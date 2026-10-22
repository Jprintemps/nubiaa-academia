/* ═══════════════════════════════════════════════════════════
   NUBIAA Academia — le questionnaire au scroll
   Fichier source : `python build_questionnaire.py` y injecte les
   icônes Phosphor (Iconify) et écrit ../questionnaire.js.

   Le principe :
   · chaque question est une scène épinglée qu'on traverse au
     scroll (fond en parallaxe, numéro géant, visuels flottants,
     panneau en verre) ;
   · la page s'arrête à la question en cours : répondre ouvre la
     scène suivante et y emmène la page avec un ressort, que la
     molette ou le doigt peuvent interrompre à tout moment ;
   · on peut remonter changer une réponse, rien n'est perdu.
   ═══════════════════════════════════════════════════════════ */

/* ─── À RÉGLER AVANT LA MISE EN LIGNE ─── */
const CONFIG = {
  // URL qui reçoit les réponses en JSON (Google Apps Script, Make…).
  // Vide = rien n'est envoyé : la page reste une maquette.
  endpoint: '',
  // Numéro WhatsApp de NUBIAA, format international sans + (ex. 2438xxxxxxxx).
  // Vide = le bouton « Écrire à Stella » n'apparaît pas.
  whatsapp: '',
  // Heures proposées pour l'échange découverte (heure de Kinshasa, UTC+1).
  hours: ['10:00', '14:00', '16:30'],
  days: 6,
  // « Aucun de ces créneaux ne me convient » : le calendrier propose les jours
  // de demain à `calDays` jours, et les heures de `calFrom` à `calTo` (pas de 30 min)
  calDays: 90, calFrom: 8, calTo: 19.5
};

/* Indicatifs téléphoniques internationaux, par code pays ISO 3166-1.
   Les noms des pays viennent du navigateur (Intl.DisplayNames, en français) :
   ici, seulement le code et l'indicatif. Injecté dans questionnaire.js au build. */
const PAYS = 'AF93 AL355 DZ213 AS1684 AD376 AO244 AI1264 AG1268 AR54 AM374 AW297 AU61 AT43 AZ994 ' +
  'BS1242 BH973 BD880 BB1246 BY375 BE32 BZ501 BJ229 BM1441 BT975 BO591 BA387 BW267 BR55 VG1284 BN673 BG359 BF226 BI257 ' +
  'KH855 CM237 CA1 CV238 KY1345 CF236 TD235 CL56 CN86 CO57 KM269 CG242 CD243 CK682 CR506 CI225 HR385 CU53 CW599 CY357 CZ420 ' +
  'DK45 DJ253 DM1767 DO1809 EC593 EG20 SV503 GQ240 ER291 EE372 SZ268 ET251 FK500 FO298 FJ679 FI358 FR33 GF594 PF689 ' +
  'GA241 GM220 GE995 DE49 GH233 GI350 GR30 GL299 GD1473 GP590 GU1671 GT502 GG44 GN224 GW245 GY592 ' +
  'HT509 HN504 HK852 HU36 IS354 IN91 ID62 IR98 IQ964 IE353 IM44 IL972 IT39 JM1876 JP81 JE44 JO962 ' +
  'KZ7 KE254 KI686 XK383 KW965 KG996 LA856 LV371 LB961 LS266 LR231 LY218 LI423 LT370 LU352 ' +
  'MO853 MG261 MW265 MY60 MV960 ML223 MT356 MH692 MQ596 MR222 MU230 YT262 MX52 FM691 MD373 MC377 MN976 ME382 MS1664 MA212 MZ258 MM95 ' +
  'NA264 NR674 NP977 NL31 NC687 NZ64 NI505 NE227 NG234 NU683 KP850 MK389 MP1670 NO47 OM968 ' +
  'PK92 PW680 PS970 PA507 PG675 PY595 PE51 PH63 PL48 PT351 PR1787 QA974 RE262 RO40 RU7 RW250 ' +
  'BL590 SH290 KN1869 LC1758 MF590 PM508 VC1784 WS685 SM378 ST239 SA966 SN221 RS381 SC248 SL232 SG65 SX1721 SK421 SI386 ' +
  'SB677 SO252 ZA27 KR82 SS211 ES34 LK94 SD249 SR597 SE46 CH41 SY963 ' +
  'TW886 TJ992 TZ255 TH66 TL670 TG228 TK690 TO676 TT1868 TN216 TR90 TM993 TC1649 TV688 ' +
  'UG256 UA380 AE971 GB44 US1 UY598 VI1340 UZ998 VU678 VA39 VE58 VN84 WF681 EH212 YE967 ZM260 ZW263';
const flag = (cc) => String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
// Windows n'affiche pas les drapeaux émoji (il écrit « CD ») : on le détecte une fois,
// et l'on montre alors le code du pays dans une pastille, sans rien télécharger
const FLAGS_OK = (() => {
  try {
    const c = document.createElement('canvas'); c.width = c.height = 20;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.textBaseline = 'top'; x.font = '16px sans-serif'; x.fillStyle = '#000';
    x.fillText(flag('FR'), 0, 0);
    const d = x.getImageData(0, 0, 20, 20).data;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 120 && d[i + 2] > d[i] + 60) return true;   // du bleu : un vrai drapeau
    return false;
  } catch (e) { return true; }
})();
const flagHTML = (cc) => FLAGS_OK
  ? `<span class="fl" aria-hidden="true">${flag(cc)}</span>`
  : `<span class="fl code" aria-hidden="true">${cc}</span>`;
