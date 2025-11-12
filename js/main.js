document.addEventListener('DOMContentLoaded', () => {
  const btn      = document.getElementById('btn');
  const strip    = document.getElementById('strip');
  const s1       = document.getElementById('s1');
  const s2       = document.getElementById('s2');
  const overlay  = document.getElementById('countdown');
  const countEl  = document.getElementById('countnum');
  const flashEl  = document.getElementById('flash');
  const pb       = document.getElementById('photobooth');
  const snap = document.getElementById('snap');

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
        // Sonido Polaroid sincronizado con el flash
        try {
          if (snap) { snap.currentTime = 0; snap.volume = 1; snap.play().catch(()=>{}); }
        } catch {}

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
    
    // Desbloquear audio en el primer gesto del usuario (iOS/Safari/Android)
    try {
      if (snap) {
        snap.volume = 0;        // silencio
        snap.currentTime = 0;
        const p = snap.play();  // intenta reproducir
        if (p && p.catch) p.catch(()=>{}); // ignora si falla
        setTimeout(()=>{
          try { snap.pause(); snap.currentTime = 0; snap.volume = 1; } catch {}
        }, 20); // vuelve a posición 0 y restaura volumen
      }
    } catch {}

    startCountdown();
  });

    // ====== TIMELINE CARRUSEL (Detalles) ======
  (function setupTimelineCarousel(){
    const root = document.getElementById('timeline');
    if (!root) return;

    const track   = root.querySelector('.track');
    const slides  = Array.from(root.querySelectorAll('.slide'));
    const vp      = root.querySelector('.viewport');
    const prevBtn = root.querySelector('.prev');
    const nextBtn = root.querySelector('.next');
    const dotsBox = root.querySelector('.dots');
    const labEl   = root.querySelector('#tl-label');
    const timeEl  = root.querySelector('#tl-time');

    let i = 0;             // índice activo
    const n = slides.length;

    // Crear dots accesibles
    slides.forEach((_, idx) => {
      const b = document.createElement('button');
      b.className = 'dot';
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `Ir al tramo ${idx+1}`);
      b.addEventListener('click', () => go(idx));
      dotsBox.appendChild(b);
    });

    function updateCaption(){
      const s = slides[i];
      if (s){
        const label = s.dataset.label || '';
        const time  = s.dataset.time  || '';
        if (labEl)  labEl.textContent  = label;
        if (timeEl) timeEl.textContent = time;
      }
    }

    function updateDots(){
      const dots = Array.from(dotsBox.children);
      dots.forEach((d, idx) => d.setAttribute('aria-selected', idx === i ? 'true' : 'false'));
    }

    function go(next){
      i = (next + n) % n;
      // desliza el carril (cada slide ocupa 100% del viewport)
      track.style.transform = `translateX(-${i * 100}%)`;
      updateDots();
      updateCaption();
    }

    // Controles
    prevBtn?.addEventListener('click', () => go(i - 1));
    nextBtn?.addEventListener('click', () => go(i + 1));

    // Gestos (drag / swipe)
    let x0 = null, t0 = 0, dragging = false;
    const THRESH = 40; // px
    const SPEED  = 0.35; // px/ms

    function onDown(e){
      dragging = true;
      x0 = (e.touches ? e.touches[0].clientX : e.clientX);
      t0 = Date.now();
    }
    function onMove(e){
      if (!dragging || x0 == null) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      const dx = x - x0;
      // efecto arrastre sutil (opcional)
      track.style.transition = 'none';
      track.style.transform = `translateX(calc(-${i*100}% + ${dx}px))`;
    }
    function onUp(e){
      if (!dragging) return;
      dragging = false;
      const x = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
      const dx = x - x0;
      const dt = Math.max(1, Date.now() - t0);
      track.style.transition = ''; // restablece
      const fast = Math.abs(dx/dt) > SPEED;
      if (Math.abs(dx) > THRESH || fast){
        if (dx < 0) go(i + 1); else go(i - 1);
      } else {
        go(i); // volver al índice actual
      }
      x0 = null;
    }

    vp.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    vp.addEventListener('touchstart', onDown, {passive:true});
    vp.addEventListener('touchmove',  onMove, {passive:true});
    vp.addEventListener('touchend',   onUp);

    // Teclado (cuando el foco esté en botones o dots)
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft'){ e.preventDefault(); go(i - 1); }
      if (e.key === 'ArrowRight'){ e.preventDefault(); go(i + 1); }
    });

    // Init
    go(0);
  })();


  // Limpieza por si el usuario navega o recarga
  window.addEventListener('beforeunload', () => {
    if (countdownTimer) clearInterval(countdownTimer);
  });
});
