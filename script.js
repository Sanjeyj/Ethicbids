/**
 * EthicBids Technologies — Premium Interactions Engine
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
  const duration = 1200; // Reduced from 1800ms for better LCP
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
   2. CUSTOM CURSOR WITH PRECISION DOT & GLOW
   ═══════════════════════════════════════════════════════ */
(function initCursor() {
  if (isMobile() || prefersReducedMotion) return;

  const glow = $('#cursor-glow');
  const dot = $('#cursor-dot');
  if (!glow && !dot) return;

  document.body.classList.add('has-custom-cursor');

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Instant tracking for the precision center dot
    if (dot) {
      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';
    }
  });

  document.addEventListener('mouseleave', () => {
    if (glow) glow.style.opacity = '0';
    if (dot) dot.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    if (glow) glow.style.opacity = '1';
    if (dot) dot.style.opacity = '1';
  });

  // Hover state detection on interactive items
  const interactiveSelector = 'a, button, input, select, textarea, .magnetic-btn, .tilt-card, .contact-card, .qr-preview-card, .tech-chip';
  document.addEventListener('mouseover', e => {
    if (dot && e.target.closest(interactiveSelector)) {
      dot.classList.add('hovered');
    }
  });
  document.addEventListener('mouseout', e => {
    if (dot && e.target.closest(interactiveSelector)) {
      dot.classList.remove('hovered');
    }
  });

  // Smooth lerping for the ambient trailing glow
  function animateCursorGlow() {
    if (glow) {
      cursorX = lerp(cursorX, mouseX, 0.12);
      cursorY = lerp(cursorY, mouseY, 0.12);
      glow.style.left = cursorX + 'px';
      glow.style.top = cursorY + 'px';
    }
    requestAnimationFrame(animateCursorGlow);
  }
  animateCursorGlow();
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
   4. HERO CANVAS — HIGH-DPI & INTERSECTION OPTIMIZED
   ═══════════════════════════════════════════════════════ */
(function initHeroCanvas() {
  const canvas = $('#heroCanvas');
  const heroSection = $('#hero');
  if (!canvas || !heroSection || prefersReducedMotion) return;

  const ctx = canvas.getContext('2d');
  let W, H, cols, rows, gridSize;
  let dpr = 1;
  let animFrame = null;
  let isCanvasActive = true;
  let t = 0;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;

    // High-DPI scaling: physical pixel buffer scaled by devicePixelRatio
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

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
    if (!isCanvasActive) return;
    drawGrid();
    animFrame = requestAnimationFrame(loop);
  }

  // Optimize: Disconnect loop when hero is off-screen
  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isCanvasActive = entry.isIntersecting;
      if (isCanvasActive) {
        if (!animFrame) {
          animFrame = requestAnimationFrame(loop);
        }
      } else {
        if (animFrame) {
          cancelAnimationFrame(animFrame);
          animFrame = null;
        }
      }
    });
  }, { threshold: 0.02 });

  heroObserver.observe(heroSection);

  window.addEventListener('resize', resize, { passive: true });
  resize();
  loop();

  function loop() {
    if (!canvasVisible) { animFrame = null; return; }
    drawGrid();
    animFrame = requestAnimationFrame(loop);
  }

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

/* ═══════════════════════════════════════════════════════
   18. INTERACTIVE CONTACT FORM (FORMSPREE & ASYNC AJAX)
   ═══════════════════════════════════════════════════════ */
(function initContactForm() {
  const form = $('#contactForm');
  const submitBtn = $('#contactSubmitBtn');
  const statusEl = $('#formStatus');
  if (!form || !submitBtn || !statusEl) return;

  const btnText = submitBtn.querySelector('.btn-text');
  const originalText = btnText ? btnText.textContent : 'Send Message';

  form.addEventListener('submit', async e => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'Sending Message...';
    submitBtn.classList.add('loading');
    statusEl.className = 'form-status loading';
    statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting your message to EthicBids Technologies...';

    const formData = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        statusEl.className = 'form-status success';
        statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Thank you! Your message has been received. Our team will contact you within 24 hours.';
        form.reset();
      } else {
        const data = await response.json().catch(() => ({}));
        const errMessage = (data && data.errors && data.errors.map(err => err.message).join(', ')) ||
                           'Unable to submit form at this moment.';
        statusEl.className = 'form-status error';
        statusEl.innerHTML = `<i class="fas fa-triangle-exclamation"></i> ${errMessage} <br><a href="mailto:ethicbids@gmail.com?subject=Inquiry%20via%20EthicBids%20Website" style="text-decoration:underline;color:#fff;margin-top:6px;display:inline-block;">Click here to email us directly &rarr;</a>`;
      }
    } catch (err) {
      statusEl.className = 'form-status error';
      statusEl.innerHTML = `<i class="fas fa-circle-exclamation"></i> Network error. <a href="mailto:ethicbids@gmail.com?subject=Inquiry%20via%20EthicBids%20Website" style="text-decoration:underline;color:#fff;font-weight:600;">Click to email us directly &rarr;</a> or reach us on WhatsApp at +91 6383649726.`;
    } finally {
      submitBtn.disabled = false;
      if (btnText) btnText.textContent = originalText;
      submitBtn.classList.remove('loading');
    }
  });
})();

