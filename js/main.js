document.addEventListener('DOMContentLoaded',()=>{
  const btn  = document.getElementById('btn');
  const strip= document.getElementById('strip');
  const s1   = document.getElementById('s1');
  const s2   = document.getElementById('s2');
  const overlay = document.getElementById('countdown');
  const countEl = document.getElementById('countnum');
  const flashEl = document.getElementById('flash');
  const pb   = document.getElementById('photobooth');

  let started=false;
  let countdownStarted=false;
  let countdownTimer=null;

  // 26 Sep 2026 17:30 en Madrid (CEST, UTC+02)
  const TARGET = new Date('2026-09-26T17:30:00+02:00');

  function msFromCssVar(name, fallbackMs){
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const m = v.match(/^(\d+(?:\.\d+)?)(ms|s)$/i);
    if(!m) return fallbackMs;
    const val = parseFloat(m[1]);
    return m[2].toLowerCase()==='s' ? val*1000 : val;
  }

  function playFlash(){
    flashEl.classList.remove('play');
    void flashEl.offsetWidth;
    flashEl.classList.add('play');
  }

  function pad2(n){ return String(n).padStart(2,'0'); }

  function fmtCountdown(ms){
    if (ms <= 0) return '¡Es el gran día!';
    const total = Math.floor(ms/1000);
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const dia = (d===1 ? 'día' : 'días');
    return `${d} ${dia} ${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  }

  function startLiveCountdown(){
    if (countdownStarted) return;
    countdownStarted = true;

    // Reutilizamos s2 para pintar la cuenta atrás en dorado
    s1.style.display = 'none';
    s2.className = 'cd';
    s2.id = 'wcd';

    const tick = () => {
      const now = Date.now();
      s2.textContent = fmtCountdown(TARGET.getTime() - now);
    };
    tick(); // primera pintura inmediata
    countdownTimer = setInterval(tick, 1000);
  }

  function revealStrip(){
    // Mostrar tira acoplada, centrada
    strip.classList.add('is-docked');
    // Al revelarse la tira, arrancamos la cuenta atrás
    startLiveCountdown();
  }

  function startCountdown(){
    document.body.classList.add('noscroll');
    overlay.classList.add('visible');
    overlay.setAttribute('aria-hidden','false');

    let n = 3;
    countEl.textContent = n;
    countEl.style.animation = 'none';
    void countEl.offsetWidth;
    countEl.style.animation = '';

    const tick = setInterval(()=>{
      n--;
      if(n>0){
        countEl.textContent = n;
        countEl.style.animation = 'none';
        void countEl.offsetWidth;
        countEl.style.animation = '';
      }else{
        clearInterval(tick);

        overlay.classList.remove('visible');
        overlay.setAttribute('aria-hidden','true');
        playFlash();

        const flashMs = msFromCssVar('--flash-ms', 2000);
        const revealAt = Math.max(0, Math.floor(flashMs * 0.6)); // 60% del flash

        // Revela la tira DURANTE el flash (debajo del overlay blanco)
        setTimeout(()=>{ revealStrip(); }, revealAt);

        // Al terminar el flash, liberamos scroll y desplazamos
        flashEl.addEventListener('animationend', ()=>{
          document.body.classList.remove('noscroll');

          // Ya no mostramos "¡COMPLETADO!" para dejar solo la cuenta atrás
          // (si prefieres mantener un título encima, dímelo y lo añadimos)

          const gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--dock-gap')) || 0;
          const y = pb.getBoundingClientRect().bottom + window.scrollY - gap;
          window.scrollTo({ top: y, behavior:'smooth' });
        }, { once:true });
      }
    }, 1000);
  }

  btn.addEventListener('click', ()=>{
    if(started) return; started = true;
    startCountdown();
  });

  // Limpieza si el usuario navega o recarga raro
  window.addEventListener('beforeunload', ()=> { if (countdownTimer) clearInterval(countdownTimer); });
});
