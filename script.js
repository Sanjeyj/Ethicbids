/**
 * EthicsBids Technologies — Premium Interactions Engine
 * Handles: Preloader, Cursor, Navbar, Canvas Grid, Particles,
 *          Scroll Reveal, Magnetic Buttons, Card Tilt, Count-Up,
 *          Timeline, Mobile Menu, Back to Top
 */

'use strict';

/* ─── UTILITIES ─────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const lerp = (a, b, t) => a + (b - a) * t;

/* ─── STATE ─────────────────────────────────────────── */
let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;
let rafId = null;
let scrollY = 0;
const isMobile = () => window.innerWidth <= 768;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══════════════════════════════════════════════════════
   1. PRELOADER
   ═══════════════════════════════════════════════════════ */
(function initPreloader() {
  const preloader = $('#preloader');
  const bar = $('#preloaderBar');
  if (!preloader || !bar) return;

  let progress = 0;
  const duration = 1800;
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    progress = clamp(elapsed / duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    bar.style.width = (eased * 100) + '%';

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      setTimeout(() => {
        preloader.classList.add('hidden');
        document.body.style.overflow = '';
        triggerHeroAnimations();
      }, 300);
    }
  }

  document.body.style.overflow = 'hidden';
  requestAnimationFrame(tick);
})();

function triggerHeroAnimations() {
  $$('.reveal-up').forEach(el => {
    el.style.animationPlayState = 'running';
  });
}

/* ═══════════════════════════════════════════════════════
   2. CUSTOM CURSOR
   ═══════════════════════════════════════════════════════ */
(function initCursor() {
  if (isMobile() || prefersReducedMotion) return;

  const cursor = $('#cursor-glow');
  if (!cursor) return;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
  });

  function animateCursor() {
    cursorX = lerp(cursorX, mouseX, 0.08);
    cursorY = lerp(cursorY, mouseY, 0.08);
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();
})();

/* ═══════════════════════════════════════════════════════
   3. NAVBAR
   ═══════════════════════════════════════════════════════ */
(function initNavbar() {
  const navbar = $('#navbar');
  const navToggle = $('#navToggle');
  const mobileMenu = $('#mobileMenu');
  const navLinks = $$('.nav-link');
  const mobileLinks = $$('.mobile-link');
  if (!navbar) return;

  // Scroll behavior
  function onScroll() {
    scrollY = window.scrollY;
    navbar.classList.toggle('scrolled', scrollY > 40);

    // Back to top
    const btt = $('#backToTop');
    if (btt) btt.classList.toggle('visible', scrollY > 400);

    // Active nav link
    const sections = $$('section[id]');
    let current = '';
    sections.forEach(s => {
      const top = s.offsetTop - 120;
      if (scrollY >= top) current = s.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === current);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu toggle
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open);
      mobileMenu.classList.toggle('open', open);
      mobileMenu.setAttribute('aria-hidden', !open);
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!navbar.contains(e.target)) {
        navToggle.classList.remove('open');
        mobileMenu.classList.remove('open');
      }
    });
  }

  // Back to top
  const btt = $('#backToTop');
  if (btt) {
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
})();

/* ═══════════════════════════════════════════════════════
   4. HERO CANVAS — ANIMATED GRID
   ═══════════════════════════════════════════════════════ */
