/* =====================================================
   VEDANSH VISUALS — script.js
   ===================================================== */

/* ---------- 1. Navbar: scroll effect + active link ---------- */
const navbar    = document.getElementById('navbar');
const navLinks  = document.querySelectorAll('.nav-link');
const sections  = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
  /* Glassmorphism kicks in after 50px */
  navbar.classList.toggle('scrolled', window.scrollY > 50);

  /* Highlight active nav link based on scroll position */
  let current = '';
  const scrollMid = window.scrollY + window.innerHeight / 2;
  sections.forEach(sec => {
    if (scrollMid >= sec.offsetTop) current = sec.id;
  });
  /* Fallback: if near bottom of page, activate last section */
  if ((window.innerHeight + window.scrollY) >= document.body.scrollHeight - 10) {
    current = sections[sections.length - 1].id;
  }
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}, { passive: true });


/* ---------- 2. Mobile nav toggle ---------- */
const navToggle  = document.getElementById('navToggle');
const navLinksList = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navLinksList.classList.toggle('open');
  document.body.style.overflow = navLinksList.classList.contains('open') ? 'hidden' : '';
});

/* Close menu when a link is clicked */
navLinksList.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navLinksList.classList.remove('open');
    document.body.style.overflow = '';
  });
});


/* ---------- 3. Portfolio — two-level filter ---------- */
(function () {
  const primaryBtns  = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const pfSub        = document.getElementById('pfSub');

  let activePrimary = 'all';  /* 'all' | 'photo' | 'video' */
  let activeSubCat  = 'all'; /* active sub-category */

  /* Sub-button definitions per primary tab */
  const subDefs = {
    all: [
      { cat: 'all',               label: 'All' },
      { cat: 'wedding-prewedding',label: 'Wedding &amp; Pre-Wedding' },
      { cat: 'cinematic',         label: 'Cinematic' },
      { cat: 'travel',            label: 'Travel' },
      { cat: 'birthday',          label: 'Birthday' },
      { cat: 'reels',             label: 'Social Media Content' },
    ],
    photo: [
      { cat: 'all',               label: 'All Photos' },
      { cat: 'wedding-prewedding',label: 'Wedding &amp; Pre-Wedding' },
      { cat: 'cinematic',         label: 'Cinematic' },
      { cat: 'travel',            label: 'Travel' },
      { cat: 'birthday',          label: 'Birthday' },
      { cat: 'reels',             label: 'Social Media Content' },
    ],
    video: [
      { cat: 'all',               label: 'All Videos' },
      { cat: 'wedding-prewedding',label: 'Wedding &amp; Pre-Wedding' },
      { cat: 'cinematic',         label: 'Cinematic' },
      { cat: 'travel',            label: 'Travel' },
      { cat: 'birthday',          label: 'Birthday' },
      { cat: 'reels',             label: 'Social Media Content' },
    ],
  };

  /* Show/hide the sub-row with animation */
  function showSub() {
    pfSub.classList.add('pf-sub--visible');
    requestAnimationFrame(() => pfSub.classList.add('pf-sub--in'));
  }
  function hideSub() {
    pfSub.classList.remove('pf-sub--in');
    pfSub.addEventListener('transitionend', () => pfSub.classList.remove('pf-sub--visible'), { once: true });
  }

  /* Rebuild sub-row buttons for the given primary tab, preserving active cat if it exists */
  function renderSub(primary) {
    if (primary === 'all') {
      hideSub();
      activeSubCat = 'all';
      return;
    }

    const defs = subDefs[primary];
    /* Keep current sub-cat active only if it exists in the new set */
    const catExists = defs.some(d => d.cat === activeSubCat);
    if (!catExists) activeSubCat = 'all';

    pfSub.innerHTML = defs.map(d =>
      `<button class="pf-sub-btn${d.cat === activeSubCat ? ' active' : ''}" data-cat="${d.cat}">${d.label}</button>`
    ).join('');

    /* Re-attach click handlers */
    pfSub.querySelectorAll('.pf-sub-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        pfSub.querySelectorAll('.pf-sub-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSubCat = btn.dataset.cat;
        applyFilter();
      });
    });

    showSub();
  }

  function applyFilter() {
    let visIdx = 0;
    galleryItems.forEach(item => {
      const isVideo = item.dataset.type === 'video';
      const cat     = item.dataset.category;
      let show = false;

      const typeMatch =
        activePrimary === 'all' ||
        (activePrimary === 'photo' && !isVideo) ||
        (activePrimary === 'video' && isVideo);

      const catMatch =
        activeSubCat === 'all' ||
        cat === activeSubCat ||
        (activeSubCat === 'wedding-prewedding' && (cat === 'wedding' || cat === 'pre-wedding'));

      show = typeMatch && catMatch;

      if (show) {
        item.classList.remove('hidden');
        item.classList.remove('gi-visible');
        const delay = visIdx * 75;
        visIdx++;
        setTimeout(() => item.classList.add('gi-visible'), delay);
      } else {
        item.classList.remove('gi-visible');
        item.classList.add('hidden');
      }
    });
  }

  /* Primary filter clicks */
  primaryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      primaryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activePrimary = btn.dataset.filter;
      renderSub(activePrimary);
      applyFilter();
    });
  });

  /* No initial renderSub needed — sub-row starts hidden when All is active */

  /* expose galleryItems for section 3b below */
  window._galleryItems = galleryItems;
})();