const regionName = (() => {
  try { const dn = new Intl.DisplayNames(['fr'], { type: 'region' }); return (cc) => dn.of(cc) || cc; } catch (e) { return (cc) => cc; }
})();
// les noms qu'on emploie à Kinshasa, et d'autres façons de chercher un pays
const NOM_PAYS = { CD: 'RD Congo', CG: 'Congo-Brazzaville' };
const ALIAS = {
  CD: 'rdc drc zaire congo kinshasa republique democratique', CG: 'congo brazzaville', US: 'usa etats unis amerique',
  GB: 'uk angleterre royaume uni grande bretagne', AE: 'emirats dubai', CI: 'cote d ivoire', ZA: 'afrique du sud', NL: 'hollande'
};
// recherche sans accents ni casse : « Côte-d’Ivoire » → « cote d ivoire »
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[‘’'`´\-–—.,()/]/g, ' ').replace(/\s+/g, ' ').trim();
const COUNTRIES = PAYS.trim().split(/\s+/)
  .map((t) => { const cc = t.slice(0, 2); return { cc, dial: '+' + t.slice(2), name: NOM_PAYS[cc] || regionName(cc) }; })
  .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
const BY_CC = Object.fromEntries(COUNTRIES.map((c) => [c.cc, c]));
// en tête de liste : la RDC et les pays d'où viennent le plus de demandes
const TOP_CC = ['CD', 'CG', 'AO', 'CM', 'FR', 'BE', 'CA', 'US'];

const ICONS = {"arrow-left":"<path fill=\"currentColor\" d=\"M224 128a8 8 0 0 1-8 8H59.31l58.35 58.34a8 8 0 0 1-11.32 11.32l-72-72a8 8 0 0 1 0-11.32l72-72a8 8 0 0 1 11.32 11.32L59.31 120H216a8 8 0 0 1 8 8\"/>","arrow-right":"<path fill=\"currentColor\" d=\"m221.66 133.66l-72 72a8 8 0 0 1-11.32-11.32L196.69 136H40a8 8 0 0 1 0-16h156.69l-58.35-58.34a8 8 0 0 1 11.32-11.32l72 72a8 8 0 0 1 0 11.32\"/>","arrows-clockwise":"<path fill=\"currentColor\" d=\"M224 48v48a8 8 0 0 1-8 8h-48a8 8 0 0 1 0-16h28.69l-14.63-14.63a79.56 79.56 0 0 0-56.13-23.43h-.45a79.52 79.52 0 0 0-55.89 22.77a8 8 0 0 1-11.18-11.44a96 96 0 0 1 135 .79L208 76.69V48a8 8 0 0 1 16 0m-37.59 135.29a80 80 0 0 1-112.47-.66L59.31 168H88a8 8 0 0 0 0-16H40a8 8 0 0 0-8 8v48a8 8 0 0 0 16 0v-28.69l14.63 14.63A95.43 95.43 0 0 0 130 222.06h.53a95.36 95.36 0 0 0 67.07-27.33a8 8 0 0 0-11.18-11.44Z\"/>","backpack":"<path fill=\"currentColor\" d=\"M168 40.58V32a24 24 0 0 0-24-24h-32a24 24 0 0 0-24 24v8.58A56.09 56.09 0 0 0 40 96v120a16 16 0 0 0 16 16h144a16 16 0 0 0 16-16V96a56.09 56.09 0 0 0-48-55.42M112 24h32a8 8 0 0 1 8 8v8h-48v-8a8 8 0 0 1 8-8m56 136H88v-8a8 8 0 0 1 8-8h64a8 8 0 0 1 8 8Zm-80 16h48v8a8 8 0 0 0 16 0v-8h16v40H88Zm112 40h-16v-64a24 24 0 0 0-24-24H96a24 24 0 0 0-24 24v64H56V96a40 40 0 0 1 40-40h64a40 40 0 0 1 40 40zM152 88a8 8 0 0 1-8 8h-32a8 8 0 0 1 0-16h32a8 8 0 0 1 8 8\"/>","briefcase":"<path fill=\"currentColor\" d=\"M216 56h-40v-8a24 24 0 0 0-24-24h-48a24 24 0 0 0-24 24v8H40a16 16 0 0 0-16 16v128a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V72a16 16 0 0 0-16-16M96 48a8 8 0 0 1 8-8h48a8 8 0 0 1 8 8v8H96Zm120 24v41.61A184 184 0 0 1 128 136a184.1 184.1 0 0 1-88-22.38V72Zm0 128H40v-68.36A200.2 200.2 0 0 0 128 152a200.25 200.25 0 0 0 88-20.37zm-112-88a8 8 0 0 1 8-8h32a8 8 0 0 1 0 16h-32a8 8 0 0 1-8-8\"/>","broadcast":"<path fill=\"currentColor\" d=\"M128 88a40 40 0 1 0 40 40a40 40 0 0 0-40-40m0 64a24 24 0 1 1 24-24a24 24 0 0 1-24 24m73.71 7.14a80 80 0 0 1-14.08 22.2a8 8 0 0 1-11.92-10.67a63.95 63.95 0 0 0 0-85.33a8 8 0 1 1 11.92-10.67a80.08 80.08 0 0 1 14.08 84.47M69 103.09a64 64 0 0 0 11.26 67.58a8 8 0 0 1-11.92 10.67a79.93 79.93 0 0 1 0-106.67a8 8 0 1 1 11.95 10.67A63.8 63.8 0 0 0 69 103.09M248 128a119.58 119.58 0 0 1-34.29 84a8 8 0 1 1-11.42-11.2a103.9 103.9 0 0 0 0-145.56A8 8 0 1 1 213.71 44A119.58 119.58 0 0 1 248 128M53.71 200.78A8 8 0 1 1 42.29 212a119.87 119.87 0 0 1 0-168a8 8 0 1 1 11.42 11.2a103.9 103.9 0 0 0 0 145.56Z\"/>","bug":"<path fill=\"currentColor\" d=\"M144 92a12 12 0 1 1 12 12a12 12 0 0 1-12-12m-44-12a12 12 0 1 0 12 12a12 12 0 0 0-12-12m116 64a87.8 87.8 0 0 1-3 23l22.24 9.72A8 8 0 0 1 232 192a7.9 7.9 0 0 1-3.2-.67L207.38 182a88 88 0 0 1-158.76 0l-21.42 9.33a7.9 7.9 0 0 1-3.2.67a8 8 0 0 1-3.2-15.33L43 167a87.8 87.8 0 0 1-3-23v-8H16a8 8 0 0 1 0-16h24v-8a87.8 87.8 0 0 1 3-23l-22.2-9.67a8 8 0 1 1 6.4-14.66L48.62 74a88 88 0 0 1 158.76 0l21.42-9.36a8 8 0 0 1 6.4 14.66L213 89.05a87.8 87.8 0 0 1 3 23v8h24a8 8 0 0 1 0 16h-24ZM56 120h144v-8a72 72 0 0 0-144 0Zm64 95.54V136H56v8a72.08 72.08 0 0 0 64 71.54M200 144v-8h-64v79.54A72.08 72.08 0 0 0 200 144\"/>","calendar-blank":"<path fill=\"currentColor\" d=\"M208 32h-24v-8a8 8 0 0 0-16 0v8H88v-8a8 8 0 0 0-16 0v8H48a16 16 0 0 0-16 16v160a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16M72 48v8a8 8 0 0 0 16 0v-8h80v8a8 8 0 0 0 16 0v-8h24v32H48V48Zm136 160H48V96h160z\"/>","caret-down":"<path fill=\"currentColor\" d=\"m213.66 101.66l-80 80a8 8 0 0 1-11.32 0l-80-80a8 8 0 0 1 11.32-11.32L128 164.69l74.34-74.35a8 8 0 0 1 11.32 11.32\"/>","caret-left":"<path fill=\"currentColor\" d=\"M165.66 202.34a8 8 0 0 1-11.32 11.32l-80-80a8 8 0 0 1 0-11.32l80-80a8 8 0 0 1 11.32 11.32L91.31 128Z\"/>","caret-right":"<path fill=\"currentColor\" d=\"m181.66 133.66l-80 80a8 8 0 0 1-11.32-11.32L164.69 128L90.34 53.66a8 8 0 0 1 11.32-11.32l80 80a8 8 0 0 1 0 11.32\"/>","chat-circle-dots":"<path fill=\"currentColor\" d=\"M140 128a12 12 0 1 1-12-12a12 12 0 0 1 12 12m-56-12a12 12 0 1 0 12 12a12 12 0 0 0-12-12m88 0a12 12 0 1 0 12 12a12 12 0 0 0-12-12m60 12a104 104 0 0 1-152.88 91.82l-34.05 11.35a16 16 0 0 1-20.24-20.24l11.35-34.05A104 104 0 1 1 232 128m-16 0a88 88 0 1 0-164.19 44.06a8 8 0 0 1 .66 6.54L40 216l37.4-12.47a7.9 7.9 0 0 1 2.53-.42a8 8 0 0 1 4 1.08A88 88 0 0 0 216 128\"/>","check":"<path fill=\"currentColor\" d=\"m229.66 77.66l-128 128a8 8 0 0 1-11.32 0l-56-56a8 8 0 0 1 11.32-11.32L96 188.69L218.34 66.34a8 8 0 0 1 11.32 11.32\"/>","circuitry-light":"<path fill=\"currentColor\" d=\"M208 34H48a14 14 0 0 0-14 14v160a14 14 0 0 0 14 14h160a14 14 0 0 0 14-14V48a14 14 0 0 0-14-14M88 158a10 10 0 1 1-10 10a10 10 0 0 1 10-10m-42 50V48a2 2 0 0 1 2-2h34v100.84a22 22 0 1 0 12 0v-36.35l52 52V210H48a2 2 0 0 1-2-2m164 0a2 2 0 0 1-2 2h-50v-50a6 6 0 0 0-1.76-4.24L94 93.51V46h36v26a6 6 0 0 0 1.76 4.24l17 17a22 22 0 1 0 8.48-8.48L142 69.51V46h66a2 2 0 0 1 2 2ZM168 94a10 10 0 1 1-10 10a10 10 0 0 1 10-10\"/>","clipboard-text-light":"<path fill=\"currentColor\" d=\"M166 152a6 6 0 0 1-6 6H96a6 6 0 0 1 0-12h64a6 6 0 0 1 6 6m-6-38H96a6 6 0 0 0 0 12h64a6 6 0 0 0 0-12m54-66v168a14 14 0 0 1-14 14H56a14 14 0 0 1-14-14V48a14 14 0 0 1 14-14h37.17a45.91 45.91 0 0 1 69.66 0H200a14 14 0 0 1 14 14M94 64v2h68v-2a34 34 0 0 0-68 0m108-16a2 2 0 0 0-2-2h-29.67A45.8 45.8 0 0 1 174 64v8a6 6 0 0 1-6 6H88a6 6 0 0 1-6-6v-8a45.8 45.8 0 0 1 3.67-18H56a2 2 0 0 0-2 2v168a2 2 0 0 0 2 2h144a2 2 0 0 0 2-2Z\"/>","clock":"<path fill=\"currentColor\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88m64-88a8 8 0 0 1-8 8h-56a8 8 0 0 1-8-8V72a8 8 0 0 1 16 0v48h48a8 8 0 0 1 8 8\"/>","code-block":"<path fill=\"currentColor\" d=\"m58.34 101.66l-32-32a8 8 0 0 1 0-11.32l32-32a8 8 0 0 1 11.32 11.32L43.31 64l26.35 26.34a8 8 0 0 1-11.32 11.32m40 0a8 8 0 0 0 11.32 0l32-32a8 8 0 0 0 0-11.32l-32-32a8 8 0 0 0-11.32 11.32L124.69 64L98.34 90.34a8 8 0 0 0 0 11.32M200 40h-24a8 8 0 0 0 0 16h24v144H56v-64a8 8 0 0 0-16 0v64a16 16 0 0 0 16 16h144a16 16 0 0 0 16-16V56a16 16 0 0 0-16-16\"/>","coins":"<path fill=\"currentColor\" d=\"M184 89.57V84c0-25.08-37.83-44-88-44S8 58.92 8 84v40c0 20.89 26.25 37.49 64 42.46V172c0 25.08 37.83 44 88 44s88-18.92 88-44v-40c0-20.7-25.42-37.32-64-42.43M232 132c0 13.22-30.79 28-72 28c-3.73 0-7.43-.13-11.08-.37C170.49 151.77 184 139 184 124v-18.26c29.87 4.45 48 16.53 48 26.26M72 150.25v-23.79A184 184 0 0 0 96 128a184 184 0 0 0 24-1.54v23.79A163 163 0 0 1 96 152a163 163 0 0 1-24-1.75m96-40.32V124c0 8.39-12.41 17.4-32 22.87V123.5c12.91-3.13 23.84-7.79 32-13.57M96 56c41.21 0 72 14.78 72 28s-30.79 28-72 28s-72-14.78-72-28s30.79-28 72-28m-72 68v-14.07c8.16 5.78 19.09 10.44 32 13.57v23.37C36.41 141.4 24 132.39 24 124m64 48v-4.17c2.63.1 5.29.17 8 .17c3.88 0 7.67-.13 11.39-.35a122 122 0 0 0 12.61 3.76v23.46c-19.59-5.47-32-14.48-32-22.87m48 26.25V174.4a179.5 179.5 0 0 0 24 1.6a184 184 0 0 0 24-1.54v23.79a165.5 165.5 0 0 1-48 0m64-3.38V171.5c12.91-3.13 23.84-7.79 32-13.57V172c0 8.39-12.41 17.4-32 22.87\"/>","compass":"<path fill=\"currentColor\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88m44.42-143.16l-64 32a8.05 8.05 0 0 0-3.58 3.58l-32 64A8 8 0 0 0 80 184a8.1 8.1 0 0 0 3.58-.84l64-32a8.05 8.05 0 0 0 3.58-3.58l32-64a8 8 0 0 0-10.74-10.74M138 138l-40.11 20.11L118 118l40.15-20.07Z\"/>","cpu":"<path fill=\"currentColor\" d=\"M152 96h-48a8 8 0 0 0-8 8v48a8 8 0 0 0 8 8h48a8 8 0 0 0 8-8v-48a8 8 0 0 0-8-8m-8 48h-32v-32h32Zm88 0h-16v-32h16a8 8 0 0 0 0-16h-16V56a16 16 0 0 0-16-16h-40V24a8 8 0 0 0-16 0v16h-32V24a8 8 0 0 0-16 0v16H56a16 16 0 0 0-16 16v40H24a8 8 0 0 0 0 16h16v32H24a8 8 0 0 0 0 16h16v40a16 16 0 0 0 16 16h40v16a8 8 0 0 0 16 0v-16h32v16a8 8 0 0 0 16 0v-16h40a16 16 0 0 0 16-16v-40h16a8 8 0 0 0 0-16m-32 56H56V56h144z\"/>","cube":"<path fill=\"currentColor\" d=\"m223.68 66.15l-88-48.15a15.88 15.88 0 0 0-15.36 0l-88 48.17a16 16 0 0 0-8.32 14v95.64a16 16 0 0 0 8.32 14l88 48.17a15.88 15.88 0 0 0 15.36 0l88-48.17a16 16 0 0 0 8.32-14V80.18a16 16 0 0 0-8.32-14.03M128 32l80.34 44L128 120L47.66 76ZM40 90l80 43.78v85.79l-80-43.75Zm96 129.57v-85.75L216 90v85.78Z\"/>","envelope-simple":"<path fill=\"currentColor\" d=\"M224 48H32a8 8 0 0 0-8 8v136a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V56a8 8 0 0 0-8-8m-20.57 16L128 133.15L52.57 64ZM216 192H40V74.19l82.59 75.71a8 8 0 0 0 10.82 0L216 74.19z\"/>","globe-hemisphere-east":"<path fill=\"currentColor\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 16a87.5 87.5 0 0 1 48 14.28V74l-22.17 25.74l-31.47 4.26l-.31-.22l-19.67-12.86a16 16 0 0 0-22.51 4.18l-20.94 31.3a16 16 0 0 0-2.7 8.81L56 171.44l-3.27 2.15A88 88 0 0 1 128 40M62.29 186.47l2.52-1.65A16 16 0 0 0 72 171.53l.21-36.23L93.17 104a4 4 0 0 0 .32.22l19.67 12.87a15.94 15.94 0 0 0 11.35 2.77l31.49-4.27a16 16 0 0 0 10-5.41l22.17-25.76A16 16 0 0 0 192 74v-6.33A87.87 87.87 0 0 1 211.77 155l-16.14-14.76a16 16 0 0 0-16.93-3l-30.46 12.65a16.08 16.08 0 0 0-9.68 12.45l-2.39 16.19a16 16 0 0 0 11.77 17.81L169.4 202l2.36 2.37a87.88 87.88 0 0 1-109.47-17.9M185 195l-4.3-4.31a16 16 0 0 0-7.26-4.18L152 180.85l2.39-16.19L184.84 152L205 170.48A88.4 88.4 0 0 1 185 195\"/>","graduation-cap":"<path fill=\"currentColor\" d=\"m251.76 88.94l-120-64a8 8 0 0 0-7.52 0l-120 64a8 8 0 0 0 0 14.12L32 117.87v48.42a15.9 15.9 0 0 0 4.06 10.65C49.16 191.53 78.51 216 128 216a130 130 0 0 0 48-8.76V240a8 8 0 0 0 16 0v-40.49a115.6 115.6 0 0 0 27.94-22.57a15.9 15.9 0 0 0 4.06-10.65v-48.42l27.76-14.81a8 8 0 0 0 0-14.12M128 200c-43.27 0-68.72-21.14-80-33.71V126.4l76.24 40.66a8 8 0 0 0 7.52 0L176 143.47v46.34c-12.6 5.88-28.48 10.19-48 10.19m80-33.75a97.8 97.8 0 0 1-16 14.25v-45.57l16-8.53Zm-20-47.31l-.22-.13l-56-29.87a8 8 0 0 0-7.52 14.12L171 128l-43 22.93L25 96l103-54.93L231 96Z\"/>","hourglass-medium-light":"<path fill=\"currentColor\" d=\"M198 75.64V40a14 14 0 0 0-14-14H72a14 14 0 0 0-14 14v36a14.06 14.06 0 0 0 5.6 11.2L118 128l-54.4 40.8A14.06 14.06 0 0 0 58 180v36a14 14 0 0 0 14 14h112a14 14 0 0 0 14-14v-35.64a14.08 14.08 0 0 0-5.56-11.17L138 128l54.49-41.19A14.08 14.08 0 0 0 198 75.64M70 40a2 2 0 0 1 2-2h112a2 2 0 0 1 2 2v35.64a2 2 0 0 1-.79 1.6L178.9 82H76.67l-5.87-4.4A2 2 0 0 1 70 76Zm58 80.49L92.67 94H163Zm58 59.87V216a2 2 0 0 1-2 2H72a2 2 0 0 1-2-2v-36a2 2 0 0 1 .8-1.6L122 140v28a6 6 0 0 0 12 0v-27.94l51.21 38.7a2 2 0 0 1 .79 1.6\"/>","lock-simple":"<path fill=\"currentColor\" d=\"M208 80h-32V56a48 48 0 0 0-96 0v24H48a16 16 0 0 0-16 16v112a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16M96 56a32 32 0 0 1 64 0v24H96Zm112 152H48V96h160z\"/>","map-pin":"<path fill=\"currentColor\" d=\"M128 64a40 40 0 1 0 40 40a40 40 0 0 0-40-40m0 64a24 24 0 1 1 24-24a24 24 0 0 1-24 24m0-112a88.1 88.1 0 0 0-88 88c0 31.4 14.51 64.68 42 96.25a254.2 254.2 0 0 0 41.45 38.3a8 8 0 0 0 9.18 0a254.2 254.2 0 0 0 41.37-38.3c27.45-31.57 42-64.85 42-96.25a88.1 88.1 0 0 0-88-88m0 206c-16.53-13-72-60.75-72-118a72 72 0 0 1 144 0c0 57.23-55.47 105-72 118\"/>","map-trifold":"<path fill=\"currentColor\" d=\"M228.92 49.69a8 8 0 0 0-6.86-1.45l-61.13 15.28l-61.35-30.68a8 8 0 0 0-5.52-.6l-64 16A8 8 0 0 0 24 56v144a8 8 0 0 0 9.94 7.76l61.13-15.28l61.35 30.68a8.15 8.15 0 0 0 3.58.84a8 8 0 0 0 1.94-.24l64-16A8 8 0 0 0 232 200V56a8 8 0 0 0-3.08-6.31M104 52.94l48 24v126.12l-48-24Zm-64 9.31l48-12v127.5l-48 12Zm176 131.5l-48 12V78.25l48-12Z\"/>","pencil-simple":"<path fill=\"currentColor\" d=\"m227.31 73.37l-44.68-44.69a16 16 0 0 0-22.63 0L36.69 152A15.86 15.86 0 0 0 32 163.31V208a16 16 0 0 0 16 16h44.69a15.86 15.86 0 0 0 11.31-4.69L227.31 96a16 16 0 0 0 0-22.63M92.69 208H48v-44.69l88-88L180.69 120ZM192 108.68L147.31 64l24-24L216 84.68Z\"/>","phone":"<path fill=\"currentColor\" d=\"m222.37 158.46l-47.11-21.11l-.13-.06a16 16 0 0 0-15.17 1.4a8 8 0 0 0-.75.56L134.87 160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16 16 0 0 0 1.32-15.06v-.12L97.54 33.64a16 16 0 0 0-16.62-9.52A56.26 56.26 0 0 0 32 80c0 79.4 64.6 144 144 144a56.26 56.26 0 0 0 55.88-48.92a16 16 0 0 0-9.51-16.62M176 208A128.14 128.14 0 0 1 48 80a40.2 40.2 0 0 1 34.87-40a.6.6 0 0 0 0 .12l21 47l-20.67 24.74a6 6 0 0 0-.57.77a16 16 0 0 0-1 15.7c9.06 18.53 27.73 37.06 46.46 46.11a16 16 0 0 0 15.75-1.14a8 8 0 0 0 .74-.56L168.89 152l47 21.05h.11A40.21 40.21 0 0 1 176 208\"/>","phone-call-light":"<path fill=\"currentColor\" d=\"M146.2 46.45a6 6 0 0 1 7.35-4.25a84.24 84.24 0 0 1 60.25 60.25a6 6 0 0 1-4.25 7.35a6 6 0 0 1-1.55.2a6 6 0 0 1-5.8-4.45a72.34 72.34 0 0 0-51.75-51.75a6 6 0 0 1-4.25-7.35m-3.75 39.35C157 89.68 166.32 99 170.2 113.55A6 6 0 0 0 176 118a6 6 0 0 0 1.55-.2a6 6 0 0 0 4.25-7.35c-5-18.71-17.54-31.25-36.25-36.25a6 6 0 1 0-3.1 11.6m79.44 97A54.25 54.25 0 0 1 168 230C89.7 230 26 166.3 26 88a54.25 54.25 0 0 1 47.17-53.89a14 14 0 0 1 14.56 8.39l21.1 47.1a14 14 0 0 1-1.12 13.28a6 6 0 0 1-.42.57l-21.07 25.06a1.89 1.89 0 0 0 0 1.67c7.66 15.68 24.1 32 40 39.65a1.88 1.88 0 0 0 1.68-.06l24.69-21a5 5 0 0 1 .56-.42a14 14 0 0 1 13.28-1.22l47.24 21.17a14 14 0 0 1 8.22 14.53ZM210 181.32a2 2 0 0 0-1.21-2l-47.25-21.17a1.92 1.92 0 0 0-1.6.1l-24.68 21c-.18.15-.37.29-.56.42a14 14 0 0 1-13.77 1c-18.36-8.87-36.66-27-45.53-45.19a14 14 0 0 1 .91-13.73a5 5 0 0 1 .43-.57l21.05-25.09a2 2 0 0 0 0-1.67L76.74 47.31A2 2 0 0 0 74.9 46h-.23A42.24 42.24 0 0 0 38 88c0 71.68 58.32 130 130 130a42.24 42.24 0 0 0 42-36.68\"/>","robot":"<path fill=\"currentColor\" d=\"M200 48h-64V16a8 8 0 0 0-16 0v32H56a32 32 0 0 0-32 32v112a32 32 0 0 0 32 32h144a32 32 0 0 0 32-32V80a32 32 0 0 0-32-32m16 144a16 16 0 0 1-16 16H56a16 16 0 0 1-16-16V80a16 16 0 0 1 16-16h144a16 16 0 0 1 16 16Zm-52-56H92a28 28 0 0 0 0 56h72a28 28 0 0 0 0-56m-24 16v24h-24v-24Zm-60 12a12 12 0 0 1 12-12h8v24h-8a12 12 0 0 1-12-12m84 12h-8v-24h8a12 12 0 0 1 0 24m-92-68a12 12 0 1 1 12 12a12 12 0 0 1-12-12m88 0a12 12 0 1 1 12 12a12 12 0 0 1-12-12\"/>","rocket-launch":"<path fill=\"currentColor\" d=\"M223.85 47.12a16 16 0 0 0-15-15c-12.58-.75-44.73.4-71.41 27.07L132.69 64H74.36A15.9 15.9 0 0 0 63 68.68L28.7 103a16 16 0 0 0 9.07 27.16l38.47 5.37l44.21 44.21l5.37 38.49a15.94 15.94 0 0 0 10.78 12.92a16.1 16.1 0 0 0 5.1.83a15.9 15.9 0 0 0 11.3-4.68l34.32-34.3a15.9 15.9 0 0 0 4.68-11.36v-58.33l4.77-4.77c26.68-26.68 27.83-58.83 27.08-71.42M74.36 80h42.33l-39.53 39.52L40 114.34Zm74.41-9.45a76.65 76.65 0 0 1 59.11-22.47a76.46 76.46 0 0 1-22.42 59.16L128 164.68L91.32 128ZM176 181.64L141.67 216l-5.19-37.17L176 139.31Zm-74.16 9.5C97.34 201 82.29 224 40 224a8 8 0 0 1-8-8c0-42.29 23-57.34 32.86-61.85a8 8 0 0 1 6.64 14.56c-6.43 2.93-20.62 12.36-23.12 38.91c26.55-2.5 36-16.69 38.91-23.12a8 8 0 1 1 14.56 6.64Z\"/>","shield-check":"<path fill=\"currentColor\" d=\"M208 40H48a16 16 0 0 0-16 16v56c0 52.72 25.52 84.67 46.93 102.19c23.06 18.86 46 25.26 47 25.53a8 8 0 0 0 4.2 0c1-.27 23.91-6.67 47-25.53C198.48 196.67 224 164.72 224 112V56a16 16 0 0 0-16-16m0 72c0 37.07-13.66 67.16-40.6 89.42a129.3 129.3 0 0 1-39.4 22.2a128.3 128.3 0 0 1-38.92-21.81C61.82 179.51 48 149.3 48 112V56h160ZM82.34 141.66a8 8 0 0 1 11.32-11.32L112 148.69l50.34-50.35a8 8 0 0 1 11.32 11.32l-56 56a8 8 0 0 1-11.32 0Z\"/>","signpost":"<path fill=\"currentColor\" d=\"M246 106.65L212.33 69.3a16 16 0 0 0-11.89-5.3H136V32a8 8 0 0 0-16 0v32H40a16 16 0 0 0-16 16v64a16 16 0 0 0 16 16h80v64a8 8 0 0 0 16 0v-64h64.44a16 16 0 0 0 11.89-5.3L246 117.35a8 8 0 0 0 0-10.7M200.44 144H40V80h160.44l28.8 32Z\"/>","solar-panel":"<path fill=\"currentColor\" d=\"M32 104a8 8 0 0 1 8-8h16a8 8 0 0 1 0 16H40a8 8 0 0 1-8-8m39.43-45.25a8 8 0 0 0 11.32-11.32L71.43 36.12a8 8 0 0 0-11.31 11.31ZM128 40a8 8 0 0 0 8-8V16a8 8 0 0 0-16 0v16a8 8 0 0 0 8 8m50.91 21.09a8 8 0 0 0 5.66-2.34l11.31-11.32a8 8 0 0 0-11.31-11.31l-11.32 11.31a8 8 0 0 0 5.66 13.66M192 104a8 8 0 0 0 8 8h16a8 8 0 0 0 0-16h-16a8 8 0 0 0-8 8m-104 8a8 8 0 0 0 8-8a32 32 0 0 1 64 0a8 8 0 0 0 16 0a48 48 0 0 0-96 0a8 8 0 0 0 8 8m150.91 108a8 8 0 0 1-6.91 4H24a8 8 0 0 1-7-11.94l40.69-72a8 8 0 0 1 7-4.06H191.3a8 8 0 0 1 7 4.06l40.69 72a8 8 0 0 1-.08 7.94m-52.27-68h-24.37l3.48 16h29.93Zm-37.26 16l-3.48-16h-35.8l-3.48 16Zm-46.24 16l-5.21 24h60.14l-5.21-24Zm-42.82-16h29.93l3.48-16H69.36Zm-22.61 40h43.84l5.22-24H51.28Zm180.58 0l-13.57-24h-35.49l5.22 24Z\"/>","user":"<path fill=\"currentColor\" d=\"M230.92 212c-15.23-26.33-38.7-45.21-66.09-54.16a72 72 0 1 0-73.66 0c-27.39 8.94-50.86 27.82-66.09 54.16a8 8 0 1 0 13.85 8c18.84-32.56 52.14-52 89.07-52s70.23 19.44 89.07 52a8 8 0 1 0 13.85-8M72 96a56 56 0 1 1 56 56a56.06 56.06 0 0 1-56-56\"/>","whatsapp-logo":"<path fill=\"currentColor\" d=\"m187.58 144.84l-32-16a8 8 0 0 0-8 .5l-14.69 9.8a40.55 40.55 0 0 1-16-16l9.8-14.69a8 8 0 0 0 .5-8l-16-32A8 8 0 0 0 104 64a40 40 0 0 0-40 40a88.1 88.1 0 0 0 88 88a40 40 0 0 0 40-40a8 8 0 0 0-4.42-7.16M152 176a72.08 72.08 0 0 1-72-72a24 24 0 0 1 19.29-23.54l11.48 23L101 118a8 8 0 0 0-.73 7.51a56.47 56.47 0 0 0 30.15 30.15A8 8 0 0 0 138 155l14.61-9.74l23 11.48A24 24 0 0 1 152 176M128 24a104 104 0 0 0-91.82 152.88l-11.35 34.05a16 16 0 0 0 20.24 20.24l34.05-11.35A104 104 0 1 0 128 24m0 192a87.87 87.87 0 0 1-44.06-11.81a8 8 0 0 0-6.54-.67L40 216l12.47-37.4a8 8 0 0 0-.66-6.54A88 88 0 1 1 128 216\"/>","wrench":"<path fill=\"currentColor\" d=\"M226.76 69a8 8 0 0 0-12.84-2.88l-40.3 37.19l-17.23-3.7l-3.7-17.23l37.19-40.3A8 8 0 0 0 187 29.24A72 72 0 0 0 88 96a72.3 72.3 0 0 0 6 28.94L33.79 177c-.15.12-.29.26-.43.39a32 32 0 0 0 45.26 45.26c.13-.13.27-.28.39-.42L131.06 162A72 72 0 0 0 232 96a71.6 71.6 0 0 0-5.24-27M160 152a56.14 56.14 0 0 1-27.07-7a8 8 0 0 0-9.92 1.77l-55.9 64.74a16 16 0 0 1-22.62-22.62L109.18 133a8 8 0 0 0 1.77-9.93a56 56 0 0 1 58.36-82.31l-31.2 33.81a8 8 0 0 0-1.94 7.1l5.66 26.33a8 8 0 0 0 6.14 6.14l26.35 5.66a8 8 0 0 0 7.1-1.94l33.81-31.2A56.06 56.06 0 0 1 160 152\"/>","x":"<path fill=\"currentColor\" d=\"M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 0 1-11.32-11.32L116.69 128L50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128Z\"/>","magnifying-glass":"<path fill=\"currentColor\" d=\"m229.66 218.34l-50.07-50.06a88.11 88.11 0 1 0-11.31 11.31l50.06 50.07a8 8 0 0 0 11.32-11.32M40 112a72 72 0 1 1 72 72a72.08 72.08 0 0 1-72-72\"/>","arrow-up":"<path fill=\"currentColor\" d=\"M205.66 117.66a8 8 0 0 1-11.32 0L136 59.31V216a8 8 0 0 1-16 0V59.31l-58.34 58.35a8 8 0 0 1-11.32-11.32l72-72a8 8 0 0 1 11.32 0l72 72a8 8 0 0 1 0 11.32\"/>"};

/* ─── Les questions (tunnel du PDF, avec la question budget) ─── */
const DOMAINES = [
  { v: 'Électronique & PCB', short: 'électronique', icon: 'cpu', sub: 'Circuits, soudure, conception de cartes' },
  { v: 'Embarqué, IoT & robotique', short: 'IoT et robotique', icon: 'robot', sub: 'Arduino, capteurs, objets connectés' },
  { v: 'Code web, mobile & IA', short: 'code', icon: 'code-block', sub: 'Sites, applications, premiers modèles d’IA' },
  { v: 'Télécoms & spatial', short: 'télécoms', icon: 'broadcast', sub: 'Réseaux, radio, CubeSat' },
  { v: 'Solaire & génie électrique', short: 'solaire', icon: 'solar-panel', sub: 'Installations, énergie, câblage' },
  { v: 'Cybersécurité & données', short: 'cybersécurité', icon: 'shield-check', sub: 'Protéger, analyser, comprendre' },
  { v: 'Je ne sais pas encore', short: '', icon: 'compass', sub: 'On en parle pendant l’échange' }
];

const img = (p) => (window.NubiaaImg ? window.NubiaaImg(p) : p);   // le tirage d'image du thème et de l'écran (theme.js)
// un élève est mineur : c'est son parent ou son tuteur qui prend la suite (coordonnées, échange, accord)
const ELEVE = 'Élève, je prépare mes études';
const isMinor = (a) => a.profil === ELEVE;
const LEGAL = {
  adulte: 'En continuant, vous acceptez que NUBIAA vous écrive sur WhatsApp au sujet de votre demande. Vos réponses ne sont ni vendues ni partagées.',
  mineur: 'Stella écrit à votre parent ou tuteur sur WhatsApp pour lui présenter la démarche et recueillir son accord. Vos réponses ne sont ni vendues ni partagées.'
};
const NOTE_CONTACT = {
  adulte: 'Stella vous écrit sur WhatsApp. L’e-mail sert à recevoir l’invitation.',
  mineur: 'Stella écrit à votre parent ou tuteur sur WhatsApp pour fixer l’échange.'
};
const TZ = {
  adulte: 'Heure de Kinshasa (UTC+1). 20 minutes avec Stella, par appel WhatsApp.',
  mineur: 'Heure de Kinshasa (UTC+1). 20 minutes avec Stella, par appel WhatsApp à votre parent ou tuteur. Vous pouvez être là.'
};
const QUESTIONS = [
  {
    id: 'domaine', type: 'choice', other: 'Quel domaine ?', kicker: 'Domaine',
    title: 'Quel domaine vous attire le plus ?',
    note: 'Les trois domaines les plus demandés ouvrent en janvier.',
    options: DOMAINES,
    bg: 'images/bg-domaine.jpg', floats: ['images/fl-02.jpg', 'images/fl-05.jpg']
  },
  {
    id: 'profil', type: 'choice', other: 'Votre situation', kicker: 'Profil',
    title: 'Aujourd’hui, vous êtes…',
    options: [
      { v: ELEVE, icon: 'backpack', sub: 'Votre parent ou tuteur nous accompagne' },
      { v: 'Étudiant(e) en ingénierie ou en sciences', icon: 'graduation-cap' },
      { v: 'En poste, ingénieur ou technicien', icon: 'wrench' },
      { v: 'Entrepreneur(e) ou porteur(se) de projet', icon: 'rocket-launch' },
      { v: 'En reconversion', icon: 'arrows-clockwise' }
    ],
    bg: 'images/bg-profil.jpg', floats: ['images/fl-07.jpg', 'images/tr-19.jpg']
  },
  {
    id: 'lieu', type: 'choice', other: 'Votre ville ou votre pays', kicker: 'Lieu',
    title: 'Où êtes-vous basé(e) ?',
    note: 'Pour savoir si l’on peut aussi se voir en vrai.',
    options: [
      { v: 'À Kinshasa', icon: 'map-pin', sub: 'Séances le samedi sur place, ou en ligne' },
      { v: 'Ailleurs en RDC', icon: 'map-trifold', sub: 'Tout se fait en ligne' },
      { v: 'Hors de la RDC', icon: 'globe-hemisphere-east', sub: 'Tout se fait en ligne', city: true }
    ],
    bg: 'images/bg-lieu.jpg', floats: ['images/fl-04.jpg', 'images/fl-09.jpg']
  },
  {
    id: 'objectif', type: 'choice', other: 'Votre objectif', kicker: 'Objectif',
    title: (a) => {
      const d = DOMAINES.find((x) => x.v === a.domaine);
      return d && d.short ? `En ${d.short}, qu’attendez-vous d’abord ?` : 'Qu’attendez-vous d’abord de NUBIAA ?';
    },
    options: [
      { v: 'Réaliser un vrai projet ou un prototype', icon: 'cube' },
      { v: 'Débloquer un problème technique précis', icon: 'bug' },
      { v: 'Choisir mes études ou mon métier', icon: 'signpost' },
      { v: 'Accéder à de meilleures opportunités', icon: 'briefcase' }
    ],
    bg: 'images/bg-objectif.jpg', floats: ['images/fl-10.jpg', 'images/tr-17.jpg']
  },
  {
    id: 'budget', type: 'choice', other: 'Votre budget, ou votre question', kicker: 'Budget',
    title: 'Pour avancer, combien pourriez-vous investir par mois ?',
    note: 'C’est seulement pour vous proposer la bonne formule.',
    options: [
      { v: 'Moins de 10 $' }, { v: '10 à 30 $' }, { v: '30 à 70 $' }, { v: 'Plus de 70 $' },
      { v: 'Je préfère en parler pendant l’échange' }
    ],
    bg: 'images/bg-budget.jpg', floats: ['images/fl-08.jpg', 'images/tr-20.jpg']
  },
  {
    id: 'contact', type: 'contact', kicker: 'Coordonnées',
    title: (a) => isMinor(a) ? 'Les coordonnées de votre parent ou tuteur.' : 'Où vous envoyer la confirmation ?',
    bg: 'images/bg-contact.jpg', floats: ['images/fl-01.jpg', 'images/fl-03.jpg']
  },
  {
    id: 'creneau', type: 'slots', kicker: 'Créneau',
    title: (a) => isMinor(a) ? 'Choisissez le moment de l’échange avec votre parent.' : 'Choisissez le moment de votre échange.',
    bg: 'images/bg-creneau.jpg', floats: ['images/fl-06.jpg', 'images/tr-07.jpg']
  }
];
if (window.NubiaaTheme) window.NubiaaTheme.fixData(QUESTIONS);
const N = QUESTIONS.length;

/* ─── Outils ─── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Typographie française : espaces insécables avant ? ! ; : et dans les montants
const typo = (s) => esc(s)
  .replace(/ ([?!;])/g, ' $1')
  .replace(/ :/g, ' :')
  .replace(/(\d) (\$|h|min)/g, '$1 $2')
  .replace(/(\d) à (\d)/g, '$1 à $2');
const sfx = (name) => { if (window.NubiaaSound) window.NubiaaSound.play(name); };
// un son quand une valeur de scroll franchit le seuil où démarre un mouvement (dans les deux sens)
const soundCue = (key, v, th, name) => { if (window.NubiaaSound) window.NubiaaSound.cue(key, v, th, name); };
const words = (s) => typo(s).split(' ').map((w) => `<span class="wd">${w}</span>`).join(' ');
const icon = (n) => `<svg viewBox="0 0 256 256" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ═══ RESSORT (amortissement + réponse, comme chez Apple) ═══
   Chaque nouvelle cible part de la valeur et de la vitesse
   courantes : l'animation reste interruptible. */
class Spring {
  constructor(value, response = 0.42, damping = 1) {
    this.x = value; this.v = 0; this.target = value; this.response = response; this.damping = damping;
  }
  step(dt) {
    const k = (2 * Math.PI / this.response) ** 2;
    const c = 4 * Math.PI * this.damping / this.response;
    this.v += (-k * (this.x - this.target) - c * this.v) * dt;
    this.x += this.v * dt;
  }
  get idle() { return Math.abs(this.x - this.target) < 0.5 && Math.abs(this.v) < 2; }
}

/* ═══ ÉTAT ═══ */
const answers = {};
let reached = 0;            // index de la dernière question ouverte
let finished = false;
let advanceTimer = 0;
const flow = $('#flow');
const scenes = [];          // { q, el, bg, num, floats, panel, words, items }

/* ═══ LE DÉSERT DE L'OUVERTURE ═══ */
function dunes(svg, { w, h, rows, seed, fills, traces }) {
  let r = seed;
  const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  let out = '';
  rows.forEach((row, ri) => {
    const pts = [];
    for (let x = -200; x <= w + 200; x += row.step) pts.push([x, row.y + (rnd() - 0.5) * row.amp]);
    let top = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      top += ` C${x0 + row.step * 0.45} ${y0} ${x1 - row.step * 0.45} ${y1} ${x1} ${y1}`;
    }
    out += `<path d="${top} L${w + 200} ${h} L-200 ${h} Z" style="fill:${fills[ri]}"/>`;
    if (row.ridge) out += `<path d="${top}" fill="none" stroke="rgba(195,150,105,${row.ridge})" stroke-width="1.4" vector-effect="non-scaling-stroke"/>`;
  });
  // pistes de circuit posées sur le sable, à 45°, terminées par une pastille
  (traces || []).forEach((t) => {
    let x = t.x, y = t.y, d = `M${x} ${y}`;
    t.path.forEach(([dx, dy]) => { x += dx; y += dy; d += ` L${x} ${y}`; });
    out += `<path d="${d}" fill="none" style="stroke:rgb(var(--trace-rgb));stroke-opacity:${t.o}" stroke-width="1.6" vector-effect="non-scaling-stroke"/>`;
    out += `<circle cx="${x}" cy="${y}" r="14" fill="rgba(214,170,120,${t.o * 0.2})"/>`;
    out += `<circle cx="${x}" cy="${y}" r="4.5" style="fill:var(--bone);stroke:rgb(var(--trace-rgb));stroke-opacity:${t.o + 0.25}" stroke-width="1.6" vector-effect="non-scaling-stroke"/>`;
  });
  svg.innerHTML = out;
}
dunes($('#duneFar'), { w: 2400, h: 600, seed: 3, rows: [{ y: 260, amp: 160, step: 420, ridge: 0.18 }], fills: ['var(--dune-far)'] });
dunes($('#duneMid'), { w: 2400, h: 500, seed: 11, rows: [{ y: 240, amp: 150, step: 520, ridge: 0.28 }], fills: ['var(--dune-mid)'] });
dunes($('#duneNear'), {
  w: 2400, h: 400, seed: 29, rows: [{ y: 170, amp: 110, step: 600, ridge: 0.4 }], fills: ['var(--dune-near)'],
  traces: [
    { x: 260, y: 400, o: 0.55, path: [[0, -90], [60, -60], [190, 0]] },
    { x: 1080, y: 400, o: 0.42, path: [[0, -70], [-50, -50], [0, -30]] },
    { x: 1640, y: 400, o: 0.55, path: [[0, -60], [70, -70], [260, 0]] },
    { x: 2180, y: 400, o: 0.45, path: [[0, -110], [-60, -60]] }
  ]
});