(function initHeroCanvas() {
  const canvas = $('#heroCanvas');
  if (!canvas || prefersReducedMotion) return;

  const ctx = canvas.getContext('2d');
  let W, H, cols, rows, gridSize;
  let animFrame;
  let t = 0;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    gridSize = isMobile() ? 50 : 70;
    cols = Math.ceil(W / gridSize) + 1;
    rows = Math.ceil(H / gridSize) + 1;
  }

  function drawGrid() {
    ctx.clearRect(0, 0, W, H);

    const mx = mouseX;
    const my = mouseY;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * gridSize;
        const y = j * gridSize;

        const dx = mx - x;
        const dy = my - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 250;
        const proximity = clamp(1 - dist / maxDist, 0, 1);

        // Wave effect
        const wave = Math.sin(t * 0.8 + i * 0.4 + j * 0.3) * 0.5 + 0.5;
        const baseAlpha = 0.04 + wave * 0.04;
        const alpha = baseAlpha + proximity * 0.25;

        // Draw dot
        ctx.beginPath();
        ctx.arc(x, y, 1 + proximity * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 191, 255, ${alpha})`;
        ctx.fill();

        // Draw connecting lines (right and down)
        if (i < cols - 1) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + gridSize, y);
          ctx.strokeStyle = `rgba(0, 191, 255, ${baseAlpha * 0.5})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
        if (j < rows - 1) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + gridSize);
          ctx.strokeStyle = `rgba(0, 191, 255, ${baseAlpha * 0.5})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    t += 0.016;
  }

  function loop() {
    drawGrid();
    animFrame = requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  loop();
})();

/* ═══════════════════════════════════════════════════════
   5. HERO PARTICLES
   ═══════════════════════════════════════════════════════ */
(function initParticles() {
  const container = $('#heroParticles');
  if (!container || prefersReducedMotion) return;

  const count = isMobile() ? 20 : 40;
  const particles = [];

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const size = Math.random() * 3 + 1;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const duration = Math.random() * 20 + 15;
    const delay = Math.random() * -20;
    const opacity = Math.random() * 0.5 + 0.1;
    const hue = Math.random() < 0.6 ? 197 : (Math.random() < 0.5 ? 174 : 270);

    p.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: hsl(${hue}, 100%, 60%);
      opacity: ${opacity};
      left: ${x}%;
      top: ${y}%;
      animation: particleFloat ${duration}s ${delay}s ease-in-out infinite alternate;
      pointer-events: none;
    `;
    container.appendChild(p);
    particles.push(p);
  }

  // Inject keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes particleFloat {
      0% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(${Math.random() * 60 - 30}px, ${Math.random() * 60 - 30}px) scale(1.2); }
      66% { transform: translate(${Math.random() * 60 - 30}px, ${Math.random() * 60 - 30}px) scale(0.8); }
      100% { transform: translate(${Math.random() * 60 - 30}px, ${Math.random() * 60 - 30}px) scale(1); }
    }
    #heroParticles {
      position: absolute; inset: 0;
      z-index: 1;
      overflow: hidden;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
})();

/* ═══════════════════════════════════════════════════════
   6. MAGNETIC BUTTONS
   ═══════════════════════════════════════════════════════ */
