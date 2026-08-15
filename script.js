// 1. SMART AUDIO CONTROLLER (Forces Tap to Enter)
(function initLoaderAndAudio() {
  const loader = document.getElementById('introLoader');
  const audio = document.getElementById('weddingAudio');
  let isUnlocked = false;

  function dismissAndPlay() {
    if (isUnlocked) return;
    isUnlocked = true;

    if (loader) {
      loader.classList.add('is-hidden');
    }

    // Audio plays instantly because the user gave a physical "tap" gesture
    audio.play().catch((err) => {
      console.log("Audio blocked: ", err);
    });

    startPetals();
  }

  // The envelope waits for the user to tap it. No auto-dismiss!
  if (loader) {
    loader.addEventListener('click', dismissAndPlay);
  }

  // Fallbacks just in case the loader isn't present
  document.addEventListener('click', dismissAndPlay, { once: true });
  document.addEventListener('scroll', dismissAndPlay, { once: true, passive: true });
  document.addEventListener('touchstart', dismissAndPlay, { once: true, passive: true });
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

// 4. Smart Continuous Auto-Scroll & Dynamic Background
(function(){
  const carouselContainer = document.getElementById('eventCarousel');
  const eventsSection = document.getElementById('eventsSection'); 
  const cards = document.querySelectorAll('.event-card');
  const swipeHint = document.getElementById('swipeHint');
  
  if(!carouselContainer || !cards.length) return;

  let isAutoScrolling = false; 
  let autoScrollSpeed = 1; 
  let animationFrameId;
  let resumeTimeout;

  function runAutoScroll() {
    if (!isAutoScrolling) return;
    
    carouselContainer.scrollLeft += autoScrollSpeed;

    if (carouselContainer.scrollLeft >= (carouselContainer.scrollWidth - carouselContainer.clientWidth - 2)) {
       isAutoScrolling = false;
       return;
    }

    animationFrameId = requestAnimationFrame(runAutoScroll);
  }

  const sectionObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isAutoScrolling) {
      setTimeout(() => {
          isAutoScrolling = true;
          runAutoScroll();
      }, 1000);
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
      if (carouselContainer.scrollLeft < (carouselContainer.scrollWidth - carouselContainer.clientWidth - 2)) {
        isAutoScrolling = true;
        carouselContainer.classList.remove('is-manual'); 
        runAutoScroll();
      }
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
    cards.forEach(card => card.classList.add('is-focused'));
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

  cards.forEach(card => carouselObserver.observe(card));
})();

// 5. RSVP FORM SUBMISSION TO GOOGLE SHEETS
(function initRSVP() {
  // PASTE YOUR GOOGLE WEB APP URL HERE
  const scriptURL = 'https://script.google.com/macros/s/AKfycbzS6wicYnTgnOOFgOkIuovFL11GRwcs5NO4coQtDFTLgymhT1QUjMfJ2MVP6EC9_h0v/exec';
  
  const form = document.getElementById('rsvpForm');
  const btn = document.getElementById('rsvpBtn');

  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    
    // Change button state to show loading
    const originalText = btn.innerText;
    btn.innerText = 'Sending...';
    btn.disabled = true;
    btn.style.opacity = '0.8';

    // Send data to Google Sheets
    fetch(scriptURL, { method: 'POST', body: new FormData(form) })
      .then(response => {
        // Success State
        btn.innerText = 'RSVP Sent Beautifully! ✨';
        btn.style.background = '#2B231F'; // Dark ink color for success
        btn.style.color = '#B5893F'; // Gold text
        form.reset();
        
        // Reset button after 4 seconds so they can submit another if needed
        setTimeout(() => {
          btn.innerText = originalText;
          btn.disabled = false;
          btn.style.background = ''; 
          btn.style.color = '';
          btn.style.opacity = '1';
        }, 4000);
      })
      .catch(error => {
        // Error State
        console.error('Error!', error.message);
        btn.innerText = 'Error. Please try again.';
        btn.style.background = 'red';
        btn.disabled = false;
        btn.style.opacity = '1';
      });
  });
})();