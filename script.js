// ============================================================
// Padala Venkata Reddy — Portfolio
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initSplash();
  initRailNav();
  initMobileMenu();
  initContactForm();
  initExport();
  initStarfield();
  initTilt();
  initShatter();
  document.getElementById('year').textContent = new Date().getFullYear();
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- Starfield background ---------------- */
function initStarfield(){
  const canvas = document.getElementById('stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  let w, h;

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const density = Math.min(180, Math.floor((w * h) / 9000));
    stars = Array.from({ length: density }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.3 + 0.3,
      baseAlpha: Math.random() * 0.5 + 0.3,
      speed: Math.random() * 0.15 + 0.03,
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() < 0.15 ? 'teal' : (Math.random() < 0.3 ? 'violet' : 'white')
    }));
  }

  const colors = {
    white: '255,255,255',
    teal: '120,240,220',
    violet: '160,140,255'
  };

  let t = 0;
  function draw(){
    ctx.clearRect(0, 0, w, h);
    t += 0.012;
    stars.forEach(s => {
      const twinkle = s.baseAlpha + Math.sin(t * s.speed * 10 + s.phase) * 0.25;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${colors[s.hue]},${Math.max(0, Math.min(1, twinkle))})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (!prefersReducedMotion){
        s.y += s.speed * 0.06;
        if (s.y > h) s.y = 0;
      }
    });
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
}

/* ---------------- 3D tilt on pointer move ---------------- */
function initTilt(){
  if (prefersReducedMotion) return;
  if (window.matchMedia('(pointer: coarse)').matches) return; // skip on touch devices

  const cards = document.querySelectorAll('.tilt');
  cards.forEach(card => {
    const strength = 10;
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `rotateY(${x * strength}deg) rotateX(${-y * strength}deg) translateZ(0)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
  });
}

/* ---------------- Splash screen ---------------- */
function initSplash(){
  const splash = document.getElementById('splash');
  const nameEl = document.getElementById('splashName');
  const fullName = 'Padala Venkata Reddy';
  let i = 0;

  function type(){
    if (i <= fullName.length){
      nameEl.textContent = fullName.slice(0, i);
      i++;
      setTimeout(type, 55);
    }
  }
  type();

  const MIN_DISPLAY = 1900;
  const start = Date.now();
  function dismiss(){
    const elapsed = Date.now() - start;
    const wait = Math.max(0, MIN_DISPLAY - elapsed);
    setTimeout(() => {
      splash.classList.add('hide');
      document.body.style.overflow = '';
    }, wait);
  }
  document.body.style.overflow = 'hidden';
  if (document.readyState === 'complete'){ dismiss(); }
  else { window.addEventListener('load', dismiss); setTimeout(dismiss, 3500); }
}

/* ---------------- Side rail: active section + smooth focus ---------------- */
function initRailNav(){
  const dots = document.querySelectorAll('.rail-dot');
  const sections = [...document.querySelectorAll('main .section')];
  if (!dots.length || !sections.length) return;

  const map = new Map();
  dots.forEach(d => map.set(d.getAttribute('href').slice(1), d));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        dots.forEach(d => d.classList.remove('active'));
        const dot = map.get(entry.target.id);
        if (dot) dot.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));
}

/* ---------------- Mobile menu ---------------- */
function initMobileMenu(){
  const toggle = document.getElementById('mobile-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });

  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---------------- Contact form ---------------- */
const STORAGE_KEY = 'pvr_portfolio_submissions';

function initContactForm(){
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const mobile = form.mobile.value.trim();
    const email = form.email.value.trim();
    const description = form.description.value.trim();

    if (!name || !mobile || !email || !description){
      showStatus(status, 'Please fill in every field before sending.', true);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)){
      showStatus(status, 'That email address doesn\u2019t look right.', true);
      return;
    }

    // Save locally as a backup
    const entry = {
      name, mobile, email, description,
      submittedAt: new Date().toISOString()
    };
    saveSubmission(entry);

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    showStatus(status, 'Sending your message...', false);

    // Send to Google Sheets
    const formData = new FormData();
    formData.append('name', name);
    formData.append('mobile', mobile);
    formData.append('email', email);
    formData.append('description', description);

    fetch('https://script.google.com/macros/s/AKfycbxVdW8qul9UqC4Eu6xc3hJLhgpxVD0Jt8nllA37L8wfL17h5ABT3IJHyXl175PMGU8/exec', {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    })
    .then(() => {
      form.reset();
      showStatus(status, 'Thanks — your message has been recorded.', false);
    })
    .catch(error => {
      console.error('Error!', error);
      showStatus(status, 'Error sending message, but it was saved locally.', true);
    })
    .finally(() => {
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
    });
  });
}

function saveSubmission(entry){
  let list = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) list = JSON.parse(raw);
  } catch (err){
    list = [];
  }
  list.push(entry);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err){
    console.error('Could not save submission locally:', err);
  }
}

function showStatus(el, message, isError){
  el.textContent = message;
  el.classList.toggle('error', !!isError);
}

/* ---------------- Export submissions as CSV (opens fine in Excel) ---------------- */
function initExport(){
  const btn = document.getElementById('exportBtn');
  if (!btn) return;

  // Secretly show the button only if the URL contains ?admin=true
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') === 'true') {
    btn.style.display = 'block';
  }

  btn.addEventListener('click', () => {
    let list = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) list = JSON.parse(raw);
    } catch (err){
      list = [];
    }

    if (!list.length){
      alert('No contact form submissions yet on this device/browser.');
      return;
    }

    const header = ['Name', 'Mobile Number', 'Email', 'Description', 'Submitted At'];
    const rows = list.map(e => [e.name, e.mobile, e.email, e.description, e.submittedAt]);

    const csv = [header, ...rows]
      .map(row => row.map(csvEscape).join(','))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-inquiries-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

function csvEscape(value){
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)){
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/* ---------------- Particle Text Shatter Animation ---------------- */
let cachedTargetPoints = [];

function generateTargetPoints() {
  const scale = 0.5; // Downscale to make pixel scanning 4x faster
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = window.innerWidth * scale;
  canvas.height = window.innerHeight * scale;
  
  const text = "VENKATA REDDY";
  const fontSize = Math.min(window.innerWidth * 0.12, 160) * scale;
  ctx.font = `bold ${fontSize}px "Space Grotesk", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  cachedTargetPoints = [];
  const step = 2; // Step 2 on a 0.5 scale means 4 pixels on screen (very dense)
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const idx = (y * canvas.width + x) * 4;
      if (imgData[idx + 3] > 128) { 
        cachedTargetPoints.push({ x: x / scale, y: y / scale });
      }
    }
  }

  // Shuffle array so particles don't map perfectly linearly (looks better)
  for (let i = cachedTargetPoints.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cachedTargetPoints[i], cachedTargetPoints[j]] = [cachedTargetPoints[j], cachedTargetPoints[i]];
  }
}