/* ═══ DATES ═══ */
const WD = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const WDL = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MO = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MOL = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const longOf = (d) => `${WDL[d.getDay()]} ${d.getDate()} ${MOL[d.getMonth()]}`;
// « Vendredi 23 octobre à 16 h 30 »
function slotOf(iso, time) {
  const [y, m, dd] = iso.split('-').map(Number), [hh, mm] = time.split(':').map(Number);
  const long = longOf(new Date(y, m - 1, dd, 12));
  return { y, m, d: dd, hh, mm, label: `${long[0].toUpperCase() + long.slice(1)} à ${hh} h${mm ? ' ' + String(mm).padStart(2, '0') : ''}` };
}
/* ═══ CONSTRUCTION DES SCÈNES ═══ */
let errId = 0;
function otherForm(label, cta) {
  return `<form class="other" data-other-form hidden novalidate>
        <label class="field"><input name="autre" maxlength="${LIM.autre}" autocomplete="off" placeholder=" " aria-describedby="err-autre-${++errId}"><span class="lbl">${typo(label)}</span></label>
        <p class="err" data-err="autre" id="err-autre-${errId}" aria-live="polite"></p>
        <button class="btn primary" type="submit">${typo(cta)} ${icon('arrow-right')}</button>
      </form>`;
}

