/* ═══════════════════════════════════════════════════════════
   NUBIAA Academia — le thème et le poids des images
   Chargé en premier, dans le <head>, avant les styles : pas de
   flash de la mauvaise couleur. Pose <html data-theme="dark|light">
   selon le réglage du système, et suit ses changements en direct.

   Chaque image existe en plusieurs tirages, sous le même nom :
   · images/          thème sombre      images/clair/      thème clair
   · images/m/        sombre, léger     images/clair/m/    clair, léger
   Le tirage léger (≈ deux fois plus petit, JPEG seulement) sert sur
   téléphone et sur connexion lente (2G, 3G lente, économie de données).

   NubiaaImg('images/hero.jpg') donne le bon chemin ; les scripts du
   site l'utilisent pour toutes leurs images. Dans le HTML, les images
   s'écrivent data-src="images/…" : le navigateur ne télécharge ainsi
   que le bon tirage, jamais les deux.
   ═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const root = document.documentElement;
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const params = new URLSearchParams(location.search);
  // ?theme=clair ou ?theme=sombre force un thème ; ?leger=1 ou 0 force le tirage (captures et tests)
  const forced = (params.get('theme') || '').toLowerCase();
  const isDark = () => (forced === 'sombre' ? true : forced === 'clair' ? false : mq.matches);

  const net = navigator.connection || {};
  const slow = params.get('leger') === '1' || (params.get('leger') !== '0' &&
    (!!net.saveData || /(^|-)2g$|^3g$/.test(net.effectiveType || '')));
  const light = params.get('leger') === '1' || (params.get('leger') !== '0' &&
    (slow || Math.min(screen.width, screen.height) <= 820));

  let dark = isDark();
  // 'images/clair/m/x.jpg' ou 'images/x.jpg' → le chemin du tirage voulu
  function pick(path) {
    const m = /^(.*?)images\/(?:clair\/)?(?:m\/)?(.+)$/.exec(path);
    if (!m) return path;
    const lite = light && /\.jpe?g$/i.test(m[2]);
    return `${m[1]}images/${dark ? '' : 'clair/'}${lite ? 'm/' : ''}${m[2]}`;
  }

  function fix(el) {
    if (el.nodeType !== 1) return;
    const ds = el.getAttribute('data-src');
    if (ds) { el.setAttribute('src', pick(ds)); el.removeAttribute('data-src'); }
    const src = el.getAttribute('src');
    if (src && src.indexOf('images/') !== -1) { const n = pick(src); if (n !== src) el.setAttribute('src', n); }
    const st = el.getAttribute('style');
    if (st && st.indexOf('images/') !== -1) {
      const n = st.replace(/url\((['"]?)([^'")]*images\/[^'")]+)\1\)/g, (all, q, u) => `url(${q}${pick(u)}${q})`);
      if (n !== st) el.setAttribute('style', n);
    }
  }
  function sweep(node) {
    fix(node);
    if (node.querySelectorAll) node.querySelectorAll('[data-src], img[src], [style*="images/"]').forEach(fix);
  }

  function apply() {
    dark = isDark();
    root.dataset.theme = dark ? 'dark' : 'light';
    sweep(root);
  }
  root.dataset.theme = dark ? 'dark' : 'light';

  // le HTML lu après ce script (data-src) passe par le même filtre, au fil de la lecture
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'childList') m.addedNodes.forEach(sweep);
      else fix(m.target);
    }
  }).observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'data-src'] });

  // l'image à précharger, annoncée sur la balise de ce script : data-preload="images/hero.jpg"
  const pre = document.currentScript && document.currentScript.dataset.preload;
  if (pre) {
    const l = document.createElement('link');
    l.rel = 'preload'; l.as = 'image'; l.href = pick(pre);
    document.head.appendChild(l);
  }

  if (!forced) (mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply));
  // remplace aussi les chemins d'images dans un objet de données (contenu de page)
  function fixData(o) {
    if (typeof o === 'string') return o.indexOf('images/') !== -1 ? pick(o) : o;
    if (Array.isArray(o)) { o.forEach((v, i) => { o[i] = fixData(v); }); return o; }
    if (o && typeof o === 'object') Object.keys(o).forEach((k) => { o[k] = fixData(o[k]); });
    return o;
  }
  window.NubiaaImg = pick;
  window.NubiaaTheme = { get dark() { return dark; }, slow, light, fixData };
})();
