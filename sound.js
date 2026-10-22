/* ═══════════════════════════════════════════════════════════
   NUBIAA Academia — les effets sonores
   Chaque mouvement de la page a son propre son, déclenché au
   moment exact où il se produit (au scroll, dans les deux sens).
   Sous les effets, une musique de fond très douce, qui donne de
   l'élan : ré majeur, ré – la – si mineur – sol, une nappe, un
   arpège de piano léger et une basse discrète, à 76 battements
   par minute. Tout est synthétisé avec la Web Audio API : aucun
   fichier, aucun droit à gérer.

   Au chargement, une première question : avec ou sans le son ?
   Ce clic débloque l'audio (les navigateurs l'exigent), puis la
   page continue. La réponse vaut pour toute la visite : on ne la
   repose pas en passant d'une page à l'autre. La touche M coupe ou
   remet le son à tout moment. `?son=0` ou `?son=1` dans l'adresse
   saute la question (captures et tests).

   API :
   · NubiaaSound.play(nom)
   · NubiaaSound.cue(clé, valeur, seuils, nom | [nomAller, nomRetour])
     joue le son quand `valeur` franchit un des seuils depuis le
     dernier appel pour cette clé (au plus un son par appel).
   ═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const KEY = 'nubiaa-son';
  const HIJAZ = [0, 1, 4, 5, 7, 8, 10];          // ré, mi bémol, fa dièse, sol, la, si bémol, do
  const D4 = 293.66;
  const hz = (deg, oct = 0) => D4 * Math.pow(2, (HIJAZ[((deg % 7) + 7) % 7] + 12 * (oct + Math.floor(deg / 7))) / 12);

  let ctx = null, out = null, verb = null, on = false;
  const lastPlay = {}, lastCue = {};

  // la réponse vaut pour la visite (sessionStorage), pas pour toujours
  const remembered = () => { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } };
  const remember = (v) => { try { sessionStorage.setItem(KEY, v ? '1' : '0'); } catch (e) { /* stockage indisponible */ } };

  /* ─── la chaîne : chaque son → (panoramique) → sortie + un peu de réverbération ─── */
  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    out = ctx.createGain(); out.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4;
    out.connect(comp).connect(ctx.destination);
    verb = ctx.createConvolver();
    const len = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.32;
    verb.connect(wet).connect(out);
  }

  /* une voie de sortie, avec panoramique gauche/droite optionnel (-1 → 1) */
  function bus(pan = 0, send = 1) {
    const g = ctx.createGain();
    let head = g;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); head = p; }
    head.connect(out);
    if (send) { const s = ctx.createGain(); s.gain.value = send; head.connect(s).connect(verb); }
    return g;
  }

  const env = (g, t, a, peak, d) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  };
  function tone(type, f0, f1, dur, peak, dest, attack = 0.004, at = 0) {
    const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, attack, peak, dur);
    o.connect(g).connect(dest); o.start(t); o.stop(t + attack + dur + 0.05);
  }
  let noiseBuf = null;
  function noise(dur, { type = 'bandpass', f0 = 800, f1 = 800, q = 0.8, peak = 0.1, attack = 0.02, dest, at = 0 } = {}) {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ctx.currentTime + at, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true;
    f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, attack, peak, dur);
    s.connect(f).connect(g).connect(dest); s.start(t, Math.random()); s.stop(t + attack + dur + 0.05);
  }
  const pluck = (f, peak, dur, dest) => { tone('triangle', f * 1.006, f, dur, peak, dest, 0.004); tone('sine', f * 2, f * 2, dur * 0.5, peak * 0.25, dest, 0.004); };

  /* ─── la musique de fond ───
     Un ordonnanceur pose les notes un peu en avance sur l'horloge
     audio (et non sur des minuteries) : le tempo reste régulier même
     quand la page travaille. */
  const BPM = 76, BEAT = 60 / BPM, BAR = BEAT * 4;
  const N = (semi) => 146.83 * Math.pow(2, semi / 12);          // demi-tons depuis ré 3
  // ré, la, si mineur, sol : fondamentale + accord (demi-tons depuis ré 3)
  const CHORDS = [
    { root: 0, tones: [0, 4, 7, 12] },      // ré majeur
    { root: 7, tones: [7, 11, 14, 19] },    // la majeur
    { root: 9, tones: [9, 12, 16, 21] },    // si mineur
    { root: 5, tones: [5, 9, 12, 17] }      // sol majeur
  ];
  // une mélodie simple, un tour sur deux (demi-tons depuis ré 4, null = silence)
  const MELODY = [[16, 14, null, 12], [14, null, 11, null], [12, 14, 16, null], [14, 12, null, null]];
  let music = null, musicBus = null, barIndex = 0, nextBarTime = 0, schedTimer = 0;

  function musicChain() {
    musicBus = ctx.createGain(); musicBus.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; lp.Q.value = 0.4;
    musicBus.connect(lp); lp.connect(out);
    const send = ctx.createGain(); send.gain.value = 0.45; lp.connect(send).connect(verb);
  }
  function padChord(tones, t) {
    tones.forEach((st, i) => {
      [0, 0.06].forEach((det) => {                       // deux voix légèrement désaccordées : la nappe respire
        const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = 'sawtooth'; o.frequency.value = N(st) * (1 + det / 100) * (i === 0 ? 1 : 1);
        f.type = 'lowpass'; f.frequency.value = 700; f.Q.value = 0.3;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.012, t + 1.1);
        g.gain.setValueAtTime(0.012, t + BAR - 0.6);
        g.gain.linearRampToValueAtTime(0.0001, t + BAR + 0.5);
        o.connect(f).connect(g).connect(musicBus);
        o.start(t); o.stop(t + BAR + 0.6);
      });
    });
  }
  function piano(freq, t, peak, dur) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = freq;
    o2.type = 'sine'; o2.frequency.value = freq * 2; g2.gain.value = 0.3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); o2.connect(g2).connect(g); g.connect(musicBus);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function bass(freq, t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + BEAT * 1.8);
    o.connect(g).connect(musicBus);
    o.start(t); o.stop(t + BEAT * 2);
  }
  function scheduleBar(t, n) {
    const c = CHORDS[n % 4], lap = Math.floor(n / 4);
    padChord(c.tones, t);
    bass(N(c.root - 12), t); bass(N(c.root - 12), t + BEAT * 2);
    // arpège en croches : 1 – 3 – 5 – 8, montant puis descendant
    const arp = [0, 1, 2, 3, 2, 1, 2, 3];
    arp.forEach((k, i) => piano(N(c.tones[k] + 12), t + i * BEAT / 2, i % 4 === 0 ? 0.03 : 0.02, 1.1));
    // la mélodie, un tour sur deux
    if (lap % 2 === 1) MELODY[n % 4].forEach((st, i) => { if (st !== null) piano(N(st + 12), t + i * BEAT, 0.035, 1.8); });
  }
  function startMusic() {
    if (music) return;
    if (!musicBus) musicChain();
    music = true;
    barIndex = 0;
    nextBarTime = ctx.currentTime + 0.15;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
    musicBus.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 3);     // fondu d'entrée
    const tick = () => {
      while (nextBarTime < ctx.currentTime + 0.6) { scheduleBar(nextBarTime, barIndex++); nextBarTime += BAR; }
    };
    tick();
    schedTimer = setInterval(tick, 200);
  }
  function stopMusic() {
    if (!music) return;
    music = null;
    clearInterval(schedTimer);
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
    musicBus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
  }

  /* ─── les sons, un par mouvement ─── */
  const FX = {
    // UI
    tick() { tone('sine', 1500, 700, 0.06, 0.08, bus(0, 0)); },
    select() { const b = bus(0, 0.6); pluck(hz(4), 0.12, 0.7, b); setTimeout(() => pluck(hz(7), 0.1, 0.9, b), 70); },
    error() { tone('triangle', 160, 120, 0.22, 0.12, bus(0, 0)); },
    // la page glisse vers la scène suivante : un souffle de sable
    whoosh() { noise(0.75, { f0: 260, f1: 2400, q: 0.9, peak: 0.14, attack: 0.18, dest: bus(0, 0.4) }); },
    // le nuage d'images s'ouvre : un souffle d'air large
    drift() { const b = bus(0, 0.6); noise(1.3, { type: 'lowpass', f0: 500, f1: 1600, q: 0.3, peak: 0.07, attack: 0.5, dest: b }); },
    // une ligne se lève, une image naît : une montée tonale douce
    rise() { const b = bus(0, 0.8); tone('sine', hz(0), hz(4), 0.6, 0.06, b, 0.15); noise(0.6, { f0: 600, f1: 3000, q: 1.2, peak: 0.03, attack: 0.2, dest: b }); },
    // l'image prend tout l'écran : souffle profond qui finit sur un impact sourd
    zoom() {
      const b = bus(0, 0.6);
      noise(0.9, { f0: 150, f1: 1800, q: 0.7, peak: 0.16, attack: 0.55, dest: b });
      tone('sine', 90, 42, 0.5, 0.22, bus(0, 0), 0.01, 0.62);
    },
    // un mot apparaît : petit « toc » boisé
    word() { tone('sine', 820 + Math.random() * 160, 520, 0.07, 0.07, bus((Math.random() - 0.5) * 0.4, 0.3)); },
    // une lettre s'encre : tic de frappe très léger
    type() { noise(0.035, { type: 'highpass', f0: 3500, f1: 3500, q: 0.7, peak: 0.05, attack: 0.002, dest: bus((Math.random() - 0.5) * 0.3, 0) }); },
    // un trait dessiné à la main : grattement de stylo
    draw() { const b = bus(0, 0.2); [0, 0.11, 0.23, 0.34].forEach((at) => noise(0.09, { f0: 2600, f1: 4200, q: 2, peak: 0.045, attack: 0.02, dest: b, at })); },
    // une carte se pose : choc mat
    land() { const b = bus((Math.random() - 0.5) * 0.6, 0.2); tone('sine', 140, 55, 0.18, 0.18, b, 0.003); noise(0.06, { type: 'lowpass', f0: 900, f1: 300, peak: 0.08, attack: 0.002, dest: b }); },
    // un panneau de verre apparaît : léger scintillement
    glass() { const b = bus(0, 0.9); tone('sine', 1760, 1760, 0.5, 0.025, b, 0.03); tone('sine', 2637, 2637, 0.35, 0.015, b, 0.05); noise(0.4, { type: 'highpass', f0: 5000, f1: 7000, peak: 0.018, attack: 0.08, dest: b }); },
    // les deux moitiés d'image se recollent : « clac » net
    snap() { const b = bus(0, 0.3); noise(0.03, { type: 'highpass', f0: 1800, f1: 1800, peak: 0.14, attack: 0.001, dest: b }); tone('sine', 180, 70, 0.14, 0.2, b, 0.002); },
    // elles se séparent : glissé
    split() { noise(0.28, { f0: 1400, f1: 500, q: 1.4, peak: 0.07, attack: 0.03, dest: bus(0, 0.3) }); },
    // le rideau de lames passe : balayage de gauche à droite (aller) ou de droite à gauche (retour)
    wipeIn() { [-0.8, 0, 0.8].forEach((pan, i) => noise(0.22, { f0: 700, f1: 2200, q: 1, peak: 0.07, attack: 0.04, dest: bus(pan, 0.2), at: i * 0.07 })); },
    wipeOut() { [0.8, 0, -0.8].forEach((pan, i) => noise(0.22, { f0: 2200, f1: 700, q: 1, peak: 0.06, attack: 0.04, dest: bus(pan, 0.2), at: i * 0.07 })); },
    // le compteur d'étape tourne : cliquetis mécanique
    odometer() { const b = bus(0, 0.15); [0, 0.045, 0.09].forEach((at, i) => tone('square', 1200 - i * 150, 600, 0.025, 0.035, b, 0.001, at)); },
    // une phrase s'encre : souffle d'encre
    ink() { noise(0.32, { type: 'lowpass', f0: 1800, f1: 400, q: 0.5, peak: 0.06, attack: 0.04, dest: bus(0, 0.5) }); },
    // le guillemet monte, le nom se pose : une corde
    pluck() { pluck(hz(Math.floor(Math.random() * 7)), 0.09, 1.2, bus(0, 0.7)); },
    // le logo se révèle : montée puis accord
    reveal() {
      const b = bus(0, 1);
      noise(0.9, { f0: 300, f1: 2800, q: 0.8, peak: 0.08, attack: 0.6, dest: b });
      [0, 2, 4, 7].forEach((deg, i) => setTimeout(() => on && pluck(hz(deg, 1), 0.08, 2, b), 650 + i * 110));
    },
    // la fin du questionnaire : un arpège qui s'ouvre
    chime() { const b = bus(0, 1); [0, 2, 4, 7].forEach((deg, i) => setTimeout(() => on && pluck(hz(deg, 1), 0.1, 2.2, b), i * 120)); }
  };

  // un même son ne repart pas avant ce délai (ms) : pas de rafale quand on secoue la molette
  const GAP = { type: 45, word: 60, land: 70, tick: 40 };
  function play(name) {
    if (!on || !ctx || !FX[name]) return;
    const now = performance.now();
    if (now - (lastPlay[name] || 0) < (GAP[name] || 140)) return;
    lastPlay[name] = now;
    FX[name]();
    if (api.onplay) api.onplay(name);   // crochet pour les tests
  }

  function cue(key, value, thresholds, names) {
    const prev = lastCue[key];
    lastCue[key] = value;
    if (!on || prev === undefined || prev === value) return;
    const lo = Math.min(prev, value), hi = Math.max(prev, value);
    if (!thresholds.some((t) => t > lo && t <= hi)) return;
    const fwd = value > prev;
    play(Array.isArray(names) ? names[fwd ? 0 : 1] : names);
  }

  function setOn(v) {
    on = v;
    remember(v);
    if (v) {
      if (!ctx) build();
      ctx.resume();
      out.gain.cancelScheduledValues(ctx.currentTime);
      out.gain.setTargetAtTime(0.9, ctx.currentTime, 0.08);
      startMusic();
    } else if (ctx) {
      stopMusic();
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    }
  }

  /* ─── la première question : avec ou sans le son ? ─── */
  let resolveReady;
  const ready = new Promise((r) => { resolveReady = r; });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ask() {
    const style = document.createElement('style');
    style.textContent = `
      .snd-ask { position: fixed; inset: 0; z-index: 3000; display: grid; place-items: center; padding: 20px;
        background: rgba(10, 9, 8, 0.55); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
        touch-action: none; opacity: 0; transition: opacity .45s ease; }
      .snd-ask.in { opacity: 1; }
      .snd-card { width: min(420px, 100%); padding: 30px 26px 24px; border-radius: 28px; text-align: center;
        color: #f2f1ec; font-family: 'Bricolage Grotesque', system-ui, sans-serif;
        background: rgba(28, 27, 24, 0.72); -webkit-backdrop-filter: blur(26px) saturate(150%); backdrop-filter: blur(26px) saturate(150%);
        border: 1px solid rgba(242, 241, 236, 0.1);
        box-shadow: inset 0 1px 0 rgba(242, 241, 236, 0.07), 0 30px 80px rgba(0, 0, 0, 0.5);
        transform: scale(.94); filter: blur(8px); transition: transform .6s cubic-bezier(.19, 1, .22, 1), filter .5s ease; }
      .snd-ask.in .snd-card { transform: none; filter: none; }
      .snd-ask.out { opacity: 0; }
      .snd-ask.out .snd-card { transform: scale(.97); filter: blur(6px); }
      .snd-wave { display: flex; justify-content: center; align-items: center; gap: 4px; height: 34px; margin-bottom: 18px; }
      .snd-wave i { width: 3px; height: 8px; border-radius: 2px; background: #c39669; animation: sndw 1.2s ease-in-out infinite; }
      .snd-wave i:nth-child(2) { animation-delay: -.2s; } .snd-wave i:nth-child(3) { animation-delay: -.4s; }
      .snd-wave i:nth-child(4) { animation-delay: -.6s; } .snd-wave i:nth-child(5) { animation-delay: -.8s; }
      @keyframes sndw { 0%, 100% { height: 8px; } 50% { height: 30px; } }
      .snd-kicker { font: 500 .6875rem/1 'DM Mono', ui-monospace, monospace; letter-spacing: .13em; text-transform: uppercase; color: #c39669; margin: 0 0 12px; }
      .snd-card h2 { margin: 0; font-weight: 500; font-size: clamp(1.6rem, 6vw, 2.1rem); line-height: 1.08; letter-spacing: -.028em; }
      .snd-card p.snd-text { margin: 12px 0 0; font-size: .98rem; line-height: 1.5; color: rgba(242, 241, 236, .66); }
      .snd-actions { display: grid; gap: 10px; margin-top: 24px; }
      .snd-actions button { min-height: 54px; border: 0; border-radius: 999px; font: 500 1.02rem/1 'Bricolage Grotesque', system-ui, sans-serif;
        cursor: pointer; transition: transform .1s ease-out, background-color .2s; -webkit-tap-highlight-color: transparent; }
      .snd-actions button:active { transform: scale(.97); }
      .snd-yes { background: #c39669; color: #1a1915; box-shadow: 0 10px 30px rgba(195, 150, 105, .24); }
      .snd-yes:hover { background: #cda47a; }
      .snd-no { background: rgba(242, 241, 236, .08); color: #f2f1ec; }
      .snd-no:hover { background: rgba(242, 241, 236, .12); }
      .snd-actions button:focus-visible { outline: 2px solid #c39669; outline-offset: 3px; }
      .snd-hint { margin: 16px 0 0; font: 500 .62rem/1.4 'DM Mono', ui-monospace, monospace; letter-spacing: .1em; text-transform: uppercase; color: rgba(242, 241, 236, .38); }
      @media (hover: none) { .snd-hint { display: none; } }
      @media (prefers-reduced-motion: reduce) {
        .snd-card, .snd-ask { transition: opacity .2s ease; transform: none !important; filter: none !important; }
        .snd-wave i { animation: none; height: 16px; }
      }`;
    document.head.appendChild(style);

    const box = document.createElement('div');
    box.className = 'snd-ask';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'sndAskTitle');
    box.innerHTML = `<div class="snd-card">
        <div class="snd-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        <p class="snd-kicker">NUBIAA Academia</p>
        <h2 id="sndAskTitle">Avec ou sans le son ?</h2>
        <p class="snd-text">Une musique douce et des effets accompagnent le défilement. Vous pouvez aussi continuer en silence.</p>
        <div class="snd-actions">
          <button type="button" class="snd-yes" data-sound="on">Activer le son</button>
          <button type="button" class="snd-no" data-sound="off">Continuer sans le son</button>
        </div>
        <p class="snd-hint">Touche M pour couper ou remettre le son</p>
      </div>`;
    document.body.appendChild(box);
    // la page ne défile pas tant que la question est posée
    const html = document.documentElement, prevOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('in')));
    const yes = box.querySelector('.snd-yes');
    setTimeout(() => yes.focus({ preventScroll: true }), 60);

    const choose = (v) => {
      setOn(v);
      if (v) setTimeout(() => play('select'), 40);
      box.classList.add('out');
      html.style.overflow = prevOverflow;
      removeEventListener('keydown', onKey, true);
      setTimeout(() => box.remove(), reducedMotion ? 220 : 520);
      resolveReady(v);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); choose(false); }
      else if (e.key === 'Tab') {            // le focus reste dans la question
        e.preventDefault();
        const b = [...box.querySelectorAll('button')];
        b[(b.indexOf(document.activeElement) + (e.shiftKey ? -1 : 1) + b.length) % b.length].focus();
      } else if (!['Enter', ' '].includes(e.key)) e.stopPropagation();  // la page n'entend rien d'autre
    };
    addEventListener('keydown', onKey, true);
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-sound]');
      if (b) choose(b.dataset.sound === 'on');
    });
    ['wheel', 'touchmove'].forEach((t) => box.addEventListener(t, (e) => e.preventDefault(), { passive: false }));
  }

  const forced = new URLSearchParams(location.search).get('son');
  const prior = forced !== null ? forced : remembered();
  if (prior === '1') {
    // déjà répondu « oui » pendant cette visite : le son repart au premier geste
    const resume = () => {
      if (!on) setOn(true);
      removeEventListener('pointerdown', resume, true);
      removeEventListener('keydown', resume, true);
    };
    addEventListener('pointerdown', resume, true);
    addEventListener('keydown', resume, true);
    resolveReady(true);
  } else if (prior === '0') {
    resolveReady(false);
  } else {
    ask();
  }

  // M coupe ou remet le son, à tout moment
  addEventListener('keydown', (e) => {
    if (e.key !== 'm' && e.key !== 'M') return;
    if ((e.target.closest && e.target.closest('input, textarea')) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector('.snd-ask')) return;
    setOn(!on);
    if (on) setTimeout(() => play('select'), 40);
  });
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !on) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  const api = { play, cue, ready, onplay: null, get enabled() { return on; }, get music() { return !!music; } };
  window.NubiaaSound = api;
})();