/* ═══════════════════════════════════════════════════════
   19. WHATSAPP QR CODE MODAL & FLOATING TRIGGERS
   ═══════════════════════════════════════════════════════ */
(function initWhatsAppQrModal() {
  const modal = $('#qrModal');
  const closeBtn = $('#qrModalClose');
  const backdrop = $('#qrModalBackdrop');
  const openButtons = [
    $('#openQrModalBtn'),
    $('#openQrBtn'),
    $('#floatingQrBtn'),
    $('#qrPreviewCard')
  ].filter(Boolean);

  if (!modal) return;

  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openButtons.forEach(btn => {
    btn.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      e.preventDefault();
      openModal();
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
})();

/* ═══════════════════════════════════════════════════════
   20. RESEARCH & PRICING FILTER TABS
   ═══════════════════════════════════════════════════════ */
(function initPricingTabs() {
  const tabs = $$('.pricing-tab');
  const cards = $$('.pricing-card');
  if (!tabs.length || !cards.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const filter = tab.dataset.filter;

      cards.forEach(card => {
        const category = card.dataset.category;
        if (filter === 'all' || category === filter) {
          card.classList.remove('pricing-hidden');
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = '';
          });
        } else {
          card.classList.add('pricing-hidden');
        }
      });
    });
  });
})();

/* ═══════════════════════════════════════════════════════
   21. PRICING TO CONTACT FORM AUTO-SELECTION
   ═══════════════════════════════════════════════════════ */
(function initPricingFormSelect() {
  const selectBtns = $$('.pricing-btn-select');
  const serviceSelect = $('#contactService');
  const contactSection = $('#contact');
  if (!selectBtns.length || !serviceSelect || !contactSection) return;

  selectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const serviceName = btn.dataset.service;
      if (!serviceName) return;

      // Find matching option or closest match
      let matched = false;
      for (const opt of serviceSelect.options) {
        if (opt.value === serviceName || opt.value.includes(serviceName) || serviceName.includes(opt.value)) {
          serviceSelect.value = opt.value;
          matched = true;
          break;
        }
      }

      // Smooth scroll to contact form
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Highlight select field
      setTimeout(() => {
        serviceSelect.focus();
        serviceSelect.style.borderColor = 'var(--cyan)';
        serviceSelect.style.boxShadow = '0 0 20px rgba(0, 255, 229, 0.4)';
        setTimeout(() => {
          serviceSelect.style.borderColor = '';
          serviceSelect.style.boxShadow = '';
        }, 2200);
      }, 500);
    });
  });
})();

/* ═══════════════════════════════════════════════════════
   22. POSTER PREVIEW MODAL
   ═══════════════════════════════════════════════════════ */
(function initPosterModal() {
  const modal = $('#posterModal');
  const closeBtn = $('#posterModalClose');
  const backdrop = $('#posterModalBackdrop');
  const triggers = [$('#openPosterModalBtn'), $('#posterCardTrigger')].filter(Boolean);

  if (!modal) return;

  function openPosterModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }

  function closePosterModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  triggers.forEach(trig => {
    trig.addEventListener('click', e => {
      e.preventDefault();
      openPosterModal();
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closePosterModal);
  if (backdrop) backdrop.addEventListener('click', closePosterModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closePosterModal();
    }
  });
})();

console.log('%cEthicBids Technologies', 'font-size:16px;font-weight:bold;color:#00BFFF;');
console.log('%cWhere Ethics Meets Technology', 'font-size:11px;color:#888;');
