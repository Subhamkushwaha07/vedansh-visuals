/* =====================================================
   VEDANSH VISUALS — reviews.js
   Client Reviews: submit → Firestore, fetch → render
   ===================================================== */

(function () {

  /* ── DOM refs ─────────────────────────────────────── */
  const form        = document.getElementById('reviewForm');
  const rvName      = document.getElementById('rvName');
  const rvLocation  = document.getElementById('rvLocation');
  const rvMsg       = document.getElementById('rvMsg');
  const rvSubmitBtn = document.getElementById('rvSubmitBtn');
  const rvFormMsg   = document.getElementById('rvFormMsg');
  const rvGrid      = document.getElementById('rvGrid');
  const rvEmpty     = document.getElementById('rvEmpty');
  const rvLoader    = document.getElementById('rvLoader');
  const stars       = document.querySelectorAll('.rv-star');

  /* ── State ────────────────────────────────────────── */
  let selectedRating = 0;

  /* ── Star rating interaction ──────────────────────── */
  stars.forEach(star => {
    /* Hover: fill up to hovered star */
    star.addEventListener('mouseenter', () => {
      const val = +star.dataset.value;
      stars.forEach(s => s.classList.toggle('hovered', +s.dataset.value <= val));
    });

    /* Mouse leave: restore to selected state */
    star.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.remove('hovered'));
    });

    /* Click: lock selection */
    star.addEventListener('click', () => {
      selectedRating = +star.dataset.value;
      stars.forEach(s => {
        s.classList.toggle('selected', +s.dataset.value <= selectedRating);
        s.setAttribute('aria-pressed', +s.dataset.value <= selectedRating ? 'true' : 'false');
      });
      clearFieldError('rvErrRating');
    });

    /* Keyboard: Enter / Space selects */
    star.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        star.click();
      }
    });
  });

  /* ── Validation helpers ───────────────────────────── */
  function setFieldError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }
  function clearFieldError(id) {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  }
  function setInputState(input, hasError) {
    if (!input) return;
    input.style.borderColor = hasError ? '#e05c5c' : '';
    input.style.boxShadow   = hasError ? '0 0 0 3px rgba(224,92,92,.1)' : '';
  }

  /* Live-clear errors */
  if (rvName)     rvName.addEventListener('input',     () => { setFieldError('rvErrName',     ''); setInputState(rvName,     false); });
  if (rvLocation) rvLocation.addEventListener('input', () => { setFieldError('rvErrLocation', ''); setInputState(rvLocation, false); });
  if (rvMsg)      rvMsg.addEventListener('input',      () => { setFieldError('rvErrMsg',      ''); setInputState(rvMsg,      false); });

  /* ── Show form status message ─────────────────────── */
  function showFormMsg(text, type) {
    if (!rvFormMsg) return;
    rvFormMsg.textContent = text;
    rvFormMsg.className   = 'rv-form-msg rv-form-msg--' + type;
    clearTimeout(rvFormMsg._t);
    if (type === 'success') {
      rvFormMsg._t = setTimeout(() => { rvFormMsg.textContent = ''; rvFormMsg.className = 'rv-form-msg'; }, 6000);
    }
  }

  /* ── Submit handler ───────────────────────────────── */
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name     = rvName     ? rvName.value.trim()     : '';
      const location = rvLocation ? rvLocation.value.trim() : '';
      const msg      = rvMsg      ? rvMsg.value.trim()       : '';

      /* Validate */
      let valid = true;
      if (!name)     { setFieldError('rvErrName',     'Please enter your full name.');    setInputState(rvName,     true); valid = false; }
      if (!location) { setFieldError('rvErrLocation', 'Please enter your city and state.'); setInputState(rvLocation, true); valid = false; }
      if (selectedRating === 0) { setFieldError('rvErrRating', 'Please select a star rating.'); valid = false; }
      if (!msg)      { setFieldError('rvErrMsg',      'Please write your review.');        setInputState(rvMsg,      true); valid = false; }
      if (!valid) return;

      /* Disable button while saving */
      rvSubmitBtn.disabled    = true;
      rvSubmitBtn.textContent = 'Submitting…';

      try {
        /* Check if Firebase / Firestore is available */
        if (typeof db === 'undefined') {
          throw new Error('Firebase not configured. Please add your Firebase credentials to firebase-config.js');
        }

        await db.collection('reviews').add({
          name:      name,
          location:  location,
          rating:    selectedRating,
          message:   msg,
          approved:  true,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showFormMsg('✓ Thank you! Your review has been published.', 'success');
        form.reset();
        selectedRating = 0;
        stars.forEach(s => { s.classList.remove('selected', 'hovered'); s.setAttribute('aria-pressed', 'false'); });

        /* Reload reviews to show the new one */
        loadReviews();

      } catch (err) {
        console.error('Review submit error:', err);
        showFormMsg('⚠ ' + (err.message || 'Something went wrong. Please try again.'), 'error');
      } finally {
        rvSubmitBtn.disabled    = false;
        rvSubmitBtn.textContent = 'Submit Review';
      }
    });
  }

  /* ── Load & render reviews ────────────────────────── */
  function loadReviews() {
    if (!rvGrid) return;

    /* Show loader, hide empty state */
    if (rvLoader) rvLoader.style.display = 'flex';
    if (rvEmpty)  rvEmpty.style.display  = 'none';

    /* Clear existing cards (keep loader + empty nodes) */
    Array.from(rvGrid.children).forEach(child => {
      if (!child.id) child.remove();
    });

    if (typeof db === 'undefined') {
      if (rvLoader) rvLoader.style.display = 'none';
      if (rvEmpty)  { rvEmpty.style.display = 'block'; rvEmpty.textContent = 'Firebase not configured yet.'; }
      return;
    }

    db.collection('reviews')
      .where('approved', '==', true)
      .orderBy('createdAt', 'desc')
      .get()
      .then(snapshot => {
        if (rvLoader) rvLoader.style.display = 'none';

        if (snapshot.empty) {
          if (rvEmpty) rvEmpty.style.display = 'block';
          return;
        }

        snapshot.forEach((doc, idx) => {
          const data = doc.data();
          const card = buildCard(data, idx);
          rvGrid.appendChild(card);
        });
      })
      .catch(err => {
        console.error('Reviews load error:', err);
        if (rvLoader) rvLoader.style.display = 'none';
        if (rvEmpty)  { rvEmpty.style.display = 'block'; rvEmpty.textContent = 'Could not load reviews.'; }
      });
  }

  /* ── Build a single review card DOM node ─────────── */
  function buildCard(data, idx) {
    const card = document.createElement('article');
    card.className = 'rv-card';
    card.style.animationDelay = (idx * 100) + 'ms';

    const date = data.createdAt
      ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';

    const starsHtml = Array.from({ length: 5 }, (_, i) =>
      `<span class="rv-card-star${i < data.rating ? ' filled' : ''}" aria-hidden="true">★</span>`
    ).join('');

    const initials = data.name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const locationHtml = data.location
      ? `<span class="rv-card-location">&#128205; ${escapeHtml(data.location)}</span>`
      : '';

    card.innerHTML = `
      <div class="rv-card-header">
        <div class="rv-avatar" aria-hidden="true">${initials}</div>
        <div class="rv-card-meta">
          <p class="rv-card-name">${escapeHtml(data.name)}</p>
          ${locationHtml}
          <div class="rv-card-stars" aria-label="${data.rating} out of 5 stars">${starsHtml}</div>
        </div>
        <span class="rv-card-date">${date}</span>
      </div>
      <p class="rv-card-msg">${escapeHtml(data.message)}</p>
      <div class="rv-card-quote" aria-hidden="true">"</div>
    `;

    return card;
  }

  /* ── XSS guard ────────────────────────────────────── */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── Init ─────────────────────────────────────────── */
  loadReviews();

})();
