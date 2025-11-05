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

  // --- Cuenta atrás usando zona horaria de Madrid ---
  // 26 septiembre 2026 17:30 hora local de Madrid
  function getTargetInMadrid() {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false
    });
    const parts = fmt.formatToParts(new Date("2026-09-26T15:30:00Z"));
    // Creamos un Date equivalente a "2026-09-26 17:30:00 Europe/Madrid"
    return new Date(Date.UTC(
      2026, 8, 26, 17 - (new Date().getTimezoneOffset() / 60), 30, 0
    ));
  }
  const TARGET_TZ = "Europe/Madrid";
  const targetDate = new Date("2026-09-26T17:30:00");
  const TARGET = new Date(
    new Date(
      targetDate.toLocaleString("en-US", { timeZone: TARGET_TZ })
    )
  );

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
    void flashEl.offsetWidth;
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

    s1.style.display = 'none';
    s2.className = 'cd2';
    s2.id = 'wcd';
    s2.setAttribute('aria-live', 'polite');

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
      const now = new Date();
      // Convertimos ahora al mismo huso horario (Madrid)
      const nowLocal = new Date(now.toLocaleString("en-US", { timeZone: TARGET_TZ }));
      const diff = targetDate - nowLocal;

      const t = splitTime(diff);
      dEl.textContent = t.d.toString().padStart(3, '0');
      hEl.textContent = pad2(t.h);
      mEl.textContent = pad2(t.m);
      sEl.textContent = pad2(t.s);

      if (t.done) clearInterval(countdownTimer);
    };

    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  function revealStrip() {
    strip.classList.add('is-docked');
    startLiveCountdown();
  }

  function startCountdown() {
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

        overlay.classList.remove('visible');
        overlay.setAttribute('aria-hidden', 'true');
        playFlash();

        const flashMs = msFromCssVar('--flash-ms', 2000);
        const revealAt = Math.max(0, Math.floor(flashMs * 0.6));

        setTimeout(() => { revealStrip(); }, revealAt);

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

  window.addEventListener('beforeunload', () => {
    if (countdownTimer) clearInterval(countdownTimer);
  });
});
