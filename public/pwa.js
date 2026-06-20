/* This Indian Life — progressive-web-app glue.
   Registers the service worker and adds two native-app niceties:
     • an unobtrusive "a new version is available — Refresh" toast (auto-hides)
     • a one-click Install button, surfaced ONLY on the /install page (never a popup)
   There is no auto install prompt and no notifications: installation is opt-in,
   driven entirely by the dedicated /install page.
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
    const close = () => t.classList.remove('is-in');
    t.querySelector('button').addEventListener('click', () => {
      worker.postMessage('SKIP_WAITING');
      t.remove();
    });
    // The update applies on the next navigation regardless — so if the toast is
    // ignored, quietly retire it after a few seconds instead of nagging.
    t.addEventListener('transitionend', () => { if (!t.classList.contains('is-in')) t.remove(); });
    setTimeout(close, 8000);
    enter(t);
  }

  /* ---- install (opt-in, /install page only) ------------------------------ */
  // Capture the native prompt when the browser offers it, but never pop a banner.
  // The /install page reads `deferred` to power its one-click Install button.
  let deferred = null;
  let installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  const refreshInstallUI = () => {
    const btn = document.getElementById('pwa-install-btn');
    if (!btn) return; // not on the /install page
    const note = document.getElementById('pwa-install-note');
    if (installed) {
      btn.hidden = true;
      if (note) note.textContent = 'This app is already installed. Open it from your home screen or app drawer.';
      return;
    }
    if (deferred) {
      btn.hidden = false;
      btn.disabled = false;
      if (note) note.textContent = '';
    } else {
      // No native prompt available (iOS Safari, Firefox, already-dismissed, etc.).
      // The manual per-browser instructions on the page cover this case.
      btn.hidden = true;
    }
  };

  const wireInstallButton = () => {
    const btn = document.getElementById('pwa-install-btn');
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', async () => {
      if (!deferred) return;
      btn.disabled = true;
      deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      refreshInstallUI();
    });
  };

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // suppress the browser's own mini-infobar; no banner of ours either
    deferred = e;
    refreshInstallUI();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    refreshInstallUI();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { wireInstallButton(); refreshInstallUI(); });
  } else {
    wireInstallButton();
    refreshInstallUI();
  }
})();
