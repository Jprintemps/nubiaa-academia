(()=>{"use strict";const P="nubiaa-son",Y=[0,1,4,5,7,8,10],$=293.66,v=(e,t=0)=>$*Math.pow(2,(Y[(e%7+7)%7]+12*(t+Math.floor(e/7)))/12);let a=null,k=null,L=null,h=!1,E=!1;const N={},I={},X=()=>{try{return sessionStorage.getItem(P)}catch{return null}},j=e=>{try{sessionStorage.setItem(P,e?"1":"0")}catch{}};function Q(){a=new(window.AudioContext||window.webkitAudioContext),k=a.createGain(),k.gain.value=0;const e=a.createDynamicsCompressor();e.threshold.value=-18,e.ratio.value=4,k.connect(e).connect(a.destination),L=a.createConvolver();const t=a.sampleRate*2.2,n=a.createBuffer(2,t,a.sampleRate);for(let i=0;i<2;i++){const m=n.getChannelData(i);for(let u=0;u<t;u++)m[u]=(Math.random()*2-1)*Math.pow(1-u/t,3)}L.buffer=n;const s=a.createGain();s.gain.value=.32,L.connect(s).connect(k)}function o(e=0,t=1){const n=a.createGain();let s=n;if(e&&a.createStereoPanner){const i=a.createStereoPanner();i.pan.value=e,n.connect(i),s=i}if(s.connect(k),t){const i=a.createGain();i.gain.value=t,s.connect(i).connect(L)}return n}const F=(e,t,n,s,i)=>{e.gain.setValueAtTime(1e-4,t),e.gain.exponentialRampToValueAtTime(s,t+n),e.gain.exponentialRampToValueAtTime(1e-4,t+n+i)};function b(e,t,n,s,i,m,u=.004,w=0){const p=a.currentTime+w,c=a.createOscillator(),f=a.createGain();c.type=e,c.frequency.setValueAtTime(t,p),n&&n!==t&&c.frequency.exponentialRampToValueAtTime(n,p+s),F(f,p,u,i,s),c.connect(f).connect(m),c.start(p),c.stop(p+u+s+.05)}let M=null;function l(e,{type:t="bandpass",f0:n=800,f1:s=800,q:i=.8,peak:m=.1,attack:u=.02,dest:w,at:p=0}={}){if(!M){M=a.createBuffer(1,a.sampleRate*2,a.sampleRate);const T=M.getChannelData(0);for(let q=0;q<T.length;q++)T[q]=Math.random()*2-1}const c=a.currentTime+p,f=a.createBufferSource(),r=a.createBiquadFilter(),d=a.createGain();f.buffer=M,f.loop=!0,r.type=t,r.Q.value=i,r.frequency.setValueAtTime(n,c),r.frequency.exponentialRampToValueAtTime(s,c+e),F(d,c,u,m,e),f.connect(r).connect(d).connect(w),f.start(c,Math.random()),f.stop(c+u+e+.05)}const A=(e,t,n,s)=>{b("triangle",e*1.006,e,n,t,s,.004),b("sine",e*2,e*2,n*.5,t*.25,s,.004)},W=!!(window.NubiaaTheme&&window.NubiaaTheme.slow)?"audio/musique-fond-leger.mp3":"audio/musique-fond.mp3",_=.32;let y=null,g=null,x=null,z=0;function J(){x=new Audio(W),x.loop=!0,x.preload="auto",g=a.createGain(),g.gain.value=0;const e=a.createBiquadFilter();e.type="lowpass",e.frequency.value=11e3,e.Q.value=.3,a.createMediaElementSource(x).connect(g).connect(e).connect(k)}function K(e,t){g.gain.cancelScheduledValues(a.currentTime),g.gain.setValueAtTime(g.gain.value,a.currentTime),g.gain.linearRampToValueAtTime(e,a.currentTime+t)}function B(e=3){y||(g||J(),y=!0,clearTimeout(z),x.play().catch(()=>{y=null,ee()}),K(_,e))}function Z(){y&&(y=null,K(0,.6),z=setTimeout(()=>x.pause(),700))}function ee(){const e=()=>{removeEventListener("pointerdown",e,!0),removeEventListener("keydown",e,!0),a&&a.resume(),E&&!document.hidden&&B(1.2)};addEventListener("pointerdown",e,!0),addEventListener("keydown",e,!0)}let S=!1;function O(){a&&(y&&(S=!0,y=null,clearTimeout(z),g.gain.cancelScheduledValues(a.currentTime),g.gain.setValueAtTime(0,a.currentTime),x.pause()),a.suspend())}function H(){if(!a||document.hidden)return;const e=()=>{S&&E&&B(1.2),S=!1};if(!h){S=!1;return}a.resume().then(e,e)}document.addEventListener("visibilitychange",()=>document.hidden?O():H()),addEventListener("pagehide",O),addEventListener("pageshow",H);const U={tick(){b("sine",1500,700,.06,.08,o(0,0))},select(){const e=o(0,.6);A(v(4),.12,.7,e),setTimeout(()=>A(v(7),.1,.9,e),70)},error(){b("triangle",160,120,.22,.12,o(0,0))},whoosh(){l(.75,{f0:260,f1:2400,q:.9,peak:.14,attack:.18,dest:o(0,.4)})},drift(){const e=o(0,.6);l(1.3,{type:"lowpass",f0:500,f1:1600,q:.3,peak:.07,attack:.5,dest:e})},rise(){const e=o(0,.8);b("sine",v(0),v(4),.6,.06,e,.15),l(.6,{f0:600,f1:3e3,q:1.2,peak:.03,attack:.2,dest:e})},zoom(){const e=o(0,.6);l(.9,{f0:150,f1:1800,q:.7,peak:.16,attack:.55,dest:e}),b("sine",90,42,.5,.22,o(0,0),.01,.62)},word(){b("sine",820+Math.random()*160,520,.07,.07,o((Math.random()-.5)*.4,.3))},type(){l(.035,{type:"highpass",f0:3500,f1:3500,q:.7,peak:.05,attack:.002,dest:o((Math.random()-.5)*.3,0)})},draw(){const e=o(0,.2);[0,.11,.23,.34].forEach(t=>l(.09,{f0:2600,f1:4200,q:2,peak:.045,attack:.02,dest:e,at:t}))},land(){const e=o((Math.random()-.5)*.6,.2);b("sine",140,55,.18,.18,e,.003),l(.06,{type:"lowpass",f0:900,f1:300,peak:.08,attack:.002,dest:e})},glass(){const e=o(0,.9);b("sine",1760,1760,.5,.025,e,.03),b("sine",2637,2637,.35,.015,e,.05),l(.4,{type:"highpass",f0:5e3,f1:7e3,peak:.018,attack:.08,dest:e})},snap(){const e=o(0,.3);l(.03,{type:"highpass",f0:1800,f1:1800,peak:.14,attack:.001,dest:e}),b("sine",180,70,.14,.2,e,.002)},split(){l(.28,{f0:1400,f1:500,q:1.4,peak:.07,attack:.03,dest:o(0,.3)})},wipeIn(){[-.8,0,.8].forEach((e,t)=>l(.22,{f0:700,f1:2200,q:1,peak:.07,attack:.04,dest:o(e,.2),at:t*.07}))},wipeOut(){[.8,0,-.8].forEach((e,t)=>l(.22,{f0:2200,f1:700,q:1,peak:.06,attack:.04,dest:o(e,.2),at:t*.07}))},odometer(){const e=o(0,.15);[0,.045,.09].forEach((t,n)=>b("square",1200-n*150,600,.025,.035,e,.001,t))},ink(){l(.32,{type:"lowpass",f0:1800,f1:400,q:.5,peak:.06,attack:.04,dest:o(0,.5)})},pluck(){A(v(Math.floor(Math.random()*7)),.09,1.2,o(0,.7))},reveal(){const e=o(0,1);l(.9,{f0:300,f1:2800,q:.8,peak:.08,attack:.6,dest:e}),[0,2,4,7].forEach((t,n)=>setTimeout(()=>h&&A(v(t,1),.08,2,e),650+n*110))},chime(){const e=o(0,1);[0,2,4,7].forEach((t,n)=>setTimeout(()=>h&&A(v(t,1),.1,2.2,e),n*120))}},te={type:45,word:60,land:70,tick:40};function C(e){if(!h||!a||!U[e])return;const t=performance.now();t-(N[e]||0)<(te[e]||140)||(N[e]=t,U[e](),V.onplay&&V.onplay(e))}function ne(e,t,n,s){const i=I[e];if(I[e]=t,!h||i===void 0||i===t)return;const m=Math.min(i,t),u=Math.max(i,t);if(!n.some(p=>p>m&&p<=u))return;const w=t>i;C(Array.isArray(s)?s[w?0:1]:s)}function G(e){E=e,j(e),a||Q(),a.resume(),h||(h=!0,k.gain.cancelScheduledValues(a.currentTime),k.gain.setTargetAtTime(.9,a.currentTime,.08)),e?B():Z()}let D;const ae=new Promise(e=>{D=e}),re=matchMedia("(prefers-reduced-motion: reduce)").matches;function se(e){const t=document.createElement("style");t.textContent=`
      .snd-ask { position: fixed; inset: 0; z-index: 3000; display: grid; place-items: center; padding: 20px;
        background: radial-gradient(80% 70% at 50% 45%, rgba(250, 246, 239, 0.1), rgba(236, 224, 205, 0.5));
        touch-action: none; opacity: 0; transition: opacity .5s ease; }
      .snd-ask.in { opacity: 1; }
      .snd-lg { position: absolute; width: 0; height: 0; }

      .snd-card { position: relative; width: min(420px, 100%); padding: 32px 26px 24px; border-radius: 34px; text-align: center; isolation: isolate;
        color: #1a1915; font-family: 'Bricolage Grotesque', system-ui, sans-serif;
        background: linear-gradient(150deg, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0.34) 38%, rgba(255, 255, 255, 0.26) 62%, rgba(255, 255, 255, 0.46) 100%);
        -webkit-backdrop-filter: blur(16px) saturate(190%) brightness(1.06);
                backdrop-filter: blur(16px) saturate(190%) brightness(1.06);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.95),
          inset 0 -1px 0 rgba(140, 100, 60, 0.12),
          inset 0 0 0 1px rgba(255, 255, 255, 0.4),
          inset 0 18px 40px -20px rgba(255, 255, 255, 0.7),
          0 30px 80px rgba(90, 62, 34, 0.22), 0 6px 18px rgba(90, 62, 34, 0.12);
        transform: scale(.92); filter: blur(10px);
        transition: transform .7s cubic-bezier(.2, 1.3, .3, 1), filter .5s ease, border-radius .55s cubic-bezier(.65, 0, .35, 1), opacity .45s ease; }
      .snd-card.refract { -webkit-backdrop-filter: url(#sndLiquid) blur(16px) saturate(190%) brightness(1.06);
                                  backdrop-filter: url(#sndLiquid) blur(16px) saturate(190%) brightness(1.06); }
      /* le liseré : un dégradé de lumière posé sur le bord seulement */
      .snd-card::before { content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1.2px; pointer-events: none; z-index: 2;
        background: linear-gradient(140deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.3) 30%, rgba(195, 150, 105, 0.18) 55%, rgba(255, 255, 255, 0.8) 100%);
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
      /* le reflet qui suit le pointeur */
      .snd-card::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 1;
        background: radial-gradient(240px circle at var(--mx, 30%) var(--my, 0%), rgba(255, 255, 255, 0.55), transparent 60%);
        mix-blend-mode: soft-light; transition: opacity .3s; }
      .snd-card > * { position: relative; z-index: 3; }
      .snd-ask.in .snd-card { transform: none; filter: none; }
      /* sortie : la carte se replie en pilule vers le haut, puis s'efface */
      .snd-ask.out { opacity: 0; transition: opacity .55s ease .15s; }
      .snd-ask.out .snd-card { transform: translateY(-38vh) scale(.28, .14); border-radius: 999px; filter: blur(2px); opacity: 0;
        transition: transform .62s cubic-bezier(.65, 0, .35, 1), border-radius .4s ease, filter .5s ease, opacity .35s ease .3s; }
      .snd-ask.out .snd-card > * { opacity: 0; transition: opacity .15s; }

      .snd-wave { display: flex; justify-content: center; align-items: center; gap: 4px; height: 34px; margin-bottom: 18px; }
      .snd-wave i { width: 3px; height: 8px; border-radius: 2px; background: #b07f50; box-shadow: 0 0 10px rgba(195, 150, 105, .45); animation: sndw 1.2s ease-in-out infinite; }
      .snd-wave i:nth-child(2) { animation-delay: -.2s; } .snd-wave i:nth-child(3) { animation-delay: -.4s; }
      .snd-wave i:nth-child(4) { animation-delay: -.6s; } .snd-wave i:nth-child(5) { animation-delay: -.8s; }
      @keyframes sndw { 0%, 100% { height: 8px; } 50% { height: 30px; } }
      .snd-kicker { font: 500 .6875rem/1 'DM Mono', ui-monospace, monospace; letter-spacing: .13em; text-transform: uppercase; color: #8a5a2f; margin: 0 0 12px; }
      .snd-card h2 { margin: 0; font-weight: 500; font-size: clamp(1.6rem, 6vw, 2.1rem); line-height: 1.08; letter-spacing: -.028em; text-shadow: 0 1px 0 rgba(255, 255, 255, .6); }
      .snd-card p.snd-text { margin: 12px 0 0; font-size: .98rem; line-height: 1.5; color: rgba(26, 25, 21, .72); font-weight: 450; letter-spacing: .005em; }

      .snd-actions { display: grid; gap: 10px; margin-top: 24px; }
      .snd-actions button { position: relative; overflow: hidden; min-height: 54px; border: 0; border-radius: 999px; isolation: isolate;
        font: 500 1.02rem/1 'Bricolage Grotesque', system-ui, sans-serif; cursor: pointer; -webkit-tap-highlight-color: transparent;
        -webkit-backdrop-filter: blur(10px) saturate(180%); backdrop-filter: blur(10px) saturate(180%);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .9), inset 0 -1px 0 rgba(140, 100, 60, .14), inset 0 0 0 1px rgba(255, 255, 255, .5), 0 8px 24px rgba(90, 62, 34, .16);
        transition: transform .5s cubic-bezier(.2, 1.6, .35, 1), background-color .2s, box-shadow .2s; }
      .snd-actions button::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: -1;
        background: radial-gradient(120px circle at var(--bx, 50%) var(--by, 0%), rgba(255, 255, 255, .6), transparent 70%); opacity: 0; transition: opacity .25s; }
      .snd-actions button:hover::after, .snd-actions button.pressed::after { opacity: 1; }
      .snd-actions button:hover { transform: scale(1.02); }
      .snd-actions button.pressed { transform: scale(.95); transition-duration: .12s; }
      /* verre teinté (le choix principal) et verre clair */
      .snd-yes { color: #1a1915; background: linear-gradient(180deg, rgba(226, 189, 143, .92), rgba(195, 150, 105, .78)); }
      .snd-no { color: #1a1915; background: linear-gradient(180deg, rgba(255, 255, 255, .7), rgba(255, 255, 255, .4)); }
      .snd-actions button:focus-visible { outline: 2px solid rgba(138, 90, 47, .9); outline-offset: 3px; }
      .snd-hint { margin: 16px 0 0; font: 500 .62rem/1.4 'DM Mono', ui-monospace, monospace; letter-spacing: .1em; text-transform: uppercase; color: rgba(26, 25, 21, .45); }
      /* thème sombre : du verre fumé, texte clair */
      [data-theme="dark"] .snd-ask { background: radial-gradient(80% 70% at 50% 45%, rgba(10, 9, 8, 0.12), rgba(10, 9, 8, 0.5)); }
      [data-theme="dark"] .snd-card { color: #fbf8f3;
        background: linear-gradient(150deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.05) 38%, rgba(255, 255, 255, 0.02) 62%, rgba(255, 255, 255, 0.09) 100%);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.42), inset 0 -1px 0 rgba(255, 255, 255, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.08),
          inset 0 18px 40px -20px rgba(255, 255, 255, 0.18), 0 30px 80px rgba(0, 0, 0, 0.45), 0 6px 18px rgba(0, 0, 0, 0.25); }
      [data-theme="dark"] .snd-card::before { background: linear-gradient(140deg, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.08) 30%, rgba(255, 255, 255, 0.02) 55%, rgba(255, 255, 255, 0.35) 100%); }
      [data-theme="dark"] .snd-card::after { background: radial-gradient(240px circle at var(--mx, 30%) var(--my, 0%), rgba(255, 255, 255, 0.16), transparent 60%); mix-blend-mode: screen; }
      [data-theme="dark"] .snd-wave i { background: #e2bd8f; box-shadow: 0 0 10px rgba(226, 189, 143, .6); }
      [data-theme="dark"] .snd-kicker { color: #e2bd8f; }
      [data-theme="dark"] .snd-card h2 { text-shadow: 0 1px 12px rgba(0, 0, 0, .25); }
      [data-theme="dark"] .snd-card p.snd-text { color: rgba(251, 248, 243, .78); }
      [data-theme="dark"] .snd-actions button { box-shadow: inset 0 1px 0 rgba(255, 255, 255, .45), inset 0 -1px 0 rgba(255, 255, 255, .08), inset 0 0 0 1px rgba(255, 255, 255, .12), 0 8px 24px rgba(0, 0, 0, .22); }
      [data-theme="dark"] .snd-actions button::after { background: radial-gradient(120px circle at var(--bx, 50%) var(--by, 0%), rgba(255, 255, 255, .35), transparent 70%); }
      [data-theme="dark"] .snd-no { color: #fbf8f3; background: linear-gradient(180deg, rgba(255, 255, 255, .16), rgba(255, 255, 255, .06)); }
      [data-theme="dark"] .snd-actions button:focus-visible { outline-color: rgba(226, 189, 143, .9); }
      [data-theme="dark"] .snd-hint { color: rgba(251, 248, 243, .45); }
      @media (hover: none) { .snd-hint { display: none; } }
      @media (prefers-reduced-transparency: reduce) {
        .snd-card, .snd-card.refract { background: #fbf8f2; -webkit-backdrop-filter: none; backdrop-filter: none; }
        [data-theme="dark"] .snd-card, [data-theme="dark"] .snd-card.refract { background: #24221f; }
      }
      @media (prefers-reduced-motion: reduce) {
        .snd-card, .snd-ask, .snd-ask.out .snd-card { transition: opacity .2s ease; transform: none !important; filter: none !important; }
        .snd-wave i { animation: none; height: 16px; }
      }`,document.head.appendChild(t);const n=document.createElement("div");n.className="snd-ask",n.setAttribute("role","dialog"),n.setAttribute("aria-modal","true"),n.setAttribute("aria-labelledby","sndAskTitle"),n.innerHTML=`
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
        <h2 id="sndAskTitle">Avec ou sans musique ?</h2>
        <p class="snd-text">Des bruitages accompagnent chaque mouvement de la page. Ajoutez une musique de fond si vous le souhaitez.</p>
        <div class="snd-actions">
          <button type="button" class="snd-yes" data-sound="on">Avec la musique</button>
          <button type="button" class="snd-no" data-sound="off">Sans musique</button>
        </div>
        <p class="snd-hint">Touche M pour couper ou remettre la musique</p>
      </div>`,document.body.appendChild(n);const s=n.querySelector(".snd-card");!!(navigator.userAgentData&&navigator.userAgentData.brands.some(r=>/Chromium/.test(r.brand)))&&s.classList.add("refract");const m=document.documentElement,u=m.style.overflow;m.style.overflow="hidden",requestAnimationFrame(()=>requestAnimationFrame(()=>n.classList.add("in")));const w=n.querySelector(e==="0"?".snd-no":".snd-yes");setTimeout(()=>w.focus({preventScroll:!0}),60),n.addEventListener("pointermove",r=>{const d=s.getBoundingClientRect();s.style.setProperty("--mx",`${r.clientX-d.left}px`),s.style.setProperty("--my",`${r.clientY-d.top}px`);const T=r.target.closest(".snd-actions button");if(T){const q=T.getBoundingClientRect();T.style.setProperty("--bx",`${r.clientX-q.left}px`),T.style.setProperty("--by",`${r.clientY-q.top}px`)}}),n.addEventListener("pointerdown",r=>{const d=r.target.closest(".snd-actions button");d&&d.classList.add("pressed")});const p=()=>n.querySelectorAll(".pressed").forEach(r=>r.classList.remove("pressed"));n.addEventListener("pointerup",p),n.addEventListener("pointercancel",p),n.addEventListener("pointerleave",p);const c=r=>{G(r),setTimeout(()=>C("select"),40),n.classList.add("out"),m.style.overflow=u,removeEventListener("keydown",f,!0),setTimeout(()=>n.remove(),re?240:760),D(r)},f=r=>{if(r.key==="Escape")r.preventDefault(),c(!1);else if(r.key==="Tab"){r.preventDefault();const d=[...n.querySelectorAll("button")];d[(d.indexOf(document.activeElement)+(r.shiftKey?-1:1)+d.length)%d.length].focus()}else["Enter"," "].includes(r.key)||r.stopPropagation()};addEventListener("keydown",f,!0),n.addEventListener("click",r=>{const d=r.target.closest("[data-sound]");d&&c(d.dataset.sound==="on")}),["wheel","touchmove"].forEach(r=>n.addEventListener(r,d=>d.preventDefault(),{passive:!1}))}const R=new URLSearchParams(location.search).get("son");if(R==="1"||R==="0"){const e=()=>{h||G(R==="1"),removeEventListener("pointerdown",e,!0),removeEventListener("keydown",e,!0)};addEventListener("pointerdown",e,!0),addEventListener("keydown",e,!0),D(R==="1")}else se(X());addEventListener("keydown",e=>{e.key!=="m"&&e.key!=="M"||e.target.closest&&e.target.closest('input, textarea, select, [contenteditable], [role="combobox"]')||e.metaKey||e.ctrlKey||e.altKey||e.repeat||document.querySelector(".snd-ask")||(G(!E),C("tick"))});const V={play:C,cue:ne,ready:ae,onplay:null,get enabled(){return h},get music(){return!!y},get musicWanted(){return E},get musicTime(){return x?x.currentTime:0}};window.NubiaaSound=V})();