/* ─── Les limites des champs : réalistes, et appliquées pendant la frappe ─── */
const LIM = { autre: 120, ville: 60, nom: 60, prenom: 30, email: 80, recherche: 40 };
// chiffres d'un numéro national, sans le 0 du début : 9 en RDC et dans la plupart des pays ;
// quelques pays ont des numéros plus longs (ou plus courts)
const TEL_LEN = {
  CD: [9, 9], CG: [9, 9], AO: [9, 9], CM: [9, 9], FR: [9, 9], BE: [8, 9], CH: [9, 9], NL: [9, 9], ES: [9, 9], PT: [9, 9],
  ZA: [9, 9], KE: [9, 9], UG: [9, 9], RW: [9, 9], TZ: [9, 9], ZM: [9, 9], SN: [9, 9], MA: [9, 9], DZ: [9, 9], IE: [9, 9],
  AE: [9, 9], SA: [9, 9], AU: [9, 9], GB: [10, 10], DE: [10, 11], AT: [10, 12], IT: [9, 10], CN: [11, 11], IN: [10, 10],
  BR: [10, 11], MX: [10, 10], NG: [10, 10], CI: [10, 10], EG: [10, 10], TR: [10, 10], RU: [10, 10], KZ: [10, 10],
  JP: [10, 10], KR: [9, 10], ID: [9, 12], PH: [10, 10], PK: [10, 10], AR: [10, 10], CO: [10, 10], VE: [10, 10],
  IR: [10, 10], IQ: [10, 10], BD: [10, 10], MY: [9, 10], NO: [8, 8], DK: [8, 8], BI: [8, 8], TN: [8, 8], SE: [7, 9]
};
const telLen = (cc) => TEL_LEN[cc] || (BY_CC[cc] && BY_CC[cc].dial === '+1' ? [10, 10] : [7, 9]);
function telHint(cc) {
  const [a, b] = telLen(cc);
  const n = a === b ? `${a} chiffres` : `${a} à ${b} chiffres`;
  return cc === 'CD' ? `${n}, sans le 0 du début (ex. 812345678)` : `${n}, sans le 0 du début`;
}

// « Hors de la RDC » : la ville, proposée au fil de la frappe (base GeoNames, villes/*.json)
function cityForm(id) {
  return `<form class="other city" data-city-form hidden novalidate>
        <div class="field city-field"><input name="ville" role="combobox" aria-expanded="false" aria-controls="cities-${id}" aria-autocomplete="list" autocomplete="off" autocapitalize="words" spellcheck="false" maxlength="${LIM.ville}" placeholder=" " aria-describedby="err-ville-${id}"><span class="lbl">Votre ville</span></div>
        <ul class="city-list" id="cities-${id}" role="listbox" aria-label="Villes proposées" hidden></ul>
        <p class="err" data-err="ville" id="err-ville-${id}" aria-live="polite"></p>
        <button class="btn primary" type="submit">Continuer ${icon('arrow-right')}</button>
      </form>`;
}

// le bouton de l'indicatif : un drapeau (ou le code du pays) et l'indicatif ; il ouvre la liste des pays
function setPrefix(inp) {
  const c = BY_CC[inp.value] || BY_CC.CD;
  const btn = $('[data-cc-btn]', inp.closest('.field'));
  $('.prefix-val', btn).innerHTML = `${flagHTML(c.cc)}<span class="dial">${c.dial}</span>`;
  btn.setAttribute('aria-label', `Pays du numéro : ${c.name} (${c.dial}). Changer de pays`);
  // la longueur attendue suit le pays ; un numéro déjà tapé trop long est recoupé
  const form = inp.closest('form'), hint = form && $('[data-tel-hint]', form);
  if (hint) hint.innerHTML = typo(telHint(c.cc));
  const tel = form && form.whatsapp;
  if (tel && tel.value.length > telLen(c.cc)[1]) tel.value = tel.value.slice(0, telLen(c.cc)[1]);
}

/* le calendrier : on choisit un jour, puis une heure ; « Retour » ramène aux créneaux proposés */
function pickerHTML() {
  const times = [];
  for (let t = CONFIG.calFrom; t <= CONFIG.calTo; t += 0.5) {
    const hh = Math.floor(t), mm = t % 1 ? 30 : 0;
    times.push(`<button type="button" role="radio" aria-checked="false" class="cal-time" data-time="${hh}:${String(mm).padStart(2, '0')}">${hh} h${mm ? ' 30' : ''}</button>`);
  }
  return `<div class="picker" data-picker hidden>
        <div class="cal-head">
          <button type="button" class="cal-nav" data-act="cal-prev" aria-label="Mois précédent">${icon('caret-left')}</button>
          <p class="cal-month" aria-live="polite"></p>
          <button type="button" class="cal-nav" data-act="cal-next" aria-label="Mois suivant">${icon('caret-right')}</button>
        </div>
        <div class="cal-wd" aria-hidden="true"><span>lun.</span><span>mar.</span><span>mer.</span><span>jeu.</span><span>ven.</span><span>sam.</span><span>dim.</span></div>
        <div class="cal-grid" role="radiogroup" aria-label="Jour"></div>
        <p class="cal-lbl mono">Heure</p>
        <div class="cal-times" role="radiogroup" aria-label="Heure">${times.join('')}</div>
        <p class="tz">${typo('Heure de Kinshasa (UTC+1). Stella vous confirme le créneau sur WhatsApp.')}</p>
        <div class="actions">
          <button class="btn primary" data-act="cal-ok" type="button" disabled>Proposer ce créneau</button>
          <button class="btn ghost" data-act="cal-back" type="button">${icon('arrow-left')} Retour aux créneaux proposés</button>
        </div>
      </div>`;
}

function sceneHTML(q, i) {
  const title = typeof q.title === 'function' ? q.title(answers) : q.title;
  const n = String(i + 1).padStart(2, '0');
  let body = '';
  if (q.type === 'choice') {
    // chaque question finit par « Autre », qui ouvre un champ libre
    const opts = [...q.options, { v: 'Autre', icon: q.options[0].icon ? 'pencil-simple' : '', sub: 'Précisez avec vos mots', other: true }];
    body = `
      <ul class="options" role="radiogroup" aria-label="${esc(title)}">
        ${opts.map((o, k) => `<li><button type="button" role="radio" aria-checked="false" class="opt${o.icon ? '' : ' no-icon'}" data-v="${esc(o.v)}" data-k="${k + 1}"${o.other ? ' data-other' : ''}${o.city ? ' data-city' : ''}>
          ${o.icon ? `<span class="ico">${icon(o.icon)}</span>` : ''}
          <span class="lab"><strong>${typo(o.v)}</strong>${o.sub ? `<small>${typo(o.sub)}</small>` : ''}</span>
          <span class="tick">${TICK}</span></button></li>`).join('')}
      </ul>
      ${otherForm(q.other, 'Continuer')}
      ${q.options.some((o) => o.city) ? cityForm(q.id) : ''}
      <p class="hint mono">Touche <kbd>1</kbd> à <kbd>${opts.length}</kbd> pour répondre</p>`;
  } else if (q.type === 'contact') {
    body = `
      <form class="fields" data-contact novalidate>
        <div class="minor" data-minor hidden>${icon('user')}<span>${typo('Vous êtes élève : votre parent ou tuteur confirme l’inscription. Stella l’appelle avec vous, et rien n’est payé sans son accord.')}</span></div>
        <label class="field" data-minor-field hidden><input name="eleve" autocomplete="given-name" autocapitalize="words" spellcheck="false" maxlength="${LIM.prenom}" placeholder=" " aria-describedby="err-eleve"><span class="lbl">Votre prénom</span></label>
        <p class="err" data-err="eleve" id="err-eleve" aria-live="polite"></p>
        <label class="field"><input name="nom" autocomplete="name" autocapitalize="words" spellcheck="false" maxlength="${LIM.nom}" placeholder=" " required aria-describedby="err-nom"><span class="lbl" data-lbl="nom">Nom et prénom</span></label>
        <p class="err" data-err="nom" id="err-nom" aria-live="polite"></p>
        <div class="field has-prefix"><button type="button" class="prefix" data-cc-btn aria-haspopup="listbox" aria-expanded="false"><span class="prefix-val">${flagHTML('CD')}<span class="dial">+243</span></span>${icon('caret-down')}</button><input type="hidden" name="indicatif" value="CD"><input name="whatsapp" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="24" placeholder=" " required aria-label="Numéro WhatsApp" aria-describedby="tel-hint err-whatsapp"><span class="lbl" data-lbl="whatsapp">Numéro WhatsApp</span></div>
        <p class="field-hint" id="tel-hint" data-tel-hint>${typo(telHint('CD'))}</p>
        <p class="err" data-err="whatsapp" id="err-whatsapp" aria-live="polite"></p>
        <label class="field"><input name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" maxlength="${LIM.email}" placeholder=" " aria-describedby="err-email"><span class="lbl" data-lbl="email">E-mail (facultatif)</span></label>
        <p class="err" data-err="email" id="err-email" aria-live="polite"></p>
        <div class="actions"><button class="btn primary" type="submit">Choisir mon créneau ${icon('arrow-right')}</button></div>
        <p class="legal" data-legal>${typo(LEGAL.adulte)}</p>
      </form>`;
  } else if (q.type === 'slots') {
    body = `
      <div class="days" role="radiogroup" aria-label="Jour">
        ${nextDays(CONFIG.days).map((d) => `<button type="button" role="radio" aria-checked="false" class="day" data-day="${d.iso}" aria-label="${esc(d.long)}"><small>${d.wd}</small><strong>${d.n}</strong><small>${d.mo}</small></button>`).join('')}
      </div>
      <div class="times" role="radiogroup" aria-label="Heure">
        ${CONFIG.hours.map((h) => `<button type="button" role="radio" aria-checked="false" class="time" data-time="${h}">${h.replace(':', ' h ')}</button>`).join('')}
      </div>
      <p class="tz" data-tz>${typo(TZ.adulte)}</p>
      <div class="actions"><button class="btn primary" data-act="book" type="button" disabled>Confirmer le rendez-vous</button></div>
      <button class="link-btn" data-act="slot-other" type="button">${icon('calendar-blank')} Aucun de ces créneaux ne me convient</button>
      ${pickerHTML()}`;
  }
  const note = q.type === 'contact' ? NOTE_CONTACT.adulte : q.note;
  return `
    <div class="pin">
      <div class="bg"><img src="${q.bg}" alt="" loading="lazy"></div>
      <div class="veil"></div>
      <p class="num" aria-hidden="true">0<b>${i + 1}</b></p>
      <div class="floats" aria-hidden="true">${q.floats.map((f) => `<figure><img src="${f}" alt="" loading="lazy"></figure>`).join('')}</div>
      <div class="panel">
        <p class="kicker">${typo(q.kicker)} <b>${n} / ${String(N).padStart(2, '0')}</b></p>
        <h2 class="title" data-title id="t-${q.id}">${words(title)}</h2>
        ${note ? `<p class="note" data-note>${typo(note)}</p>` : ''}
        ${body}
      </div>
    </div>`;
}

QUESTIONS.forEach((q, i) => {
  const el = document.createElement('section');
  el.className = 'scene q' + (i === N - 1 ? ' last' : '');
  el.id = 'q-' + q.id;
  el.setAttribute('aria-labelledby', 't-' + q.id);
  el.dataset.i = i;
  el.innerHTML = sceneHTML(q, i);
  el.hidden = true;           // même la première question : seul « Commencer » ouvre le questionnaire
  flow.appendChild(el);
  scenes.push(bind(q, el));
});

function bind(q, el) {
  return {
    q, el,
    bg: $('.bg', el), num: $('.num', el), panel: $('.panel', el),
    floats: $$('.floats figure', el),
    words: $$('.title .wd', el),
    items: $$('.options li, .fields > *, .days, .times, .tz, .panel > .actions, .link-btn', el)
  };
}

const done = document.createElement('section');
done.className = 'scene done';
done.id = 'fin';
done.hidden = true;
done.innerHTML = `<div class="pin"><div class="bg"><img src="${img('images/hero.jpg')}" alt="" loading="lazy"></div><div class="veil"></div><div class="panel" id="donePanel"></div></div>`;
flow.appendChild(done);

