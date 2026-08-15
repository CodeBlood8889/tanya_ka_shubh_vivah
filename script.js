// FORCES THE BROWSER TO RESET TO THE TOP ON EVERY SINGLE PAGE REFRESH
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// 1. SMART AUDIO CONTROLLER (Bulletproof Android & iOS Fix)
(function initLoaderAndAudio() {
  const loader = document.getElementById('introLoader');
  const audio = document.getElementById('weddingAudio');
  let isUnlocked = false;

  function dismissAndPlay(e) {
    if (isUnlocked) return;
    isUnlocked = true;

    if (loader) {
      loader.classList.add('is-hidden');
    }

    audio.volume = 1;
    audio.load(); 
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log("Audio blocked by browser, attaching fallback:", error);
        document.addEventListener('touchstart', () => { audio.play(); }, { once: true });
      });
    }

    startPetals();
  }

  if (loader) {
    loader.addEventListener('touchend', dismissAndPlay); 
    loader.addEventListener('click', dismissAndPlay);
  }

  document.addEventListener('click', dismissAndPlay, { once: true });
  document.addEventListener('touchend', dismissAndPlay, { once: true, passive: true });
})();

// 2. Petal Generation
function startPetals() {
  const container = document.getElementById('petalCanvas');
  if (!container || container.children.length > 0) return;
  const totalPetals = 20; 

  for (let i = 0; i < totalPetals; i++) {
    const petal = document.createElement('div');
    petal.className = 'falling-petal';
    const width = 9 + Math.random() * 12;
    const height = width * 1.1; 
    petal.style.width = width + 'px';
    petal.style.height = height + 'px';
    petal.style.left = (Math.random() * 80 + 20) + 'vw';
    const duration = 6 + Math.random() * 7;
    const delay = Math.random() * 3; 
    petal.style.animationDuration = duration + 's';
    petal.style.animationDelay = delay + 's';
    container.appendChild(petal);
  }
}

// 3. Native Scroll Reveal
(function(){
  var targets = document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){
    targets.forEach(function(t){ t.classList.add('is-visible'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach(function(t){ io.observe(t); });
})();

// 4. INFINITE SCROLL CAROUSEL & DYNAMIC BACKGROUND
(function(){
  const carouselContainer = document.getElementById('eventCarousel');
  const eventsSection = document.getElementById('eventsSection'); 
  if(!carouselContainer) return;

  const originalCards = Array.from(carouselContainer.querySelectorAll('.event-card'));
  const swipeHint = document.getElementById('swipeHint');
  
  if(!originalCards.length) return;

  // Clone the cards so it creates a seamless infinite loop
  originalCards.forEach(card => {
    const clone = card.cloneNode(true);
    carouselContainer.appendChild(clone);
  });

  const allCards = document.querySelectorAll('.event-card');
  let isAutoScrolling = false; 
  let autoScrollSpeed = 1; 
  let animationFrameId;
  let resumeTimeout;
  let totalOriginalWidth = 0;

  // Calculates the exact pixel width to snap back seamlessly
  function calculateWidth() {
    const firstCard = originalCards[0];
    const style = window.getComputedStyle(carouselContainer);
    const gap = parseFloat(style.gap) || 0;
    totalOriginalWidth = (firstCard.offsetWidth + gap) * originalCards.length;
  }
  
  calculateWidth();
  window.addEventListener('resize', calculateWidth);

  function runAutoScroll() {
    if (!isAutoScrolling) return;
    
    carouselContainer.scrollLeft += autoScrollSpeed;

    // The Magic Infinite Loop Snap
    if (carouselContainer.scrollLeft >= totalOriginalWidth) {
       carouselContainer.scrollLeft -= totalOriginalWidth;
    }

    animationFrameId = requestAnimationFrame(runAutoScroll);
  }

  const sectionObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isAutoScrolling) {
      // Adjusted delay: Waits exactly 2 seconds before the drift begins
      setTimeout(() => {
          isAutoScrolling = true;
          runAutoScroll();
      }, 2000);
      sectionObserver.disconnect();
    }
  }, { threshold: 0.3 });
  sectionObserver.observe(carouselContainer);

  function pauseForManual() {
    isAutoScrolling = false;
    cancelAnimationFrame(animationFrameId);
    carouselContainer.classList.add('is-manual');
    
    if(swipeHint) {
      swipeHint.style.opacity = '0';
      swipeHint.style.pointerEvents = 'none';
    }
    clearTimeout(resumeTimeout);
  }

  function queueResume() {
    clearTimeout(resumeTimeout);
    resumeTimeout = setTimeout(() => {
        isAutoScrolling = true;
        carouselContainer.classList.remove('is-manual'); 
        runAutoScroll();
    }, 2000); 
  }

  carouselContainer.addEventListener('touchstart', pauseForManual, { passive: true });
  carouselContainer.addEventListener('touchmove', pauseForManual, { passive: true });
  carouselContainer.addEventListener('mousedown', pauseForManual, { passive: true });
  carouselContainer.addEventListener('mousemove', (e) => {
    if (e.buttons > 0) pauseForManual(); 
  }, { passive: true });
  
  carouselContainer.addEventListener('touchend', queueResume, { passive: true });
  carouselContainer.addEventListener('mouseup', queueResume, { passive: true });
  carouselContainer.addEventListener('mouseleave', queueResume, { passive: true });
  
  carouselContainer.addEventListener('wheel', () => {
    pauseForManual();
    queueResume();
  }, { passive: true });

  if(!('IntersectionObserver' in window)) {
    allCards.forEach(card => card.classList.add('is-focused'));
    return;
  }
  
  const carouselObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-focused');
        
        if (eventsSection) {
          const newColor = entry.target.getAttribute('data-bg-color');
          if (newColor) {
            eventsSection.style.backgroundColor = newColor;
          }
        }
      } else {
        entry.target.classList.remove('is-focused');
      }
    });
  }, {
    root: carouselContainer,
    rootMargin: '0px -30% 0px -30%', 
    threshold: 0.1
  });

  allCards.forEach(card => carouselObserver.observe(card));
})();

// 5. RSVP FORM SUBMISSION TO GOOGLE SHEETS
(function initRSVP() {
  const scriptURL = 'https://script.google.com/macros/s/AKfycbzS6wicYnTgnOOFgOkIuovFL11GRwcs5NO4coQtDFTLgymhT1QUjMfJ2MVP6EC9_h0v/exec';
  
  const form = document.getElementById('rsvpForm');
  const btn = document.getElementById('rsvpBtn');

  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    
    const originalText = btn.innerText;
    btn.innerText = 'Sending...';
    btn.disabled = true;
    btn.style.opacity = '0.8';

    fetch(scriptURL, { method: 'POST', body: new FormData(form) })
      .then(response => {
        btn.innerText = 'RSVP Sent Beautifully! ✨';
        btn.style.background = '#2B231F'; 
        btn.style.color = '#B5893F'; 
        form.reset();
        
        setTimeout(() => {
          btn.innerText = originalText;
          btn.disabled = false;
          btn.style.background = ''; 
          btn.style.color = '';
          btn.style.opacity = '1';
        }, 4000);
      })
      .catch(error => {
        console.error('Error!', error.message);
        btn.innerText = 'Error. Please try again.';
        btn.style.background = 'red';
        btn.disabled = false;
        btn.style.opacity = '1';
      });
  });
})();