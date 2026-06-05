/* This Indian Life — progressive-web-app glue.
   Registers the service worker and adds the native-app niceties:
     • a tasteful "add to home screen" prompt (Android / Chromium)
     • a one-time iOS hint (Safari has no beforeinstallprompt)
     • an unobtrusive "a new version is available — Refresh" toast
   No inline handlers, no external deps — friendly to the strict CSP. */
(() => {
  if (!('serviceWorker' in navigator)) return;

  // Keep the local dev server free of stale-cache surprises. Test the installed
  // app via the preview/LAN IP or the deployed site, where the SW does register.
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') {
    navigator.serviceWorker.getRegistrations?.().then((rs) => rs.forEach((r) => r.unregister()));
    return;
  }

  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    n.className = cls;
    n.innerHTML = html;
    return n;
  };
  const enter = (node) => {
    document.body.appendChild(node);
    requestAnimationFrame(() => node.classList.add('is-in'));
  };

  /* ---- register + update flow -------------------------------------------- */
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
    if (reg.waiting) showUpdate(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', () => {
        // A new worker finished installing while one already controls the page.
        if (sw.state === 'installed' && navigator.serviceWorker.controller) showUpdate(sw);
      });
    });
  }).catch(() => {});

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  });

  function showUpdate(worker) {
    if (document.querySelector('.pwa-toast')) return;
    const t = el('div', 'pwa-toast', `<span>A new version is available.</span><button type="button">Refresh</button>`);
    t.querySelector('button').addEventListener('click', () => {
      worker.postMessage('SKIP_WAITING');
      t.remove();
    });
    enter(t);
  }

  /* ---- install prompt ----------------------------------------------------- */
  const DISMISS_KEY = 'til-install-dismissed';
  const SNOOZE = 1000 * 60 * 60 * 24 * 30; // re-offer after 30 days
  const snoozed = Date.now() - (+localStorage.getItem(DISMISS_KEY) || 0) < SNOOZE;
  let deferred = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    if (!snoozed) showInstall();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    document.querySelector('.pwa-install')?.remove();
  });

  function dismiss(node) {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    node.remove();
  }

  function showInstall() {
    if (document.querySelector('.pwa-install')) return;
    const bar = el('div', 'pwa-install', `
      <div class="pwa-install-tx">
        <b>Add to home screen</b>
        <span>Open This Indian Life like an app — and read offline.</span>
      </div>
      <div class="pwa-install-ax">
        <button type="button" data-act="add">Install</button>
        <button type="button" data-act="no">Not now</button>
      </div>`);
    bar.querySelector('[data-act="add"]').addEventListener('click', async () => {
      bar.remove();
      if (!deferred) return;
      deferred.prompt();
      await deferred.userChoice;
      deferred = null;
    });
    bar.querySelector('[data-act="no"]').addEventListener('click', () => dismiss(bar));
    enter(bar);
  }

  /* ---- iOS hint ----------------------------------------------------------- */
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (isIOS && !standalone && !snoozed) {
    window.addEventListener('load', () => setTimeout(showIOSHint, 1400));
  }
  function showIOSHint() {
    if (document.querySelector('.pwa-install')) return;
    const bar = el('div', 'pwa-install is-ios', `
      <div class="pwa-install-tx">
        <b>Add to home screen</b>
        <span>Tap <em>Share</em>, then “Add to Home Screen”.</span>
      </div>
      <button type="button" data-act="no" aria-label="Dismiss">✕</button>`);
    bar.querySelector('[data-act="no"]').addEventListener('click', () => dismiss(bar));
    enter(bar);
  }
})();
