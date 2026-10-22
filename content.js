/* ═══════════════════════════════════════════════════════════
   NUBIAA Academia — page d'inscription (onboarding)
   Moteur « Site Immersif » : seule cette moitié haute change.
   Le parcours suit le business plan : formulaire → échange
   découverte → liste d'attente → première séance.
   ═══════════════════════════════════════════════════════════ */

window.SITE_CONTENT = {

  brand: {
    name: 'NUBIAA Academia',
    title: 'NUBIAA Academia · Inscription à la cohorte pilote',
    description: 'Électronique, IoT et code avec un mentor ingénieur, à Kinshasa ou en ligne. Inscrivez-vous en deux minutes, le premier échange de 20 minutes est gratuit.',
    kicker: 'NUBIAA ACADEMIA · INSCRIPTIONS · COHORTE PILOTE 2027',
    copyright: '© 2026 · KINSHASA, RDC',
    signature: 'ÇA VOUS PLAÎT ? FABRIQUEZ-LE.',
    socials: [
      { label: 'INSTAGRAM ↗', url: 'https://www.instagram.com/nubiaa.minds/' }
    ]
  },

  nav: { proof: 'PROGRAMME', universes: 'ÉTAPES', cta: 'S’INSCRIRE' },

  hook: {
    line1: 'Ce que vous rêvez de fabriquer',
    line2a: 'commence',
    line2b: 'ici.',
    image: 'images/hero.jpg',
    imageAlt: 'Dunes du désert au crépuscule, traversées de pistes dorées comme un circuit imprimé',
    floaters: [
      // les mêmes visuels que l'ouverture du questionnaire
      'images/tr-01.jpg', 'images/fl-02.jpg', 'images/tr-03.jpg', 'images/tr-09.jpg', 'images/fl-05.jpg',
      'images/fl-07.jpg', 'images/tr-13.jpg', 'images/tr-19.jpg', 'images/fl-10.jpg', 'images/tr-11.jpg'
    ]
  },

  positioning: 'Électronique, IoT et code, avec un mentor.',

  manifesto: {
    text: 'NUBIAA, comme la Nubie : un pays du Nil où l’on a élevé plus de deux cents pyramides en plein désert. Ici, on apprend de la même façon, en construisant. Six semaines avec un mentor ingénieur, et à la fin [[un vrai prototype]] que vous présentez au groupe.'
  },

  proof: {
    layout: 'bento',
    kicker: 'CE QUE VOUS REJOIGNEZ',
    title: 'La cohorte pilote',
    sub: 'Six semaines en groupe de 8 à 12 personnes, avec une séance le samedi à Kinshasa et une séance en ligne chaque semaine.',
    meta: 'OUVERTURE · JANVIER 2027',
    features: [
      { size: 'big',  illu: 'images/bento-prototype.jpg', title: 'Un prototype à présenter', meta: 'SEMAINE 6 · DÉMONSTRATION DEVANT LE GROUPE' },
      { size: 'tall', illu: 'images/bento-mentor.jpg', title: 'Un mentor ingénieur', meta: 'UN PAR DOMAINE · CHOISI PAR STELLA' },
      { size: 'tall', illu: 'images/bento-hybride.jpg', title: 'Sur place ou en ligne', meta: 'LE SAMEDI À KINSHASA · EN LIGNE EN SEMAINE' },
      { size: 'big',  illu: 'images/bento-domaines.jpg', title: 'Trois domaines pour démarrer', meta: 'ÉLECTRONIQUE · IOT · CODE' }
    ]
  },

  motto: {
    kicker: 'CE QUI GUIDE CHAQUE SÉANCE',
    words: [
      { word: 'Bâtir', hint: 'On apprend en construisant un objet réel, dès la première séance.' },
      { word: 'Comprendre', hint: 'Chaque composant est expliqué avant d’être branché.' },
      { word: 'Montrer', hint: 'Le projet est présenté au groupe à la fin des six semaines.' }
    ]
  },

  universes: {
    introA: 'Votre',
    introB: 'inscription,',
    introC: '4 étapes.',
    cta: 'Commencer mon inscription →',
    image: 'images/bg-domaine.jpg',
    items: [
      { name: 'Le formulaire', meta: 'ÉTAPE 01 · 2 MINUTES', desc: 'Quatre questions à cocher sur votre domaine, votre profil, votre ville et votre objectif, puis vos coordonnées et le créneau qui vous arrange.' },
      { name: 'L’échange découverte', meta: 'ÉTAPE 02 · 20 MIN · GRATUIT', desc: 'Stella vous appelle pour comprendre ce que vous voulez construire et où vous avez bloqué jusqu’ici. Un rappel vous arrive sur WhatsApp la veille.' },
      { name: 'La liste d’attente', meta: 'ÉTAPE 03 · DÉCEMBRE', desc: 'Dès que votre domaine réunit assez de monde, Stella vous écrit sur WhatsApp avec le lien pour verser l’acompte et garder votre place.' },
      { name: 'La première séance', meta: 'ÉTAPE 04 · JANVIER 2027', desc: 'Vous rencontrez votre mentor et votre groupe, et vous commencez le projet que vous présenterez six semaines plus tard.' }
    ]
  },

  /* Citation de Stella : à faire valider par elle avant publication.
     Pas de chiffre : la cohorte pilote n'a pas encore eu lieu. */
  testimonial: {
    kicker: 'ÉTUDIANTE INGÉNIEURE, KINSHASA',
    figure: '',
    unit: '',
    quote: 'J’ai appris l’électronique en ratant mes premiers prototypes, parfois devant tout le monde. Je veux que vous ratiez les vôtres avec quelqu’un à côté qui sait vous expliquer pourquoi.',
    author: 'STELLA NYOTA KIZA · FONDATRICE'
  },

  objections: {
    items: ['Pas de prérequis.', 'Pas de cours magistral.', 'Pas de projet fictif.'],
    finale: 'Juste vous et',
    pill: 'un circuit.'
  },

  /* E-mail provisoire : à remplacer par l'adresse réelle de NUBIAA. */
  contact: {
    kicker: 'UNE QUESTION AVANT DE VOUS INSCRIRE ?',
    email: 'bonjour@nubiaa-academia.com',
    reassurance: 'STELLA RÉPOND SOUS 48 H · L’ÉCHANGE DÉCOUVERTE EST GRATUIT'
  },

  trail: [
    'images/tr-01.jpg', 'images/tr-02.jpg', 'images/tr-03.jpg', 'images/tr-04.jpg', 'images/tr-05.jpg',
    'images/tr-06.jpg', 'images/tr-07.jpg', 'images/tr-08.jpg', 'images/tr-09.jpg', 'images/tr-10.jpg',
    'images/tr-11.jpg', 'images/tr-12.jpg', 'images/tr-13.jpg', 'images/tr-14.jpg', 'images/tr-15.jpg',
    'images/tr-16.jpg', 'images/tr-17.jpg', 'images/tr-18.jpg', 'images/tr-19.jpg', 'images/tr-20.jpg'
  ]
};

