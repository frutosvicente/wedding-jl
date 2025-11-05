document.addEventListener('DOMContentLoaded', () => {
  const btn      = document.getElementById('btn');
  const strip    = document.getElementById('strip');
  const s1       = document.getElementById('s1');
  const s2       = document.getElementById('s2');
  const overlay  = document.getElementById('countdown');
  const countEl  = document.getElementById('countnum');
  const flashEl  = document.getElementById('flash');
  const pb       = document.getElementById('photobooth');

  let started = false;

  // === Objetivo fijo en CET (UTC+1) ===
  // 26 Sep 2026 17:30 CET  =>  16:30:00Z
  const TARGET = new Date('2026-09-26T16:30:00Z');

  let countdownStarted = false;
  let countdownTimer = null;

  function msFromCssVar(name, fallbackMs) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const m = v.match(/^(\d+(?:\.\d+)?)(ms|s)$/i);
    if (!m) return fallbackMs;
    const val = parseFloat(m[1]);
    return m[2].toLowerCase() === 's' ? val * 1000 : val;
  }

  function playFlash() {
    flashEl.classList.remove('play');
    void flashEl.offsetWidth; // reinicia animación
    flashEl.classList.add('play');
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function splitTime(ms) {
    if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
    const total = Math.floor(ms / 1000);
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return { d, h, m, s, done: false };
  }

  function startLiveCountdown() {
    if (countdownStarted) return;
    countdownStarted = true;

    // Ocultamos el título y usamos s2 como contenedor del contador
    s1.style.display = 'none';
    s2.className = 'cd2';
    s2.id = 'wcd';
    s2.setAttribute('aria-live', 'polite');

    // Plantilla con 4 columnas; cada una tiene número y etiqueta debajo
    s2.innerHTML = `
      <div class="grid" aria-hidden="true">
        <div class="cell">
          <span class="num" id="cd-d">000</span>
          <span class="lbl">DÍAS</span>
        </div>
        <div class="cell">
          <span class="num" id="cd-h">00</span>
          <span class="lbl">H</span>
        </div>
        <div class="cell">
          <span class="num" id="cd-m">00</span>
          <span class="lbl">MIN</span>
        </div>
        <div class="cell">
          <span class="num" id="cd-s">00</span>
          <span class="lbl">SEG</span>
        </div>
      </div>
    `;

    const dEl = document.getElementById('cd-d');
    const hEl = document.getElementById('cd-h');
    const mEl = document.getElementById('cd-m');
    const sEl = document.getElementById('cd-s');

    const tick = () => {
      const nowMs = Date.now();                 // ms en UTC
      const left  = TARGET.getTime() - nowMs;   // diferencia contra 16:30Z (CET)
      const t = splitTime(left);

      // Días con 3 dígitos para mantener anchura estable
      dEl.textContent = t.d.toString().padStart(3, '0');
      hEl.textContent = pad2(t.h);
      mEl.textContent = pad2(t.m);
      sEl.textContent = pad2(t.s);

      if (t.done) {
        clearInterval(countdownTimer);
      }
    };

    tick(); // primera pintura inmediata
    countdownTimer = setInterval(tick, 1000);
  }

  function revealStrip() {
    strip.classList.add('is-docked');
    startLiveCountdown(); // arrancamos el contador cuando aparece la tira
  }

  function startCountdown() {
    const hint = document.querySelector('.hint-img');
    if (hint) {
      hint.classList.add('fade-out');
    }
    document.body.classList.add('noscroll');
    overlay.classList.add('visible');
    overlay.setAttribute('aria-hidden', 'false');

    let n = 3;
    countEl.textContent = n;
    countEl.style.animation = 'none';
    void countEl.offsetWidth;
    countEl.style.animation = '';

    const tick = setInterval(() => {
      n--;
      if (n > 0) {
        countEl.textContent = n;
        countEl.style.animation = 'none';
        void countEl.offsetWidth;
        countEl.style.animation = '';
      } else {
        clearInterval(tick);

        // Ocultamos overlay y lanzamos flash
        overlay.classList.remove('visible');
        overlay.setAttribute('aria-hidden', 'true');
        playFlash();

        const flashMs = msFromCssVar('--flash-ms', 2000);
        const revealAt = Math.max(0, Math.floor(flashMs * 0.6)); // 60% del flash

        // Revela la tira DURANTE el flash (debajo del blanco)
        setTimeout(() => { revealStrip(); }, revealAt);

        // Al terminar el flash, desbloquea scroll y desplaza vista
        flashEl.addEventListener('animationend', () => {
          document.body.classList.remove('noscroll');

          const gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--dock-gap')) || 0;
          const y = pb.getBoundingClientRect().bottom + window.scrollY - gap;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }, { once: true });
      }
    }, 1000);
  }

  btn.addEventListener('click', () => {
    if (started) return;
    started = true;
    startCountdown();
  });

  // Limpieza por si el usuario navega o recarga
  window.addEventListener('beforeunload', () => {
    if (countdownTimer) clearInterval(countdownTimer);
  });
});
