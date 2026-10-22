/* ═══════════════════════════════════════════════════════════
   NUBIAA Academia — ajouts à la page programme
   Chargé APRÈS app.js, sans le modifier : on lit la position
   réelle des éléments que le moteur déplace, et on pose nos
   propres calques par-dessus.
   · la devise : chaque mot devant son image, coupée en deux
     moitiés qui s'écartent et se rejoignent comme les lettres ;
   · les étapes : une icône par étape ;
   · la fin : le logo en grand, révélé en rideau.
   Source : `python build_presentation.py` y injecte les icônes.
   ═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const ICONS = {"arrow-left": "<path fill=\"currentColor\" d=\"M224 128a8 8 0 0 1-8 8H59.31l58.35 58.34a8 8 0 0 1-11.32 11.32l-72-72a8 8 0 0 1 0-11.32l72-72a8 8 0 0 1 11.32 11.32L59.31 120H216a8 8 0 0 1 8 8\"/>", "arrow-right": "<path fill=\"currentColor\" d=\"m221.66 133.66l-72 72a8 8 0 0 1-11.32-11.32L196.69 136H40a8 8 0 0 1 0-16h156.69l-58.35-58.34a8 8 0 0 1 11.32-11.32l72 72a8 8 0 0 1 0 11.32\"/>", "arrows-clockwise": "<path fill=\"currentColor\" d=\"M224 48v48a8 8 0 0 1-8 8h-48a8 8 0 0 1 0-16h28.69l-14.63-14.63a79.56 79.56 0 0 0-56.13-23.43h-.45a79.52 79.52 0 0 0-55.89 22.77a8 8 0 0 1-11.18-11.44a96 96 0 0 1 135 .79L208 76.69V48a8 8 0 0 1 16 0m-37.59 135.29a80 80 0 0 1-112.47-.66L59.31 168H88a8 8 0 0 0 0-16H40a8 8 0 0 0-8 8v48a8 8 0 0 0 16 0v-28.69l14.63 14.63A95.43 95.43 0 0 0 130 222.06h.53a95.36 95.36 0 0 0 67.07-27.33a8 8 0 0 0-11.18-11.44Z\"/>", "backpack": "<path fill=\"currentColor\" d=\"M168 40.58V32a24 24 0 0 0-24-24h-32a24 24 0 0 0-24 24v8.58A56.09 56.09 0 0 0 40 96v120a16 16 0 0 0 16 16h144a16 16 0 0 0 16-16V96a56.09 56.09 0 0 0-48-55.42M112 24h32a8 8 0 0 1 8 8v8h-48v-8a8 8 0 0 1 8-8m56 136H88v-8a8 8 0 0 1 8-8h64a8 8 0 0 1 8 8Zm-80 16h48v8a8 8 0 0 0 16 0v-8h16v40H88Zm112 40h-16v-64a24 24 0 0 0-24-24H96a24 24 0 0 0-24 24v64H56V96a40 40 0 0 1 40-40h64a40 40 0 0 1 40 40zM152 88a8 8 0 0 1-8 8h-32a8 8 0 0 1 0-16h32a8 8 0 0 1 8 8\"/>", "briefcase": "<path fill=\"currentColor\" d=\"M216 56h-40v-8a24 24 0 0 0-24-24h-48a24 24 0 0 0-24 24v8H40a16 16 0 0 0-16 16v128a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V72a16 16 0 0 0-16-16M96 48a8 8 0 0 1 8-8h48a8 8 0 0 1 8 8v8H96Zm120 24v41.61A184 184 0 0 1 128 136a184.1 184.1 0 0 1-88-22.38V72Zm0 128H40v-68.36A200.2 200.2 0 0 0 128 152a200.25 200.25 0 0 0 88-20.37zm-112-88a8 8 0 0 1 8-8h32a8 8 0 0 1 0 16h-32a8 8 0 0 1-8-8\"/>", "broadcast": "<path fill=\"currentColor\" d=\"M128 88a40 40 0 1 0 40 40a40 40 0 0 0-40-40m0 64a24 24 0 1 1 24-24a24 24 0 0 1-24 24m73.71 7.14a80 80 0 0 1-14.08 22.2a8 8 0 0 1-11.92-10.67a63.95 63.95 0 0 0 0-85.33a8 8 0 1 1 11.92-10.67a80.08 80.08 0 0 1 14.08 84.47M69 103.09a64 64 0 0 0 11.26 67.58a8 8 0 0 1-11.92 10.67a79.93 79.93 0 0 1 0-106.67a8 8 0 1 1 11.95 10.67A63.8 63.8 0 0 0 69 103.09M248 128a119.58 119.58 0 0 1-34.29 84a8 8 0 1 1-11.42-11.2a103.9 103.9 0 0 0 0-145.56A8 8 0 1 1 213.71 44A119.58 119.58 0 0 1 248 128M53.71 200.78A8 8 0 1 1 42.29 212a119.87 119.87 0 0 1 0-168a8 8 0 1 1 11.42 11.2a103.9 103.9 0 0 0 0 145.56Z\"/>", "bug": "<path fill=\"currentColor\" d=\"M144 92a12 12 0 1 1 12 12a12 12 0 0 1-12-12m-44-12a12 12 0 1 0 12 12a12 12 0 0 0-12-12m116 64a87.8 87.8 0 0 1-3 23l22.24 9.72A8 8 0 0 1 232 192a7.9 7.9 0 0 1-3.2-.67L207.38 182a88 88 0 0 1-158.76 0l-21.42 9.33a7.9 7.9 0 0 1-3.2.67a8 8 0 0 1-3.2-15.33L43 167a87.8 87.8 0 0 1-3-23v-8H16a8 8 0 0 1 0-16h24v-8a87.8 87.8 0 0 1 3-23l-22.2-9.67a8 8 0 1 1 6.4-14.66L48.62 74a88 88 0 0 1 158.76 0l21.42-9.36a8 8 0 0 1 6.4 14.66L213 89.05a87.8 87.8 0 0 1 3 23v8h24a8 8 0 0 1 0 16h-24ZM56 120h144v-8a72 72 0 0 0-144 0Zm64 95.54V136H56v8a72.08 72.08 0 0 0 64 71.54M200 144v-8h-64v79.54A72.08 72.08 0 0 0 200 144\"/>", "calendar-blank": "<path fill=\"currentColor\" d=\"M208 32h-24v-8a8 8 0 0 0-16 0v8H88v-8a8 8 0 0 0-16 0v8H48a16 16 0 0 0-16 16v160a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16M72 48v8a8 8 0 0 0 16 0v-8h80v8a8 8 0 0 0 16 0v-8h24v32H48V48Zm136 160H48V96h160z\"/>", "chat-circle-dots": "<path fill=\"currentColor\" d=\"M140 128a12 12 0 1 1-12-12a12 12 0 0 1 12 12m-56-12a12 12 0 1 0 12 12a12 12 0 0 0-12-12m88 0a12 12 0 1 0 12 12a12 12 0 0 0-12-12m60 12a104 104 0 0 1-152.88 91.82l-34.05 11.35a16 16 0 0 1-20.24-20.24l11.35-34.05A104 104 0 1 1 232 128m-16 0a88 88 0 1 0-164.19 44.06a8 8 0 0 1 .66 6.54L40 216l37.4-12.47a7.9 7.9 0 0 1 2.53-.42a8 8 0 0 1 4 1.08A88 88 0 0 0 216 128\"/>", "check": "<path fill=\"currentColor\" d=\"m229.66 77.66l-128 128a8 8 0 0 1-11.32 0l-56-56a8 8 0 0 1 11.32-11.32L96 188.69L218.34 66.34a8 8 0 0 1 11.32 11.32\"/>", "clock": "<path fill=\"currentColor\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88m64-88a8 8 0 0 1-8 8h-56a8 8 0 0 1-8-8V72a8 8 0 0 1 16 0v48h48a8 8 0 0 1 8 8\"/>", "code-block": "<path fill=\"currentColor\" d=\"m58.34 101.66l-32-32a8 8 0 0 1 0-11.32l32-32a8 8 0 0 1 11.32 11.32L43.31 64l26.35 26.34a8 8 0 0 1-11.32 11.32m40 0a8 8 0 0 0 11.32 0l32-32a8 8 0 0 0 0-11.32l-32-32a8 8 0 0 0-11.32 11.32L124.69 64L98.34 90.34a8 8 0 0 0 0 11.32M200 40h-24a8 8 0 0 0 0 16h24v144H56v-64a8 8 0 0 0-16 0v64a16 16 0 0 0 16 16h144a16 16 0 0 0 16-16V56a16 16 0 0 0-16-16\"/>", "coins": "<path fill=\"currentColor\" d=\"M184 89.57V84c0-25.08-37.83-44-88-44S8 58.92 8 84v40c0 20.89 26.25 37.49 64 42.46V172c0 25.08 37.83 44 88 44s88-18.92 88-44v-40c0-20.7-25.42-37.32-64-42.43M232 132c0 13.22-30.79 28-72 28c-3.73 0-7.43-.13-11.08-.37C170.49 151.77 184 139 184 124v-18.26c29.87 4.45 48 16.53 48 26.26M72 150.25v-23.79A184 184 0 0 0 96 128a184 184 0 0 0 24-1.54v23.79A163 163 0 0 1 96 152a163 163 0 0 1-24-1.75m96-40.32V124c0 8.39-12.41 17.4-32 22.87V123.5c12.91-3.13 23.84-7.79 32-13.57M96 56c41.21 0 72 14.78 72 28s-30.79 28-72 28s-72-14.78-72-28s30.79-28 72-28m-72 68v-14.07c8.16 5.78 19.09 10.44 32 13.57v23.37C36.41 141.4 24 132.39 24 124m64 48v-4.17c2.63.1 5.29.17 8 .17c3.88 0 7.67-.13 11.39-.35a122 122 0 0 0 12.61 3.76v23.46c-19.59-5.47-32-14.48-32-22.87m48 26.25V174.4a179.5 179.5 0 0 0 24 1.6a184 184 0 0 0 24-1.54v23.79a165.5 165.5 0 0 1-48 0m64-3.38V171.5c12.91-3.13 23.84-7.79 32-13.57V172c0 8.39-12.41 17.4-32 22.87\"/>", "compass": "<path fill=\"currentColor\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88m44.42-143.16l-64 32a8.05 8.05 0 0 0-3.58 3.58l-32 64A8 8 0 0 0 80 184a8.1 8.1 0 0 0 3.58-.84l64-32a8.05 8.05 0 0 0 3.58-3.58l32-64a8 8 0 0 0-10.74-10.74M138 138l-40.11 20.11L118 118l40.15-20.07Z\"/>", "cpu": "<path fill=\"currentColor\" d=\"M152 96h-48a8 8 0 0 0-8 8v48a8 8 0 0 0 8 8h48a8 8 0 0 0 8-8v-48a8 8 0 0 0-8-8m-8 48h-32v-32h32Zm88 0h-16v-32h16a8 8 0 0 0 0-16h-16V56a16 16 0 0 0-16-16h-40V24a8 8 0 0 0-16 0v16h-32V24a8 8 0 0 0-16 0v16H56a16 16 0 0 0-16 16v40H24a8 8 0 0 0 0 16h16v32H24a8 8 0 0 0 0 16h16v40a16 16 0 0 0 16 16h40v16a8 8 0 0 0 16 0v-16h32v16a8 8 0 0 0 16 0v-16h40a16 16 0 0 0 16-16v-40h16a8 8 0 0 0 0-16m-32 56H56V56h144z\"/>", "cube": "<path fill=\"currentColor\" d=\"m223.68 66.15l-88-48.15a15.88 15.88 0 0 0-15.36 0l-88 48.17a16 16 0 0 0-8.32 14v95.64a16 16 0 0 0 8.32 14l88 48.17a15.88 15.88 0 0 0 15.36 0l88-48.17a16 16 0 0 0 8.32-14V80.18a16 16 0 0 0-8.32-14.03M128 32l80.34 44L128 120L47.66 76ZM40 90l80 43.78v85.79l-80-43.75Zm96 129.57v-85.75L216 90v85.78Z\"/>", "envelope-simple": "<path fill=\"currentColor\" d=\"M224 48H32a8 8 0 0 0-8 8v136a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V56a8 8 0 0 0-8-8m-20.57 16L128 133.15L52.57 64ZM216 192H40V74.19l82.59 75.71a8 8 0 0 0 10.82 0L216 74.19z\"/>", "globe-hemisphere-east": "<path fill=\"currentColor\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 16a87.5 87.5 0 0 1 48 14.28V74l-22.17 25.74l-31.47 4.26l-.31-.22l-19.67-12.86a16 16 0 0 0-22.51 4.18l-20.94 31.3a16 16 0 0 0-2.7 8.81L56 171.44l-3.27 2.15A88 88 0 0 1 128 40M62.29 186.47l2.52-1.65A16 16 0 0 0 72 171.53l.21-36.23L93.17 104a4 4 0 0 0 .32.22l19.67 12.87a15.94 15.94 0 0 0 11.35 2.77l31.49-4.27a16 16 0 0 0 10-5.41l22.17-25.76A16 16 0 0 0 192 74v-6.33A87.87 87.87 0 0 1 211.77 155l-16.14-14.76a16 16 0 0 0-16.93-3l-30.46 12.65a16.08 16.08 0 0 0-9.68 12.45l-2.39 16.19a16 16 0 0 0 11.77 17.81L169.4 202l2.36 2.37a87.88 87.88 0 0 1-109.47-17.9M185 195l-4.3-4.31a16 16 0 0 0-7.26-4.18L152 180.85l2.39-16.19L184.84 152L205 170.48A88.4 88.4 0 0 1 185 195\"/>", "graduation-cap": "<path fill=\"currentColor\" d=\"m251.76 88.94l-120-64a8 8 0 0 0-7.52 0l-120 64a8 8 0 0 0 0 14.12L32 117.87v48.42a15.9 15.9 0 0 0 4.06 10.65C49.16 191.53 78.51 216 128 216a130 130 0 0 0 48-8.76V240a8 8 0 0 0 16 0v-40.49a115.6 115.6 0 0 0 27.94-22.57a15.9 15.9 0 0 0 4.06-10.65v-48.42l27.76-14.81a8 8 0 0 0 0-14.12M128 200c-43.27 0-68.72-21.14-80-33.71V126.4l76.24 40.66a8 8 0 0 0 7.52 0L176 143.47v46.34c-12.6 5.88-28.48 10.19-48 10.19m80-33.75a97.8 97.8 0 0 1-16 14.25v-45.57l16-8.53Zm-20-47.31l-.22-.13l-56-29.87a8 8 0 0 0-7.52 14.12L171 128l-43 22.93L25 96l103-54.93L231 96Z\"/>", "lock-simple": "<path fill=\"currentColor\" d=\"M208 80h-32V56a48 48 0 0 0-96 0v24H48a16 16 0 0 0-16 16v112a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16M96 56a32 32 0 0 1 64 0v24H96Zm112 152H48V96h160z\"/>", "map-pin": "<path fill=\"currentColor\" d=\"M128 64a40 40 0 1 0 40 40a40 40 0 0 0-40-40m0 64a24 24 0 1 1 24-24a24 24 0 0 1-24 24m0-112a88.1 88.1 0 0 0-88 88c0 31.4 14.51 64.68 42 96.25a254.2 254.2 0 0 0 41.45 38.3a8 8 0 0 0 9.18 0a254.2 254.2 0 0 0 41.37-38.3c27.45-31.57 42-64.85 42-96.25a88.1 88.1 0 0 0-88-88m0 206c-16.53-13-72-60.75-72-118a72 72 0 0 1 144 0c0 57.23-55.47 105-72 118\"/>", "map-trifold": "<path fill=\"currentColor\" d=\"M228.92 49.69a8 8 0 0 0-6.86-1.45l-61.13 15.28l-61.35-30.68a8 8 0 0 0-5.52-.6l-64 16A8 8 0 0 0 24 56v144a8 8 0 0 0 9.94 7.76l61.13-15.28l61.35 30.68a8.15 8.15 0 0 0 3.58.84a8 8 0 0 0 1.94-.24l64-16A8 8 0 0 0 232 200V56a8 8 0 0 0-3.08-6.31M104 52.94l48 24v126.12l-48-24Zm-64 9.31l48-12v127.5l-48 12Zm176 131.5l-48 12V78.25l48-12Z\"/>", "phone": "<path fill=\"currentColor\" d=\"m222.37 158.46l-47.11-21.11l-.13-.06a16 16 0 0 0-15.17 1.4a8 8 0 0 0-.75.56L134.87 160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16 16 0 0 0 1.32-15.06v-.12L97.54 33.64a16 16 0 0 0-16.62-9.52A56.26 56.26 0 0 0 32 80c0 79.4 64.6 144 144 144a56.26 56.26 0 0 0 55.88-48.92a16 16 0 0 0-9.51-16.62M176 208A128.14 128.14 0 0 1 48 80a40.2 40.2 0 0 1 34.87-40a.6.6 0 0 0 0 .12l21 47l-20.67 24.74a6 6 0 0 0-.57.77a16 16 0 0 0-1 15.7c9.06 18.53 27.73 37.06 46.46 46.11a16 16 0 0 0 15.75-1.14a8 8 0 0 0 .74-.56L168.89 152l47 21.05h.11A40.21 40.21 0 0 1 176 208\"/>", "robot": "<path fill=\"currentColor\" d=\"M200 48h-64V16a8 8 0 0 0-16 0v32H56a32 32 0 0 0-32 32v112a32 32 0 0 0 32 32h144a32 32 0 0 0 32-32V80a32 32 0 0 0-32-32m16 144a16 16 0 0 1-16 16H56a16 16 0 0 1-16-16V80a16 16 0 0 1 16-16h144a16 16 0 0 1 16 16Zm-52-56H92a28 28 0 0 0 0 56h72a28 28 0 0 0 0-56m-24 16v24h-24v-24Zm-60 12a12 12 0 0 1 12-12h8v24h-8a12 12 0 0 1-12-12m84 12h-8v-24h8a12 12 0 0 1 0 24m-92-68a12 12 0 1 1 12 12a12 12 0 0 1-12-12m88 0a12 12 0 1 1 12 12a12 12 0 0 1-12-12\"/>", "rocket-launch": "<path fill=\"currentColor\" d=\"M223.85 47.12a16 16 0 0 0-15-15c-12.58-.75-44.73.4-71.41 27.07L132.69 64H74.36A15.9 15.9 0 0 0 63 68.68L28.7 103a16 16 0 0 0 9.07 27.16l38.47 5.37l44.21 44.21l5.37 38.49a15.94 15.94 0 0 0 10.78 12.92a16.1 16.1 0 0 0 5.1.83a15.9 15.9 0 0 0 11.3-4.68l34.32-34.3a15.9 15.9 0 0 0 4.68-11.36v-58.33l4.77-4.77c26.68-26.68 27.83-58.83 27.08-71.42M74.36 80h42.33l-39.53 39.52L40 114.34Zm74.41-9.45a76.65 76.65 0 0 1 59.11-22.47a76.46 76.46 0 0 1-22.42 59.16L128 164.68L91.32 128ZM176 181.64L141.67 216l-5.19-37.17L176 139.31Zm-74.16 9.5C97.34 201 82.29 224 40 224a8 8 0 0 1-8-8c0-42.29 23-57.34 32.86-61.85a8 8 0 0 1 6.64 14.56c-6.43 2.93-20.62 12.36-23.12 38.91c26.55-2.5 36-16.69 38.91-23.12a8 8 0 1 1 14.56 6.64Z\"/>", "shield-check": "<path fill=\"currentColor\" d=\"M208 40H48a16 16 0 0 0-16 16v56c0 52.72 25.52 84.67 46.93 102.19c23.06 18.86 46 25.26 47 25.53a8 8 0 0 0 4.2 0c1-.27 23.91-6.67 47-25.53C198.48 196.67 224 164.72 224 112V56a16 16 0 0 0-16-16m0 72c0 37.07-13.66 67.16-40.6 89.42a129.3 129.3 0 0 1-39.4 22.2a128.3 128.3 0 0 1-38.92-21.81C61.82 179.51 48 149.3 48 112V56h160ZM82.34 141.66a8 8 0 0 1 11.32-11.32L112 148.69l50.34-50.35a8 8 0 0 1 11.32 11.32l-56 56a8 8 0 0 1-11.32 0Z\"/>", "signpost": "<path fill=\"currentColor\" d=\"M246 106.65L212.33 69.3a16 16 0 0 0-11.89-5.3H136V32a8 8 0 0 0-16 0v32H40a16 16 0 0 0-16 16v64a16 16 0 0 0 16 16h80v64a8 8 0 0 0 16 0v-64h64.44a16 16 0 0 0 11.89-5.3L246 117.35a8 8 0 0 0 0-10.7M200.44 144H40V80h160.44l28.8 32Z\"/>", "solar-panel": "<path fill=\"currentColor\" d=\"M32 104a8 8 0 0 1 8-8h16a8 8 0 0 1 0 16H40a8 8 0 0 1-8-8m39.43-45.25a8 8 0 0 0 11.32-11.32L71.43 36.12a8 8 0 0 0-11.31 11.31ZM128 40a8 8 0 0 0 8-8V16a8 8 0 0 0-16 0v16a8 8 0 0 0 8 8m50.91 21.09a8 8 0 0 0 5.66-2.34l11.31-11.32a8 8 0 0 0-11.31-11.31l-11.32 11.31a8 8 0 0 0 5.66 13.66M192 104a8 8 0 0 0 8 8h16a8 8 0 0 0 0-16h-16a8 8 0 0 0-8 8m-104 8a8 8 0 0 0 8-8a32 32 0 0 1 64 0a8 8 0 0 0 16 0a48 48 0 0 0-96 0a8 8 0 0 0 8 8m150.91 108a8 8 0 0 1-6.91 4H24a8 8 0 0 1-7-11.94l40.69-72a8 8 0 0 1 7-4.06H191.3a8 8 0 0 1 7 4.06l40.69 72a8 8 0 0 1-.08 7.94m-52.27-68h-24.37l3.48 16h29.93Zm-37.26 16l-3.48-16h-35.8l-3.48 16Zm-46.24 16l-5.21 24h60.14l-5.21-24Zm-42.82-16h29.93l3.48-16H69.36Zm-22.61 40h43.84l5.22-24H51.28Zm180.58 0l-13.57-24h-35.49l5.22 24Z\"/>", "user": "<path fill=\"currentColor\" d=\"M230.92 212c-15.23-26.33-38.7-45.21-66.09-54.16a72 72 0 1 0-73.66 0c-27.39 8.94-50.86 27.82-66.09 54.16a8 8 0 1 0 13.85 8c18.84-32.56 52.14-52 89.07-52s70.23 19.44 89.07 52a8 8 0 1 0 13.85-8M72 96a56 56 0 1 1 56 56a56.06 56.06 0 0 1-56-56\"/>", "whatsapp-logo": "<path fill=\"currentColor\" d=\"m187.58 144.84l-32-16a8 8 0 0 0-8 .5l-14.69 9.8a40.55 40.55 0 0 1-16-16l9.8-14.69a8 8 0 0 0 .5-8l-16-32A8 8 0 0 0 104 64a40 40 0 0 0-40 40a88.1 88.1 0 0 0 88 88a40 40 0 0 0 40-40a8 8 0 0 0-4.42-7.16M152 176a72.08 72.08 0 0 1-72-72a24 24 0 0 1 19.29-23.54l11.48 23L101 118a8 8 0 0 0-.73 7.51a56.47 56.47 0 0 0 30.15 30.15A8 8 0 0 0 138 155l14.61-9.74l23 11.48A24 24 0 0 1 152 176M128 24a104 104 0 0 0-91.82 152.88l-11.35 34.05a16 16 0 0 0 20.24 20.24l34.05-11.35A104 104 0 1 0 128 24m0 192a87.87 87.87 0 0 1-44.06-11.81a8 8 0 0 0-6.54-.67L40 216l12.47-37.4a8 8 0 0 0-.66-6.54A88 88 0 1 1 128 216\"/>", "wrench": "<path fill=\"currentColor\" d=\"M226.76 69a8 8 0 0 0-12.84-2.88l-40.3 37.19l-17.23-3.7l-3.7-17.23l37.19-40.3A8 8 0 0 0 187 29.24A72 72 0 0 0 88 96a72.3 72.3 0 0 0 6 28.94L33.79 177c-.15.12-.29.26-.43.39a32 32 0 0 0 45.26 45.26c.13-.13.27-.28.39-.42L131.06 162A72 72 0 0 0 232 96a71.6 71.6 0 0 0-5.24-27M160 152a56.14 56.14 0 0 1-27.07-7a8 8 0 0 0-9.92 1.77l-55.9 64.74a16 16 0 0 1-22.62-22.62L109.18 133a8 8 0 0 0 1.77-9.93a56 56 0 0 1 58.36-82.31l-31.2 33.81a8 8 0 0 0-1.94 7.1l5.66 26.33a8 8 0 0 0 6.14 6.14l26.35 5.66a8 8 0 0 0 7.1-1.94l33.81-31.2A56.06 56.06 0 0 1 160 152\"/>", "x": "<path fill=\"currentColor\" d=\"M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 0 1-11.32-11.32L116.69 128L50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128Z\"/>", "pencil-simple": "<path fill=\"currentColor\" d=\"m227.31 73.37l-44.68-44.69a16 16 0 0 0-22.63 0L36.69 152A15.86 15.86 0 0 0 32 163.31V208a16 16 0 0 0 16 16h44.69a15.86 15.86 0 0 0 11.31-4.69L227.31 96a16 16 0 0 0 0-22.63M92.69 208H48v-44.69l88-88L180.69 120ZM192 108.68L147.31 64l24-24L216 84.68Z\"/>", "clipboard-text-light": "<path fill=\"currentColor\" d=\"M166 152a6 6 0 0 1-6 6H96a6 6 0 0 1 0-12h64a6 6 0 0 1 6 6m-6-38H96a6 6 0 0 0 0 12h64a6 6 0 0 0 0-12m54-66v168a14 14 0 0 1-14 14H56a14 14 0 0 1-14-14V48a14 14 0 0 1 14-14h37.17a45.91 45.91 0 0 1 69.66 0H200a14 14 0 0 1 14 14M94 64v2h68v-2a34 34 0 0 0-68 0m108-16a2 2 0 0 0-2-2h-29.67A45.8 45.8 0 0 1 174 64v8a6 6 0 0 1-6 6H88a6 6 0 0 1-6-6v-8a45.8 45.8 0 0 1 3.67-18H56a2 2 0 0 0-2 2v168a2 2 0 0 0 2 2h144a2 2 0 0 0 2-2Z\"/>", "phone-call-light": "<path fill=\"currentColor\" d=\"M146.2 46.45a6 6 0 0 1 7.35-4.25a84.24 84.24 0 0 1 60.25 60.25a6 6 0 0 1-4.25 7.35a6 6 0 0 1-1.55.2a6 6 0 0 1-5.8-4.45a72.34 72.34 0 0 0-51.75-51.75a6 6 0 0 1-4.25-7.35m-3.75 39.35C157 89.68 166.32 99 170.2 113.55A6 6 0 0 0 176 118a6 6 0 0 0 1.55-.2a6 6 0 0 0 4.25-7.35c-5-18.71-17.54-31.25-36.25-36.25a6 6 0 1 0-3.1 11.6m79.44 97A54.25 54.25 0 0 1 168 230C89.7 230 26 166.3 26 88a54.25 54.25 0 0 1 47.17-53.89a14 14 0 0 1 14.56 8.39l21.1 47.1a14 14 0 0 1-1.12 13.28a6 6 0 0 1-.42.57l-21.07 25.06a1.89 1.89 0 0 0 0 1.67c7.66 15.68 24.1 32 40 39.65a1.88 1.88 0 0 0 1.68-.06l24.69-21a5 5 0 0 1 .56-.42a14 14 0 0 1 13.28-1.22l47.24 21.17a14 14 0 0 1 8.22 14.53ZM210 181.32a2 2 0 0 0-1.21-2l-47.25-21.17a1.92 1.92 0 0 0-1.6.1l-24.68 21c-.18.15-.37.29-.56.42a14 14 0 0 1-13.77 1c-18.36-8.87-36.66-27-45.53-45.19a14 14 0 0 1 .91-13.73a5 5 0 0 1 .43-.57l21.05-25.09a2 2 0 0 0 0-1.67L76.74 47.31A2 2 0 0 0 74.9 46h-.23A42.24 42.24 0 0 0 38 88c0 71.68 58.32 130 130 130a42.24 42.24 0 0 0 42-36.68\"/>", "hourglass-medium-light": "<path fill=\"currentColor\" d=\"M198 75.64V40a14 14 0 0 0-14-14H72a14 14 0 0 0-14 14v36a14.06 14.06 0 0 0 5.6 11.2L118 128l-54.4 40.8A14.06 14.06 0 0 0 58 180v36a14 14 0 0 0 14 14h112a14 14 0 0 0 14-14v-35.64a14.08 14.08 0 0 0-5.56-11.17L138 128l54.49-41.19A14.08 14.08 0 0 0 198 75.64M70 40a2 2 0 0 1 2-2h112a2 2 0 0 1 2 2v35.64a2 2 0 0 1-.79 1.6L178.9 82H76.67l-5.87-4.4A2 2 0 0 1 70 76Zm58 80.49L92.67 94H163Zm58 59.87V216a2 2 0 0 1-2 2H72a2 2 0 0 1-2-2v-36a2 2 0 0 1 .8-1.6L122 140v28a6 6 0 0 0 12 0v-27.94l51.21 38.7a2 2 0 0 1 .79 1.6\"/>", "circuitry-light": "<path fill=\"currentColor\" d=\"M208 34H48a14 14 0 0 0-14 14v160a14 14 0 0 0 14 14h160a14 14 0 0 0 14-14V48a14 14 0 0 0-14-14M88 158a10 10 0 1 1-10 10a10 10 0 0 1 10-10m-42 50V48a2 2 0 0 1 2-2h34v100.84a22 22 0 1 0 12 0v-36.35l52 52V210H48a2 2 0 0 1-2-2m164 0a2 2 0 0 1-2 2h-50v-50a6 6 0 0 0-1.76-4.24L94 93.51V46h36v26a6 6 0 0 0 1.76 4.24l17 17a22 22 0 1 0 8.48-8.48L142 69.51V46h66a2 2 0 0 1 2 2ZM168 94a10 10 0 1 1-10 10a10 10 0 0 1 10-10\"/>"};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sfx = (name) => { if (window.NubiaaSound) window.NubiaaSound.play(name); };
  const icon = (n) => `<svg viewBox="0 0 256 256" aria-hidden="true">${ICONS[n] || ''}</svg>`;

  /* ─── 1 · La devise : l'image de chaque mot remplit toute la bande ───
     Chaque image couvre la bande en entier, triangles compris, et elle
     est coupée en deux moitiés verticales. Quand son mot passe au centre,
     les moitiés se recollent ; quand il s'éloigne, elles s'écartent (la
     gauche monte, la droite descend) et laissent voir l'image suivante.
     Les deux triangles montrent la première et la dernière image, cadrées
     exactement comme dans la bande : la photo continue sans raccord. */
  const MOTTO_IMAGES = ['images/motto-batir.jpg', 'images/motto-comprendre.jpg', 'images/motto-montrer.jpg'];
  const words = $$('#mottoTrack .mw');
  const mottoPin = $('.s-motto .pin');
  const mottoImg = (i) => MOTTO_IMAGES[i % MOTTO_IMAGES.length];
  const stage = document.createElement('div');
  stage.className = 'motto-stage';
  stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = words.map((_, i) =>
    `<div class="motto-shot"><i class="half l"><b style="background-image:url('${mottoImg(i)}')"></b></i>` +
    `<i class="half r"><b style="background-image:url('${mottoImg(i)}')"></b></i></div>`).join('');
  if (mottoPin) mottoPin.prepend(stage);
  const halves = words.map((w, i) => {
    const shot = stage.children[i];
    return { w, shot, l: shot.children[0], r: shot.children[1] };
  });
  [['.band .diag.to-lime', 0], ['.band .diag.from-lime', words.length - 1]].forEach(([sel, i]) => {
    const d = $(sel);
    if (!d || !words.length) return;
    d.classList.add('has-img');
    d.innerHTML = `<i style="background-image:url('${mottoImg(i)}')"></i>`;
  });
  // les triangles cadrent leur image sur la hauteur réelle de la bande
  const fitMotto = () => { if (mottoPin) document.documentElement.style.setProperty('--motto-h', mottoPin.offsetHeight + 'px'); };
  fitMotto();
  addEventListener('resize', fitMotto);

  /* ─── 2 · Les étapes : un élément qui représente chacune ─── */
  const STEP_ICONS = ['clipboard-text-light', 'phone-call-light', 'hourglass-medium-light', 'circuitry-light'];
  $$('#psteps .pstep').forEach((st, i) => {
    const ico = document.createElement('span');
    ico.className = 'pstep-ico';
    ico.innerHTML = icon(STEP_ICONS[i] || STEP_ICONS[STEP_ICONS.length - 1]);
    st.prepend(ico);
  });

  /* ─── 3 · La fin : le logo en grand ─── */
  const name = $('#footerName');
  if (name) {
    const logo = document.createElement('div');
    logo.className = 'footer-logo';
    logo.innerHTML = '<img src="images/logo.png" alt="NUBIAA Academia" width="1120" height="348">';
    name.after(logo);
    name.classList.add('replaced');
    if (reduced) logo.classList.add('in');
  }
  const logoEl = $('.footer-logo');

  /* ─── 4 · La barre : la même que celle du questionnaire ───
     On garde le dock du moteur (le nom du loader vole jusqu'à
     .dock-wordmark au démarrage) et on le réorganise : marque à
     gauche, partie en cours au centre, son + inscription à droite,
     jauge d'avancement en bas. */
  const dock = $('#dock');
  const SECTIONS = [['hero', 'Accueil'], ['manifeste', 'Manifeste'], ['travaux', 'Programme'], ['temps', 'Devise'],
    ['explorer', 'Étapes'], ['temoignage', 'Témoignage'], ['final', 'Engagements'], ['contact', 'Contact']]
    .map(([id, label]) => ({ el: document.getElementById(id), label })).filter((x) => x.el);
  let count = null, fill = null, lastSection = -2;
  if (dock) {
    dock.classList.add('as-bar');
    const word = $('.dock-wordmark', dock);
    const brand = document.createElement('div');
    brand.className = 'bar-brand';
    brand.innerHTML = '<img src="images/mark.png" alt="" width="22" height="22">';
    word.before(brand);
    brand.appendChild(word);
    count = document.createElement('p');
    count.className = 'bar-count mono';
    count.setAttribute('aria-live', 'polite');
    const right = document.createElement('div');
    right.className = 'bar-right';
    const cta = $('.dock-cta', dock);
    right.appendChild(cta);
    dock.append(count, right);
    const prog = document.createElement('div');
    prog.className = 'bar-progress';
    prog.setAttribute('aria-hidden', 'true');
    prog.innerHTML = '<i></i>';
    dock.appendChild(prog);
    fill = prog.firstChild;
  }
  const smooth = $('#smooth');
  function bar() {
    if (!dock) return;
    const r = smooth.getBoundingClientRect();
    const k = clamp(-r.top / Math.max(r.height - innerHeight, 1), 0, 1);
    fill.style.transform = `scaleX(${k.toFixed(4)})`;
    let cur = 0;
    SECTIONS.forEach((x, i) => { if (x.el.getBoundingClientRect().top <= innerHeight * 0.5) cur = i; });
    if (cur !== lastSection) {
      lastSection = cur;
      count.innerHTML = `<b>${cur + 1}</b> / ${SECTIONS.length} · ${SECTIONS[cur].label}`;
    }
  }

  /* ─── Rendu de la devise ───
     Le moteur fait glisser les mots et disperse leurs lettres selon
     leur distance au centre (rel). On relit cette distance sur la
     position réelle du mot, et on écarte les deux moitiés de la même
     façon : la gauche monte, la droite descend. Au centre, elles se
     recollent exactement. */
  const band = $('.s-motto');
  let activeWord = -1;

  /* ─── Les effets sonores, calés sur les mouvements du moteur ───
     Chaque scène épinglée avance de 0 à 1 (même calcul que app.js,
     relu sur la position réelle) ; un son part quand la scène
     franchit le seuil où démarre le mouvement qu'il accompagne. */
  const cue = (k, v, th, n) => { if (window.NubiaaSound) window.NubiaaSound.cue(k, v, th, n); };
  const range = (a, b, step) => { const o = []; for (let t = a; t <= b + 1e-9; t += step) o.push(+t.toFixed(4)); return o; };
  const progress = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.bottom < -innerHeight || r.top > innerHeight * 2) return null;
    return clamp(-r.top / Math.max(r.height - innerHeight, 1), 0, 1);
  };
  const S = {
    hero: $('.s-hero'), fill: $('.s-fill'), night: $('.s-night'), quote: $('.s-quote'), final: $('.s-final')
  };
  const introWords = $$('#spotIntro span').length;
  const nSteps = $$('#psteps .pstep').length;
  const stepTh = Array.from({ length: Math.max(nSteps - 1, 0) }, (_, k) => 0.5 + (k + 1) * (0.38 / Math.max(nSteps - 1, 1)) - 0.02);
  const cards = $$('#collGrid .card');

  function sounds() {
    const vh = innerHeight;
    let p;
    if ((p = progress(S.hero)) !== null) {
      cue('h-cloud', p, [0.02], 'drift');                 // le nuage s'ouvre
      cue('h-lift', p, [0.06], 'rise');                   // la ligne 2 monte seule au centre
      cue('h-zoom', p, [0.27], 'zoom');                   // l'image grandit jusqu'au plein écran
      cue('h-words', p, Array.from({ length: introWords }, (_, i) => 0.505 + i * 0.022), 'word'); // le positionnement, mot à mot
    }
    if ((p = progress(S.fill)) !== null) {
      cue('f-type', p, range(0.06, 0.58, 0.018), 'type'); // le manifeste s'encre lettre par lettre
      cue('f-oval', p, [0.43], 'draw');                   // l'ovale se dessine
    }
    cards.forEach((c, i) => {                             // les tuiles du programme se posent
      const r = c.getBoundingClientRect();
      cue('card' + i, clamp(1 - r.top / vh, -1, 2), [0.32], 'land');
    });
    if ((p = progress(S.night)) !== null) {
      cue('n-zoom', p, [0.09], 'zoom');                   // l'image d'intro prend l'écran
      cue('n-cover', p, [0.31], ['wipeIn', 'wipeOut']);   // le rideau couvre (gauche → droite)
      cue('n-clear', p, [0.43], ['wipeOut', 'wipeIn']);   // il se retire (droite → gauche)
      cue('n-steps', p, stepTh, 'odometer');              // le compteur passe à l'étape suivante
      cue('n-cta', p, [0.89], 'glass');                   // le bouton d'inscription arrive
      cue('n-oval', p, [0.93], 'draw');                   // son ovale se dessine
    }
    if ((p = progress(S.quote)) !== null) {
      cue('q-glyph', p, [0.04], 'rise');                  // le guillemet monte
      cue('q-text', p, [0.12], 'glass');                  // la citation apparaît
      cue('q-rule', p, [0.39], 'draw');                   // le filet se trace
      cue('q-name', p, [0.53], 'pluck');                  // la signature se pose
    }
    if ((p = progress(S.final)) !== null) {
      cue('o-ink', p, [0.08, 0.2, 0.34, 0.52], 'ink');    // chaque phrase s'encre
      cue('o-pill', p, [0.57], 'draw');                   // la pilule se dessine
    }
  }

  function frame() {
    // le logo se révèle quand il entre vraiment à l'écran
    if (logoEl && !logoEl.classList.contains('in') && logoEl.getBoundingClientRect().top < innerHeight * 0.82) {
      logoEl.classList.add('in'); sfx('reveal');
    }
    bar();
    if (!reduced) sounds();
    if (band && !reduced) {
      const br = band.getBoundingClientRect();
      if (br.bottom > 0 && br.top < innerHeight) {
        const vw = innerWidth, vh = innerHeight;
        let best = -1, bestD = 0.06;
        halves.forEach((h, wi) => {
          const r = h.w.getBoundingClientRect();
          const rel = clamp((r.left + r.width / 2 - vw / 2) / vw, -1.3, 1.3);
          const d = Math.abs(rel);
          if (d < bestD) { bestD = d; best = wi; }
          const dy = rel * vh * 0.62, dx = d * vw * 0.05;
          h.l.style.transform = `translate3d(${(-dx).toFixed(1)}px, ${(-dy).toFixed(1)}px, 0)`;
          h.r.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
          // le mot le plus proche du centre passe devant ; les autres s'effacent en s'écartant
          h.shot.style.zIndex = String(100 - Math.round(d * 50));
          h.shot.style.setProperty('--sh', Math.min(d * 6, 1).toFixed(3));
          h.shot.style.opacity = clamp(1 - (d - 0.2) / 0.28, 0, 1).toFixed(3);
        });
        // les deux moitiés se recollent au centre : « clac » ; elles repartent : glissé
        if (best !== activeWord) { sfx(best >= 0 ? 'snap' : 'split'); activeWord = best; }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