/* ---------- 3b. Portfolio item click — image vs video ---------- */
(function () {
  const galleryItems = window._galleryItems || document.querySelectorAll('.gallery-item');

  /* ---- Video lightbox DOM ---- */
  const vidLightbox = document.getElementById('vidLightbox');
  const vidBackdrop = document.getElementById('vidBackdrop');
  const vidClose    = document.getElementById('vidClose');
  const vidFrame    = document.getElementById('vidFrame');
  const vidTitle    = document.getElementById('vidTitle');

  function openVideo(url, title) {
    vidFrame.src  = url;
    vidTitle.textContent = title || '';
    vidLightbox.classList.add('vl-open');
    document.body.style.overflow = 'hidden';
  }

  function closeVideo() {
    vidLightbox.classList.remove('vl-open');
    vidFrame.src = '';
    document.body.style.overflow = '';
  }

  vidClose.addEventListener('click', closeVideo);
  vidBackdrop.addEventListener('click', closeVideo);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && vidLightbox.classList.contains('vl-open')) closeVideo();
  });

  /* ---- Image lightbox DOM ---- */
  const imgLightbox = document.getElementById('lightbox');
  const lbBackdrop  = document.getElementById('lbBackdrop');
  const lbClose     = document.getElementById('lbClose');
  const lbImg       = document.getElementById('lbImg');
  const lbLoader    = document.getElementById('lbLoader');
  const lbTitle     = document.getElementById('lbTitle');
  const lbCounter   = document.getElementById('lbCounter');
  const lbPrev      = document.getElementById('lbPrev');
  const lbNext      = document.getElementById('lbNext');

  /*
   * activeSet  — the category-scoped image array for the current session.
   * imgIndex   — position within activeSet.
   *
   * Built fresh each time openImage() is called so it always reflects
   * exactly the items that are currently visible (not hidden by the filter).
   * Only image-type items that are NOT hidden are included, giving full
   * isolation between categories.
   */
  let activeSet = [];
  let imgIndex  = 0;

  /* Returns only the visible (non-hidden) image items — respects active filter */
  function getVisibleImageItems() {
    return Array.from(galleryItems).filter(
      el => el.dataset.type !== 'video' && !el.classList.contains('hidden')
    );
  }

  /* Update arrow disabled state based on current position in activeSet */
  function syncArrows() {
    lbPrev.disabled = imgIndex === 0;
    lbNext.disabled = imgIndex === activeSet.length - 1;
  }

  function openImage(item) {
    /* Snapshot the currently visible image items at the moment of opening */
    activeSet = getVisibleImageItems();
    imgIndex  = activeSet.indexOf(item);
    /* Fallback: item not found (shouldn't happen, but be safe) */
    if (imgIndex === -1) imgIndex = 0;
    showImgAt(imgIndex);
    imgLightbox.classList.add('lb-open');
    document.body.style.overflow = 'hidden';
  }

  function closeImage() {
    imgLightbox.classList.remove('lb-open');
    document.body.style.overflow = '';
    /* Clear disabled state so arrows are clean on next open */
    lbPrev.disabled = false;
    lbNext.disabled = false;
  }

  function showImgAt(idx) {
    const el  = activeSet[idx];
    const src = el.querySelector('img').src;
    const ttl = el.dataset.title || el.dataset.category || '';
    lbImg.classList.add('lb-loading');
    lbLoader.classList.add('active');
    lbImg.src = src;
    lbImg.alt = ttl;
    lbTitle.textContent   = ttl;
    lbCounter.textContent = `${idx + 1} / ${activeSet.length}`;
    lbImg.onload = () => {
      lbImg.classList.remove('lb-loading');
      lbLoader.classList.remove('active');
    };
    syncArrows();
  }

  function navigateImg(dir) {
    const next = imgIndex + dir;
    /* Hard stop at boundaries — never wrap into another category */
    if (next < 0 || next >= activeSet.length) return;
    imgIndex = next;
    showImgAt(imgIndex);
  }

  lbClose.addEventListener('click', closeImage);
  lbBackdrop.addEventListener('click', closeImage);
  lbPrev.addEventListener('click', () => navigateImg(-1));
  lbNext.addEventListener('click', () => navigateImg(1));

  document.addEventListener('keydown', e => {
    if (!imgLightbox.classList.contains('lb-open')) return;
    if (e.key === 'Escape')     closeImage();
    if (e.key === 'ArrowLeft')  navigateImg(-1);
    if (e.key === 'ArrowRight') navigateImg(1);
  });

  /* Touch swipe — respects the same hard-stop boundary */
  let touchX = 0;
  imgLightbox.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  imgLightbox.addEventListener('touchend',   e => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) navigateImg(diff > 0 ? 1 : -1);
  }, { passive: true });

  /* ---- Attach click handler to every gallery item ---- */
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      if (item.dataset.type === 'video') {
        openVideo(item.dataset.video, item.dataset.title);
      } else {
        openImage(item);
      }
    });
  });

})();