(function initMagneticButtons() {
  if (isMobile() || prefersReducedMotion) return;

  $$('.magnetic-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.3;
      const dy = (e.clientY - cy) * 0.3;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
})();

/* ═══════════════════════════════════════════════════════
   7. 3D CARD TILT
   ═══════════════════════════════════════════════════════ */
(function initCardTilt() {
  if (isMobile() || prefersReducedMotion) return;

  $$('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rx = clamp((e.clientY - cy) / rect.height * 10, -8, 8);
      const ry = clamp((e.clientX - cx) / rect.width * -10, -8, 8);
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ═══════════════════════════════════════════════════════
   8. INTERSECTION OBSERVER — SCROLL REVEAL
   ═══════════════════════════════════════════════════════ */
(function initScrollReveal() {
  const elements = $$('.scroll-reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  });

  elements.forEach(el => observer.observe(el));
})();

/* ═══════════════════════════════════════════════════════
   9. COUNT-UP ANIMATION
   ═══════════════════════════════════════════════════════ */
(function initCountUp() {
  const counters = $$('.counter');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 2000;
        const start = performance.now();

        function update(now) {
          const elapsed = now - start;
          const progress = clamp(elapsed / duration, 0, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          const current = Math.round(eased * target);
          el.textContent = current + (progress >= 1 ? suffix : '');

          if (progress < 1) {
            requestAnimationFrame(update);
          }
        }
        requestAnimationFrame(update);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
})();

/* ═══════════════════════════════════════════════════════
   10. TIMELINE LINE DRAW
   ═══════════════════════════════════════════════════════ */
(function initTimeline() {
  const timelineLine = $('#timelineLine');
  if (!timelineLine) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        timelineLine.classList.add('drawn');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  observer.observe(timelineLine.parentElement || timelineLine);
})();

/* ═══════════════════════════════════════════════════════
   11. SMOOTH SCROLL FOR ANCHOR LINKS
   ═══════════════════════════════════════════════════════ */
(function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

/* ═══════════════════════════════════════════════════════
   12. VISION TEXT WORD REVEAL ON SCROLL
   ═══════════════════════════════════════════════════════ */
(function initVisionText() {
  const visionEl = $('#visionText');
  if (!visionEl || prefersReducedMotion) return;

  const text = visionEl.textContent.trim();
  const words = text.split(' ');
  visionEl.innerHTML = words.map((word, i) =>
    `<span class="vision-word" style="display:inline-block;opacity:0;transform:translateY(15px);transition:opacity 0.5s ${i * 0.06}s ease,transform 0.5s ${i * 0.06}s ease;">${word}&nbsp;</span>`
  ).join('');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        $$('.vision-word').forEach(w => {
          w.style.opacity = '1';
          w.style.transform = 'translateY(0)';
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  observer.observe(visionEl);
})();

/* ═══════════════════════════════════════════════════════
   13. TECH CHIPS — RANDOMIZE FLOAT PHASE
   ═══════════════════════════════════════════════════════ */
(function initTechChips() {
  $$('.tech-chip').forEach(chip => {
    const delay = (Math.random() * -4).toFixed(2) + 's';
    chip.style.animationDelay = delay;
  });
})();

/* ═══════════════════════════════════════════════════════
   14. BENTO CARD GLOW ON HOVER (COLOR MATCH)
   ═══════════════════════════════════════════════════════ */
(function initBentoGlow() {
  $$('.bento-card').forEach(card => {
    const accent = card.dataset.accent || '#00BFFF';
    card.addEventListener('mouseenter', () => {
      card.style.borderColor = accent + '33';
      card.style.boxShadow = `0 8px 40px ${accent}20`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.borderColor = '';
      card.style.boxShadow = '';
    });
  });
})();

/* ═══════════════════════════════════════════════════════
   15. PERFORMANCE: PAUSE ANIMATIONS ON HIDDEN TAB
   ═══════════════════════════════════════════════════════ */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    document.body.classList.add('paused');
  } else {
    document.body.classList.remove('paused');
  }
});

// Add CSS for paused animations
(function() {
  const s = document.createElement('style');
  s.textContent = `
    body.paused * {
      animation-play-state: paused !important;
    }
  `;
  document.head.appendChild(s);
})();

/* ═══════════════════════════════════════════════════════
   16. NAVBAR MOBILE: CLOSE ON SCROLL
   ═══════════════════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  const navToggle = $('#navToggle');
  const mobileMenu = $('#mobileMenu');
  if (navToggle && navToggle.classList.contains('open')) {
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    if (mobileMenu) {
      mobileMenu.classList.remove('open');
      mobileMenu.setAttribute('aria-hidden', 'true');
    }
  }
}, { passive: true });

/* ═══════════════════════════════════════════════════════
   17. PAGE TRANSITION — SUBTLE FADE ON LOAD
   ═══════════════════════════════════════════════════════ */
(function initPageFade() {
  document.documentElement.style.opacity = '0';
  document.documentElement.style.transition = 'opacity 0.5s ease';
  window.addEventListener('load', () => {
    requestAnimationFrame(() => {
      document.documentElement.style.opacity = '1';
    });
  });
})();

console.log('%cEthicsBids Technologies', 'font-size:16px;font-weight:bold;color:#00BFFF;');
console.log('%cWhere Ethics Meets Technology', 'font-size:11px;color:#888;');
