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
  const rvMedia     = document.getElementById('rvMedia');
  const rvSubmitBtn = document.getElementById('rvSubmitBtn');
  const rvFormMsg   = document.getElementById('rvFormMsg');
  const rvGrid      = document.getElementById('rvGrid');
  const rvEmpty     = document.getElementById('rvEmpty');
  const rvLoader    = document.getElementById('rvLoader');
  const rvFormAvatar= document.getElementById('rvFormAvatar');
  const rvStarHint  = document.getElementById('rvStarHint');
  const rvMediaPreview = document.getElementById('rvMediaPreview');
  const stars       = document.querySelectorAll('.rv-star');

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

  /* ── Single media picker preview ─────────────────── */
  if (rvMedia && rvMediaPreview) {
    rvMedia.addEventListener('change', () => {
      rvMediaPreview.innerHTML = '';
      Array.from(rvMedia.files).forEach(file => {
        const thumb = document.createElement('div');
        thumb.className = 'rv-thumb';
        if (file.type.startsWith('video/')) {
          const vid = document.createElement('video');
          vid.src = URL.createObjectURL(file);
          vid.preload = 'metadata';
          vid.muted = true;
          thumb.appendChild(vid);
          const icon = document.createElement('div');
          icon.className = 'rv-thumb-vid-icon';
          icon.textContent = '▶';
          thumb.appendChild(icon);
        } else {
          const img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          img.alt = file.name;
          thumb.appendChild(img);
        }
        rvMediaPreview.appendChild(thumb);
      });
    });
  }

  /* ── Validation helpers ───────────────────────────── */
  function setErr(id, msg)  { const el = document.getElementById(id); if (el) el.textContent = msg; }
  function clearErr(id)     { const el = document.getElementById(id); if (el) el.textContent = ''; }
  function setInputErr(inp) { if (inp) { inp.style.borderColor = '#e05c5c'; inp.style.boxShadow = '0 0 0 3px rgba(224,92,92,.1)'; } }
  function setInputOk(inp)  { if (inp) { inp.style.borderColor = ''; inp.style.boxShadow = ''; } }

  if (rvEmail)    rvEmail.addEventListener('input',    () => { clearErr('rvErrEmail');    setInputOk(rvEmail); });
  if (rvMsg)      rvMsg.addEventListener('input',      () => { clearErr('rvErrMsg');      setInputOk(rvMsg); });

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

  /* ── Upload helper ────────────────────────────────── */
  async function uploadFile(file, path) {
    const ref = storage.ref(path);
    await ref.put(file);
    return ref.getDownloadURL();
  }

  /* ── Submit ───────────────────────────────────────── */
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const name     = rvName     ? rvName.value.trim()     : '';
      const email    = rvEmail    ? rvEmail.value.trim()    : '';
      const location = rvLocation ? rvLocation.value.trim() : '';
      const msg      = rvMsg      ? rvMsg.value.trim()      : '';

      let valid = true;
      if (!name)     { setErr('rvErrName',  'Please enter your name.');              setInputErr(rvName);  valid = false; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                       setErr('rvErrEmail', 'Please enter a valid email address.');  setInputErr(rvEmail); valid = false; }
      if (selectedRating === 0) { setErr('rvErrRating', 'Please select a rating.'); valid = false; }
      if (!msg)      { setErr('rvErrMsg',   'Please write your review.');            setInputErr(rvMsg);   valid = false; }
      if (!valid) return;

      const allFiles   = rvMedia ? Array.from(rvMedia.files) : [];
      const imageFiles = allFiles.filter(f => f.type.startsWith('image/')).slice(0, 5);
      const videoFile  = allFiles.find(f => f.type.startsWith('video/')) || null;

      rvSubmitBtn.disabled    = true;
      rvSubmitBtn.textContent = allFiles.length ? 'Uploading…' : 'Posting…';

      try {
        const ts = Date.now();
        const imageURLs = [];
        let   videoURL  = '';

        for (let i = 0; i < imageFiles.length; i++) {
          imageURLs.push(await uploadFile(imageFiles[i], `reviews/${ts}_img${i}_${imageFiles[i].name}`));
        }
        if (videoFile) {
          videoURL = await uploadFile(videoFile, `reviews/${ts}_vid_${videoFile.name}`);
        }

        rvSubmitBtn.textContent = 'Posting…';

        await db.collection('reviews').add({
          name, email, location,
          rating:    selectedRating,
          message:   msg,
          images:    imageURLs,
          video:     videoURL,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMsg('✓ Your review has been posted!', 'success');
        form.reset();
        if (rvName) rvName.value = '';
        if (rvEmail) rvEmail.value = '';
        selectedRating = 0;
        stars.forEach(s => { s.classList.remove('selected', 'hovered'); s.setAttribute('aria-pressed', 'false'); });
        if (rvStarHint) rvStarHint.textContent = 'Tap to rate';
        if (rvFormAvatar) rvFormAvatar.textContent = '?';
        if (rvMediaPreview) rvMediaPreview.innerHTML = '';
        loadReviews();

      } catch (err) {
        console.error('Review submit error:', err);
        showMsg('⚠ ' + (err.message || 'Something went wrong. Please try again.'), 'error');
      } finally {
        rvSubmitBtn.disabled    = false;
        rvSubmitBtn.textContent = 'Post';
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

  /* ── XSS guard ────────────────────────────────────── */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ── Init ─────────────────────────────────────────── */
  loadReviews();

})();
