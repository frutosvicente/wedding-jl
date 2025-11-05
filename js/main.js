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

  function msFromCssVar(name, fallbackMs){
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const m = v.match(/^(\d+(?:\.\d+)?)(ms|s)$/i);
    if(!m) return fallbackMs;
    const val = parseFloat(m[1]);
    return m[2].toLowerCase()==='s' ? val*1000 : val;
  }

  function playFlash(){
    flashEl.classList.remove('play');
    void flashEl.offsetWidth;           // reinicia animación
    flashEl.classList.add('play');
  }

  function revealStrip(){
    // Mostrar tira acoplada, centrada
    strip.classList.add('is-docked');
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

        // Prepara flash
        overlay.classList.remove('visible');
        overlay.setAttribute('aria-hidden','true');
        playFlash();

        const flashMs = msFromCssVar('--flash-ms', 2000);
        const revealAt = Math.max(0, Math.floor(flashMs * 0.6)); // 60% del flash

        // Revela la tira DURANTE el flash (debajo del overlay blanco)
        setTimeout(()=>{ revealStrip(); }, revealAt);

        // Cuando termina el flash, liberamos scroll, actualizamos textos y centramos
        flashEl.addEventListener('animationend', ()=>{
          document.body.classList.remove('noscroll');

          s1.textContent = '¡COMPLETADO!';
          s2.textContent = 'Desliza para ver la invitación';

          // Centrar viewport justo bajo el photobooth
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
});
