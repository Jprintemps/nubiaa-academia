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
const regionName = (() => {
  try { const dn = new Intl.DisplayNames(['fr'], { type: 'region' }); return (cc) => dn.of(cc) || cc; } catch (e) { return (cc) => cc; }
})();
const COUNTRIES = PAYS.trim().split(/\s+/)
  .map((t) => ({ cc: t.slice(0, 2), dial: '+' + t.slice(2), name: regionName(t.slice(0, 2)) }))
  .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
const BY_CC = Object.fromEntries(COUNTRIES.map((c) => [c.cc, c]));
// en tête de liste : la RDC et les pays d'où viennent le plus de demandes
const TOP_CC = ['CD', 'CG', 'AO', 'CM', 'FR', 'BE', 'CA', 'US'];

const ICONS = {"arrow-left":"<path fill=\"currentColor\" d=\"M224 128a8 8 0 0 1-8 8H59.31l58.35 58.34a8 8 0 0 1-11.32 11.32l-72-72a8 8 0 0 1 0-11.32l72-72a8 8 0 0 1 11.32 11.32L59.31 120H216a8 8 0 0 1 8 8\"/>","arrow-right":"<path fill=\"currentColor\" d=\"m221.66 133.66l-72 72a8 8 0 0 1-11.32-11.32L196.69 136H40a8 8 0 0 1 0-16h156.69l-58.35-58.34a8 8 0 0 1 11.32-11.32l72 72a8 8 0 0 1 0 11.32\"/>","arrows-clockwise":"<path fill=\"currentColor\" d=\"M224 48v48a8 8 0 0 1-8 8h-48a8 8 0 0 1 0-16h28.69l-14.63-14.63a79.56 79.56 0 0 0-56.13-23.43h-.45a79.52 79.52 0 0 0-55.89 22.77a8 8 0 0 1-11.18-11.44a96 96 0 0 1 135 .79L208 76.69V48a8 8 0 0 1 16 0m-37.59 135.29a80 80 0 0 1-112.47-.66L59.31 168H88a8 8 0 0 0 0-16H40a8 8 0 0 0-8 8v48a8 8 0 0 0 16 0v-28.69l14.63 14.63A95.43 95.43 0 0 0 130 222.06h.53a95.36 95.36 0 0 0 67.07-27.33a8 8 0 0 0-11.18-11.44Z\"/>","backpack":"<path fill=\"currentColor\" d=\"M168 40.58V32a24 24 0 0 0-24-24h-32a24 24 0 0 0-24 24v8.58A56.09 56.09 0 0 0 40 96v120a16 16 0 0 0 16 16h144a16 16 0 0 0 16-16V96a56.09 56.09 0 0 0-48-55.42M112 24h32a8 8 0 0 1 8 8v8h-48v-8a8 8 0 0 1 8-8m56 136H88v-8a8 8 0 0 1 8-8h64a8 8 0 0 1 8 8Zm-80 16h48v8a8 8 0 0 0 16 0v-8h16v40H88Zm112 40h-16v-64a24 24 0 0 0-24-24H96a24 24 0 0 0-24 24v64H56V96a40 40 0 0 1 40-40h64a40 40 0 0 1 40 40zM152 88a8 8 0 0 1-8 8h-32a8 8 0 0 1 0-16h32a8 8 0 0 1 8 8\"/>","briefcase":"<path fill=\"currentColor\" d=\"M216 56h-40v-8a24 24 0 0 0-24-24h-48a24 24 0 0 0-24 24v8H40a16 16 0 0 0-16 16v128a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V72a16 16 0 0 0-16-16M96 48a8 8 0 0 1 8-8h48a8 8 0 0 1 8 8v8H96Zm120 24v41.61A184 184 0 0 1 128 136a184.1 184.1 0 0 1-88-22.38V72Zm0 128H40v-68.36A200.2 200.2 0 0 0 128 152a200.25 200.25 0 0 0 88-20.37zm-112-88a8 8 0 0 1 8-8h32a8 8 0 0 1 0 16h-32a8 8 0 0 1-8-8\"/>","broadcast":"<path fill=\"currentColor\" d=\"M128 88a40 40 0 1 0 40 40a40 40 0 0 0-40-40m0 64a24 24 0 1 1 24-24a24 24 0 0 1-24 24m73.71 7.14a80 80 0 0 1-14.08 22.2a8 8 0 0 1-11.92-10.67a63.95 63.95 0 0 0 0-85.33a8 8 0 1 1 11.92-10.67a80.08 80.08 0 0 1 14.08 84.47M69 103.09a64 64 0 0 0 11.26 67.58a8 8 0 0 1-11.92 10.67a79.93 79.93 0 0 1 0-106.67a8 8 0 1 1 11.95 10.67A63.8 63.8 0 0 0 69 103.09M248 128a119.58 119.58 0 0 1-34.29 84a8 8 0 1 1-11.42-11.2a103.9 103.9 0 0 0 0-145.56A8 8 0 1 1 213.71 44A119.58 119.58 0 0 1 248 128M53.71 200.78A8 8 0 1 1 42.29 212a119.87 119.87 0 0 1 0-168a8 8 0 1 1 11.42 11.2a103.9 103.9 0 0 0 0 145.56Z\"/>","bug":"<path fill=\"currentColor\" d=\"M144 92a12 12 0 1 1 12 12a12 12 0 0 1-12-12m-44-12a12 12 0 1 0 12 12a12 12 0 0 0-12-12m116 64a87.8 87.8 0 0 1-3 23l22.24 9.72A8 8 0 0 1 232 192a7.9 7.9 0 0 1-3.2-.67L207.38 182a88 88 0 0 1-158.76 0l-21.42 9.33a7.9 7.9 0 0 1-3.2.67a8 8 0 0 1-3.2-15.33L43 167a87.8 87.8 0 0 1-3-23v-8H16a8 8 0 0 1 0-16h24v-8a87.8 87.8 0 0 1 3-23l-22.2-9.67a8 8 0 1 1 6.4-14.66L48.62 74a88 88 0 0 1 158.76 0l21.42-9.36a8 8 0 0 1 6.4 14.66L213 89.05a87.8 87.8 0 0 1 3 23v8h24a8 8 0 0 1 0 16h-24ZM56 120h144v-8a72 72 0 0 0-144 0Zm64 95.54V136H56v8a72.08 72.08 0 0 0 64 71.54M200 144v-8h-64v79.54A72.08 72.08 0 0 0 200 144\"/>","calendar-blank":"<path fill=\"currentColor\" d=\"M208 32h-24v-8a8 8 0 0 0-16 0v8H88v-8a8 8 0 0 0-16 0v8H48a16 16 0 0 0-16 16v160a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16M72 48v8a8 8 0 0 0 16 0v-8h80v8a8 8 0 0 0 16 0v-8h24v32H48V48Zm136 160H48V96h160z\"/>","caret-down":"<path fill=\"currentColor\" d=\"m213.66 101.66l-80 80a8 8 0 0 1-11.32 0l-80-80a8 8 0 0 1 11.32-11.32L128 164.69l74.34-74.35a8 8 0 0 1 11.32 11.32\"/>","caret-left":"<path fill=\"currentColor\" d=\"M165.66 202.34a8 8 0 0 1-11.32 11.32l-80-80a8 8 0 0 1 0-11.32l80-80a8 8 0 0 1 11.32 11.32L91.31 128Z\"/>","caret-right":"<path fill=\"currentColor\" d=\"m181.66 133.66l-80 80a8 8 0 0 1-11.32-11.32L164.69 128L90.34 53.66a8 8 0 0 1 11.32-11.32l80 80a8 8 0 0 1 0 11.32\"/>","chat-circle-dots":"<path fill=\"currentColor\" d=\"M140 128a12 12 0 1 1-12-12a12 12 0 0 1 12 12m-56-12a12 12 0 1 0 12 12a12 12 0 0 0-12-12m88 0a12 12 0 1 0 12 12a12 12 0 0 0-12-12m60 12a104 104 0 0 1-152.88 91.82l-34.05 11.35a16 16 0 0 1-20.24-20.24l11.35-34.05A104 104 0 1 1 232 128m-16 0a88 88 0 1 0-164.19 44.06a8 8 0 0 1 .66 6.54L40 216l37.4-12.47a7.9 7.9 0 0 1 2.53-.42a8 8 0 0 1 4 1.08A88 88 0 0 0 216 128\"/>","check":"<path fill=\"currentColor\" d=\"m229.66 77.66l-128 128a8 8 0 0 1-11.32 0l-56-56a8 8 0 0 1 11.32-11.32L96 188.69L218.34 66.34a8 8 0 0 1 11.32 11.32\"/>","circuitry-light":"<path fill=\"currentColor\" d=\"M208 34H48a14 14 0 0 0-14 14v160a14 14 0 0 0 14 14h160a14 14 0 0 0 14-14V48a14 14 0 0 0-14-14M88 158a10 10 0 1 1-10 10a10 10 0 0 1 10-10m-42 50V48a2 2 0 0 1 2-2h34v100.84a22 22 0 1 0 12 0v-36.35l52 52V210H48a2 2 0 0 1-2-2m164 0a2 2 0 0 1-2 2h-50v-50a6 6 0 0 0-1.76-4.24L94 93.51V46h36v26a6 6 0 0 0 1.76 4.24l17 17a22 22 0 1 0 8.48-8.48L142 69.51V46h66a2 2 0 0 1 2 2ZM168 94a10 10 0 1 1-10 10a10 10 0 0 1 10-10\"/>","clipboard-text-light":"<path fill=\"currentColor\" d=\"M166 152a6 6 0 0 1-6 6H96a6 6 0 0 1 0-12h64a6 6 0 0 1 6 6m-6-38H96a6 6 0 0 0 0 12h64a6 6 0 0 0 0-12m54-66v168a14 14 0 0 1-14 14H56a14 14 0 0 1-14-14V48a14 14 0 0 1 14-14h37.17a45.91 45.91 0 0 1 69.66 0H200a14 14 0 0 1 14 14M94 64v2h68v-2a34 34 0 0 0-68 0m108-16a2 2 0 0 0-2-2h-29.67A45.8 45.8 0 0 1 174 64v8a6 6 0 0 1-6 6H88a6 6 0 0 1-6-6v-8a45.8 45.8 0 0 1 3.67-18H56a2 2 0 0 0-2 2v168a2 2 0 0 0 2 2h144a2 2 0 0 0 2-2Z\"/>","clock":"<path fill=\"currentColor\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88m64-88a8 8 0 0 1-8 8h-56a8 8 0 0 1-8-8V72a8 8 0 0 1 16 0v48h48a8 8 0 0 1 8 8\"/>","code-block":"<path fill=\"currentColor\" d=\"m58.34 101.66l-32-32a8 8 0 0 1 0-11.32l32-32a8 8 0 0 1 11.32 11.32L43.31 64l26.35 26.34a8 8 0 0 1-11.32 11.32m40 0a8 8 0 0 0 11.32 0l32-32a8 8 0 0 0 0-11.32l-32-32a8 8 0 0 0-11.32 11.32L124.69 64L98.34 90.34a8 8 0 0 0 0 11.32M200 40h-24a8 8 0 0 0 0 16h24v144H56v-64a8 8 0 0 0-16 0v64a16 16 0 0 0 16 16h144a16 16 0 0 0 16-16V56a16 16 0 0 0-16-16\"/>","coins":"<path fill=\"currentColor\" d=\"M184 89.57V84c0-25.08-37.83-44-88-44S8 58.92 8 84v40c0 20.89 26.25 37.49 64 42.46V172c0 25.08 37.83 44 88 44s88-18.92 88-44v-40c0-20.7-25.42-37.32-64-42.43M232 132c0 13.22-30.79 28-72 28c-3.73 0-7.43-.13-11.08-.37C170.49 151.77 184 139 184 124v-18.26c29.87 4.45 48 16.53 48 26.26M72 150.25v-23.79A184 184 0 0 0 96 128a184 184 0 0 0 24-1.54v23.79A163 163 0 0 1 96 152a163 163 0 0 1-24-1.75m96-40.32V124c0 8.39-12.41 17.4-32 22.87V123.5c12.91-3.13 23.84-7.79 32-13.57M96 56c41.21 0 72 14.78 72 28s-30.79 28-72 28s-72-14.78-72-28s30.79-28 72-28m-72 68v-14.07c8.16 5.78 19.09 10.44 32 13.57v23.37C36.41 141.4 24 132.39 24 124m64 48v-4.17c2.63.1 5.29.17 8 .17c3.88 0 7.67-.13 11.39-.35a122 122 0 0 0 12.61 3.76v23.46c-19.59-5.47-32-14.48-32-22.87m48 26.25V174.4a179.5 179.5 0 0 0 24 1.6a184 184 0 0 0 24-1.54v23.79a165.5 165.5 0 0 1-48 0m64-3.38V171.5c12.91-3.13 23.84-7.79 32-13.57V172c0 8.39-12.41 17.4-32 22.87\"/>","compass":"<path fill=\"currentColor\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88m44.42-143.16l-64 32a8.05 8.05 0 0 0-3.58 3.58l-32 64A8 8 0 0 0 80 184a8.1 8.1 0 0 0 3.58-.84l64-32a8.05 8.05 0 0 0 3.58-3.58l32-64a8 8 0 0 0-10.74-10.74M138 138l-40.11 20.11L118 118l40.15-20.07Z\"/>","cpu":"<path fill=\"currentColor\" d=\"M152 96h-48a8 8 0 0 0-8 8v48a8 8 0 0 0 8 8h48a8 8 0 0 0 8-8v-48a8 8 0 0 0-8-8m-8 48h-32v-32h32Zm88 0h-16v-32h16a8 8 0 0 0 0-16h-16V56a16 16 0 0 0-16-16h-40V24a8 8 0 0 0-16 0v16h-32V24a8 8 0 0 0-16 0v16H56a16 16 0 0 0-16 16v40H24a8 8 0 0 0 0 16h16v32H24a8 8 0 0 0 0 16h16v40a16 16 0 0 0 16 16h40v16a8 8 0 0 0 16 0v-16h32v16a8 8 0 0 0 16 0v-16h40a16 16 0 0 0 16-16v-40h16a8 8 0 0 0 0-16m-32 56H56V56h144z\"/>","cube":"<path fill=\"currentColor\" d=\"m223.68 66.15l-88-48.15a15.88 15.88 0 0 0-15.36 0l-88 48.17a16 16 0 0 0-8.32 14v95.64a16 16 0 0 0 8.32 14l88 48.17a15.88 15.88 0 0 0 15.36 0l88-48.17a16 16 0 0 0 8.32-14V80.18a16 16 0 0 0-8.32-14.03M128 32l80.34 44L128 120L47.66 76ZM40 90l80 43.78v85.79l-80-43.75Zm96 129.57v-85.75L216 90v85.78Z\"/>","envelope-simple":"<path fill=\"currentColor\" d=\"M224 48H32a8 8 0 0 0-8 8v136a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V56a8 8 0 0 0-8-8m-20.57 16L128 133.15L52.57 64ZM216 192H40V74.19l82.59 75.71a8 8 0 0 0 10.82 0L216 74.19z\"/>","globe-hemisphere-east":"<path fill=\"currentColor\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 16a87.5 87.5 0 0 1 48 14.28V74l-22.17 25.74l-31.47 4.26l-.31-.22l-19.67-12.86a16 16 0 0 0-22.51 4.18l-20.94 31.3a16 16 0 0 0-2.7 8.81L56 171.44l-3.27 2.15A88 88 0 0 1 128 40M62.29 186.47l2.52-1.65A16 16 0 0 0 72 171.53l.21-36.23L93.17 104a4 4 0 0 0 .32.22l19.67 12.87a15.94 15.94 0 0 0 11.35 2.77l31.49-4.27a16 16 0 0 0 10-5.41l22.17-25.76A16 16 0 0 0 192 74v-6.33A87.87 87.87 0 0 1 211.77 155l-16.14-14.76a16 16 0 0 0-16.93-3l-30.46 12.65a16.08 16.08 0 0 0-9.68 12.45l-2.39 16.19a16 16 0 0 0 11.77 17.81L169.4 202l2.36 2.37a87.88 87.88 0 0 1-109.47-17.9M185 195l-4.3-4.31a16 16 0 0 0-7.26-4.18L152 180.85l2.39-16.19L184.84 152L205 170.48A88.4 88.4 0 0 1 185 195\"/>","graduation-cap":"<path fill=\"currentColor\" d=\"m251.76 88.94l-120-64a8 8 0 0 0-7.52 0l-120 64a8 8 0 0 0 0 14.12L32 117.87v48.42a15.9 15.9 0 0 0 4.06 10.65C49.16 191.53 78.51 216 128 216a130 130 0 0 0 48-8.76V240a8 8 0 0 0 16 0v-40.49a115.6 115.6 0 0 0 27.94-22.57a15.9 15.9 0 0 0 4.06-10.65v-48.42l27.76-14.81a8 8 0 0 0 0-14.12M128 200c-43.27 0-68.72-21.14-80-33.71V126.4l76.24 40.66a8 8 0 0 0 7.52 0L176 143.47v46.34c-12.6 5.88-28.48 10.19-48 10.19m80-33.75a97.8 97.8 0 0 1-16 14.25v-45.57l16-8.53Zm-20-47.31l-.22-.13l-56-29.87a8 8 0 0 0-7.52 14.12L171 128l-43 22.93L25 96l103-54.93L231 96Z\"/>","hourglass-medium-light":"<path fill=\"currentColor\" d=\"M198 75.64V40a14 14 0 0 0-14-14H72a14 14 0 0 0-14 14v36a14.06 14.06 0 0 0 5.6 11.2L118 128l-54.4 40.8A14.06 14.06 0 0 0 58 180v36a14 14 0 0 0 14 14h112a14 14 0 0 0 14-14v-35.64a14.08 14.08 0 0 0-5.56-11.17L138 128l54.49-41.19A14.08 14.08 0 0 0 198 75.64M70 40a2 2 0 0 1 2-2h112a2 2 0 0 1 2 2v35.64a2 2 0 0 1-.79 1.6L178.9 82H76.67l-5.87-4.4A2 2 0 0 1 70 76Zm58 80.49L92.67 94H163Zm58 59.87V216a2 2 0 0 1-2 2H72a2 2 0 0 1-2-2v-36a2 2 0 0 1 .8-1.6L122 140v28a6 6 0 0 0 12 0v-27.94l51.21 38.7a2 2 0 0 1 .79 1.6\"/>","lock-simple":"<path fill=\"currentColor\" d=\"M208 80h-32V56a48 48 0 0 0-96 0v24H48a16 16 0 0 0-16 16v112a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16M96 56a32 32 0 0 1 64 0v24H96Zm112 152H48V96h160z\"/>","map-pin":"<path fill=\"currentColor\" d=\"M128 64a40 40 0 1 0 40 40a40 40 0 0 0-40-40m0 64a24 24 0 1 1 24-24a24 24 0 0 1-24 24m0-112a88.1 88.1 0 0 0-88 88c0 31.4 14.51 64.68 42 96.25a254.2 254.2 0 0 0 41.45 38.3a8 8 0 0 0 9.18 0a254.2 254.2 0 0 0 41.37-38.3c27.45-31.57 42-64.85 42-96.25a88.1 88.1 0 0 0-88-88m0 206c-16.53-13-72-60.75-72-118a72 72 0 0 1 144 0c0 57.23-55.47 105-72 118\"/>","map-trifold":"<path fill=\"currentColor\" d=\"M228.92 49.69a8 8 0 0 0-6.86-1.45l-61.13 15.28l-61.35-30.68a8 8 0 0 0-5.52-.6l-64 16A8 8 0 0 0 24 56v144a8 8 0 0 0 9.94 7.76l61.13-15.28l61.35 30.68a8.15 8.15 0 0 0 3.58.84a8 8 0 0 0 1.94-.24l64-16A8 8 0 0 0 232 200V56a8 8 0 0 0-3.08-6.31M104 52.94l48 24v126.12l-48-24Zm-64 9.31l48-12v127.5l-48 12Zm176 131.5l-48 12V78.25l48-12Z\"/>","pencil-simple":"<path fill=\"currentColor\" d=\"m227.31 73.37l-44.68-44.69a16 16 0 0 0-22.63 0L36.69 152A15.86 15.86 0 0 0 32 163.31V208a16 16 0 0 0 16 16h44.69a15.86 15.86 0 0 0 11.31-4.69L227.31 96a16 16 0 0 0 0-22.63M92.69 208H48v-44.69l88-88L180.69 120ZM192 108.68L147.31 64l24-24L216 84.68Z\"/>","phone":"<path fill=\"currentColor\" d=\"m222.37 158.46l-47.11-21.11l-.13-.06a16 16 0 0 0-15.17 1.4a8 8 0 0 0-.75.56L134.87 160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16 16 0 0 0 1.32-15.06v-.12L97.54 33.64a16 16 0 0 0-16.62-9.52A56.26 56.26 0 0 0 32 80c0 79.4 64.6 144 144 144a56.26 56.26 0 0 0 55.88-48.92a16 16 0 0 0-9.51-16.62M176 208A128.14 128.14 0 0 1 48 80a40.2 40.2 0 0 1 34.87-40a.6.6 0 0 0 0 .12l21 47l-20.67 24.74a6 6 0 0 0-.57.77a16 16 0 0 0-1 15.7c9.06 18.53 27.73 37.06 46.46 46.11a16 16 0 0 0 15.75-1.14a8 8 0 0 0 .74-.56L168.89 152l47 21.05h.11A40.21 40.21 0 0 1 176 208\"/>","phone-call-light":"<path fill=\"currentColor\" d=\"M146.2 46.45a6 6 0 0 1 7.35-4.25a84.24 84.24 0 0 1 60.25 60.25a6 6 0 0 1-4.25 7.35a6 6 0 0 1-1.55.2a6 6 0 0 1-5.8-4.45a72.34 72.34 0 0 0-51.75-51.75a6 6 0 0 1-4.25-7.35m-3.75 39.35C157 89.68 166.32 99 170.2 113.55A6 6 0 0 0 176 118a6 6 0 0 0 1.55-.2a6 6 0 0 0 4.25-7.35c-5-18.71-17.54-31.25-36.25-36.25a6 6 0 1 0-3.1 11.6m79.44 97A54.25 54.25 0 0 1 168 230C89.7 230 26 166.3 26 88a54.25 54.25 0 0 1 47.17-53.89a14 14 0 0 1 14.56 8.39l21.1 47.1a14 14 0 0 1-1.12 13.28a6 6 0 0 1-.42.57l-21.07 25.06a1.89 1.89 0 0 0 0 1.67c7.66 15.68 24.1 32 40 39.65a1.88 1.88 0 0 0 1.68-.06l24.69-21a5 5 0 0 1 .56-.42a14 14 0 0 1 13.28-1.22l47.24 21.17a14 14 0 0 1 8.22 14.53ZM210 181.32a2 2 0 0 0-1.21-2l-47.25-21.17a1.92 1.92 0 0 0-1.6.1l-24.68 21c-.18.15-.37.29-.56.42a14 14 0 0 1-13.77 1c-18.36-8.87-36.66-27-45.53-45.19a14 14 0 0 1 .91-13.73a5 5 0 0 1 .43-.57l21.05-25.09a2 2 0 0 0 0-1.67L76.74 47.31A2 2 0 0 0 74.9 46h-.23A42.24 42.24 0 0 0 38 88c0 71.68 58.32 130 130 130a42.24 42.24 0 0 0 42-36.68\"/>","robot":"<path fill=\"currentColor\" d=\"M200 48h-64V16a8 8 0 0 0-16 0v32H56a32 32 0 0 0-32 32v112a32 32 0 0 0 32 32h144a32 32 0 0 0 32-32V80a32 32 0 0 0-32-32m16 144a16 16 0 0 1-16 16H56a16 16 0 0 1-16-16V80a16 16 0 0 1 16-16h144a16 16 0 0 1 16 16Zm-52-56H92a28 28 0 0 0 0 56h72a28 28 0 0 0 0-56m-24 16v24h-24v-24Zm-60 12a12 12 0 0 1 12-12h8v24h-8a12 12 0 0 1-12-12m84 12h-8v-24h8a12 12 0 0 1 0 24m-92-68a12 12 0 1 1 12 12a12 12 0 0 1-12-12m88 0a12 12 0 1 1 12 12a12 12 0 0 1-12-12\"/>","rocket-launch":"<path fill=\"currentColor\" d=\"M223.85 47.12a16 16 0 0 0-15-15c-12.58-.75-44.73.4-71.41 27.07L132.69 64H74.36A15.9 15.9 0 0 0 63 68.68L28.7 103a16 16 0 0 0 9.07 27.16l38.47 5.37l44.21 44.21l5.37 38.49a15.94 15.94 0 0 0 10.78 12.92a16.1 16.1 0 0 0 5.1.83a15.9 15.9 0 0 0 11.3-4.68l34.32-34.3a15.9 15.9 0 0 0 4.68-11.36v-58.33l4.77-4.77c26.68-26.68 27.83-58.83 27.08-71.42M74.36 80h42.33l-39.53 39.52L40 114.34Zm74.41-9.45a76.65 76.65 0 0 1 59.11-22.47a76.46 76.46 0 0 1-22.42 59.16L128 164.68L91.32 128ZM176 181.64L141.67 216l-5.19-37.17L176 139.31Zm-74.16 9.5C97.34 201 82.29 224 40 224a8 8 0 0 1-8-8c0-42.29 23-57.34 32.86-61.85a8 8 0 0 1 6.64 14.56c-6.43 2.93-20.62 12.36-23.12 38.91c26.55-2.5 36-16.69 38.91-23.12a8 8 0 1 1 14.56 6.64Z\"/>","shield-check":"<path fill=\"currentColor\" d=\"M208 40H48a16 16 0 0 0-16 16v56c0 52.72 25.52 84.67 46.93 102.19c23.06 18.86 46 25.26 47 25.53a8 8 0 0 0 4.2 0c1-.27 23.91-6.67 47-25.53C198.48 196.67 224 164.72 224 112V56a16 16 0 0 0-16-16m0 72c0 37.07-13.66 67.16-40.6 89.42a129.3 129.3 0 0 1-39.4 22.2a128.3 128.3 0 0 1-38.92-21.81C61.82 179.51 48 149.3 48 112V56h160ZM82.34 141.66a8 8 0 0 1 11.32-11.32L112 148.69l50.34-50.35a8 8 0 0 1 11.32 11.32l-56 56a8 8 0 0 1-11.32 0Z\"/>","signpost":"<path fill=\"currentColor\" d=\"M246 106.65L212.33 69.3a16 16 0 0 0-11.89-5.3H136V32a8 8 0 0 0-16 0v32H40a16 16 0 0 0-16 16v64a16 16 0 0 0 16 16h80v64a8 8 0 0 0 16 0v-64h64.44a16 16 0 0 0 11.89-5.3L246 117.35a8 8 0 0 0 0-10.7M200.44 144H40V80h160.44l28.8 32Z\"/>","solar-panel":"<path fill=\"currentColor\" d=\"M32 104a8 8 0 0 1 8-8h16a8 8 0 0 1 0 16H40a8 8 0 0 1-8-8m39.43-45.25a8 8 0 0 0 11.32-11.32L71.43 36.12a8 8 0 0 0-11.31 11.31ZM128 40a8 8 0 0 0 8-8V16a8 8 0 0 0-16 0v16a8 8 0 0 0 8 8m50.91 21.09a8 8 0 0 0 5.66-2.34l11.31-11.32a8 8 0 0 0-11.31-11.31l-11.32 11.31a8 8 0 0 0 5.66 13.66M192 104a8 8 0 0 0 8 8h16a8 8 0 0 0 0-16h-16a8 8 0 0 0-8 8m-104 8a8 8 0 0 0 8-8a32 32 0 0 1 64 0a8 8 0 0 0 16 0a48 48 0 0 0-96 0a8 8 0 0 0 8 8m150.91 108a8 8 0 0 1-6.91 4H24a8 8 0 0 1-7-11.94l40.69-72a8 8 0 0 1 7-4.06H191.3a8 8 0 0 1 7 4.06l40.69 72a8 8 0 0 1-.08 7.94m-52.27-68h-24.37l3.48 16h29.93Zm-37.26 16l-3.48-16h-35.8l-3.48 16Zm-46.24 16l-5.21 24h60.14l-5.21-24Zm-42.82-16h29.93l3.48-16H69.36Zm-22.61 40h43.84l5.22-24H51.28Zm180.58 0l-13.57-24h-35.49l5.22 24Z\"/>","user":"<path fill=\"currentColor\" d=\"M230.92 212c-15.23-26.33-38.7-45.21-66.09-54.16a72 72 0 1 0-73.66 0c-27.39 8.94-50.86 27.82-66.09 54.16a8 8 0 1 0 13.85 8c18.84-32.56 52.14-52 89.07-52s70.23 19.44 89.07 52a8 8 0 1 0 13.85-8M72 96a56 56 0 1 1 56 56a56.06 56.06 0 0 1-56-56\"/>","whatsapp-logo":"<path fill=\"currentColor\" d=\"m187.58 144.84l-32-16a8 8 0 0 0-8 .5l-14.69 9.8a40.55 40.55 0 0 1-16-16l9.8-14.69a8 8 0 0 0 .5-8l-16-32A8 8 0 0 0 104 64a40 40 0 0 0-40 40a88.1 88.1 0 0 0 88 88a40 40 0 0 0 40-40a8 8 0 0 0-4.42-7.16M152 176a72.08 72.08 0 0 1-72-72a24 24 0 0 1 19.29-23.54l11.48 23L101 118a8 8 0 0 0-.73 7.51a56.47 56.47 0 0 0 30.15 30.15A8 8 0 0 0 138 155l14.61-9.74l23 11.48A24 24 0 0 1 152 176M128 24a104 104 0 0 0-91.82 152.88l-11.35 34.05a16 16 0 0 0 20.24 20.24l34.05-11.35A104 104 0 1 0 128 24m0 192a87.87 87.87 0 0 1-44.06-11.81a8 8 0 0 0-6.54-.67L40 216l12.47-37.4a8 8 0 0 0-.66-6.54A88 88 0 1 1 128 216\"/>","wrench":"<path fill=\"currentColor\" d=\"M226.76 69a8 8 0 0 0-12.84-2.88l-40.3 37.19l-17.23-3.7l-3.7-17.23l37.19-40.3A8 8 0 0 0 187 29.24A72 72 0 0 0 88 96a72.3 72.3 0 0 0 6 28.94L33.79 177c-.15.12-.29.26-.43.39a32 32 0 0 0 45.26 45.26c.13-.13.27-.28.39-.42L131.06 162A72 72 0 0 0 232 96a71.6 71.6 0 0 0-5.24-27M160 152a56.14 56.14 0 0 1-27.07-7a8 8 0 0 0-9.92 1.77l-55.9 64.74a16 16 0 0 1-22.62-22.62L109.18 133a8 8 0 0 0 1.77-9.93a56 56 0 0 1 58.36-82.31l-31.2 33.81a8 8 0 0 0-1.94 7.1l5.66 26.33a8 8 0 0 0 6.14 6.14l26.35 5.66a8 8 0 0 0 7.1-1.94l33.81-31.2A56.06 56.06 0 0 1 160 152\"/>","x":"<path fill=\"currentColor\" d=\"M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 0 1-11.32-11.32L116.69 128L50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128Z\"/>"};

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
      { v: 'Élève, je prépare mes études', icon: 'backpack' },
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
      { v: 'Hors de la RDC', icon: 'globe-hemisphere-east', sub: 'Tout se fait en ligne' }
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
    title: 'Où vous envoyer la confirmation ?',
    bg: 'images/bg-contact.jpg', floats: ['images/fl-01.jpg', 'images/fl-03.jpg']
  },
  {
    id: 'creneau', type: 'slots', kicker: 'Créneau',
    title: 'Choisissez le moment de votre échange.',
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
        <label class="field"><input name="autre" maxlength="160" autocomplete="off" placeholder=" " aria-describedby="err-autre-${++errId}"><span class="lbl">${typo(label)}</span></label>
        <p class="err" data-err="autre" id="err-autre-${errId}" aria-live="polite"></p>
        <button class="btn primary" type="submit">${typo(cta)} ${icon('arrow-right')}</button>
      </form>`;
}

function countryOptions() {
  const opt = (c) => `<option value="${c.cc}">${flag(c.cc)} ${esc(c.name)} (${c.dial})</option>`;
  return `<optgroup label="Les plus fréquents">${TOP_CC.map((cc) => opt(BY_CC[cc])).join('')}</optgroup>` +
    `<optgroup label="Tous les pays">${COUNTRIES.map(opt).join('')}</optgroup>`;
}
function setPrefix(sel) {
  const c = BY_CC[sel.value] || BY_CC.CD;
  $('.prefix-val', sel.parentNode).textContent = `${flag(c.cc)} ${c.dial}`;
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
        ${opts.map((o, k) => `<li><button type="button" role="radio" aria-checked="false" class="opt${o.icon ? '' : ' no-icon'}" data-v="${esc(o.v)}" data-k="${k + 1}"${o.other ? ' data-other' : ''}>
          ${o.icon ? `<span class="ico">${icon(o.icon)}</span>` : ''}
          <span class="lab"><strong>${typo(o.v)}</strong>${o.sub ? `<small>${typo(o.sub)}</small>` : ''}</span>
          <span class="tick">${TICK}</span></button></li>`).join('')}
      </ul>
      ${otherForm(q.other, 'Continuer')}
      <p class="hint mono">Touche <kbd>1</kbd> à <kbd>${opts.length}</kbd> pour répondre</p>`;
  } else if (q.type === 'contact') {
    body = `
      <form class="fields" novalidate>
        <label class="field"><input name="nom" autocomplete="name" placeholder=" " required aria-describedby="err-nom"><span class="lbl">Nom et prénom</span></label>
        <p class="err" data-err="nom" id="err-nom" aria-live="polite"></p>
        <div class="field has-prefix"><span class="prefix"><span class="prefix-val" aria-hidden="true">${flag('CD')} +243</span>${icon('caret-down')}<select name="indicatif" aria-label="Pays de votre numéro">${countryOptions()}</select></span><input name="whatsapp" type="tel" inputmode="tel" autocomplete="tel-national" placeholder=" " required aria-label="Numéro WhatsApp" aria-describedby="err-whatsapp"><span class="lbl">Numéro WhatsApp</span></div>
        <p class="err" data-err="whatsapp" id="err-whatsapp" aria-live="polite"></p>
        <label class="field"><input name="email" type="email" inputmode="email" autocomplete="email" placeholder=" " aria-describedby="err-email"><span class="lbl">E-mail (facultatif)</span></label>
        <p class="err" data-err="email" id="err-email" aria-live="polite"></p>
        <div class="minor" data-minor hidden>${icon('user')}<span>${typo('Si vous avez moins de 18 ans, un parent devra donner son accord avant tout paiement.')}</span></div>
        <div class="actions"><button class="btn primary" type="submit">Choisir mon créneau ${icon('arrow-right')}</button></div>
        <p class="legal">${typo('En continuant, vous acceptez que NUBIAA vous écrive sur WhatsApp au sujet de votre demande. Vos réponses ne sont ni vendues ni partagées.')}</p>
      </form>`;
  } else if (q.type === 'slots') {
    body = `
      <div class="days" role="radiogroup" aria-label="Jour">
        ${nextDays(CONFIG.days).map((d) => `<button type="button" role="radio" aria-checked="false" class="day" data-day="${d.iso}" aria-label="${esc(d.long)}"><small>${d.wd}</small><strong>${d.n}</strong><small>${d.mo}</small></button>`).join('')}
      </div>
      <div class="times" role="radiogroup" aria-label="Heure">
        ${CONFIG.hours.map((h) => `<button type="button" role="radio" aria-checked="false" class="time" data-time="${h}">${h.replace(':', ' h ')}</button>`).join('')}
      </div>
      <p class="tz">${typo('Heure de Kinshasa (UTC+1). 20 minutes avec Stella, par appel WhatsApp.')}</p>
      <div class="actions"><button class="btn primary" data-act="book" type="button" disabled>Confirmer le rendez-vous</button></div>
      <button class="link-btn" data-act="slot-other" type="button">${icon('calendar-blank')} Aucun de ces créneaux ne me convient</button>
      ${pickerHTML()}`;
  }
  const note = q.type === 'contact' ? 'Stella vous écrit sur WhatsApp. L’e-mail sert à recevoir l’invitation.' : q.note;
  return `
    <div class="pin">
      <div class="bg"><img src="${q.bg}" alt="" loading="lazy"></div>
      <div class="veil"></div>
      <p class="num" aria-hidden="true">0<b>${i + 1}</b></p>
      <div class="floats" aria-hidden="true">${q.floats.map((f) => `<figure><img src="${f}" alt="" loading="lazy"></figure>`).join('')}</div>
      <div class="panel">
        <p class="kicker">${typo(q.kicker)} <b>${n} / ${String(N).padStart(2, '0')}</b></p>
        <h2 class="title" data-title id="t-${q.id}">${words(title)}</h2>
        ${note ? `<p class="note">${typo(note)}</p>` : ''}
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
  if (i > 0) el.hidden = true;
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
    for (let k = 0; k <= i; k++) scenes[k].el.hidden = false;
    reached = Math.max(reached, i);
    refresh(i);
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
  if (s.q.type === 'contact') {
    const inRdc = ['À Kinshasa', 'Ailleurs en RDC'].includes(answers.lieu);
    const ind = $('[name="indicatif"]', s.el);
    // tant que la personne n'a pas choisi elle-même : la RDC si elle y vit,
    // sinon le pays de son navigateur (fr-BE → Belgique), s'il est connu
    if (!ind.dataset.touched) {
      const guess = (navigator.languages || [navigator.language || '']).map((l) => (l.split('-')[1] || '').toUpperCase()).find((cc) => BY_CC[cc]);
      ind.value = inRdc || !guess ? 'CD' : guess;
      setPrefix(ind);
    }
    $('[data-minor]', s.el).hidden = answers.profil !== 'Élève, je prépare mes études';
  }
}

function focusScene(i) {
  const root = i >= N ? done : scenes[i].el;
  const f = $('[aria-checked="true"], .opt, input:not([readonly]):not([name="indicatif"]), .day, .btn', root);
  if (f) f.focus({ preventScroll: true });
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

function showOther(sceneEl, on) {
  const f = $('[data-other-form]', sceneEl);
  if (!f) return;
  f.hidden = !on;
  if (on) requestAnimationFrame(() => f.autre.focus({ preventScroll: true }));
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

/* ─── Le calendrier (« Aucun de ces créneaux ne me convient ») ─── */
const cal = { view: null, iso: '', time: '' };
function showPicker(sceneEl, on) {
  const pk = $('[data-picker]', sceneEl), panel = $('.panel', sceneEl);
  pk.hidden = !on;
  panel.classList.toggle('picking', on);
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
  sfx(opt.hasAttribute('data-other') ? 'tick' : 'select');
  if (opt.hasAttribute('data-other')) {
    // « Autre » : on attend que la personne écrive, rien ne part tout seul
    delete answers[s.q.id];
    updateProgress();
    showOther(s.el, true);
    return;
  }
  showOther(s.el, false);
  answers[s.q.id] = opt.dataset.v;
  if (navigator.vibrate && navigator.userActivation && navigator.userActivation.isActive) navigator.vibrate(8);
  // les questions déjà ouvertes qui en dépendent se mettent à jour
  scenes.forEach((x, k) => { if (k > i && !x.el.hidden) refresh(k); });
  updateProgress();
  clearTimeout(advanceTimer);
  // un temps pour voir la coche se poser, puis la scène suivante
  advanceTimer = setTimeout(() => open(i + 1), reduced ? 100 : 380);
}

/* ─── Réponse libre (« Autre ») ─── */
flow.addEventListener('submit', (e) => {
  if (!e.target.matches('[data-other-form]')) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const f = e.target, v = f.autre.value.trim();
  const sceneEl = f.closest('.scene.q'), i = +sceneEl.dataset.i, q = QUESTIONS[i];
  $('[data-err="autre"]', f).textContent = v.length < 2 ? 'Écrivez quelques mots.' : '';
  f.autre.closest('.field').classList.toggle('invalid', v.length < 2);
  f.autre.setAttribute('aria-invalid', String(v.length < 2));
  if (v.length < 2) { sfx('error'); f.autre.focus({ preventScroll: true }); return; }
  sfx('select');
  answers[q.id] = `Autre : ${v}`;
  scenes.forEach((x, k) => { if (k > i && !x.el.hidden) refresh(k); });
  updateProgress();
  open(i + 1);
});

/* ─── Coordonnées ─── */
flow.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target;
  const nom = f.nom.value.trim();
  const tel = f.whatsapp.value.replace(/[^\d]/g, '');
  const pays = BY_CC[f.indicatif.value] || BY_CC.CD, ind = pays.dial;
  const mail = f.email.value.trim();
  const errs = {
    nom: nom.length < 2 ? 'Indiquez votre nom et votre prénom.' : '',
    whatsapp: tel.length < 6 ? 'Ce numéro paraît incomplet.' : '',
    email: mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail) ? 'Cette adresse e-mail paraît incomplète.' : ''
  };
  Object.entries(errs).forEach(([k, v]) => {
    $(`[data-err="${k}"]`, f).textContent = v;
    f[k].closest('.field').classList.toggle('invalid', !!v);
    f[k].setAttribute('aria-invalid', String(!!v));
  });
  const bad = Object.keys(errs).find((k) => errs[k]);
  if (bad) { sfx('error'); f[bad].focus({ preventScroll: true }); return; }
  sfx('select');
  // le 0 du format national tombe devant l'indicatif (081… → +243 81…), sauf en Italie et alentour
  const num = ['IT', 'SM', 'VA'].includes(pays.cc) ? tel : tel.replace(/^0+/, '');
  Object.assign(answers, { nom, whatsapp: `${ind} ${num}`, pays: pays.name, email: mail });
  const i = QUESTIONS.findIndex((q) => q.type === 'contact');
  updateProgress();
  open(i + 1);
});
flow.addEventListener('change', (e) => {
  if (e.target.name !== 'indicatif') return;
  e.target.dataset.touched = '1';
  setPrefix(e.target);
  sfx('tick');
});
flow.addEventListener('input', (e) => {
  const field = e.target.closest('.field');
  if (field && field.classList.contains('invalid')) {
    field.classList.remove('invalid');
    e.target.removeAttribute('aria-invalid');
    const err = $(`[data-err="${e.target.name}"]`, field.closest('form'));
    if (err) err.textContent = '';
  }
});

/* ─── Fin ─── */
function renderDone() {
  const prenom = (answers.nom || '').trim().split(/\s+/)[0] || '';
  const d = answers.slot;
  const wa = CONFIG.whatsapp
    ? `<a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(waText())}">${icon('whatsapp-logo')} Écrire à Stella</a>` : '';
  $('#donePanel').innerHTML = `
    <div class="done-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
    <p class="kicker">Inscription reçue</p>
    <h2 class="title">${typo(prenom ? `C’est noté, ${prenom}.` : 'C’est noté.')}</h2>
    <div class="when">${d && d.custom
      ? `<strong>${typo('Vous avez proposé : ' + d.label)}</strong><span>${typo('Stella vous confirme le créneau sur WhatsApp. Échange découverte · 20 min · gratuit')}</span>`
      : `<strong>${typo(d ? d.label : '')}</strong><span>${typo('Échange découverte · 20 min · gratuit · par appel WhatsApp')}</span>`}</div>
    <ol class="next">
      <li class="ok"><i>✓</i><span><b>Questionnaire envoyé.</b> ${typo('Stella le lit avant votre appel.')}</span></li>
      <li><i>2</i><span><b>L’échange découverte.</b> ${typo('Un rappel vous arrive sur WhatsApp la veille.')}</span></li>
      <li><i>3</i><span><b>La liste d’attente.</b> ${typo('Dès que votre domaine ouvre, vous recevez le lien pour verser l’acompte.')}</span></li>
      <li><i>4</i><span><b>La première séance.</b> ${typo('En janvier 2027, avec votre mentor et votre groupe.')}</span></li>
    </ol>
    <p class="recap">${['domaine', 'profil', 'lieu', 'objectif', 'budget'].filter((k) => answers[k]).map((k) => `<b>${typo(answers[k])}</b>`).join(' · ')}</p>
    <div class="actions">
      ${d && !d.custom ? `<button class="btn primary" data-act="ics" type="button">${icon('calendar-blank')} Ajouter à mon agenda</button>` : ''}
      ${wa}
      <button class="btn ghost" data-act="edit" type="button">Revoir mes réponses</button>
      <a class="btn ghost" href="presentation.html">Découvrir le programme</a>
    </div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => done.classList.add('drawn')));
}

function waText() {
  return `Bonjour Stella, c'est ${answers.nom || ''}. Je viens de réserver l'échange découverte (${answers.slot ? answers.slot.label : ''}). Domaine : ${answers.domaine || ''}.`;
}
function submit() {
  const payload = { ...answers, slot: answers.slot && answers.slot.label, envoye_le: new Date().toISOString(), source: 'site-questionnaire' };
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

$('#startBtn').addEventListener('click', () => { sfx('whoosh'); glideTo(docTop(scenes[0].el) + innerHeight * 0.06, () => focusScene(0)); });
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
const count = $('#count');
let ticking = false, last = 0, introAt = 0;

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
  render(now);
  const introRunning = now - introAt < 1600;
  if (glide || introRunning) requestAnimationFrame(frame); else ticking = false;
}

function render(now) {
  const vh = innerHeight, vw = innerWidth;
  if (reduced) { renderStatic(); return; }

  /* ── ouverture ── */
  const hr = hero.getBoundingClientRect();
  if (hr.bottom > 0) {
    const hp = clamp(-hr.top / (hr.height - vh), 0, 1);
    // 1 · le trou s'ouvre entre les mots, l'image y naît
    const born = easeOut(seg(hp, 0, 0.1));
    hole.style.width = (born * (vw < 600 ? 1.5 : 2.4)).toFixed(3) + 'em';
    // 2 · la première ligne s'efface, la seconde monte seule au centre
    const l1 = seg(hp, 0.06, 0.15);
    heroL1.style.opacity = (1 - l1).toFixed(3);
    heroKicker.style.opacity = (1 - l1).toFixed(3);
    heroL1.style.transform = `translateY(${(-l1 * 40).toFixed(1)}px)`;
    // 3 · l'image prend tout l'écran, les mots s'écartent
    const g = easeInOut(seg(hp, 0.14, 0.5));
    const r = hole.getBoundingClientRect();
    const rad = (1 - g) * 10;
    full.style.clipPath = born > 0.01
      ? `inset(${(r.top * (1 - g)).toFixed(1)}px ${((vw - r.right) * (1 - g)).toFixed(1)}px ${((vh - r.bottom) * (1 - g)).toFixed(1)}px ${(r.left * (1 - g)).toFixed(1)}px round ${rad.toFixed(1)}px)`
      : 'inset(50% 50% 50% 50%)';
    fullImg.style.transform = `scale(${(1.35 - 0.3 * g + 0.06 * seg(hp, 0.5, 1)).toFixed(4)})`;
    heroA.style.transform = `translateX(${(-g * vw * 0.42).toFixed(1)}px)`;
    heroB.style.transform = `translateX(${(g * vw * 0.42).toFixed(1)}px)`;
    heroA.style.opacity = heroB.style.opacity = (1 - seg(hp, 0.3, 0.46)).toFixed(3);
    // le nuage s'ouvre vers les bords, chaque visuel à sa profondeur
    cloud.forEach((f) => {
      const d = +f.dataset.d;
      const x = parseFloat(f.style.getPropertyValue('--x')) / 100 - 0.5;
      const y = parseFloat(f.style.getPropertyValue('--y')) / 100 - 0.5;
      const k = easeOut(seg(hp, 0, 0.45));
      const shown = introAt ? easeOut(clamp((now - introAt - d * 260) / 900, 0, 1)) : 0;
      f.style.opacity = (shown * (1 - seg(hp, 0.32, 0.5))).toFixed(3);
      f.style.transform = `translate3d(${(x * k * vw * 0.5 * d).toFixed(1)}px, ${(y * k * vh * 0.6 * d - hp * vh * 0.3 * d + (1 - shown) * 40).toFixed(1)}px, 0) scale(${(0.85 + 0.15 * shown + k * 0.25 * d).toFixed(3)})`;
    });
    // les dunes s'enfoncent, chacune à sa vitesse ; le soleil monte
    duneFar.style.transform = `translate3d(0, ${(hp * vh * 0.18).toFixed(1)}px, 0)`;
    duneMid.style.transform = `translate3d(0, ${(hp * vh * 0.34).toFixed(1)}px, 0)`;
    duneNear.style.transform = `translate3d(0, ${(hp * vh * 0.6).toFixed(1)}px, 0)`;
    sun.style.transform = `translate3d(0, ${(-hp * vh * 0.4).toFixed(1)}px, 0)`;
    // 4 · sur l'image, l'annonce du questionnaire
    const io = easeOut(seg(hp, 0.5, 0.64));
    fullVeil.style.opacity = io.toFixed(3);
    intro.style.opacity = io.toFixed(3);
    intro.style.transform = `translateY(${((1 - io) * 40 - seg(hp, 0.85, 1) * 60).toFixed(1)}px)`;
    intro.style.pointerEvents = io > 0.6 ? 'auto' : 'none';
    cue.style.opacity = (1 - seg(hp, 0, 0.05)).toFixed(3);
    // les sons de l'ouverture, chacun sur son mouvement
    soundCue('o-born', hp, [0.012], 'rise');     // l'image naît entre les mots
    soundCue('o-cloud', hp, [0.05], 'drift');    // le nuage s'ouvre vers les bords
    soundCue('o-zoom', hp, [0.15], 'zoom');      // l'image prend tout l'écran
    soundCue('o-intro', hp, [0.53], 'glass');    // l'annonce apparaît sur l'image
  }

  /* ── questions ── */
  let current = -1;
  scenes.forEach((s, i) => {
    if (s.el.hidden) return;
    const r = s.el.getBoundingClientRect();
    if (r.top > vh * 0.5 && r.top - vh * 0.5 < vh * 0.5) { /* scène qui arrive */ }
    if (r.top <= vh * 0.5 && r.bottom >= vh * 0.5) current = i;
    if (r.bottom < -40 || r.top > vh + 40) return;
    const pe = clamp(1 - r.top / vh, 0, 1);                 // entrée : 0 → 1 quand la scène arrive en haut
    const pp = clamp(-r.top / (r.height - vh), 0, 1);       // épinglée : 0 → 1
    const nextOpen = i < N - 1 ? !scenes[i + 1].el.hidden : finished;
    // les sons de la scène : visuels, panneau, titre mot à mot, réponses une à une, sortie
    soundCue(`s${i}-floats`, pe, [0.25], 'drift');
    soundCue(`s${i}-panel`, pe, [0.34], 'glass');
    soundCue(`s${i}-words`, pe, s.words.map((_, k) => 0.5 + k * 0.025), 'word');
    soundCue(`s${i}-items`, pe, s.items.map((_, k) => 0.6 + (k / Math.max(s.items.length, 1)) * 0.27), 'type');
    if (nextOpen) soundCue(`s${i}-out`, pp, [0.74], 'split');
    const out = nextOpen ? easeInOut(seg(pp, 0.72, 1)) : 0;  // sortie seulement si la suite existe

    // le fond traîne derrière la scène (parallaxe), puis respire
    s.bg.style.transform = `translate3d(0, ${(-(1 - pe) * vh * 0.42 + pp * vh * 0.06).toFixed(1)}px, 0) scale(${(1.16 - 0.12 * easeOut(pe) + 0.05 * out).toFixed(4)})`;
    // le numéro va plus lentement que tout le reste
    s.num.style.setProperty('--ny', `${(-(1 - pe) * vh * 0.25 - pp * vh * 0.22).toFixed(1)}px`);
    s.num.style.setProperty('--no', (easeOut(seg(pe, 0.3, 0.9)) * (1 - out)).toFixed(3));
    // les visuels flottants passent devant, plus vite
    s.floats.forEach((f, k) => {
      const d = k ? 1.35 : 0.9;
      f.style.transform = `translate3d(0, ${((1 - pe) * vh * 0.55 * d - pp * vh * 0.5 * d).toFixed(1)}px, 0) rotate(${((k ? -1 : 1) * (1 - pe) * 6).toFixed(2)}deg)`;
      f.style.opacity = (seg(pe, 0.2, 0.7) * (1 - out)).toFixed(3);
    });
    // le panneau, puis le titre mot par mot, puis les réponses une à une
    const pk = easeOut(seg(pe, 0.3, 0.85));
    s.panel.style.setProperty('--py', `${((1 - pk) * 90 - out * 70).toFixed(1)}px`);
    s.panel.style.setProperty('--po', (pk * (1 - out)).toFixed(3));
    s.panel.style.pointerEvents = pk > 0.6 && out < 0.5 ? 'auto' : 'none';
    s.words.forEach((w, k) => {
      const kw = easeOut(seg(pe, 0.42 + k * 0.025, 0.72 + k * 0.025));
      w.style.opacity = kw.toFixed(3);
      w.style.transform = `translateY(${((1 - kw) * 0.5).toFixed(3)}em)`;
    });
    const n = s.items.length;
    s.items.forEach((it, k) => {
      const a = 0.58 + (k / Math.max(n, 1)) * 0.27;
      const ki = easeOut(seg(pe, a, a + 0.15));
      it.style.opacity = ki.toFixed(3);
      it.style.transform = `translate3d(0, ${((1 - ki) * 26).toFixed(1)}px, 0)`;
    });
  });

  /* ── fin ── */
  if (!done.hidden) {
    const r = done.getBoundingClientRect();
    const pe = clamp(1 - r.top / vh, 0, 1);
    $('.bg', done).style.transform = `translate3d(0, ${(-(1 - pe) * vh * 0.42).toFixed(1)}px, 0) scale(${(1.16 - 0.12 * easeOut(pe)).toFixed(4)})`;
    soundCue('fin-panel', pe, [0.36], 'glass');
    const p = $('#donePanel'), pk = easeOut(seg(pe, 0.35, 0.9));
    p.style.setProperty('--py', `${((1 - pk) * 80).toFixed(1)}px`);
    p.style.setProperty('--po', pk.toFixed(3));
    if (r.top < vh * 0.5) current = N;
  }
  if (!outro.hidden) {
    const r = outro.getBoundingClientRect();
    const k = easeOut(clamp(1 - r.top / vh, 0, 1));
    soundCue('logo', 1 - r.top / vh, [0.35], 'reveal'); // le logo monte
    const o = $('.outro-in', outro);
    o.style.opacity = k.toFixed(3);
    o.style.transform = `translate3d(0, ${((1 - k) * vh * 0.25).toFixed(1)}px, 0) scale(${(0.92 + 0.08 * k).toFixed(4)})`;
  }

  /* ── barre ── */
  count.innerHTML = current < 0 ? '' : current >= N ? 'Terminé' : `Question <b>${current + 1}</b> / ${N}`;
}

function renderStatic() {
  let current = -1;
  scenes.forEach((s, i) => { if (!s.el.hidden) { const r = s.el.getBoundingClientRect(); if (r.top <= innerHeight * 0.5 && r.bottom >= innerHeight * 0.5) current = i; } });
  if (!done.hidden && done.getBoundingClientRect().top < innerHeight * 0.5) current = N;
  count.innerHTML = current < 0 ? '' : current >= N ? 'Terminé' : `Question <b>${current + 1}</b> / ${N}`;
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
  requestAnimationFrame(() => { scrollTo(0, y); render(performance.now()); });
}
