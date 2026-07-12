/* =====================================================
   VEDANSH VISUALS — reviews.js
   Google Play-style UI · Single media input · Firestore
   ===================================================== */

(function () {

  /* ── DOM refs ─────────────────────────────────────── */
  const form        = document.getElementById('reviewForm');
  const rvName      = document.getElementById('rvName');
  const rvEmail     = document.getElementById('rvEmail');
  const rvLocation  = document.getElementById('rvLocation');
  const rvMsg       = document.getElementById('rvMsg');
  const rvSubmitBtn = document.getElementById('rvSubmitBtn');
  const rvFormMsg   = document.getElementById('rvFormMsg');
  const rvGrid      = document.getElementById('rvGrid');
  const rvEmpty     = document.getElementById('rvEmpty');
  const rvLoader    = document.getElementById('rvLoader');
  const rvFormAvatar    = document.getElementById('rvFormAvatar');
  const rvStarHint      = document.getElementById('rvStarHint');
  const rvSocialPlatform= document.getElementById('rvSocialPlatform');
  const rvSocialHandle  = document.getElementById('rvSocialHandle');
  const stars           = document.querySelectorAll('.rv-star');

  const STAR_HINTS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  /* ── State ────────────────────────────────────────── */
  let selectedRating = 0;

  /* ── Live avatar from name ────────────────────────── */
  if (rvName && rvFormAvatar) {
    rvName.addEventListener('input', () => {
      const initials = rvName.value.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
      rvFormAvatar.textContent = initials || '?';
      clearErr('rvErrName'); setInputOk(rvName);
    });
  }

  /* ── Star rating ──────────────────────────────────── */
  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const val = +star.dataset.value;
      stars.forEach(s => s.classList.toggle('hovered', +s.dataset.value <= val));
      if (rvStarHint) rvStarHint.textContent = STAR_HINTS[val] || '';
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.remove('hovered'));
      if (rvStarHint) rvStarHint.textContent = selectedRating ? STAR_HINTS[selectedRating] : 'Tap to rate';
    });
    star.addEventListener('click', () => {
      selectedRating = +star.dataset.value;
      stars.forEach(s => {
        s.classList.toggle('selected', +s.dataset.value <= selectedRating);
        s.setAttribute('aria-pressed', +s.dataset.value <= selectedRating ? 'true' : 'false');
      });
      if (rvStarHint) rvStarHint.textContent = STAR_HINTS[selectedRating];
      clearErr('rvErrRating');
    });
    star.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); star.click(); }
    });
  });

/* ── Validation helpers ───────────────────────────── */
  function setErr(id, msg)  { const el = document.getElementById(id); if (el) el.textContent = msg; }
  function clearErr(id)     { const el = document.getElementById(id); if (el) el.textContent = ''; }
  function setInputErr(inp) { if (inp) { inp.style.borderColor = '#e05c5c'; inp.style.boxShadow = '0 0 0 3px rgba(224,92,92,.1)'; } }
  function setInputOk(inp)  { if (inp) { inp.style.borderColor = ''; inp.style.boxShadow = ''; } }

  if (rvEmail)         rvEmail.addEventListener('input',          () => { clearErr('rvErrEmail');  setInputOk(rvEmail); });
  if (rvMsg)           rvMsg.addEventListener('input',            () => { clearErr('rvErrMsg');    setInputOk(rvMsg); });
  if (rvSocialPlatform)rvSocialPlatform.addEventListener('change',() => { clearErr('rvErrSocial'); setInputOk(rvSocialPlatform); });
  if (rvSocialHandle)  rvSocialHandle.addEventListener('input',   () => { clearErr('rvErrSocial'); setInputOk(rvSocialHandle); });

  /* ── Form status ──────────────────────────────────── */
  function showMsg(text, type) {
    if (!rvFormMsg) return;
    rvFormMsg.textContent = text;
    rvFormMsg.className   = 'rv-form-msg rv-form-msg--' + type;
    clearTimeout(rvFormMsg._t);
    if (type === 'success') {
      rvFormMsg._t = setTimeout(() => { rvFormMsg.textContent = ''; rvFormMsg.className = 'rv-form-msg'; }, 6000);
    }
  }