// Generate points immediately and re-generate on resize
generateTargetPoints();
window.addEventListener('resize', () => {
    clearTimeout(window.resizePointsTimer);
    window.resizePointsTimer = setTimeout(generateTargetPoints, 200);
});

function initShatter() {
  if (prefersReducedMotion) return;

  const cards = document.querySelectorAll('.edu-card, .exp-card, .project-card, .skill-category-card, .skill-card, .cert-card, .achieve-list li');
  
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (card.classList.contains('is-shattered')) return;
      if (cachedTargetPoints.length === 0) return;
      
      card.classList.add('is-shattered');

      // 1. Create Overlay
      const overlay = document.createElement('div');
      overlay.style.position = 'absolute'; // Absolute to support scrolling
      overlay.style.inset = '0';
      overlay.style.zIndex = '9999';
      overlay.style.pointerEvents = 'none';
      document.body.appendChild(overlay);

      const rect = card.getBoundingClientRect();
      
      // Cap maximum particles for perfectly smooth 60fps performance but dense enough for text
      const maxParticles = 1200; 
      const numParticles = Math.min(cachedTargetPoints.length, maxParticles);
      
      // Calculate grid
      const ratio = rect.width / rect.height;
      const cols = Math.ceil(Math.sqrt(numParticles * ratio));
      const rows = Math.ceil(numParticles / cols);
      
      const pWidth = rect.width / cols;
      const pHeight = rect.height / rows;

      const particles = [];
      const colors = ['#2fe6c4', '#8c6bff', '#ff8a00', '#e52e71', '#f2c811'];

      // Hide card content
      const originalOpacity = window.getComputedStyle(card).opacity;
      card.style.opacity = '0';
      
      const fragment = document.createDocumentFragment();
      let pIdx = 0;
      
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (pIdx >= numParticles) break;
          
          const particle = document.createElement('div');
          particle.style.position = 'absolute';
          // Use absolute document coordinates
          const startX = rect.left + window.scrollX + (x * pWidth);
          const startY = rect.top + window.scrollY + (y * pHeight);
          
          particle.style.width = Math.ceil(pWidth) + 'px';
          particle.style.height = Math.ceil(pHeight) + 'px';
          const color = colors[Math.floor(Math.random() * colors.length)];
          particle.style.backgroundColor = color;
          particle.style.borderRadius = '50%'; // Make them perfectly circular for a magical look
          
          // Start at 0, 0 and use transform for initial position (GPU acceleration)
          particle.style.left = '0px';
          particle.style.top = '0px';
          particle.style.transform = `translate3d(${startX}px, ${startY}px, 0) scale(1)`;
          
          const delay = Math.random() * 0.3;
          // ONLY transition transform! No layout repaints!
          particle.style.transition = `transform 1.2s cubic-bezier(0.25, 1, 0.5, 1) ${delay}s`;
          particle.style.willChange = 'transform';
          
          fragment.appendChild(particle);
          
          // Destination scale: smaller dots (3.5px) for finer text resolution
          const targetScale = 3.5 / Math.max(pWidth, pHeight);
          
          particles.push({
            el: particle,
            startX,
            startY,
            // Add scroll offsets to cached viewport points
            targetX: cachedTargetPoints[pIdx].x + window.scrollX,
            targetY: cachedTargetPoints[pIdx].y + window.scrollY,
            targetScale
          });
          
          pIdx++;
        }
      }
      
      // Append all at once for huge performance boost
      overlay.appendChild(fragment);

      // 2. Trigger Animation to Text
      // Small timeout to ensure DOM recognizes the initial transform
      setTimeout(() => {
        particles.forEach(p => {
          p.el.style.transform = `translate3d(${p.targetX}px, ${p.targetY}px, 0) scale(${p.targetScale})`;
        });
      }, 50);

      // 3. Restore after delay
      setTimeout(() => {
        particles.forEach(p => {
          const delay = Math.random() * 0.2;
          p.el.style.transition = `transform 0.8s cubic-bezier(0.5, 0, 0.2, 1) ${delay}s`;
          p.el.style.transform = `translate3d(${p.startX}px, ${p.startY}px, 0) scale(1)`;
        });

        setTimeout(() => {
          document.body.removeChild(overlay);
          card.style.opacity = originalOpacity;
          card.classList.remove('is-shattered');
        }, 1100);
      }, 3500);

    });
  });
}