// le dernier écran : le logo en grand
const outro = document.createElement('section');
outro.className = 'scene outro';
outro.id = 'logo';
outro.hidden = true;
outro.innerHTML = `<div class="pin"><div class="outro-in"><img src="${img('images/logo.png')}" alt="NUBIAA Academia" width="1120" height="348" loading="lazy"><p class="mono">Ça vous plaît ? Fabriquez-le.</p></div></div>`;
flow.appendChild(outro);

/* ─── Jours ouvrés à venir (le dimanche est sauté) ─── */
function nextDays(n) {
  const out = [];
  const d = new Date(); d.setHours(12, 0, 0, 0);
  while (out.length < n) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) continue;
    out.push({ iso: isoOf(d), n: d.getDate(), wd: WD[d.getDay()], mo: MO[d.getMonth()], long: longOf(d) });
  }
  return out;
}

/* ═══ AVANCER ═══ */
function open(i) {
  // ouvre la scène i (et tout ce qui la précède), puis y emmène la page
  sfx(i >= N ? 'chime' : 'whoosh');
  if (i >= N) {
    finished = true;
    renderDone();
    done.hidden = false;
    outro.hidden = false;
    submit();
  } else {
    // les questions suivantes déjà répondues restent ouvertes, jusqu'à la première sans réponse
    let j = i;
    while (j < N - 1 && answered(QUESTIONS[j])) j++;
    for (let k = 0; k <= j; k++) scenes[k].el.hidden = false;
    reached = Math.max(reached, j);
    for (let k = i; k <= j; k++) refresh(k);
  }
  updateProgress();
  requestAnimationFrame(() => {
    const target = i >= N ? done : scenes[i].el;
    glideTo(docTop(target) + innerHeight * 0.06, () => focusScene(i));
  });
}

function refresh(i) {
  const s = scenes[i];
  // une question qui dépend d'une réponse précédente est réécrite à l'arrivée
  if (typeof s.q.title === 'function') {
    $('[data-title]', s.el).innerHTML = words(s.q.title(answers));
    s.words = $$('.title .wd', s.el);
  }
  const minor = isMinor(answers);
  if (s.q.type === 'contact') {
    const inRdc = ['À Kinshasa', 'Ailleurs en RDC'].includes(answers.lieu);
    const ind = $('[name="indicatif"]', s.el);
    // tant que la personne n'a pas choisi elle-même : la RDC si elle y vit, sinon le pays
    // de la ville donnée (Bruxelles → Belgique), sinon celui du navigateur (fr-BE → Belgique)
    if (!ind.dataset.touched) {
      const guess = (navigator.languages || [navigator.language || '']).map((l) => (l.split('-')[1] || '').toUpperCase()).find((cc) => BY_CC[cc]);
      ind.value = inRdc ? 'CD' : (BY_CC[answers.pays_cc] ? answers.pays_cc : guess || 'CD');
      setPrefix(ind);
    }
    // un élève : ses coordonnées sont celles de son parent ou tuteur, et l'on demande son prénom à lui
    $('[data-minor]', s.el).hidden = !minor;
    $('[data-minor-field]', s.el).hidden = !minor;
    $('[data-lbl="nom"]', s.el).textContent = minor ? 'Nom et prénom de votre parent ou tuteur' : 'Nom et prénom';
    $('[data-lbl="whatsapp"]', s.el).textContent = minor ? 'WhatsApp du parent' : 'Numéro WhatsApp';
    $('[name="whatsapp"]', s.el).setAttribute('aria-label', minor ? 'Numéro WhatsApp de votre parent ou tuteur' : 'Numéro WhatsApp');
    $('[data-lbl="email"]', s.el).textContent = minor ? 'E-mail du parent (facultatif)' : 'E-mail (facultatif)';
    $('[data-legal]', s.el).innerHTML = typo(minor ? LEGAL.mineur : LEGAL.adulte);
    $('[data-note]', s.el).innerHTML = typo(minor ? NOTE_CONTACT.mineur : NOTE_CONTACT.adulte);
  }
  if (s.q.type === 'slots') $('[data-tz]', s.el).innerHTML = typo(minor ? TZ.mineur : TZ.adulte);
  fitScene(s.el);
}

const visible = (el) => !!el && el.offsetParent !== null;
function focusScene(i) {
  const root = i >= N ? done : scenes[i].el;
  const f = $$('[aria-checked="true"], .opt, input:not([type="hidden"]):not([readonly]), .day, .btn', root).find(visible);
  if (f) f.focus({ preventScroll: true });
}

// une réponse redevient incomplète (« Autre » vide, ville à donner) : la suite se referme
// jusqu'à ce qu'elle soit complétée ; les réponses déjà données plus loin sont gardées
function closeAfter(i) {
  for (let k = i + 1; k < N; k++) scenes[k].el.hidden = true;
  done.hidden = true;
  outro.hidden = true;
  finished = false;
  reached = Math.min(reached, i);
  kick();
}
// après un changement de réponse sur un questionnaire déjà envoyé : la fin se réécrit, l'envoi suit
let resendTimer = 0;
function afterChange() {
  if (!finished) return;
  renderDone();
  clearTimeout(resendTimer);
  resendTimer = setTimeout(submit, 1500);
}

function updateProgress() {
  const n = finished ? N : QUESTIONS.filter((q) => answered(q)).length;
  $('#progressFill').style.transform = `scaleX(${n / N})`;
  $('.progress').setAttribute('aria-valuenow', n);
}
const answered = (q) => q.type === 'contact' ? !!answers.nom : q.type === 'slots' ? !!answers.slot : !!answers[q.id];

/* ─── Clics ─── */
flow.addEventListener('click', (e) => {
  const sceneEl = e.target.closest('.scene.q');
  const ccBtn = e.target.closest('[data-cc-btn]');
  if (ccBtn) return ccOpen(ccBtn);
  const opt = e.target.closest('.opt');
  if (opt && sceneEl) return choose(+sceneEl.dataset.i, opt);

  const day = e.target.closest('.day'), time = e.target.closest('.time');
  if ((day || time) && sceneEl) {
    const group = day ? '.day' : '.time';
    $$(group, sceneEl).forEach((b) => b.setAttribute('aria-checked', String(b === (day || time))));
    sfx('tick');
    const dSel = $('.day[aria-checked="true"]', sceneEl), tSel = $('.time[aria-checked="true"]', sceneEl);
    if (dSel && tSel) answers.slot = slotOf(dSel.dataset.day, tSel.dataset.time);
    $('[data-act="book"]', sceneEl).disabled = !(dSel && tSel);
    return;
  }
  const calDay = e.target.closest('.cal-day'), calTime = e.target.closest('.cal-time');
  if ((calDay || calTime) && sceneEl) {
    if (calDay) cal.iso = calDay.dataset.iso; else cal.time = calTime.dataset.time;
    sfx('tick');
    renderCal(sceneEl);
    // jour et heure choisis : le panneau descend jusqu'au bouton de confirmation
    if (cal.iso && cal.time) { const panel = $('.panel', sceneEl); panel.scrollTo({ top: panel.scrollHeight, behavior: reduced ? 'auto' : 'smooth' }); }
    return;
  }
  const act = e.target.closest('[data-act]');
  if (act && act.dataset.act === 'book' && !act.disabled) { updateProgress(); open(N); }
  if (act && (act.dataset.act === 'cal-prev' || act.dataset.act === 'cal-next') && sceneEl) {
    cal.view = new Date(cal.view.getFullYear(), cal.view.getMonth() + (act.dataset.act === 'cal-next' ? 1 : -1), 1);
    sfx('tick');
    renderCal(sceneEl);
  }
  if (act && act.dataset.act === 'cal-ok' && !act.disabled && cal.iso && cal.time) {
    sfx('select');
    answers.slot = { ...slotOf(cal.iso, cal.time), custom: true };
    updateProgress();
    open(N);
  }
  if (act && act.dataset.act === 'cal-back' && sceneEl) { sfx('tick'); showPicker(sceneEl, false); }
  if (act && act.dataset.act === 'ics') downloadIcs();
  if (act && act.dataset.act === 'slot-other' && sceneEl) { sfx('tick'); showPicker(sceneEl, true); }
  if (act && act.dataset.act === 'edit') glideTo(docTop(scenes[0].el) + innerHeight * 0.06);
});

/* Un panneau qui dépasse l'écran de quelques pixels seulement est un piège au doigt : le
   navigateur donne tout le geste au panneau, qui défile de 9 px, et la page ne bouge plus.
   S'il déborde de peu, on le resserre (espacements réduits) pour qu'il tienne en entier ;
   s'il déborde vraiment (calendrier), il garde son propre défilement. */
function fitPanel(panel) {
  if (!panel) return;
  panel.classList.remove('tight');
  const over = panel.scrollHeight - panel.clientHeight;
  if (over > 0 && over <= 140) panel.classList.add('tight');
}
const fitScene = (sceneEl) => requestAnimationFrame(() => fitPanel($('.panel', sceneEl)));
addEventListener('resize', () => scenes.forEach((s) => { if (!s.el.hidden) fitPanel(s.panel); }));

function showOther(sceneEl, on) {
  const f = $('[data-other-form]', sceneEl);
  if (!f) return;
  f.hidden = !on;
  fitScene(sceneEl);
  if (on) requestAnimationFrame(() => f.autre.focus({ preventScroll: true }));
}
function showCity(sceneEl, on) {
  const f = $('[data-city-form]', sceneEl);
  if (!f) return;
  f.hidden = !on;
  fitScene(sceneEl);
  if (!on) cityClose(f);
  if (on) {
    requestAnimationFrame(() => f.ville.focus({ preventScroll: true }));
    cityPrefetch(f.ville.value);
  }
}

/* ─── Clavier : les flèches parcourent un groupe de choix ───
   Comme dans un groupe de boutons radio natif ; dans le calendrier,
   haut et bas sautent d'une semaine. */
flow.addEventListener('keydown', (e) => {
  const group = e.target.closest('[role="radiogroup"]');
  if (!group || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
  const items = $$('[role="radio"]:not([disabled])', group);
  const all = $$('[role="radio"]', group);
  const cur = all.indexOf(e.target);
  if (cur < 0 || !items.length) return;
  e.preventDefault();
  const grid = group.classList.contains('cal-grid');
  let next;
  if (e.key === 'Home') next = items[0];
  else if (e.key === 'End') next = items[items.length - 1];
  else {
    const step = (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) * (grid && (e.key === 'ArrowUp' || e.key === 'ArrowDown') ? 7 : 1);
    for (let k = cur + step; k >= 0 && k < all.length; k += Math.sign(step)) {
      if (!all[k].disabled) { next = all[k]; break; }
      if (Math.abs(step) === 7) break;
    }
  }
  if (next) next.focus({ preventScroll: true });
});

/* ═══ LA LISTE DES PAYS (indicatif) ═══
   Une fenêtre en verre sous le bouton (une feuille qui monte du bas sur
   téléphone) : recherche par nom, par indicatif ou sans accents, flèches,
   Entrée, Échap. Le pays choisi s'écrit dans le champ caché « indicatif ». */
const ccPop = document.createElement('div');
ccPop.className = 'ccpop';
ccPop.hidden = true;
ccPop.innerHTML = `<div class="ccpop-sheet" role="dialog" aria-label="Choisir le pays du numéro">
    <div class="ccpop-grip" aria-hidden="true"></div>
    <div class="ccpop-head"><p class="mono">Pays du numéro</p><button type="button" class="ccpop-x" data-cc-close aria-label="Fermer">${icon('x')}</button></div>
    <label class="ccpop-search">${icon('magnifying-glass')}<input type="text" role="combobox" aria-expanded="true" aria-controls="ccList" aria-autocomplete="list" autocomplete="off" spellcheck="false" maxlength="${LIM.recherche}" placeholder="Pays ou indicatif (Belgique, +32…)" aria-label="Rechercher un pays ou un indicatif"></label>
    <ul class="ccpop-list" id="ccList" role="listbox" aria-label="Pays"></ul>
    <p class="ccpop-empty" hidden>Aucun pays ne correspond.</p>
  </div>`;
document.body.appendChild(ccPop);
const ccSheet = $('.ccpop-sheet', ccPop), ccSearch = $('input', ccPop), ccList = $('.ccpop-list', ccPop), ccEmpty = $('.ccpop-empty', ccPop);
const ccRow = (c, g) => `<li role="option" id="cc-${g}-${c.cc}" data-cc="${c.cc}" aria-selected="false">${flagHTML(c.cc)}<span class="cc-name">${esc(c.name)}</span><span class="cc-dial">${c.dial}</span><span class="cc-tick">${TICK}</span></li>`;
ccList.innerHTML = `<li class="cc-group" role="presentation" data-g="t">Les plus fréquents</li>${TOP_CC.map((cc) => ccRow(BY_CC[cc], 't')).join('')}`
  + `<li class="cc-group" role="presentation" data-g="a">Tous les pays</li>${COUNTRIES.map((c) => ccRow(c, 'a')).join('')}`;
const ccRows = $$('[role="option"]', ccList);
const ccKey = Object.fromEntries(COUNTRIES.map((c) => [c.cc, ' ' + norm(`${c.name} ${regionName(c.cc)} ${ALIAS[c.cc] || ''} ${c.cc}`)]));
let ccField = null, ccActive = null;

function ccOpen(btn) {
  ccField = btn.closest('.field');
  const cur = $('[name="indicatif"]', ccField).value;
  ccRows.forEach((li) => li.setAttribute('aria-selected', String(li.dataset.cc === cur)));
  ccSearch.value = '';
  ccFilter('');
  ccPop.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
  ccPlace(btn);
  requestAnimationFrame(() => ccPop.classList.add('in'));
  const sel = ccRows.find((li) => li.dataset.cc === cur && !li.hidden);
  ccSetActive(sel || ccRows.find((li) => !li.hidden), true);
  // au doigt, le clavier ne s'ouvre pas tout seul (il cacherait la liste) ; on touche la recherche si besoin
  if (!matchMedia('(pointer: coarse)').matches) ccSearch.focus({ preventScroll: true }); else $('[data-cc-close]', ccPop).focus({ preventScroll: true });
  sfx('tick');
}
function ccPlace(btn) {
  if (innerWidth < 640) { ccSheet.style.left = ccSheet.style.top = ccSheet.style.bottom = ''; ccPop.classList.add('sheet'); return; }
  ccPop.classList.remove('sheet');
  const r = btn.getBoundingClientRect(), w = 340, h = Math.min(420, innerHeight - 32);
  ccSheet.style.left = `${clamp(r.left, 12, innerWidth - w - 12)}px`;
  const below = innerHeight - r.bottom - 12 >= h;
  ccSheet.style.top = `${below ? r.bottom + 8 : Math.max(12, r.top - 8 - h)}px`;
  ccSheet.style.maxHeight = `${h}px`;
}
function ccClose(focusBtn = true) {
  if (ccPop.hidden) return;
  ccPop.classList.remove('in');
  ccPop.hidden = true;
  if (ccField) {
    const btn = $('[data-cc-btn]', ccField);
    btn.setAttribute('aria-expanded', 'false');
    if (focusBtn) btn.focus({ preventScroll: true });
  }
}
function ccFilter(q) {
  const k = norm(q), digits = q.replace(/\D/g, '');
  const searching = !!(k || digits);
  let n = 0;
  ccRows.forEach((li) => {
    const c = BY_CC[li.dataset.cc];
    // en recherche, la liste « fréquents » disparaît pour ne pas montrer deux fois le même pays
    const show = li.id.startsWith('cc-t-') ? !searching
      : !searching || (k && ccKey[c.cc].includes(' ' + k)) || (digits && c.dial.slice(1).startsWith(digits) && !/[a-z]/.test(k));
    li.hidden = !show;
    if (show) n++;
  });
  $$('.cc-group', ccList).forEach((g) => { g.hidden = searching; });
  ccEmpty.hidden = n > 0;
  ccSearch.setAttribute('aria-expanded', String(n > 0));
  ccSetActive(ccRows.find((li) => !li.hidden), true);
}
function ccSetActive(li, scroll) {
  if (ccActive) ccActive.classList.remove('active');
  ccActive = li || null;
  if (!li) { ccSearch.removeAttribute('aria-activedescendant'); return; }
  li.classList.add('active');
  ccSearch.setAttribute('aria-activedescendant', li.id);
  if (scroll) li.scrollIntoView({ block: 'nearest' });
}
function ccPick(li) {
  const inp = $('[name="indicatif"]', ccField);
  inp.value = li.dataset.cc;
  inp.dataset.touched = '1';
  setPrefix(inp);
  sfx('select');
  ccClose(false);
  $('[name="whatsapp"]', ccField).focus({ preventScroll: true });
}
ccSearch.addEventListener('input', () => ccFilter(ccSearch.value));
ccPop.addEventListener('keydown', (e) => {
  const vis = ccRows.filter((li) => !li.hidden);
  const at = vis.indexOf(ccActive);
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    ccSetActive(vis[clamp(at + (e.key === 'ArrowDown' ? 1 : -1), 0, vis.length - 1)], true);
  } else if (e.key === 'PageDown' || e.key === 'PageUp') {
    e.preventDefault();
    ccSetActive(vis[clamp(at + (e.key === 'PageDown' ? 8 : -8), 0, vis.length - 1)], true);
  } else if (e.key === 'Enter') {
    if (ccActive && (e.target === ccSearch || e.target.closest('.ccpop-list'))) { e.preventDefault(); ccPick(ccActive); }
  } else if (e.key === 'Escape') {
    e.preventDefault(); ccClose();
  } else if (e.key === 'Tab') {
    ccClose(false);
  }
  e.stopPropagation();          // ni les chiffres 1 à 9, ni la touche M ne partent vers la page
});
ccList.addEventListener('click', (e) => { const li = e.target.closest('[role="option"]'); if (li) ccPick(li); });
ccList.addEventListener('pointermove', (e) => { const li = e.target.closest('[role="option"]'); if (li && li !== ccActive) ccSetActive(li, false); });
ccPop.addEventListener('click', (e) => { if (e.target === ccPop || e.target.closest('[data-cc-close]')) ccClose(); });
// la page bouge sous la fenêtre (défilement, rotation) : elle se ferme plutôt que de flotter au mauvais endroit
addEventListener('scroll', () => { if (!ccPop.hidden && !ccPop.classList.contains('sheet')) ccClose(false); }, { passive: true });
addEventListener('resize', () => { if (!ccPop.hidden) ccClose(false); });