/* ---------- 4. Scroll-reveal animation ---------- */
const revealEls = document.querySelectorAll(
  '.contact-grid, .section-title, .section-label'
);

/* Add reveal class to each element */
revealEls.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), 0);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => revealObserver.observe(el));

/* ---- Portfolio items stagger reveal ---- */
(function () {
  const items = document.querySelectorAll('#portfolio .gallery-item');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const idx   = Array.from(items).indexOf(entry.target);
      const delay = idx * 100; /* 100ms stagger per card */
      setTimeout(() => entry.target.classList.add('gi-visible'), delay);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  items.forEach(item => observer.observe(item));
})();

/* ---- Service cards stagger reveal ---- */
(function () {
  const cards = document.querySelectorAll('#services .service-card');
  if (!cards.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const idx   = Array.from(cards).indexOf(entry.target);
      const delay = idx * 120; /* 120ms stagger per card */
      setTimeout(() => entry.target.classList.add('sc-visible'), delay);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  cards.forEach(card => observer.observe(card));
})();

/* ---- Pricing cards stagger reveal ---- */
(function () {
  const cards = document.querySelectorAll('#gallery .pc');
  if (!cards.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const idx   = Array.from(cards).indexOf(entry.target);
      const delay = idx * 130; /* 130ms stagger per card */
      setTimeout(() => entry.target.classList.add('pc-visible'), delay);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  cards.forEach(card => observer.observe(card));
})();


/* ---------- 5. Contact form — WhatsApp redirect ---------- */
(function () {

  const OWNER_WA = '918710005016'; /* E.164, no + sign */

  const formMsg = document.getElementById('formMsg');
  const btn     = document.getElementById('btnDiscuss');

  /* Field refs */
  const fName   = document.getElementById('cfName');
  const fWa     = document.getElementById('cfWa');
  const fEmail  = document.getElementById('cfEmail');
  const fType   = document.getElementById('cfType');
  const fBudget = document.getElementById('cfBudget');
  const fDesc   = document.getElementById('cfDesc');

  /* Error span refs */
  const eName  = document.getElementById('cfErrName');
  const eWa    = document.getElementById('cfErrWa');
  const eEmail = document.getElementById('cfErrEmail');
  const eType  = document.getElementById('cfErrType');
  const eDesc  = document.getElementById('cfErrDesc');

  function showMsg(text, color) {
    formMsg.style.color = color;
    formMsg.textContent = text;
    clearTimeout(formMsg._t);
    formMsg._t = setTimeout(() => (formMsg.textContent = ''), 6000);
  }

  function setErr(span, input, msg) {
    span.textContent = msg;
    input.style.borderColor = msg ? '#e05c5c' : '';
    input.style.boxShadow   = msg ? '0 0 0 3px rgba(224,92,92,.1)' : '';
  }

  /* Live-clear errors on input */
  [[fName, eName], [fWa, eWa], [fEmail, eEmail], [fType, eType], [fDesc, eDesc]].forEach(([el, err]) => {
    el.addEventListener('input', () => setErr(err, el, ''));
  });

  btn.addEventListener('click', () => {
    const name   = fName.value.trim();
    const wa     = fWa.value.trim();
    const email  = fEmail.value.trim();
    const type   = fType.value;
    const budget = fBudget.value.trim();
    const desc   = fDesc.value.trim();

    /* Validate */
    let valid = true;
    if (!name)  { setErr(eName,  fName,  'Please enter your full name.');          valid = false; }
    if (!wa)    { setErr(eWa,    fWa,    'Please enter your WhatsApp number.');     valid = false; }
    if (!email) { setErr(eEmail, fEmail, 'Please enter your email address.');       valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  setErr(eEmail, fEmail, 'Please enter a valid email address.');     valid = false; }
    if (!type)  { setErr(eType,  fType,  'Please select a project type.');          valid = false; }
    if (!desc)  { setErr(eDesc,  fDesc,  'Please describe your project.');          valid = false; }
    if (!valid) {
      /* Scroll to first error */
      const first = document.querySelector('#contactForm .cf-err:not(:empty)');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    /* Build pre-filled WhatsApp message */
    const text =
      `Hello Vedansh! I found you on your portfolio website and would like to discuss a project.\n\n` +
      `*Name:* ${name}\n` +
      `*WhatsApp:* ${wa}\n` +
      `*Email:* ${email}\n` +
      `*Project Type:* ${type}\n` +
      (budget ? `*Budget:* ${budget}\n` : '') +
      `\n*Project Details:*\n${desc}`;

    window.open(
      `https://wa.me/${OWNER_WA}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );

    showMsg('Opening WhatsApp — just tap Send!', '#c9a84c');
  });

})();




/* =====================================================
   PRICING — WhatsApp redirect per card button
   ===================================================== */
(function () {

  const OWNER_WA = '918710005016'; /* E.164, no + sign — owner's fixed number */

  document.querySelectorAll('.pc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const raw     = btn.dataset.service || 'your service';
      const service = raw.replace(/&amp;/g, '&');

      const text =
        `Hello Vedansh! I found you on your portfolio website.\n\n` +
        `I'm interested in: *${service}*\n\n` +
        `Could you please share more details and availability?`;

      window.open(
        `https://wa.me/${OWNER_WA}?text=${encodeURIComponent(text)}`,
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

})();


/* =====================================================
   FOOTER — Fade-in on scroll + Back to Top
   ===================================================== */
(function () {
  const footer = document.getElementById('footer');
  const bttBtn = document.getElementById('bttBtn');

  /* Fade-in footer when it enters viewport */
  if (footer) {
    const ftObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          footer.classList.add('ft-visible');
          ftObserver.unobserve(footer);
        }
      });
    }, { threshold: 0.08 });
    ftObserver.observe(footer);
  }

  /* Show/hide back-to-top button */
  if (bttBtn) {
    window.addEventListener('scroll', () => {
      bttBtn.classList.toggle('btt-show', window.scrollY > 400);
    }, { passive: true });

    bttBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();


/* =====================================================
   HOME — Parallax
   ===================================================== */
(function () {
  const heroBg   = document.querySelector('.hero-bg');
  const heroSec  = document.getElementById('home');
  if (!heroBg || !heroSec) return;

  /* Set initial transform immediately — prevents the 8s CSS transition
     from firing on first paint and avoids a blank/oversized frame */
  heroBg.style.transform = 'scale(1.05) translateY(0px)';

  /* Honour reduced-motion preference */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrollY      = window.scrollY;
      const heroHeight   = heroSec.offsetHeight;

      /* Only apply while hero is visible */
      if (scrollY <= heroHeight) {
        /* Background moves at 35 % of scroll speed — subtle but visible */
        const offset = scrollY * 0.35;
        /* Combine with the existing scale so the image never shows edges */
        heroBg.style.transform = `scale(1.05) translateY(${offset}px)`;
      }
      ticking = false;
    });
  }, { passive: true });
})();


/* =====================================================
   ABOUT — Scroll animations & counter
   ===================================================== */
(function () {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const imgWrap  = document.querySelector('.about-slide-left');
  const textWrap = document.querySelector('.about-slide-right');

  if (!imgWrap || !textWrap) return;

  /* ---- 1. Slide-in observer ---- */
  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('about-visible');
      slideObserver.unobserve(entry.target);

      /* Trigger counters when text block becomes visible */
      if (entry.target === textWrap) runCounters();
    });
  }, { threshold: 0.18 });

  slideObserver.observe(imgWrap);
  slideObserver.observe(textWrap);

  /* ---- 2. Counter animation ---- */
  function runCounters() {
    document.querySelectorAll('.about-stats .stat span[data-target]').forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';

      /* Non-numeric stat (e.g. "India") — skip counting */
      if (isNaN(target) || target === 0) {
        el.textContent = suffix;
        return;
      }

      if (reducedMotion) {
        el.textContent = target + '+';
        return;
      }

      const duration = 1400; /* ms */
      const startTime = performance.now();

      function tick(now) {
        const elapsed  = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        /* Ease-out quad */
        const eased    = 1 - (1 - progress) * (1 - progress);
        const current  = Math.floor(eased * target);
        el.textContent = current + (progress < 1 ? '' : '+');
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }
})();


/* =====================================================
   ABOUT — Projects stat scrolls to Portfolio
   ===================================================== */
(function () {
  const statProjects  = document.getElementById('statProjects');
  const portfolioSec  = document.getElementById('portfolio');
  if (!statProjects || !portfolioSec) return;

  function scrollToPortfolio() {
    portfolioSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  statProjects.addEventListener('click', scrollToPortfolio);
  statProjects.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToPortfolio();
    }
  });
})();


