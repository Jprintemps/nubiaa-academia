/* ═══════════════════════════════════════════════════════════
   NUBIAA Academia — le thème suit celui du téléphone
   Chargé en premier, dans le <head>, avant les styles : pas de
   flash de la mauvaise couleur. Pose <html data-theme="dark|light">
   selon le réglage du système, et suit ses changements en direct.

   Les images du thème clair vivent dans images/clair/, sous les
   mêmes noms. En thème clair, toute image servie depuis images/
   (balise <img> ou background-image en ligne, y compris celles
   ajoutées plus tard par les scripts) est redirigée vers sa
   version claire.
   ═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const root = document.documentElement;
  const mq = matchMedia('(prefers-color-scheme: dark)');
  // ?theme=clair ou ?theme=sombre force un thème (captures et tests)
  const forced = (new URLSearchParams(location.search).get('theme') || '').toLowerCase();
  const isDark = () => (forced === 'sombre' ? true : forced === 'clair' ? false : mq.matches);

  const DARK = /(^|\/)images\/(?!clair\/)/;
  const LIGHT = /(^|\/)images\/clair\//;
  function fix(el, dark) {
    if (el.nodeType !== 1) return;
    const src = el.getAttribute('src');
    if (src) {
      const next = dark ? src.replace(LIGHT, '$1images/') : src.replace(DARK, '$1images/clair/');
      if (next !== src) el.setAttribute('src', next);
    }
    const st = el.getAttribute('style');
    if (st && st.indexOf('images/') !== -1) {
      const next = dark ? st.replace(/images\/clair\//g, 'images/') : st.replace(/images\/(?!clair\/)/g, 'images/clair/');
      if (next !== st) el.setAttribute('style', next);
    }
  }
  function sweep(node, dark) {
    fix(node, dark);
    if (node.querySelectorAll) node.querySelectorAll('img[src], [style*="images/"]').forEach((el) => fix(el, dark));
  }

  let dark = isDark();
  function apply() {
    dark = isDark();
    root.dataset.theme = dark ? 'dark' : 'light';
    sweep(root, dark);
  }
  apply();

  // les images ajoutées après coup, ou dont la source change, passent par le même filtre
  // (on n'observe pas l'attribut style : les moteurs le réécrivent à chaque image)
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'childList') m.addedNodes.forEach((n) => sweep(n, dark));
      else fix(m.target, dark);
    }
  }).observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });

  if (!forced) (mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply));
  window.NubiaaTheme = { get dark() { return dark; } };
})();