/* ═══ LA VILLE, PROPOSÉE AU FIL DE LA FRAPPE ═══
   villes/<lettre>.json (GeoNames, CC BY 4.0) : le fichier de la première
   lettre tapée, chargé une seule fois. Une ligne : [nom, pays, population
   en milliers, autres noms…]. Hors connexion, le nom tapé suffit. */
const cityShards = {};
function cityShard(l) {
  if (!cityShards[l]) {
    cityShards[l] = fetch(`villes/${l}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((rows) => rows.map((r) => ({ r, keys: [norm(r[0]), ...r.slice(3)] })))
      .catch(() => { delete cityShards[l]; return null; });
  }
  return cityShards[l];
}
const shardOf = (q) => { const k = norm(q); return k ? (/[a-z]/.test(k[0]) ? k[0] : '_') : ''; };
function cityPrefetch(q) { const l = shardOf(q); if (l) cityShard(l); }
function citySearch(q) {
  const k = norm(q);
  if (k.length < 2) return Promise.resolve([]);
  return cityShard(shardOf(q)).then((rows) => {
    if (!rows) return null;
    const hits = [];
    for (const x of rows) {
      let score = -1;
      for (const key of x.keys) {
        if (key === k) { score = 3; break; }
        if (key.startsWith(k)) score = Math.max(score, 2);
        else if (key.includes(' ' + k)) score = Math.max(score, 1);
      }
      if (score >= 0) hits.push([score, x.r]);
    }
    hits.sort((a, b) => b[0] - a[0] || b[1][2] - a[1][2]);
    return hits.slice(0, 6).map((h) => h[1]);
  });
}
let cityTimer = 0, citySeq = 0;
function cityRender(f, rows, q) {
  const list = $('.city-list', f), inp = f.ville;
  f._list = rows || [];
  f._active = -1;
  if (rows === null) {
    list.innerHTML = `<li class="city-msg" role="presentation">${typo('Liste indisponible hors connexion : écrivez simplement votre ville.')}</li>`;
  } else if (!rows.length) {
    list.innerHTML = norm(q).length < 2 ? '' : `<li class="city-msg" role="presentation">${typo('Aucune ville trouvée : écrivez-la simplement, puis Continuer.')}</li>`;
  } else {
    const k = norm(q);
    list.innerHTML = rows.map((r, i) => {
      const name = esc(r[0]), m = norm(r[0]).startsWith(k) ? Math.min(k.length, r[0].length) : 0;
      const shown = m ? `<b>${esc(r[0].slice(0, m))}</b>${esc(r[0].slice(m))}` : name;
      return `<li role="option" id="${list.id}-${i}" data-i="${i}" aria-selected="false">${flagHTML(r[1])}<span class="c-name">${shown}</span><span class="c-country">${esc(BY_CC[r[1]] ? BY_CC[r[1]].name : regionName(r[1]))}</span></li>`;
    }).join('');
  }
  const open = !!list.innerHTML;
  list.hidden = !open;
  inp.setAttribute('aria-expanded', String(open && !!f._list.length));
  inp.removeAttribute('aria-activedescendant');
}
function cityClose(f) {
  const list = $('.city-list', f);
  list.hidden = true;
  f.ville.setAttribute('aria-expanded', 'false');
  f.ville.removeAttribute('aria-activedescendant');
}
function citySetActive(f, i) {
  const items = $$('.city-list [role="option"]', f);
  if (!items.length) return;
  f._active = clamp(i, 0, items.length - 1);
  items.forEach((li, k) => { li.classList.toggle('active', k === f._active); li.setAttribute('aria-selected', String(k === f._active)); });
  f.ville.setAttribute('aria-activedescendant', items[f._active].id);
}
function cityPick(f, i) {
  const r = f._list[i];
  if (!r) return;
  f._pick = r;
  f.ville.value = r[0];
  cityClose(f);
  sfx('tick');
  f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
}
flow.addEventListener('input', (e) => {
  if (e.target.name !== 'ville') return;
  const f = e.target.form, q = e.target.value, seq = ++citySeq;
  f._pick = null;
  clearTimeout(cityTimer);
  cityPrefetch(q);
  cityTimer = setTimeout(() => citySearch(q).then((rows) => { if (seq === citySeq) cityRender(f, rows, q); }), 90);
});
flow.addEventListener('keydown', (e) => {
  if (e.target.name !== 'ville') return;
  const f = e.target.form, list = $('.city-list', f);
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    if (list.hidden) return;
    e.preventDefault();
    citySetActive(f, f._active + (e.key === 'ArrowDown' ? 1 : -1));
  } else if (e.key === 'Enter' && !list.hidden && f._active >= 0) {
    e.preventDefault();
    cityPick(f, f._active);
  } else if (e.key === 'Escape' && !list.hidden) {
    e.preventDefault();
    cityClose(f);
  }
});
// pointerdown (et non click) : le champ ne perd pas le focus avant que le choix soit pris
flow.addEventListener('pointerdown', (e) => {
  const li = e.target.closest('.city-list [role="option"]');
  if (!li) return;
  e.preventDefault();
  cityPick(li.closest('form'), +li.dataset.i);
});
flow.addEventListener('focusout', (e) => {
  if (e.target.name !== 'ville') return;
  const f = e.target.form;
  setTimeout(() => { if (!f.contains(document.activeElement)) cityClose(f); }, 120);
});

/* ─── Le calendrier (« Aucun de ces créneaux ne me convient ») ─── */
const cal = { view: null, iso: '', time: '' };
function showPicker(sceneEl, on) {
  const pk = $('[data-picker]', sceneEl), panel = $('.panel', sceneEl);
  pk.hidden = !on;
  panel.classList.toggle('picking', on);
  fitScene(sceneEl);
  if (on) {
    if (!cal.view) { const t = new Date(); cal.view = new Date(t.getFullYear(), t.getMonth(), 1); }
    renderCal(sceneEl);
    panel.scrollTop = 0;
    requestAnimationFrame(() => { const f = $('.cal-day[aria-checked="true"], .cal-day:not([disabled])', pk); if (f) f.focus({ preventScroll: true }); });
  } else {
    requestAnimationFrame(() => $('[data-act="slot-other"]', sceneEl).focus({ preventScroll: true }));
  }
}
function renderCal(sceneEl) {
  const pk = $('[data-picker]', sceneEl);
  const first = new Date(); first.setHours(12, 0, 0, 0); first.setDate(first.getDate() + 1);   // dès demain
  const last = new Date(first); last.setDate(last.getDate() + CONFIG.calDays);
  const y = cal.view.getFullYear(), m = cal.view.getMonth();
  $('.cal-month', pk).textContent = `${MOL[m][0].toUpperCase() + MOL[m].slice(1)} ${y}`;
  $('[data-act="cal-prev"]', pk).disabled = new Date(y, m, 1) <= new Date(first.getFullYear(), first.getMonth(), 1);
  $('[data-act="cal-next"]', pk).disabled = new Date(y, m + 1, 1) > last;
  const lead = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  let html = '<span></span>'.repeat(lead);
  for (let n = 1; n <= days; n++) {
    const d = new Date(y, m, n, 12), iso = isoOf(d);
    const off = d < first || d > last || d.getDay() === 0;     // pas de rendez-vous le dimanche
    html += `<button type="button" role="radio" class="cal-day" data-iso="${iso}" aria-checked="${iso === cal.iso}" aria-label="${longOf(d)}"${off ? ' disabled' : ''}>${n}</button>`;
  }
  $('.cal-grid', pk).innerHTML = html;
  $$('.cal-time', pk).forEach((b) => b.setAttribute('aria-checked', String(b.dataset.time === cal.time)));
  $('[data-act="cal-ok"]', pk).disabled = !(cal.iso && cal.time);
}

function choose(i, opt) {
  const s = scenes[i];
  $$('.opt', s.el).forEach((o) => o.setAttribute('aria-checked', String(o === opt)));
  clearTimeout(advanceTimer);
  const pending = opt.hasAttribute('data-other') || opt.hasAttribute('data-city');
  sfx(pending ? 'tick' : 'select');
  if (pending) {
    // « Autre » ou « Hors de la RDC » : la réponse attend le champ à remplir (obligatoire),
    // et la suite se referme tant qu'il est vide
    const wasMinor = isMinor(answers);
    delete answers[s.q.id];
    if (s.q.id === 'lieu') clearCity();
    minorSwitch(wasMinor);
    closeAfter(i);
    updateProgress();
    showOther(s.el, opt.hasAttribute('data-other'));
    showCity(s.el, opt.hasAttribute('data-city'));
    return;
  }
  showOther(s.el, false);
  showCity(s.el, false);
  const wasMinor = isMinor(answers);
  answers[s.q.id] = opt.dataset.v;
  if (s.q.id === 'lieu') clearCity();
  minorSwitch(wasMinor);
  if (navigator.vibrate && navigator.userActivation && navigator.userActivation.isActive) navigator.vibrate(8);
  // les questions déjà ouvertes qui en dépendent se mettent à jour
  scenes.forEach((x, k) => { if (k > i && !x.el.hidden) refresh(k); });
  updateProgress();
  afterChange();
  clearTimeout(advanceTimer);
  // un temps pour voir la coche se poser, puis la scène suivante
  advanceTimer = setTimeout(() => open(i + 1), reduced ? 100 : 380);
}
function clearCity() { delete answers.ville; delete answers.pays_residence; delete answers.pays_cc; }
// passer d'élève à adulte (ou l'inverse) change le sens des coordonnées déjà données :
// elles sont à revoir, et la suite se referme après les coordonnées
function minorSwitch(wasMinor) {
  if (wasMinor === isMinor(answers) || !answers.nom) return;
  delete answers.nom;
  closeAfter(QUESTIONS.findIndex((q) => q.type === 'contact'));
}

/* ─── Réponse libre (« Autre ») ─── */
flow.addEventListener('submit', (e) => {
  if (!e.target.matches('[data-other-form]')) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const f = e.target, v = f.autre.value.replace(/\s+/g, ' ').trim();
  const sceneEl = f.closest('.scene.q'), i = +sceneEl.dataset.i, q = QUESTIONS[i];
  // au moins deux lettres ou chiffres : « .. » ou deux espaces ne passent pas
  const bad = (v.match(/[\p{L}\p{N}]/gu) || []).length < 2;
  $('[data-err="autre"]', f).textContent = bad ? 'Ce champ est obligatoire : écrivez quelques mots.' : '';
  f.autre.closest('.field').classList.toggle('invalid', bad);
  f.autre.setAttribute('aria-invalid', String(bad));
  if (bad) { sfx('error'); f.autre.focus({ preventScroll: true }); return; }
  sfx('select');
  const wasMinor = isMinor(answers);
  answers[q.id] = `Autre : ${v}`;
  minorSwitch(wasMinor);
  scenes.forEach((x, k) => { if (k > i && !x.el.hidden) refresh(k); });
  updateProgress();
  afterChange();
  open(i + 1);
});

/* ─── Ville (« Hors de la RDC ») ─── */
flow.addEventListener('submit', (e) => {
  if (!e.target.matches('[data-city-form]')) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const f = e.target, v = f.ville.value.replace(/\s+/g, ' ').trim();
  const sceneEl = f.closest('.scene.q'), i = +sceneEl.dataset.i, q = QUESTIONS[i];
  const bad = (v.match(/\p{L}/gu) || []).length < 2;
  $('[data-err="ville"]', f).textContent = bad ? 'Indiquez votre ville, même si elle ne s’affiche pas dans la liste.' : '';
  f.ville.closest('.field').classList.toggle('invalid', bad);
  f.ville.setAttribute('aria-invalid', String(bad));
  if (bad) { sfx('error'); f.ville.focus({ preventScroll: true }); return; }
  // une ville de la liste donne aussi le pays ; sinon le nom tapé suffit
  const pick = f._pick && norm(f._pick[0]) === norm(v) ? f._pick : (f._list || []).find((r) => norm(r[0]) === norm(v));
  cityClose(f);
  sfx('select');
  answers[q.id] = $('.opt[data-city]', sceneEl).dataset.v;
  answers.ville = pick ? pick[0] : v;
  if (pick && BY_CC[pick[1]]) { answers.pays_cc = pick[1]; answers.pays_residence = BY_CC[pick[1]].name; } else { delete answers.pays_cc; delete answers.pays_residence; }
  scenes.forEach((x, k) => { if (k > i && !x.el.hidden) refresh(k); });
  updateProgress();
  afterChange();
  open(i + 1);
});

/* ─── Coordonnées ─── */
// un numéro tapé avec son indicatif (+32 470…, 00243…, 243 81…) : l'indicatif est retiré,
// et s'il désigne un autre pays que celui choisi, le pays suit
const DIALS = COUNTRIES.map((c) => c.dial.slice(1)).filter((d, k, a) => a.indexOf(d) === k).sort((a, b) => b.length - a.length);
function splitNumber(raw, cc) {
  let digits = raw.replace(/\D/g, '');
  let pays = BY_CC[cc] || BY_CC.CD;
  const dial = pays.dial.slice(1);
  if (/^\s*(\+|00)/.test(raw)) {
    digits = digits.replace(/^00/, '');
    const d = DIALS.find((x) => digits.startsWith(x));
    if (d) {
      if (d !== dial) pays = BY_CC[TOP_CC.find((c) => BY_CC[c].dial === '+' + d)] || COUNTRIES.find((c) => c.dial === '+' + d);
      digits = digits.slice(d.length);
    }
  } else if (digits.startsWith(dial) && digits.length - dial.length >= 8) {
    digits = digits.slice(dial.length);
  }
  // le 0 du format national tombe devant l'indicatif (081… → +243 81…), sauf en Italie et alentour
  if (!['IT', 'SM', 'VA'].includes(pays.cc)) digits = digits.replace(/^0+/, '');
  return { pays, num: digits };
}
/* Un nom : des lettres (tous alphabets, accents compris), espaces, apostrophes, traits d'union.
   Contrôles minimaux mais francs : assez de mots, assez de lettres, pas trois fois la même
   lettre d'affilée (« aaa »), pas de mot fait d'une seule lettre répétée, pas de « -- » ni de « '' ». */
const NAME_CHARS = /[^\p{L}\p{M} '’.\-]/gu;
function checkName(v, words, msg) {
  const parts = v.split(' ').filter((w) => (w.match(/\p{L}/gu) || []).length >= 2);
  if (parts.length < words) return msg;
  if (/(\p{L})\1\1/iu.test(v)) return 'Ce nom paraît incorrect : vérifiez l’orthographe.';
  if (/['’.\-]{2,}|^['’.\-]|['’\-]$/u.test(v)) return 'Ce nom paraît incorrect : vérifiez la ponctuation.';
  if (v.split(' ').some((w) => w.length > 2 && new Set(w.toLowerCase()).size === 1)) return 'Ce nom paraît incorrect : vérifiez l’orthographe.';
  return '';
}
/* Une adresse e-mail : lettres sans accents, chiffres et . _ % + - avant le @ ; un domaine
   fait de lettres, chiffres et traits d'union ; une extension d'au moins deux lettres. */
const EMAIL_CHARS = /[^A-Za-z0-9._%+@-]/g;
const EMAIL_OK = /^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+-]{1,64}(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

// le nettoyage pendant la frappe : ce qui n'a rien à faire dans le champ ne s'écrit pas,
// et un mot dit pourquoi (au lieu d'une saisie qui « ne marche pas » sans explication)
const GUARD = {
  nom: { chars: NAME_CHARS, msg: 'Seules les lettres sont acceptées dans un nom.' },
  eleve: { chars: NAME_CHARS, msg: 'Seules les lettres sont acceptées dans un prénom.' },
  ville: { chars: /[^\p{L}\p{M}\p{N} '’.()\-]/gu, msg: 'Seules les lettres sont acceptées dans un nom de ville.' },
  email: { chars: EMAIL_CHARS, msg: 'Ce caractère n’est pas accepté dans une adresse e-mail (pas d’espace ni d’accent).' }
};
function guard(inp) {
  const g = GUARD[inp.name], form = inp.form;
  let v = inp.value, said = '';
  const pos = inp.selectionStart;
  if (inp.name === 'whatsapp') {
    const ind = form.indicatif;
    if (/\+|^\s*00/.test(v)) {
      // un numéro collé avec son indicatif : le pays suit, l'indicatif sort du champ
      const { pays, num } = splitNumber(v, ind.value);
      if (pays.cc !== ind.value) { ind.value = pays.cc; ind.dataset.touched = '1'; setPrefix(ind); }
      v = num;
    } else {
      if (/[^\d\s().\-]/.test(v)) said = 'Seuls les chiffres sont acceptés.';
      v = v.replace(/\D/g, '');
      if (!['IT', 'SM', 'VA'].includes(ind.value) && /^0/.test(v)) { v = v.replace(/^0+/, ''); said = 'Le 0 du début n’est pas nécessaire : il est retiré.'; }
      const dial = BY_CC[ind.value].dial.slice(1), max = telLen(ind.value)[1];
      if (v.length > max && v.startsWith(dial)) v = v.slice(dial.length);   // 243812345678 tapé d'une traite
    }
    const max = telLen(ind.value)[1];
    if (v.length > max) { v = v.slice(0, max); said = said || `${max} chiffres au maximum pour ce pays.`; }
  } else if (g) {
    const before = v;
    v = v.replace(g.chars, '');
    if (inp.name === 'email') {
      const at = v.indexOf('@');
      if (at >= 0) v = v.slice(0, at + 1) + v.slice(at + 1).replace(/@/g, '');   // un seul @
    } else {
      v = v.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
    }
    if (v !== before && v.length < before.length && before.replace(g.chars, '') !== before) said = g.msg;
  }
  if (v !== inp.value) {
    const cut = inp.value.length - v.length;
    inp.value = v;
    try { const p = Math.max(0, (pos || v.length) - cut); inp.setSelectionRange(p, p); } catch (e) { /* champ de type email : pas de curseur */ }
  }
  const err = form && $(`[data-err="${inp.name}"]`, form);
  if (err && said) { err.textContent = said; err.classList.add('soft'); clearTimeout(err._t); err._t = setTimeout(() => { if (err.classList.contains('soft')) { err.textContent = ''; err.classList.remove('soft'); } }, 2600); }
}
flow.addEventListener('input', (e) => { if (GUARD[e.target.name] || e.target.name === 'whatsapp') guard(e.target); });

flow.addEventListener('submit', (e) => {
  if (!e.target.matches('[data-contact]')) return;
  e.preventDefault();
  const f = e.target;
  const minor = isMinor(answers);
  const nom = f.nom.value.replace(/\s+/g, ' ').trim();
  const eleve = f.eleve.value.replace(/\s+/g, ' ').trim();
  const { pays, num } = splitNumber(f.whatsapp.value, f.indicatif.value);
  if (pays.cc !== f.indicatif.value) { f.indicatif.value = pays.cc; f.indicatif.dataset.touched = '1'; setPrefix(f.indicatif); }
  const mail = f.email.value.trim();
  const [tmin, tmax] = telLen(pays.cc);
  const errs = {
    eleve: minor ? checkName(eleve, 1, 'Indiquez votre prénom.') : '',
    nom: checkName(nom, 2, minor ? 'Indiquez le prénom et le nom de votre parent ou tuteur.' : 'Indiquez votre prénom et votre nom.'),
    whatsapp: num.length < tmin || num.length > tmax
      ? `Le numéro doit avoir ${tmin === tmax ? tmin : `${tmin} à ${tmax}`} chiffres, sans le 0 du début.` : '',
    email: mail && !EMAIL_OK.test(mail) ? 'Cette adresse e-mail paraît incorrecte (exemple : nom@gmail.com).' : ''
  };
  Object.entries(errs).forEach(([k, v]) => {
    const el = $(`[data-err="${k}"]`, f);
    el.classList.remove('soft');
    el.textContent = v;
    f[k].closest('.field').classList.toggle('invalid', !!v);
    f[k].setAttribute('aria-invalid', String(!!v));
  });
  const bad = Object.keys(errs).find((k) => errs[k]);
  if (bad) { sfx('error'); f[bad].focus({ preventScroll: true }); return; }
  sfx('select');
  Object.assign(answers, { nom, whatsapp: `${pays.dial} ${num}`, pays: pays.name, email: mail, mineur: minor });
  if (minor) answers.eleve = eleve; else delete answers.eleve;
  const i = QUESTIONS.findIndex((q) => q.type === 'contact');
  updateProgress();
  afterChange();
  open(i + 1);
});
flow.addEventListener('input', (e) => {
  const field = e.target.closest('.field');
  if (field && field.classList.contains('invalid')) {
    field.classList.remove('invalid');
    e.target.removeAttribute('aria-invalid');
    const err = $(`[data-err="${e.target.name}"]`, field.closest('form'));
    if (err && !err.classList.contains('soft')) err.textContent = '';
  }
});

/* ─── Fin ─── */
function renderDone() {
  const minor = isMinor(answers);
  const prenom = ((minor ? answers.eleve : answers.nom) || '').trim().split(/\s+/)[0] || '';
  const d = answers.slot;
  const avec = minor ? 'avec votre parent ou tuteur · ' : '';
  const wa = CONFIG.whatsapp
    ? `<a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(waText())}">${icon('whatsapp-logo')} Écrire à Stella</a>` : '';
  $('#donePanel').innerHTML = `
    <div class="done-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
    <p class="kicker">Inscription reçue</p>
    <h2 class="title">${typo(prenom ? `C’est noté, ${prenom}.` : 'C’est noté.')}</h2>
    <div class="when">${d && d.custom
      ? `<strong>${typo('Vous avez proposé : ' + d.label)}</strong><span>${typo((minor ? 'Stella confirme le créneau à votre parent sur WhatsApp. ' : 'Stella vous confirme le créneau sur WhatsApp. ') + 'Échange découverte · ' + avec + '20 min · gratuit')}</span>`
      : `<strong>${typo(d ? d.label : '')}</strong><span>${typo('Échange découverte · ' + avec + '20 min · gratuit · par appel WhatsApp')}</span>`}</div>
    <ol class="next">
      <li class="ok"><i>✓</i><span><b>Questionnaire envoyé.</b> ${typo('Stella le lit avant votre appel.')}</span></li>
      ${minor
        ? `<li><i>2</i><span><b>L’échange avec votre parent.</b> ${typo('Il reçoit un rappel sur WhatsApp la veille. Vous pouvez être là.')}</span></li>
      <li><i>3</i><span><b>L’accord de votre parent.</b> ${typo('Rien n’est réservé ni payé sans lui. Dès que votre domaine ouvre, il reçoit le lien pour l’acompte.')}</span></li>`
        : `<li><i>2</i><span><b>L’échange découverte.</b> ${typo('Un rappel vous arrive sur WhatsApp la veille.')}</span></li>
      <li><i>3</i><span><b>La liste d’attente.</b> ${typo('Dès que votre domaine ouvre, vous recevez le lien pour verser l’acompte.')}</span></li>`}
      <li><i>4</i><span><b>La première séance.</b> ${typo('En janvier 2027, avec votre mentor et votre groupe.')}</span></li>
    </ol>
    <p class="recap">${['domaine', 'profil', 'lieu', 'objectif', 'budget'].filter((k) => answers[k]).map((k) => `<b>${typo(k === 'lieu' && answers.ville ? `${answers.lieu} (${answers.ville}${answers.pays_residence ? ', ' + answers.pays_residence : ''})` : answers[k])}</b>`).join(' · ')}</p>
    <div class="actions">
      ${d && !d.custom ? `<button class="btn primary" data-act="ics" type="button">${icon('calendar-blank')} Ajouter à mon agenda</button>` : ''}
      ${wa}
      <button class="btn ghost" data-act="edit" type="button">Revoir mes réponses</button>
      <a class="btn ghost" href="presentation.html">Découvrir le programme</a>
    </div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => done.classList.add('drawn')));
}

function waText() {
  const slot = answers.slot ? answers.slot.label : '';
  return isMinor(answers)
    ? `Bonjour Stella, je suis ${answers.nom || ''}, parent ou tuteur de ${answers.eleve || ''}. Nous avons réservé l'échange découverte (${slot}). Domaine : ${answers.domaine || ''}.`
    : `Bonjour Stella, c'est ${answers.nom || ''}. Je viens de réserver l'échange découverte (${slot}). Domaine : ${answers.domaine || ''}.`;
}
// un envoi par version des réponses : un double clic ou un retour sur la fin ne renvoie rien ;
// une réponse changée après coup part comme une mise à jour
let lastSent = '', sends = 0;
function submit() {
  const data = { ...answers, slot: answers.slot && answers.slot.label, source: 'site-questionnaire' };
  const sig = JSON.stringify(data);
  if (sig === lastSent) return;
  lastSent = sig;
  sends++;
  const payload = { ...data, envoye_le: new Date().toISOString(), ...(sends > 1 ? { mise_a_jour: sends - 1 } : {}) };
  if (CONFIG.endpoint) {
    fetch(CONFIG.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) }).catch(() => {});
  }
}
function downloadIcs() {
  const s = answers.slot; if (!s || s.custom) return;
  const start = new Date(Date.UTC(s.y, s.m - 1, s.d, s.hh - 1, s.mm)); // Kinshasa = UTC+1
  const end = new Date(start.getTime() + 20 * 60000);
  const f = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NUBIAA Academia//Questionnaire//FR', 'BEGIN:VEVENT',
    `UID:${Date.now()}@nubiaa-academia`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
    'SUMMARY:Échange découverte NUBIAA Academia', 'DESCRIPTION:20 minutes avec Stella\\, par appel WhatsApp.',
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'nubiaa-echange-decouverte.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ═══ DÉFILEMENT GUIDÉ ═══
   Un ressort pousse la page jusqu'à la scène suivante. Le moindre
   geste de l'utilisateur (molette, doigt, touche) reprend la main. */
let glide = null;
function glideTo(y, after) {
  y = clamp(y, 0, document.documentElement.scrollHeight - innerHeight);
  if (reduced) { scrollTo(0, y); if (after) after(); return; }
  glide = { s: new Spring(scrollY, 0.95, 1), after };
  glide.s.target = y;
  kick();
}
const stopGlide = () => { glide = null; };
['wheel', 'touchstart', 'pointerdown'].forEach((t) => addEventListener(t, stopGlide, { passive: true }));
addEventListener('keydown', (e) => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key)) stopGlide(); });

