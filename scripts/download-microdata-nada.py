#!/usr/bin/env python3
"""Discover and download files from MoSPI NADA using a logged-in Chrome session.

Usage:
  python3 scripts/download-microdata-nada.py login
  python3 scripts/download-microdata-nada.py discover --limit-studies 5
  python3 scripts/download-microdata-nada.py download --limit-files 10
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse

import requests
import websocket
from bs4 import BeautifulSoup


BASE = "https://microdata.gov.in/NADA/index.php"
OUT_DIR = Path("data/snapshots/microdata-nada")
PROFILE_DIR = Path(".cache/microdata-nada-chrome")
MANIFEST_PATH = OUT_DIR / "manifest.json"
DEFAULT_PORT = 9223


def env_value(name: str) -> str | None:
    value = os.environ.get(name)
    if value:
        return value.strip()
    env_path = Path(".env")
    if not env_path.exists():
        return None
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, raw_value = line.split("=", 1)
        if key.strip() == name:
            return raw_value.strip().strip('"').strip("'")
    return None


def nada_api_key() -> str:
    value = env_value("NADA_API_KEY") or env_value("MICRODATA_NADA_API_KEY")
    if not value:
        raise RuntimeError("Missing NADA_API_KEY. Add it to .env or export it in the shell.")
    return value


def chrome_binary() -> str:
    for name in ("google-chrome", "chromium", "chromium-browser"):
        path = shutil.which(name)
        if path:
            return path
    raise RuntimeError("Chrome/Chromium was not found on PATH")


def launch_chrome(port: int, start_url: str) -> subprocess.Popen:
    PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    cmd = [
        chrome_binary(),
        f"--remote-debugging-port={port}",
        f"--user-data-dir={PROFILE_DIR.resolve()}",
        "--no-first-run",
        "--no-default-browser-check",
        start_url,
    ]
    return subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def wait_for_cdp(port: int, timeout: int = 30) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            requests.get(f"http://127.0.0.1:{port}/json/version", timeout=1).raise_for_status()
            return
        except Exception:
            time.sleep(0.5)
    raise RuntimeError(f"Chrome DevTools did not become available on port {port}")


class Cdp:
    def __init__(self, websocket_url: str):
        self.ws = websocket.create_connection(websocket_url, timeout=10)
        self.next_id = 1

    def call(self, method: str, params: dict | None = None) -> dict:
        message_id = self.next_id
        self.next_id += 1
        self.ws.send(json.dumps({"id": message_id, "method": method, "params": params or {}}))
        while True:
            message = json.loads(self.ws.recv())
            if message.get("id") == message_id:
                if "error" in message:
                    raise RuntimeError(f"CDP {method} failed: {message['error']}")
                return message.get("result", {})

    def close(self) -> None:
        self.ws.close()


def page_websocket_url(port: int) -> str:
    pages = requests.get(f"http://127.0.0.1:{port}/json", timeout=5).json()
    for page in pages:
        if page.get("type") == "page" and page.get("webSocketDebuggerUrl"):
            return page["webSocketDebuggerUrl"]
    raise RuntimeError("No Chrome page target found. Open the NADA tab first.")


def cookies_from_chrome(port: int) -> list[dict]:
    cdp = Cdp(page_websocket_url(port))
    try:
        cdp.call("Network.enable")
        return cdp.call("Network.getAllCookies").get("cookies", [])
    finally:
        cdp.close()


def session_from_cookies(cookies: list[dict]) -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
    )
    for cookie in cookies:
        domain = cookie.get("domain") or "microdata.gov.in"
        if "microdata.gov.in" not in domain:
            continue
        session.cookies.set(
            cookie["name"],
            cookie["value"],
            domain=domain,
            path=cookie.get("path") or "/",
        )
    return session


def require_login(session: requests.Session) -> None:
    url = f"{BASE}/catalog/213/get-microdata"
    response = session.get(url, timeout=30)
    response.raise_for_status()
    if "Login to access data" in response.text or "/download/" not in response.text:
        raise RuntimeError(
            "Chrome session is not logged in. Run `python3 scripts/download-microdata-nada.py login`, "
            "complete login in the browser, then rerun this command."
        )


def fetch_catalog(session: requests.Session, limit_studies: int | None = None) -> list[dict]:
    rows: list[dict] = []
    page_size = 100
    page = 1
    total = None
    seen_ids = set()
    while total is None or len(rows) < total:
        response = session.get(f"{BASE}/api/catalog/search", params={"ps": page_size, "page": page}, timeout=45)
        response.raise_for_status()
        result = response.json()["result"]
        total = int(result["total"])
        batch = result["rows"]
        for item in batch:
            item_id = str(item.get("id"))
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)
            rows.append(item)
        if not batch or (limit_studies and len(rows) >= limit_studies):
            break
        page += 1
    return rows[:limit_studies] if limit_studies else rows


def clean_name(value: str, fallback: str = "download") -> str:
    value = unquote(value or fallback)
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(r"[^A-Za-z0-9._ -]+", "_", value)
    value = value.replace("/", "_").replace(" ", "_")
    return value[:180].strip("._-") or fallback


def link_context(anchor) -> str:
    parent = anchor.parent
    text = " ".join(parent.get_text(" ", strip=True).split()) if parent else ""
    if text:
        return text
    return " ".join(anchor.get_text(" ", strip=True).split())


def extract_download_links(html: str, page_url: str, source: str) -> tuple[list[dict], list[dict]]:
    soup = BeautifulSoup(html, "html.parser")
    downloads = []
    seen = set()
    for anchor in soup.find_all("a", href=True):
        href = urljoin(page_url, anchor["href"])
        parsed = urlparse(href)
        if not re.search(r"/catalog/\d+/download/\d+", parsed.path):
            continue
        if href in seen:
            continue
        seen.add(href)
        match = re.search(r"/catalog/(\d+)/download/(\d+)", parsed.path)
        downloads.append(
            {
                "url": href,
                "catalog_id": match.group(1) if match else None,
                "download_id": match.group(2) if match else None,
                "source": source,
                "label": link_context(anchor),
            }
        )

    forms = []
    for form in soup.find_all("form"):
        action = form.get("action")
        forms.append(
            {
                "method": (form.get("method") or "get").lower(),
                "action": urljoin(page_url, action) if action else page_url,
                "inputs": [
                    {"name": field.get("name"), "type": field.get("type"), "value": field.get("value")}
                    for field in form.find_all("input")
                    if field.get("name")
                ],
            }
        )
    return downloads, forms


def discover(args: argparse.Namespace) -> None:
    cookies = cookies_from_chrome(args.port)
    session = session_from_cookies(cookies)
    require_login(session)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    studies = fetch_catalog(session, args.limit_studies)
    manifest = {
        "source": "https://microdata.gov.in/NADA",
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "studyCount": len(studies),
        "studies": [],
        "downloads": [],
        "forms": [],
    }

    for index, study in enumerate(studies, start=1):
        sid = str(study["id"])
        title = study.get("title") or sid
        print(f"[{index}/{len(studies)}] discover catalog/{sid}: {title}", flush=True)
        study_record = {
            "id": sid,
            "idno": study.get("idno"),
            "title": title,
            "repositoryid": study.get("repositoryid"),
            "url": study.get("url") or f"{BASE}/catalog/{sid}",
        }
        manifest["studies"].append(study_record)

        for source, page_url in (
            ("related-materials", f"{BASE}/catalog/{sid}/related-materials"),
            ("get-microdata", f"{BASE}/catalog/{sid}/get-microdata"),
        ):
            response = session.get(page_url, timeout=45)
            if response.status_code != 200:
                continue
            downloads, forms = extract_download_links(response.text, page_url, source)
            for item in downloads:
                item.update({"study_id": sid, "study_title": title, "idno": study.get("idno")})
                manifest["downloads"].append(item)
            for form in forms:
                form.update({"study_id": sid, "study_title": title, "source": source})
                manifest["forms"].append(form)

        time.sleep(args.delay)

    seen = set()
    unique_downloads = []
    for item in manifest["downloads"]:
        key = item["url"]
        if key in seen:
            continue
        seen.add(key)
        unique_downloads.append(item)
    manifest["downloads"] = unique_downloads

    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {MANIFEST_PATH}")
    print(f"studies={len(manifest['studies'])} downloads={len(manifest['downloads'])} forms={len(manifest['forms'])}")


def filename_from_response(item: dict, response: requests.Response) -> str:
    disposition = response.headers.get("content-disposition", "")
    match = re.search(r'filename\*?=(?:UTF-8\'\')?"?([^";]+)', disposition)
    if match:
        return clean_name(match.group(1))
    path_name = Path(urlparse(response.url).path).name
    if path_name and path_name != str(item.get("download_id")):
        return clean_name(path_name)
    label = clean_name(item.get("label") or f"download_{item.get('download_id')}")
    content_type = response.headers.get("content-type", "").lower()
    ext = ""
    if "pdf" in content_type:
        ext = ".pdf"
    elif "zip" in content_type:
        ext = ".zip"
    elif "excel" in content_type or "spreadsheet" in content_type:
        ext = ".xlsx"
    elif "text/plain" in content_type:
        ext = ".txt"
    return f"{label}{ext}"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def api_headers() -> dict:
    return {
        "X-API-KEY": nada_api_key(),
        "User-Agent": "Indica data downloader",
    }


def api_get_json(path: str) -> dict:
    url = f"{BASE}{path}"
    response = requests.get(url, headers=api_headers(), timeout=60)
    if response.status_code >= 400:
        raise RuntimeError(f"API request failed {response.status_code}: {response.text[:500]}")
    return response.json()


def api_discover(args: argparse.Namespace) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST_PATH.read_text()) if MANIFEST_PATH.exists() else {"downloads": []}
    target_downloads = [item for item in manifest.get("downloads", []) if item.get("source") == "get-microdata"]
    if args.only_remaining:
        completed = set()
        results_path = OUT_DIR / "download-results.jsonl"
        if results_path.exists():
            for line in results_path.read_text(encoding="utf-8").splitlines():
                if not line.strip():
                    continue
                record = json.loads(line)
                if record.get("downloaded") and record.get("url"):
                    completed.add(record["url"])
        target_downloads = [item for item in target_downloads if item.get("url") not in completed]

    api_files = []
    seen_idnos = []
    for item in target_downloads:
        idno = item.get("idno")
        if idno and idno not in seen_idnos:
            seen_idnos.append(idno)

    for idno in seen_idnos:
        print(f"API fileslist {idno}", flush=True)
        data = api_get_json(f"/api/datasets/{idno}/fileslist")
        api_files.append({"idno": idno, "response": data})

    path = OUT_DIR / "api-fileslist.json"
    path.write_text(json.dumps(api_files, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {path}")


def iter_api_files(fileslist_response: dict) -> list[dict]:
    if isinstance(fileslist_response, list):
        return fileslist_response
    for key in ("files", "datafiles", "rows", "result"):
        value = fileslist_response.get(key) if isinstance(fileslist_response, dict) else None
        if isinstance(value, list):
            return value
        if isinstance(value, dict):
            nested = iter_api_files(value)
            if nested:
                return nested
    return []


def api_file_no(file_record: dict) -> str | None:
    for key in ("base64", "file_no", "fileno", "FileNo", "file", "filename", "name", "file_name"):
        value = file_record.get(key)
        if value:
            return str(value)
    return None


def api_file_label(file_record: dict) -> str:
    for key in ("filename", "file_name", "name", "title", "label"):
        value = file_record.get(key)
        if value:
            return clean_name(str(value))
    return "download"


def download_api_file(idno: str, file_no: str, filename: str, root: Path) -> dict:
    study_dir = root / clean_name(idno)
    study_dir.mkdir(parents=True, exist_ok=True)
    path = study_dir / filename
    if path.exists() and path.stat().st_size > 0:
        return {"idno": idno, "file_no": file_no, "downloaded": True, "skipped": True, "file": str(path), "bytes": path.stat().st_size, "sha256": sha256_file(path)}

    url = f"{BASE}/api/fileslist/download/{idno}/{file_no}"
    response = requests.get(url, headers=api_headers(), stream=True, timeout=60)
    if response.status_code >= 400:
        return {"idno": idno, "file_no": file_no, "downloaded": False, "status_code": response.status_code, "error": response.text[:500]}

    filename = filename_from_response({"download_id": file_no, "label": filename}, response)
    path = study_dir / filename
    part_path = study_dir / f"{filename}.part"
    with part_path.open("wb") as handle:
        for chunk in response.iter_content(chunk_size=1024 * 1024):
            if chunk:
                handle.write(chunk)
    part_path.rename(path)
    return {"idno": idno, "file_no": file_no, "downloaded": True, "skipped": False, "file": str(path), "bytes": path.stat().st_size, "sha256": sha256_file(path)}


def api_download(args: argparse.Namespace) -> None:
    fileslist_path = OUT_DIR / "api-fileslist.json"
    if not fileslist_path.exists():
        api_discover(args)
    entries = json.loads(fileslist_path.read_text(encoding="utf-8"))
    candidates = []
    existing_names = set()
    if args.skip_existing_names:
        for base in (OUT_DIR / "files", OUT_DIR / "api-files"):
            if base.exists():
                existing_names.update(path.name for path in base.rglob("*") if path.is_file() and not path.name.endswith(".part"))
    for entry in entries:
        idno = entry["idno"]
        for file_record in iter_api_files(entry["response"]):
            file_no = api_file_no(file_record)
            if not file_no:
                continue
            if args.skip_existing_names and str(file_record.get("name") or "") in existing_names:
                continue
            if args.data_archives_only:
                name = str(file_record.get("name") or "")
                size = str(file_record.get("size") or "")
                if not re.search(r"\.(zip|rar)$", name, re.I):
                    continue
                if not re.search(r"(data|HCES_Data|PLFS|txt2csv)", name, re.I):
                    continue
            candidates.append((idno, file_no, api_file_label(file_record), file_record))
    if args.limit_files:
        candidates = candidates[: args.limit_files]

    results_path = OUT_DIR / "api-download-results.jsonl"
    with results_path.open("a", encoding="utf-8") as results:
        for index, (idno, file_no, filename, file_record) in enumerate(candidates, start=1):
            print(f"[api {index}/{len(candidates)}] {idno} {filename}", flush=True)
            try:
                record = download_api_file(idno, file_no, filename, OUT_DIR / "api-files")
            except Exception as exc:
                record = {"idno": idno, "file_no": file_no, "downloaded": False, "error": str(exc)}
            record["source_record"] = file_record
            results.write(json.dumps(record, ensure_ascii=False) + "\n")
            results.flush()
            time.sleep(args.delay)
    print(f"wrote {results_path}")


def download_one(session: requests.Session, item: dict, root: Path) -> dict:
    study_dir = root / clean_name(f"{item.get('study_id')}_{item.get('idno') or item.get('study_title')}")
    study_dir.mkdir(parents=True, exist_ok=True)

    head = session.get(item["url"], stream=True, timeout=60, allow_redirects=True)
    if head.status_code != 200:
        return {**item, "downloaded": False, "status_code": head.status_code, "error": head.text[:500]}

    filename = filename_from_response(item, head)
    final_path = study_dir / filename
    part_path = study_dir / f"{filename}.part"
    if final_path.exists() and final_path.stat().st_size > 0:
        head.close()
        return {
            **item,
            "downloaded": True,
            "skipped": True,
            "file": str(final_path),
            "bytes": final_path.stat().st_size,
            "sha256": sha256_file(final_path),
        }

    with part_path.open("wb") as handle:
        bytes_written = 0
        for chunk in head.iter_content(chunk_size=1024 * 1024):
            if not chunk:
                continue
            handle.write(chunk)
            bytes_written += len(chunk)
    part_path.rename(final_path)

    return {
        **item,
        "downloaded": True,
        "skipped": False,
        "status_code": head.status_code,
        "content_type": head.headers.get("content-type"),
        "file": str(final_path),
        "bytes": final_path.stat().st_size,
        "sha256": sha256_file(final_path),
    }


def download(args: argparse.Namespace) -> None:
    if not MANIFEST_PATH.exists():
        raise RuntimeError(f"Missing {MANIFEST_PATH}; run discover first")
    cookies = cookies_from_chrome(args.port)
    session = session_from_cookies(cookies)
    require_login(session)
    manifest = json.loads(MANIFEST_PATH.read_text())
    downloads = manifest.get("downloads", [])
    if args.source:
        downloads = [item for item in downloads if item.get("source") == args.source]
    existing_successes = set()
    results_path = OUT_DIR / "download-results.jsonl"
    if results_path.exists():
        for line in results_path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue
            if record.get("downloaded") and record.get("url"):
                existing_successes.add(record["url"])
    downloads = [item for item in downloads if item.get("url") not in existing_successes]
    if args.limit_files:
        downloads = downloads[: args.limit_files]

    stop_keepalive = threading.Event()

    def keepalive() -> None:
        if args.keepalive <= 0:
            return
        while not stop_keepalive.wait(args.keepalive):
            try:
                live_session = session_from_cookies(cookies_from_chrome(args.port))
                response = live_session.get(f"{BASE}/catalog/237/get-microdata", timeout=20)
                logged_in = (
                    response.status_code == 200
                    and "Login to access data" not in response.text
                    and "/download/" in response.text
                )
                marker = "ok" if logged_in else "not_logged_in"
                print(f"[keepalive] {marker} status={response.status_code}", flush=True)
            except Exception as exc:
                print(f"[keepalive] error {exc}", flush=True)

    keepalive_thread = threading.Thread(target=keepalive, daemon=True)
    keepalive_thread.start()
    try:
        with results_path.open("a", encoding="utf-8") as results:
            for index, item in enumerate(downloads, start=1):
                print(f"[{index}/{len(downloads)}] {item.get('study_id')} download/{item.get('download_id')} {item.get('label')}", flush=True)
                try:
                    record = download_one(session, item, OUT_DIR / "files")
                except Exception as exc:
                    record = {**item, "downloaded": False, "error": str(exc)}
                results.write(json.dumps(record, ensure_ascii=False) + "\n")
                results.flush()
                time.sleep(args.delay)
    finally:
        stop_keepalive.set()
        keepalive_thread.join(timeout=2)
    print(f"wrote {results_path}")


def login(args: argparse.Namespace) -> None:
    launch_chrome(args.port, f"{BASE}/auth/login")
    wait_for_cdp(args.port)
    print("Chrome opened. Log in to microdata.gov.in in that browser window.")
    print("Leave the browser open, then run discover/download from another terminal.")
    if args.wait:
        input("Press Enter here after you have logged in...")
        cookies = cookies_from_chrome(args.port)
        session = session_from_cookies(cookies)
        require_login(session)
        print("Login check passed.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    subparsers = parser.add_subparsers(dest="cmd", required=True)

    login_parser = subparsers.add_parser("login")
    login_parser.add_argument("--wait", action="store_true")

    discover_parser = subparsers.add_parser("discover")
    discover_parser.add_argument("--limit-studies", type=int)
    discover_parser.add_argument("--delay", type=float, default=0.3)

    download_parser = subparsers.add_parser("download")
    download_parser.add_argument("--limit-files", type=int)
    download_parser.add_argument("--source", choices=["related-materials", "get-microdata"])
    download_parser.add_argument("--delay", type=float, default=1.0)
    download_parser.add_argument("--keepalive", type=float, default=60.0)

    api_discover_parser = subparsers.add_parser("api-discover")
    api_discover_parser.add_argument("--only-remaining", action="store_true")
    api_discover_parser.add_argument("--limit-files", type=int)
    api_discover_parser.add_argument("--delay", type=float, default=1.0)

    api_download_parser = subparsers.add_parser("api-download")
    api_download_parser.add_argument("--only-remaining", action="store_true")
    api_download_parser.add_argument("--limit-files", type=int)
    api_download_parser.add_argument("--delay", type=float, default=1.0)
    api_download_parser.add_argument("--data-archives-only", action="store_true")
    api_download_parser.add_argument("--skip-existing-names", action="store_true")

    args = parser.parse_args()
    if args.cmd == "login":
        login(args)
    elif args.cmd == "discover":
        discover(args)
    elif args.cmd == "download":
        download(args)
    elif args.cmd == "api-discover":
        api_discover(args)
    elif args.cmd == "api-download":
        api_download(args)


if __name__ == "__main__":
    main()
