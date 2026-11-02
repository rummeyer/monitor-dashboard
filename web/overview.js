/**
 * The tabs, from tabs.json: a frame per dashboard that answers — a plugin not
 * installed, or its dashboard switched off, has no tab — all loaded at once
 * so that a tab switches without waiting, the one in the address (#synology)
 * shown.
 *
 * The frames come from this page's own address, through Caddy, so this page
 * can reach into them: it puts the tabs into each dashboard under its
 * header, in that dashboard's own look, and when the look is switched in one
 * of them, switches the others to it too — each keeps its look under its own
 * key, all in this address's storage.
 */
(function () {
  'use strict';

  /** The tabs in a dashboard: their look, in each of the dashboards' three. */
  const CSS = `
  .overview-tabs { display: flex; gap: 6px; margin: -4px 0 18px; overflow-x: auto; scrollbar-width: none; }
  .overview-tabs::-webkit-scrollbar { display: none; }
  .overview-tabs a { flex: none; padding: 7px 16px; border-radius: 999px; border: 1px solid var(--line);
    background: var(--card); color: var(--text); font-weight: 500; font-size: .95rem; text-decoration: none; }
  .overview-tabs a:hover { border-color: var(--accent); }
  .overview-tabs a[aria-current="page"] { background: var(--accent); border-color: var(--accent); color: #fff; }
  [data-theme="home"] .overview-tabs a { background: rgba(0,0,0,.28); border-color: rgba(255,255,255,.18); color: #fff;
    -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); }
  [data-theme="home"] .overview-tabs a:hover { border-color: rgba(255,255,255,.5); }
  [data-theme="home"] .overview-tabs a[aria-current="page"] { background: rgba(255,255,255,.95); border-color: transparent; color: #1c1c1e; }
  `;

  const LOOKS = ['home', 'light', 'dark'];
  /** id → { tab, frame } */
  const shown = new Map();
  let tabs = [];
  let current = null;

  const frameDocument = (frame) => {
    try {
      return frame.contentDocument;
    } catch {
      return null;
    }
  };

  /** Shows a tab by its id, the first for one there is none of. */
  function show(id) {
    const entry = shown.get(id) ?? shown.get(tabs[0].id);
    current = entry.tab.id;
    for (const { tab, frame } of shown.values()) {
      frame.hidden = tab.id !== current;
      const nav = frameDocument(frame)?.querySelector('.overview-tabs');
      for (const link of nav?.querySelectorAll('a') ?? []) {
        if (link.dataset.id === current) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      }
    }
    if (location.hash.slice(1) !== current) {
      history.replaceState(null, '', `#${current}`);
    }
    mirror(entry.frame);
  }

  /** The page's title and icon as the dashboard shown has them. */
  function mirror(frame) {
    const doc = frameDocument(frame);
    if (!doc) {
      return;
    }
    document.title = doc.title || 'Home';
    const icon = doc.querySelector('link[rel="icon"]');
    const own = document.querySelector('link[rel="icon"]');
    if (icon && own) {
      own.type = icon.type;
      own.href = new URL(icon.getAttribute('href'), frame.contentWindow.location.href).href;
    }
  }

  /** The tabs, put into a dashboard under its header. */
  function addTabs(doc) {
    if (doc.querySelector('.overview-tabs')) {
      return;
    }
    const style = doc.createElement('style');
    style.textContent = CSS;
    doc.head.append(style);
    const nav = doc.createElement('nav');
    nav.className = 'overview-tabs';
    nav.setAttribute('aria-label', 'Dashboards');
    for (const tab of tabs) {
      const link = doc.createElement('a');
      link.textContent = tab.name;
      link.href = `/#${tab.id}`;
      link.target = '_top';
      link.dataset.id = tab.id;
      if (tab.id === current) {
        link.setAttribute('aria-current', 'page');
      }
      link.addEventListener('click', (event) => {
        if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
          event.preventDefault();
          show(tab.id);
        }
      });
      nav.append(link);
    }
    const header = doc.querySelector('header');
    if (header) {
      header.after(nav);
    } else {
      doc.body.prepend(nav);
    }
  }

  /** A look switched in one dashboard, switched in the others too. */
  function spread(look, from) {
    for (const { tab, frame } of shown.values()) {
      try {
        if (look === 'home') {
          localStorage.removeItem(tab.themeKey);
        } else {
          localStorage.setItem(tab.themeKey, look);
        }
      } catch {
        // No storage: only for this visit.
      }
      const root = frameDocument(frame)?.documentElement;
      if (tab.id !== from && root && root.getAttribute('data-theme') !== look) {
        root.setAttribute('data-theme', look);
        root.setAttribute('data-theme-pref', look);
      }
    }
    mirror(shown.get(current).frame);
  }

  function watchLook(tab, doc) {
    new MutationObserver(() => {
      const look = doc.documentElement.getAttribute('data-theme');
      if (LOOKS.includes(look)) {
        spread(look, tab.id);
      }
    }).observe(doc.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    // The title follows the look; the page's goes with it.
    new MutationObserver(() => tab.id === current && mirror(shown.get(tab.id).frame))
      .observe(doc.head, { childList: true, subtree: true, characterData: true });
  }

  async function start() {
    const fail = (text) => document.body.append(Object.assign(document.createElement('p'), { className: 'failed', textContent: text }));
    try {
      tabs = await (await fetch('tabs.json', { cache: 'no-store' })).json();
    } catch {
      fail('tabs.json could not be read.');
      return;
    }
    const answers = await Promise.all(tabs.map((tab) => fetch(tab.path, { method: 'HEAD', cache: 'no-store' }).then((r) => r.ok, () => false)));
    tabs = tabs.filter((_, index) => answers[index]);
    if (!tabs.length) {
      fail('None of the dashboards answers. Are the plugins running, with their dashboards switched on?');
      return;
    }
    current = tabs.some((tab) => tab.id === location.hash.slice(1)) ? location.hash.slice(1) : tabs[0].id;
    for (const tab of tabs) {
      const frame = document.createElement('iframe');
      frame.title = tab.name;
      frame.src = tab.path;
      frame.hidden = tab.id !== current;
      frame.addEventListener('load', () => {
        const doc = frameDocument(frame);
        if (!doc) {
          return;
        }
        addTabs(doc);
        watchLook(tab, doc);
        if (tab.id === current) {
          mirror(frame);
        }
      });
      shown.set(tab.id, { tab, frame });
      document.body.append(frame);
    }
    show(current);
    window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  }

  start();
})();