/* ═══════════════════════════════════════════════════════════
   INJECTION — NE PAS MODIFIER (remplit le DOM avant app.js)
   ═══════════════════════════════════════════════════════════ */
(() => {
  const C = window.SITE_CONTENT;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const set = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };

  document.title = C.brand.title;
  const md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute('content', C.brand.description);

  // chrome
  set('.loader-wordmark', C.brand.name);
  set('.dock-wordmark', C.brand.name);
  set('.dock-link[href="#travaux"]', C.nav.proof);
  set('.dock-link[href="#explorer"]', C.nav.universes);
  set('.dock-cta', C.nav.cta);

  // 1 · accroche
  set('#heroKicker', C.brand.kicker);
  set('#heroLine1', C.hook.line1);
  const hls = $$('#heroLine2 .hl');
  if (hls.length === 2) { hls[0].textContent = C.hook.line2a; hls[1].textContent = C.hook.line2b; }
  const g1 = $('#grow1 img');
  if (g1) { g1.src = C.hook.image; g1.alt = C.hook.imageAlt; }
  $$('.floaters .fl img').forEach((img, i) => { if (C.hook.floaters[i]) img.src = C.hook.floaters[i]; });

  // 2 · positionnement (un span par mot)
  const intro = $('#spotIntro');
  if (intro) intro.innerHTML = C.positioning.split(' ').map((w) => `<span>${w}</span>`).join(' ');

  // 3 · démarche
  const fill = $('#fillText');
  if (fill) {
    fill.innerHTML = C.manifesto.text.replace(
      /\[\[(.+?)\]\]/,
      '<span class="boxed" id="boxedPhrase">$1<svg class="box-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path id="boxPath" d="M50,6 C88,4 98,22 97,50 C96,82 76,96 49,95 C16,94 3,76 4,48 C5,18 20,7 50,6 Z"/></svg></span>'
    );
  }

  // 4 · preuve : masonry (8 photos) ou bento (4 features big/tall/tall/big)
  const head = $$('.coll-head > *');
  if (head.length === 4) {
    head[0].textContent = C.proof.kicker;
    head[1].textContent = C.proof.title;
    head[2].textContent = C.proof.sub;
    head[3].textContent = C.proof.meta;
  }
  const grid = $('#collGrid');
  if (grid && C.proof.layout === 'bento') {
    grid.className = 'bento-grid';
    grid.innerHTML = C.proof.features.map((f) =>
      `<figure class="card${f.size ? ' b-' + f.size : ''}"><div class="card-img"><img src="${f.illu}" alt="${f.title}"></div><figcaption>${f.title}<span class="mono">${f.meta}</span></figcaption></figure>`
    ).join('');
  } else if (grid) {
    grid.className = 'coll-grid';
    const SPEEDS = [-0.05, 0.06, -0.028, 0.085];
    grid.innerHTML = SPEEDS.map((s, ci) =>
      `<div class="col" data-pspeed="${s}">` +
      C.proof.projects.slice(ci * 2, ci * 2 + 2).map((p) =>
        `<figure class="card"><div class="card-img"><img src="${p.img}" alt="${p.title} — ${p.meta}"></div><figcaption>${p.title}<span class="mono">${p.meta}</span></figcaption></figure>`
      ).join('') + '</div>'
    ).join('');
  }

  // 5 · devise (train de mots-clés)
  set('#mottoKicker', C.motto.kicker);
  const mtrack = $('#mottoTrack');
  if (mtrack) mtrack.innerHTML = C.motto.words.map((w) => `<span class="mw">${w.word}</span>`).join('');

  // 6-7 · processus immersif (visuels posés un à un)
  set('#nw1', C.universes.introA);
  set('#nw2', C.universes.introB);
  set('#nw3', C.universes.introC);
  const g2 = $('#grow2 img');
  if (g2) g2.src = C.universes.image || (C.universes.items[0] || {}).img || g2.src;
  const psteps = $('#psteps');
  if (psteps) {
    psteps.innerHTML = C.universes.items.map((u) =>
      `<div class="pstep"><span class="pstep-meta mono ash">${u.meta}</span><h3>${u.name}</h3><p>${u.desc || ''}</p></div>`
    ).join('');
  }
  const sCta = $('#stepsCtaLink');
  if (sCta) sCta.childNodes[0].textContent = C.universes.cta;

  // 8 · preuve sociale — le chiffre qui frappe
  set('#figKicker', C.testimonial.kicker || '');
  const figM = String(C.testimonial.figure || '').trim().match(/^([^\d.,+-]*[+\u2212-]?)\s*(-?[\d.,]+)/);
  set('#figPre', figM ? figM[1] : '');
  set('#figVal', figM ? figM[2] : '');
  set('#figUnit', C.testimonial.unit || '');
  set('#quoteText', C.testimonial.quote);
  set('#quoteAuthor', C.testimonial.author);

  // 9 · objections
  C.objections.items.forEach((t, i) => set('#fs' + (i + 1), t));
  const fs4 = $('#fs4');
  if (fs4) {
    fs4.innerHTML = `${C.objections.finale} <span class="pill" id="pillPhrase">${C.objections.pill}<svg class="pill-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path id="pillPath" d="M50,6 C88,4 98,22 97,50 C96,82 76,96 49,95 C16,94 3,76 4,48 C5,18 20,7 50,6 Z"/></svg></span>`;
  }
  $$('#trail img').forEach((img, i) => { img.src = C.trail[i % C.trail.length]; });

  // 10 · conversion
  set('.footer-kicker', C.contact.kicker);
  const mail = $('.footer-mail');
  if (mail) { mail.href = 'mailto:' + C.contact.email; mail.querySelector('.footer-mail-text').textContent = C.contact.email; }
  set('.footer-reassurance', C.contact.reassurance);
  const fname = $('#footerName');
  if (fname) { fname.textContent = C.brand.name; fname.setAttribute('aria-label', C.brand.name); }
  const bottom = $$('.footer-bottom > p');
  if (bottom.length === 3) {
    bottom[0].textContent = C.brand.copyright;
    bottom[1].innerHTML = C.brand.socials.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`).join('&nbsp;&nbsp;&nbsp;');
    bottom[2].textContent = C.brand.signature;
  }
})();