/* ─── « Commencer » : le seul passage vers les questions ───
   Avant le clic, la page s'arrête à la fin de l'ouverture. Si l'on essaie
   d'aller plus bas (molette, doigt, flèche), le bouton s'illumine. */
const startBtn = $('#startBtn');
startBtn.addEventListener('click', () => {
  startBtn.classList.remove('nudge');
  sfx('whoosh');
  scenes[0].el.hidden = false;
  kick();
  requestAnimationFrame(() => glideTo(docTop(scenes[0].el) + innerHeight * 0.06, () => focusScene(0)));
});
let nudgeAt = 0, touchY = null;
function nudge() {
  if (!scenes[0].el.hidden || AP) return;
  const bottom = document.documentElement.scrollHeight - innerHeight - 4;
  if (scrollY < bottom) return;                        // pas encore au bout : on laisse défiler
  const now = performance.now();
  if (now - nudgeAt < 1300) return;
  nudgeAt = now;
  startBtn.classList.remove('nudge');
  void startBtn.offsetWidth;                           // relance l'animation
  startBtn.classList.add('nudge');
  sfx('tick');
}
startBtn.addEventListener('animationend', () => startBtn.classList.remove('nudge'));
addEventListener('wheel', (e) => { if (e.deltaY > 0) nudge(); }, { passive: true });
addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
addEventListener('touchmove', (e) => { if (touchY !== null && touchY - e.touches[0].clientY > 24) { nudge(); touchY = null; } }, { passive: true });
addEventListener('touchend', (e) => { if (touchY !== null && e.changedTouches[0] && touchY - e.changedTouches[0].clientY > 24) nudge(); touchY = null; }, { passive: true });
addEventListener('keydown', (e) => { if (['ArrowDown', 'PageDown', ' ', 'End'].includes(e.key) && !e.target.closest('input, textarea, button, select')) nudge(); });
$('[data-top]').addEventListener('click', (e) => { e.preventDefault(); glideTo(0); });

