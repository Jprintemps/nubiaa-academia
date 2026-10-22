/* ═══════════════════════════════════════════════════════════
   NUBIAA Academia — les effets sonores
   Chaque mouvement de la page a son propre son, déclenché au
   moment exact où il se produit (au scroll, dans les deux sens).
   Sous les effets, une instru trap douce : 808, clap, charleston
   avec roulements, nappe et cloche, en ré mineur à 140 battements
   par minute (demi-temps). Tout est synthétisé avec la Web Audio
   API : aucun fichier, aucun droit à gérer.

   Au chargement, une première question : avec ou sans le son ?
   Ce clic débloque l'audio (les navigateurs l'exigent), puis la
   page continue. Elle est posée à chaque chargement, en style Liquid
   Glass, le focus sur la réponse donnée la fois précédente. La touche
   M coupe ou remet le son à tout moment. `?son=0` ou `?son=1` dans l'adresse
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

  /* ─── la musique de fond : une instru trap douce ───
     140 battements par minute en demi-temps (on la ressent à 70) :
     kick et basse 808 qui glisse, clap sur le 3e temps, charleston en
     croches avec des roulements, une nappe sombre et une mélodie de
     cloche. Ré mineur, ré m – si♭ – sol m – la : le la majeur garde la
     couleur orientale du site. Un ordonnanceur pose les notes un peu
     en avance sur l'horloge audio : le tempo reste régulier même quand
     la page travaille. */
  const BPM = 140, STEP = 60 / BPM / 4, BAR = STEP * 16;
  const N = (semi) => 146.83 * Math.pow(2, semi / 12);          // demi-tons depuis ré 3
  // deux mesures par accord : fondamentale + accord (demi-tons depuis ré 3)
  const CHORDS = [
    { root: 0, tones: [0, 3, 7, 12] },      // ré mineur
    { root: -4, tones: [-4, 0, 3, 8] },     // si bémol majeur
    { root: -7, tones: [-7, -2, 3, 5] },    // sol mineur
    { root: -5, tones: [-5, -1, 2, 7] }     // la majeur
  ];
  // la mélodie de cloche (pas de double croche → demi-tons depuis ré 4), un motif par accord
  const BELL = [
    [[0, 7], [3, 5], [6, 3], [10, 2], [12, 0]],
    [[0, 5], [4, 3], [8, 0], [12, -2]],
    [[0, 3], [3, 2], [6, 0], [10, -2], [12, 0]],
    [[0, 1], [4, 0], [8, -1], [11, 1], [14, 4]]
  ];
  let music = null, musicBus = null, barIndex = 0, nextBarTime = 0, schedTimer = 0, crush = null;

  function musicChain() {
    musicBus = ctx.createGain(); musicBus.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000; lp.Q.value = 0.3;
    musicBus.connect(lp); lp.connect(out);
    const send = ctx.createGain(); send.gain.value = 0.25; lp.connect(send).connect(verb);
    // une saturation douce pour que la 808 s'entende aussi sur un haut-parleur de téléphone
    crush = ctx.createWaveShaper();
    const c = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; c[i] = Math.tanh(x * 2.2); }
    crush.curve = c;
    crush.connect(musicBus);
  }
  const at = (t) => Math.max(0, t - ctx.currentTime);

  function kick(t) { tone('sine', 150, 44, 0.32, 0.22, musicBus, 0.002, at(t)); }
  function b808(semi, t, len, glideTo) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    const f = N(semi - 24);                                    // ré 1 → la 1
    o.frequency.setValueAtTime(f * 1.06, t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
    if (glideTo !== undefined) o.frequency.exponentialRampToValueAtTime(N(glideTo - 24), t + len * 0.9);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(crush);
    o.start(t); o.stop(t + len + 0.05);
  }
  function clap(t) {
    [0, 0.011, 0.022].forEach((d) => noise(0.05, { f0: 1500, f1: 1200, q: 1.2, peak: 0.07, attack: 0.001, dest: musicBus, at: at(t) + d }));
    noise(0.22, { f0: 1800, f1: 900, q: 0.9, peak: 0.035, attack: 0.002, dest: musicBus, at: at(t) + 0.03 });
    tone('triangle', 210, 160, 0.09, 0.05, musicBus, 0.001, at(t));
  }
  function hat(t, peak = 0.03, open = false) {
    noise(open ? 0.16 : 0.03, { type: 'highpass', f0: 8500, f1: 9500, q: 0.6, peak, attack: 0.001, dest: musicBus, at: at(t) });
  }
  function bell(semi, t) {
    const f = N(semi + 12);
    tone('sine', f, f, 1.1, 0.03, musicBus, 0.003, at(t));
    tone('sine', f * 2.76, f * 2.76, 0.35, 0.008, musicBus, 0.002, at(t));   // le partiel qui fait « cloche »
  }
  function pad(tones, t) {
    tones.forEach((st) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = N(st);
      f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = 0.2;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.008, t + 0.9);
      g.gain.setValueAtTime(0.008, t + BAR * 2 - 0.5);
      g.gain.linearRampToValueAtTime(0.0001, t + BAR * 2 + 0.4);
      o.connect(f).connect(g).connect(musicBus);
      o.start(t); o.stop(t + BAR * 2 + 0.5);
    });
  }

  function scheduleBar(t, n) {
    const ci = Math.floor(n / 2) % 4, c = CHORDS[ci], second = n % 2 === 1, lap = Math.floor(n / 8);
    if (!second) pad(c.tones, t);
    // kick + 808 : le 1, la double croche 10, et un rebond sur la 7 une mesure sur deux
    const hits = second ? [0, 7, 10] : [0, 10];
    hits.forEach((s, i) => {
      kick(t + s * STEP);
      const last = i === hits.length - 1;
      const next = CHORDS[(ci + (second ? 1 : 0)) % 4].root;
      b808(c.root, t + s * STEP, (last ? 16 - s : hits[i + 1] - s) * STEP, last && second ? next : undefined);
    });
    clap(t + 8 * STEP);                                       // le 3e temps : le demi-temps de la trap
    // charleston en croches ; roulement en triples croches à la fin des mesures paires
    for (let s = 0; s < 16; s += 2) hat(t + s * STEP, s % 4 === 0 ? 0.03 : 0.02);
    hat(t + 6 * STEP, 0.022, true);
    if (second) [12, 12.5, 13, 13.5, 14, 14.33, 14.66, 15, 15.33, 15.66].forEach((s, i) => hat(t + s * STEP, 0.012 + i * 0.0018));
    // la cloche entre au deuxième tour
    if (lap >= 1 && !second) BELL[ci].forEach(([s, st]) => bell(st, t + s * STEP));
  }

  function startMusic() {
    if (music) return;
    if (!musicBus) musicChain();
    music = true;
    barIndex = 0;
    nextBarTime = ctx.currentTime + 0.15;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
    musicBus.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 3);      // fondu d'entrée
    const tick = () => {
      while (nextBarTime < ctx.currentTime + 0.5) { scheduleBar(nextBarTime, barIndex++); nextBarTime += BAR; }
    };
    tick();
    schedTimer = setInterval(tick, 150);
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

  function ask(previous) {
    /* Liquid Glass, version web :
       · le verre réfracte vraiment l'arrière-plan : un filtre SVG
         (turbulence + déplacement) appliqué au flou de fond, sur
         Chromium ; ailleurs, un verre flouté classique ;
       · un liseré de lumière sur les bords, plus vif en haut à gauche ;
       · un reflet qui suit le pointeur (le verre réagit au toucher) ;
       · des boutons en verre : teinté bronze pour le choix principal,
         clair pour l'autre, qui s'enfoncent puis rebondissent ;
       · à la réponse, la carte se replie en pilule vers le haut. */
    const style = document.createElement('style');
    style.textContent = `
      .snd-ask { position: fixed; inset: 0; z-index: 3000; display: grid; place-items: center; padding: 20px;
        background: radial-gradient(80% 70% at 50% 45%, rgba(10, 9, 8, 0.12), rgba(10, 9, 8, 0.5));
        touch-action: none; opacity: 0; transition: opacity .5s ease; }
      .snd-ask.in { opacity: 1; }
      .snd-lg { position: absolute; width: 0; height: 0; }

      .snd-card { position: relative; width: min(420px, 100%); padding: 32px 26px 24px; border-radius: 34px; text-align: center; isolation: isolate;
        color: #fbf8f3; font-family: 'Bricolage Grotesque', system-ui, sans-serif;
        background: linear-gradient(150deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.05) 38%, rgba(255, 255, 255, 0.02) 62%, rgba(255, 255, 255, 0.09) 100%);
        -webkit-backdrop-filter: blur(16px) saturate(190%) brightness(1.06);
                backdrop-filter: blur(16px) saturate(190%) brightness(1.06);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.42),
          inset 0 -1px 0 rgba(255, 255, 255, 0.1),
          inset 0 0 0 1px rgba(255, 255, 255, 0.08),
          inset 0 18px 40px -20px rgba(255, 255, 255, 0.18),
          0 30px 80px rgba(0, 0, 0, 0.45), 0 6px 18px rgba(0, 0, 0, 0.25);
        transform: scale(.92); filter: blur(10px);
        transition: transform .7s cubic-bezier(.2, 1.3, .3, 1), filter .5s ease, border-radius .55s cubic-bezier(.65, 0, .35, 1), opacity .45s ease; }
      .snd-card.refract { -webkit-backdrop-filter: url(#sndLiquid) blur(16px) saturate(190%) brightness(1.06);
                                  backdrop-filter: url(#sndLiquid) blur(16px) saturate(190%) brightness(1.06); }
      /* le liseré : un dégradé de lumière posé sur le bord seulement */
      .snd-card::before { content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1.2px; pointer-events: none; z-index: 2;
        background: linear-gradient(140deg, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.08) 30%, rgba(255, 255, 255, 0.02) 55%, rgba(255, 255, 255, 0.35) 100%);
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
      /* le reflet qui suit le pointeur */
      .snd-card::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 1;
        background: radial-gradient(240px circle at var(--mx, 30%) var(--my, 0%), rgba(255, 255, 255, 0.16), transparent 60%);
        mix-blend-mode: screen; transition: opacity .3s; }
      .snd-card > * { position: relative; z-index: 3; }
      .snd-ask.in .snd-card { transform: none; filter: none; }
      /* sortie : la carte se replie en pilule vers le haut, puis s'efface */
      .snd-ask.out { opacity: 0; transition: opacity .55s ease .15s; }
      .snd-ask.out .snd-card { transform: translateY(-38vh) scale(.28, .14); border-radius: 999px; filter: blur(2px); opacity: 0;
        transition: transform .62s cubic-bezier(.65, 0, .35, 1), border-radius .4s ease, filter .5s ease, opacity .35s ease .3s; }
      .snd-ask.out .snd-card > * { opacity: 0; transition: opacity .15s; }

      .snd-wave { display: flex; justify-content: center; align-items: center; gap: 4px; height: 34px; margin-bottom: 18px; }
      .snd-wave i { width: 3px; height: 8px; border-radius: 2px; background: #e2bd8f; box-shadow: 0 0 10px rgba(226, 189, 143, .6); animation: sndw 1.2s ease-in-out infinite; }
      .snd-wave i:nth-child(2) { animation-delay: -.2s; } .snd-wave i:nth-child(3) { animation-delay: -.4s; }
      .snd-wave i:nth-child(4) { animation-delay: -.6s; } .snd-wave i:nth-child(5) { animation-delay: -.8s; }
      @keyframes sndw { 0%, 100% { height: 8px; } 50% { height: 30px; } }
      .snd-kicker { font: 500 .6875rem/1 'DM Mono', ui-monospace, monospace; letter-spacing: .13em; text-transform: uppercase; color: #e2bd8f; margin: 0 0 12px; }
      .snd-card h2 { margin: 0; font-weight: 500; font-size: clamp(1.6rem, 6vw, 2.1rem); line-height: 1.08; letter-spacing: -.028em; text-shadow: 0 1px 12px rgba(0, 0, 0, .25); }
      .snd-card p.snd-text { margin: 12px 0 0; font-size: .98rem; line-height: 1.5; color: rgba(251, 248, 243, .78); font-weight: 450; letter-spacing: .005em; }

      .snd-actions { display: grid; gap: 10px; margin-top: 24px; }
      .snd-actions button { position: relative; overflow: hidden; min-height: 54px; border: 0; border-radius: 999px; isolation: isolate;
        font: 500 1.02rem/1 'Bricolage Grotesque', system-ui, sans-serif; cursor: pointer; -webkit-tap-highlight-color: transparent;
        -webkit-backdrop-filter: blur(10px) saturate(180%); backdrop-filter: blur(10px) saturate(180%);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .45), inset 0 -1px 0 rgba(255, 255, 255, .08), inset 0 0 0 1px rgba(255, 255, 255, .12), 0 8px 24px rgba(0, 0, 0, .22);
        transition: transform .5s cubic-bezier(.2, 1.6, .35, 1), background-color .2s, box-shadow .2s; }
      .snd-actions button::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: -1;
        background: radial-gradient(120px circle at var(--bx, 50%) var(--by, 0%), rgba(255, 255, 255, .35), transparent 70%); opacity: 0; transition: opacity .25s; }
      .snd-actions button:hover::after, .snd-actions button.pressed::after { opacity: 1; }
      .snd-actions button:hover { transform: scale(1.02); }
      .snd-actions button.pressed { transform: scale(.95); transition-duration: .12s; }
      /* verre teinté (le choix principal) et verre clair */
      .snd-yes { color: #1a1915; background: linear-gradient(180deg, rgba(226, 189, 143, .92), rgba(195, 150, 105, .78)); }
      .snd-no { color: #fbf8f3; background: linear-gradient(180deg, rgba(255, 255, 255, .16), rgba(255, 255, 255, .06)); }
      .snd-actions button:focus-visible { outline: 2px solid rgba(226, 189, 143, .9); outline-offset: 3px; }
      .snd-hint { margin: 16px 0 0; font: 500 .62rem/1.4 'DM Mono', ui-monospace, monospace; letter-spacing: .1em; text-transform: uppercase; color: rgba(251, 248, 243, .45); }
      @media (hover: none) { .snd-hint { display: none; } }
      @media (prefers-reduced-transparency: reduce) {
        .snd-card, .snd-card.refract { background: #24221f; -webkit-backdrop-filter: none; backdrop-filter: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        .snd-card, .snd-ask, .snd-ask.out .snd-card { transition: opacity .2s ease; transform: none !important; filter: none !important; }
        .snd-wave i { animation: none; height: 16px; }
      }`;
    document.head.appendChild(style);

    const box = document.createElement('div');
    box.className = 'snd-ask';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'sndAskTitle');
    box.innerHTML = `
      <svg class="snd-lg" aria-hidden="true" focusable="false">
        <filter id="sndLiquid" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="n"/>
          <feGaussianBlur in="n" stdDeviation="2" result="nb"/>
          <feDisplacementMap in="SourceGraphic" in2="nb" scale="38" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </svg>
      <div class="snd-card">
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
    const card = box.querySelector('.snd-card');
    // la vraie réfraction (filtre SVG dans le flou de fond) n'existe que sur Chromium
    const chromium = !!(navigator.userAgentData && navigator.userAgentData.brands.some((b) => /Chromium/.test(b.brand)));
    if (chromium) card.classList.add('refract');

    // la page ne défile pas tant que la question est posée
    const html = document.documentElement, prevOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('in')));
    // le focus va sur la réponse donnée la dernière fois, sinon sur « Activer le son »
    const first = box.querySelector(previous === '0' ? '.snd-no' : '.snd-yes');
    setTimeout(() => first.focus({ preventScroll: true }), 60);

    // le verre réagit au pointeur : le reflet suit, les boutons s'enfoncent à l'appui
    box.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
      const btn = e.target.closest('.snd-actions button');
      if (btn) {
        const b = btn.getBoundingClientRect();
        btn.style.setProperty('--bx', `${e.clientX - b.left}px`);
        btn.style.setProperty('--by', `${e.clientY - b.top}px`);
      }
    });
    box.addEventListener('pointerdown', (e) => { const b = e.target.closest('.snd-actions button'); if (b) b.classList.add('pressed'); });
    const unpress = () => box.querySelectorAll('.pressed').forEach((b) => b.classList.remove('pressed'));
    box.addEventListener('pointerup', unpress);
    box.addEventListener('pointercancel', unpress);
    box.addEventListener('pointerleave', unpress);

    const choose = (v) => {
      setOn(v);
      if (v) setTimeout(() => play('select'), 40);
      box.classList.add('out');
      html.style.overflow = prevOverflow;
      removeEventListener('keydown', onKey, true);
      setTimeout(() => box.remove(), reducedMotion ? 240 : 760);
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

  // la question est posée à chaque chargement ; `?son=0` ou `?son=1` la saute (captures et tests)
  const forced = new URLSearchParams(location.search).get('son');
  if (forced === '1') {
    const resume = () => {
      if (!on) setOn(true);
      removeEventListener('pointerdown', resume, true);
      removeEventListener('keydown', resume, true);
    };
    addEventListener('pointerdown', resume, true);
    addEventListener('keydown', resume, true);
    resolveReady(true);
  } else if (forced === '0') {
    resolveReady(false);
  } else {
    ask(remembered());
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