/* ── Submit ───────────────────────────────────────── */
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const name           = rvName           ? rvName.value.trim()           : '';
      const email          = rvEmail          ? rvEmail.value.trim()          : '';
      const location       = rvLocation       ? rvLocation.value.trim()       : '';
      const msg            = rvMsg            ? rvMsg.value.trim()            : '';
      const socialPlatform = rvSocialPlatform ? rvSocialPlatform.value        : '';
      const socialHandle   = rvSocialHandle   ? rvSocialHandle.value.trim()   : '';

      let valid = true;
      if (!name)     { setErr('rvErrName',  'Please enter your name.');              setInputErr(rvName);  valid = false; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                       setErr('rvErrEmail', 'Please enter a valid email address.');  setInputErr(rvEmail); valid = false; }
      if (!socialPlatform || !socialHandle) {
                       setErr('rvErrSocial', 'Please select a platform and enter your username.');
                       if (!socialPlatform) setInputErr(rvSocialPlatform);
                       if (!socialHandle)   setInputErr(rvSocialHandle);
                       valid = false; }
      if (selectedRating === 0) { setErr('rvErrRating', 'Please select a rating.'); valid = false; }
      if (!msg)      { setErr('rvErrMsg',   'Please write your review.');            setInputErr(rvMsg);   valid = false; }
      if (!valid) return;

      rvSubmitBtn.disabled    = true;
      rvSubmitBtn.textContent = 'Posting…';

      try {
        await db.collection('reviews').add({
          name, email, location,
          socialPlatform, socialHandle,
          rating:    selectedRating,
          message:   msg,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMsg('✓ Your review has been posted!', 'success');
        form.reset();
        if (rvName) rvName.value = '';
        if (rvEmail) rvEmail.value = '';
        if (rvSocialPlatform) rvSocialPlatform.value = '';
        if (rvSocialHandle)   rvSocialHandle.value   = '';
        selectedRating = 0;
        stars.forEach(s => { s.classList.remove('selected', 'hovered'); s.setAttribute('aria-pressed', 'false'); });
        if (rvStarHint) rvStarHint.textContent = 'Tap to rate';
        if (rvFormAvatar) rvFormAvatar.textContent = '?';
        loadReviews();

      } catch (err) {
        console.error('Review submit error:', err);
        showMsg('⚠ ' + (err.message || 'Something went wrong. Please try again.'), 'error');
      } finally {
        rvSubmitBtn.disabled    = false;
        rvSubmitBtn.textContent = 'Post Review';
      }
    });
  }

  /* ── Load reviews ─────────────────────────────────── */
  function loadReviews() {
    if (!rvGrid) return;
    if (rvLoader) rvLoader.style.display = 'flex';
    if (rvEmpty)  rvEmpty.style.display  = 'none';
    Array.from(rvGrid.children).forEach(child => { if (!child.id) child.remove(); });

    if (typeof db === 'undefined') {
      if (rvLoader) rvLoader.style.display = 'none';
      if (rvEmpty)  { rvEmpty.style.display = 'block'; rvEmpty.textContent = 'Firebase not configured yet.'; }
      return;
    }

    db.collection('reviews')
      .orderBy('createdAt', 'desc')
      .get()
      .then(snapshot => {
        if (rvLoader) rvLoader.style.display = 'none';
        if (snapshot.empty) { if (rvEmpty) rvEmpty.style.display = 'block'; return; }
        snapshot.forEach((doc, idx) => rvGrid.appendChild(buildCard(doc.id, doc.data(), idx)));
      })
      .catch(err => {
        console.error('Reviews load error:', err);
        if (rvLoader) rvLoader.style.display = 'none';
        if (rvEmpty)  { rvEmpty.style.display = 'block'; rvEmpty.textContent = 'Could not load reviews.'; }
      });
  }

  /* ── Build card — Google Maps style ──────────────── */
  function buildCard(docId, data, idx) {
    const card = document.createElement('article');
    card.className = 'rv-card';
    card.style.animationDelay = (idx * 80) + 'ms';

    let dateStr = '';
    if (data.createdAt) {
      const d = new Date(data.createdAt.seconds * 1000);
      dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              + ' · '
              + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    const rating   = Math.min(5, Math.max(0, parseInt(data.rating, 10) || 0));
    const initials = String(data.name).split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

    /* Header */
    const header = document.createElement('div');
    header.className = 'rv-card-header';

    const avatar = document.createElement('div');
    avatar.className = 'rv-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = initials;

    const meta = document.createElement('div');
    meta.className = 'rv-card-meta';

    const nameRow = document.createElement('div');
    nameRow.className = 'rv-card-name-row';
    const nameEl = document.createElement('p');
    nameEl.className = 'rv-card-name';
    nameEl.textContent = escapeHtml(data.name);
    nameRow.appendChild(nameEl);
    meta.appendChild(nameRow);

    if (data.email) {
      const emailEl = document.createElement('p');
      emailEl.className = 'rv-card-email';
      emailEl.textContent = maskEmail(data.email);
      meta.appendChild(emailEl);
    }

    /* Stars + date row */
    const ratingRow = document.createElement('div');
    ratingRow.className = 'rv-card-rating-row';

    const starsWrap = document.createElement('div');
    starsWrap.className = 'rv-card-stars';
    starsWrap.setAttribute('aria-label', rating + ' out of 5 stars');
    for (let i = 0; i < 5; i++) {
      const s = document.createElement('span');
      s.className = 'rv-card-star' + (i < rating ? ' filled' : '');
      s.setAttribute('aria-hidden', 'true');
      s.textContent = '\u2605';
      starsWrap.appendChild(s);
    }
    ratingRow.appendChild(starsWrap);

    const dateEl = document.createElement('span');
    dateEl.className = 'rv-card-date';
    dateEl.textContent = dateStr;
    ratingRow.appendChild(dateEl);
    meta.appendChild(ratingRow);

    if (data.location) {
      const loc = document.createElement('span');
      loc.className = 'rv-card-location';
      loc.textContent = '\uD83D\uDCCD ' + escapeHtml(data.location);
      meta.appendChild(loc);
    }

    if (data.socialPlatform && data.socialHandle) {
      const PLATFORM_META = {
        Instagram: { icon: '\uD83D\uDCF7', buildUrl: h => 'https://instagram.com/' + h.replace(/^@/, '') },
        Facebook:  { icon: '\uD83D\uDCD8', buildUrl: h => 'https://facebook.com/'  + h.replace(/^@/, '') },
        YouTube:   { icon: '\u25B6\uFE0F', buildUrl: h => 'https://youtube.com/@'  + h.replace(/^@/, '') }
      };
      const pm = PLATFORM_META[data.socialPlatform];
      if (pm) {
        const socLink = document.createElement('a');
        socLink.className  = 'rv-card-social';
        socLink.href       = pm.buildUrl(data.socialHandle);
        socLink.target     = '_blank';
        socLink.rel        = 'noopener noreferrer';
        socLink.textContent = pm.icon + ' ' + data.socialPlatform + ': ' + escapeHtml(data.socialHandle);
        meta.appendChild(socLink);
      }
    }

    header.appendChild(avatar);
    header.appendChild(meta);
    card.appendChild(header);

    /* Message */
    const msgEl = document.createElement('p');
    msgEl.className = 'rv-card-msg';
    msgEl.textContent = escapeHtml(data.message);
    card.appendChild(msgEl);

    /* Images */
    if (data.images && data.images.length) {
      const imgWrap = document.createElement('div');
      imgWrap.className = 'rv-card-images';
      data.images.forEach(url => {
        const img = document.createElement('img');
        img.src = url; img.alt = 'Review photo';
        img.className = 'rv-card-img'; img.loading = 'lazy';
        imgWrap.appendChild(img);
      });
      card.appendChild(imgWrap);
    }

    /* Video */
    if (data.video) {
      const vid = document.createElement('video');
      vid.src = data.video; vid.controls = true;
      vid.className = 'rv-card-video'; vid.preload = 'metadata';
      card.appendChild(vid);
    }

    return card;
  }

  /* ── Email masking ──────────────────────────────────── */
  function maskEmail(email) {
    const at = email.indexOf('@');
    if (at < 1) return email;
    const local  = email.slice(0, at);
    const domain = email.slice(at);
    const keep   = Math.max(2, Math.min(3, Math.floor(local.length / 4)));
    const tail   = local.length > 7 ? 2 : 0;
    const stars  = '*'.repeat(Math.max(2, local.length - keep - tail));
    return local.slice(0, keep) + stars + (tail ? local.slice(-tail) : '') + domain;
  }

  /* ── XSS guard ────────────────────────────────────── */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ── Init ─────────────────────────────────────────── */
  loadReviews();

})();