/* ─── Clavier : 1 à 9 répond à la question à l'écran ─── */
addEventListener('keydown', (e) => {
  if (e.target.closest('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = parseInt(e.key, 10);
  if (!k) return;
  const s = scenes.find((x) => !x.el.hidden && inView(x.el));
  if (!s || s.q.type !== 'choice') return;
  const opt = $(`.opt[data-k="${k}"]`, s.el);
  if (opt) { e.preventDefault(); opt.focus({ preventScroll: true }); choose(+s.el.dataset.i, opt); }
});
function inView(el) { const r = el.getBoundingClientRect(); return r.top <= innerHeight * 0.3 && r.bottom >= innerHeight * 0.7; }

function docTop(el) { let y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }

/* ═══ RENDU (une image par frame, seulement quand quelque chose bouge) ═══ */
const hero = $('#ouverture'), full = $('#full'), fullImg = $('#full img'), fullVeil = $('.full-veil');
const hole = $('#hole'), heroL1 = $('#heroL1'), heroA = $('#heroA'), heroB = $('#heroB'), heroKicker = $('#heroKicker');
const intro = $('#intro'), cue = $('#cue'), sun = $('#sun');
const duneFar = $('#duneFar'), duneMid = $('#duneMid'), duneNear = $('#duneNear');
const cloud = $$('#cloud figure');
// profondeur et place de chaque visuel de l'ouverture, lues une fois (pas à chaque image)
const cloudXY = cloud.map((f) => [+f.dataset.d, parseFloat(f.style.getPropertyValue('--x')) / 100 - 0.5, parseFloat(f.style.getPropertyValue('--y')) / 100 - 0.5]);
const count = $('#count');
let ticking = false, last = 0, introAt = 0;
/* Le rendu suit un défilement lissé (sy) plutôt que le défilement brut : les
   mouvements gardent un peu d'inertie au lieu d'être collés au doigt, et la
   vitesse du geste (vel) penche légèrement les visuels. */
let sy = 0, vel = 0, countHTML = null;
const SMOOTH = 0.075;        // s : temps de rattrapage du défilement lissé
const lagOf = () => scrollY - sy;

// n'écrire un style que s'il change : une valeur identique réécrite coûte quand même un recalcul
const written = new WeakMap();
function put(el, prop, v) {
  let c = written.get(el);
  if (!c) written.set(el, (c = {}));
  if (c[prop] !== v) { c[prop] = v; el.style[prop] = v; }
}

function kick() { if (!ticking) { ticking = true; last = performance.now(); requestAnimationFrame(frame); } }
addEventListener('scroll', kick, { passive: true });
addEventListener('resize', kick);

function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 20); last = now;
  if (glide) {
    for (let t = dt; t > 0; t -= 1 / 240) glide.s.step(Math.min(1 / 240, t));
    scrollTo(0, glide.s.x);
    if (glide.s.idle) { scrollTo(0, glide.s.target); const a = glide.after; glide = null; if (a) a(); }
  }
  const prev = sy;
  sy = reduced || dt <= 0 ? scrollY : scrollY + (sy - scrollY) * Math.exp(-dt / SMOOTH);
  if (Math.abs(scrollY - sy) < 0.3 || Math.abs(scrollY - sy) > innerHeight * 3) sy = scrollY;   // un saut (ancre, rechargement) ne glisse pas
  if (dt > 0) vel += ((sy - prev) / dt - vel) * (1 - Math.exp(-dt / 0.14));
  if (Math.abs(vel) < 4) vel = 0;
  render(now);
  const introRunning = now - introAt < 1600;
  if (glide || introRunning || sy !== scrollY || vel !== 0) requestAnimationFrame(frame); else ticking = false;
}

function render(now) {
  const vh = innerHeight, vw = innerWidth;
  if (reduced) { renderStatic(); return; }
  const lag = lagOf();
  const tilt = clamp(vel / 2600, -1, 1);                 // -1 → 1 selon la vitesse du geste

  // toutes les lectures de mise en page d'abord, les écritures ensuite (pas de recalcul forcé à chaque scène)
  const hr = hero.getBoundingClientRect();
  const rects = scenes.map((s) => (s.el.hidden ? null : s.el.getBoundingClientRect()));
  const doneR = done.hidden ? null : done.getBoundingClientRect();
  const outroR = outro.hidden ? null : outro.getBoundingClientRect();

  /* ── ouverture ── */
  if (hr.bottom + lag > 0) {
    const hp = clamp(-(hr.top + lag) / (hr.height - vh), 0, 1);
    // 1 · le trou s'ouvre entre les mots, l'image y naît
    const born = easeOut(seg(hp, 0, 0.1));
    put(hole, 'width', (born * (vw < 600 ? 1.5 : 2.4)).toFixed(3) + 'em');
    // 2 · la première ligne s'efface, la seconde monte seule au centre
    const l1 = seg(hp, 0.06, 0.15);
    put(heroL1, 'opacity', (1 - l1).toFixed(3));
    put(heroKicker, 'opacity', (1 - l1).toFixed(3));
    put(heroL1, 'transform', `translateY(${(-l1 * 40).toFixed(1)}px)`);
    // 3 · l'image prend tout l'écran, les mots s'écartent
    const g = easeInOut(seg(hp, 0.14, 0.5));
    const r = hole.getBoundingClientRect();
    const rad = (1 - g) * 10;
    full.style.clipPath = born > 0.01
      ? `inset(${(r.top * (1 - g)).toFixed(1)}px ${((vw - r.right) * (1 - g)).toFixed(1)}px ${((vh - r.bottom) * (1 - g)).toFixed(1)}px ${(r.left * (1 - g)).toFixed(1)}px round ${rad.toFixed(1)}px)`
      : 'inset(50% 50% 50% 50%)';
    put(fullImg, 'transform', `scale(${(1.35 - 0.3 * g + 0.06 * seg(hp, 0.5, 1)).toFixed(4)})`);
    put(heroA, 'transform', `translateX(${(-g * vw * 0.42).toFixed(1)}px)`);
    put(heroB, 'transform', `translateX(${(g * vw * 0.42).toFixed(1)}px)`);
    { const o = (1 - seg(hp, 0.3, 0.46)).toFixed(3); put(heroA, 'opacity', o); put(heroB, 'opacity', o); }
    // le nuage s'ouvre vers les bords, chaque visuel à sa profondeur
    cloud.forEach((f, ci) => {
      const [d, x, y] = cloudXY[ci];
      const k = easeOut(seg(hp, 0, 0.45));
      const shown = introAt ? easeOut(clamp((now - introAt - d * 260) / 900, 0, 1)) : 0;
      put(f, 'opacity', (shown * (1 - seg(hp, 0.32, 0.5))).toFixed(3));
      put(f, 'transform', `translate3d(${(x * k * vw * 0.5 * d).toFixed(1)}px, ${(y * k * vh * 0.6 * d - hp * vh * 0.3 * d + (1 - shown) * 40).toFixed(1)}px, 0) scale(${(0.85 + 0.15 * shown + k * 0.25 * d).toFixed(3)})`);
    });
    // les dunes s'enfoncent, chacune à sa vitesse ; le soleil monte
    put(duneFar, 'transform', `translate3d(0, ${(hp * vh * 0.18).toFixed(1)}px, 0)`);
    put(duneMid, 'transform', `translate3d(0, ${(hp * vh * 0.34).toFixed(1)}px, 0)`);
    put(duneNear, 'transform', `translate3d(0, ${(hp * vh * 0.6).toFixed(1)}px, 0)`);
    put(sun, 'transform', `translate3d(0, ${(-hp * vh * 0.4).toFixed(1)}px, 0)`);
    // 4 · sur l'image, l'annonce du questionnaire
    const io = easeOut(seg(hp, 0.5, 0.64));
    put(fullVeil, 'opacity', io.toFixed(3));
    put(intro, 'opacity', io.toFixed(3));
    put(intro, 'transform', `translateY(${((1 - io) * 40 - seg(hp, 0.85, 1) * 60).toFixed(1)}px)`);
    put(intro, 'pointerEvents', io > 0.6 ? 'auto' : 'none');
    put(cue, 'opacity', (1 - seg(hp, 0, 0.05)).toFixed(3));
    // les sons de l'ouverture, chacun sur son mouvement
    soundCue('o-born', hp, [0.012], 'rise');     // l'image naît entre les mots
    soundCue('o-cloud', hp, [0.05], 'drift');    // le nuage s'ouvre vers les bords
    soundCue('o-zoom', hp, [0.15], 'zoom');      // l'image prend tout l'écran
    soundCue('o-intro', hp, [0.53], 'glass');    // l'annonce apparaît sur l'image
  }

  /* ── questions ── */
  let current = -1;
  scenes.forEach((s, i) => {
    const rr = rects[i];
    if (!rr) return;
    if (rr.top <= vh * 0.5 && rr.bottom >= vh * 0.5) current = i;
    const top = rr.top + lag, height = rr.height;
    if (top + height < -40 || top > vh + 40) return;
    const pe = clamp(1 - top / vh, 0, 1);                   // entrée : 0 → 1 quand la scène arrive en haut
    const pp = clamp(-top / (height - vh), 0, 1);           // épinglée : 0 → 1
    const nextOpen = i < N - 1 ? !scenes[i + 1].el.hidden : finished;
    // les sons de la scène : visuels, panneau, titre mot à mot, réponses une à une, sortie
    soundCue(`s${i}-floats`, pe, [0.25], 'drift');
    soundCue(`s${i}-panel`, pe, [0.34], 'glass');
    soundCue(`s${i}-words`, pe, s.words.map((_, k) => 0.5 + k * 0.025), 'word');
    soundCue(`s${i}-items`, pe, s.items.map((_, k) => 0.6 + (k / Math.max(s.items.length, 1)) * 0.27), 'type');
    if (nextOpen) soundCue(`s${i}-out`, pp, [0.74], 'split');
    const out = nextOpen ? easeInOut(seg(pp, 0.72, 1)) : 0;  // sortie seulement si la suite existe

    // le fond traîne derrière la scène (parallaxe), puis respire ; un geste rapide le rapproche à peine
    put(s.bg, 'transform', `translate3d(0, ${(-(1 - pe) * vh * 0.42 + pp * vh * 0.06).toFixed(1)}px, 0) scale(${(1.16 - 0.12 * easeOut(pe) + 0.05 * out + 0.018 * Math.abs(tilt)).toFixed(4)})`);
    // le numéro va plus lentement que tout le reste (transform direct : une variable CSS ferait recalculer tout le sous-arbre)
    put(s.num, 'transform', `translate3d(0, calc(-50% + ${(-(1 - pe) * vh * 0.25 - pp * vh * 0.22).toFixed(1)}px), 0)`);
    put(s.num, 'opacity', (easeOut(seg(pe, 0.3, 0.9)) * (1 - out)).toFixed(3));
    // les visuels flottants passent devant, plus vite, et penchent avec le geste
    s.floats.forEach((f, k) => {
      const d = k ? 1.35 : 0.9, side = k ? -1 : 1;
      put(f, 'transform', `translate3d(0, ${((1 - pe) * vh * 0.55 * d - pp * vh * 0.5 * d + tilt * 22 * d).toFixed(1)}px, 0) rotate(${(side * (1 - pe) * 6 + side * tilt * 3.5).toFixed(2)}deg)`);
      put(f, 'opacity', (seg(pe, 0.2, 0.7) * (1 - out)).toFixed(3));
    });
    // le panneau, puis le titre mot par mot, puis les réponses une à une
    const pk = easeOut(seg(pe, 0.3, 0.85));
    put(s.panel, 'transform', `translate3d(0, calc(var(--base) + ${((1 - pk) * 90 - out * 70).toFixed(1)}px), 0)`);
    put(s.panel, 'opacity', (pk * (1 - out)).toFixed(3));
    put(s.panel, 'pointerEvents', pk > 0.6 && out < 0.5 ? 'auto' : 'none');
    s.words.forEach((w, k) => {
      const kw = easeOut(seg(pe, 0.42 + k * 0.025, 0.72 + k * 0.025));
      put(w, 'opacity', kw.toFixed(3));
      put(w, 'transform', `translateY(${((1 - kw) * 0.5).toFixed(3)}em)`);
    });
    const n = s.items.length;
    s.items.forEach((it, k) => {
      const a = 0.58 + (k / Math.max(n, 1)) * 0.27;
      const ki = easeOut(seg(pe, a, a + 0.15));
      put(it, 'opacity', ki.toFixed(3));
      put(it, 'transform', `translate3d(0, ${((1 - ki) * 26).toFixed(1)}px, 0)`);
    });
  });

  /* ── fin ── */
  if (doneR) {
    const top = doneR.top + lag;
    const pe = clamp(1 - top / vh, 0, 1);
    put($('.bg', done), 'transform', `translate3d(0, ${(-(1 - pe) * vh * 0.42).toFixed(1)}px, 0) scale(${(1.16 - 0.12 * easeOut(pe)).toFixed(4)})`);
    soundCue('fin-panel', pe, [0.36], 'glass');
    const p = $('#donePanel'), pk = easeOut(seg(pe, 0.35, 0.9));
    put(p, 'transform', `translate3d(0, calc(var(--base) + ${((1 - pk) * 80).toFixed(1)}px), 0)`);
    put(p, 'opacity', pk.toFixed(3));
    if (doneR.top < vh * 0.5) current = N;
  }
  if (outroR) {
    const top = outroR.top + lag;
    const k = easeOut(clamp(1 - top / vh, 0, 1));
    soundCue('logo', 1 - top / vh, [0.35], 'reveal'); // le logo monte
    const o = $('.outro-in', outro);
    put(o, 'opacity', k.toFixed(3));
    put(o, 'transform', `translate3d(0, ${((1 - k) * vh * 0.25).toFixed(1)}px, 0) scale(${(0.92 + 0.08 * k).toFixed(4)})`);
  }

  /* ── barre ── (réécrite seulement quand elle change) */
  setCount(current);
}
function setCount(current) {
  const h = current < 0 ? '' : current >= N ? 'Terminé' : `Question <b>${current + 1}</b> / ${N}`;
  if (h !== countHTML) { count.innerHTML = h; countHTML = h; }
}

function renderStatic() {
  let current = -1;
  scenes.forEach((s, i) => { if (!s.el.hidden) { const r = s.el.getBoundingClientRect(); if (r.top <= innerHeight * 0.5 && r.bottom >= innerHeight * 0.5) current = i; } });
  if (!done.hidden && done.getBoundingClientRect().top < innerHeight * 0.5) current = N;
  setCount(current);
}

/* ═══ DÉMARRAGE ═══ */
if (reduced) document.documentElement.classList.add('rm');
const go = () => { document.body.classList.add('ready'); introAt = performance.now(); kick(); };
// l'ouverture attend les fontes ET la réponse à la question du son, pour ne pas jouer derrière elle
const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
const soundReady = window.NubiaaSound ? window.NubiaaSound.ready : Promise.resolve();
Promise.all([fontsReady, soundReady]).then(() => requestAnimationFrame(go));
history.scrollRestoration = 'manual';
scrollTo(0, 0);
kick();

/* ─── Aperçu pour les captures de contrôle : ?apercu=<id de scène>:<position>
   position < 0 : la scène arrive (−1 = encore sous l'écran) ; 0 → 1 : scène épinglée.
   Toutes les questions sont alors ouvertes et remplies avec la première réponse. */
const AP = new URLSearchParams(location.search).get('apercu');
if (AP) {
  QUESTIONS.forEach((q, i) => {
    if (q.type === 'choice') { const o = $('.opt', scenes[i].el); o.setAttribute('aria-checked', 'true'); answers[q.id] = o.dataset.v; }
  });
  Object.assign(answers, { nom: 'Grâce Mbuyi', whatsapp: '+243 812345678', slot: { y: 2026, m: 10, d: 23, hh: 14, mm: 0, label: 'Vendredi 23 octobre à 14 h' } });
  scenes.forEach((s, i) => { s.el.hidden = false; refresh(i); });
  finished = true; renderDone(); done.hidden = false; outro.hidden = false; updateProgress();
  const [id, f] = AP.split(':'); const el = document.getElementById(id) || hero; const frac = parseFloat(f) || 0;
  const y = frac < 0 ? docTop(el) + frac * innerHeight : docTop(el) + frac * (el.offsetHeight - innerHeight);
  introAt = performance.now() - 5000;
  requestAnimationFrame(() => { scrollTo(0, y); sy = scrollY; vel = 0; render(performance.now()); });
}
