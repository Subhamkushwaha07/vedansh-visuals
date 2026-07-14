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
  const rvSocialPlatform    = document.getElementById('rvSocialPlatform');
  const rvSocialHandle      = document.getElementById('rvSocialHandle');
  const rvOtherPlatformName = document.getElementById('rvOtherPlatformName');
  const stars               = document.querySelectorAll('.rv-star');

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
      const rawPlatform    = rvSocialPlatform ? rvSocialPlatform.value        : '';
      const otherName      = rvOtherPlatformName ? rvOtherPlatformName.value.trim() : '';
      const socialPlatform = rawPlatform === 'Other' && otherName ? otherName : rawPlatform;
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
        if (rvSocialHandle)       rvSocialHandle.value       = '';
        if (rvOtherPlatformName)  rvOtherPlatformName.value  = '';
        const otherFields = document.getElementById('rvOtherFields');
        if (otherFields) otherFields.classList.remove('rv-other-fields--visible');
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
      const GLOBE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';

      /* Known platforms — keyed by lowercase */
      const KNOWN = {
        instagram: { svgClass: 'rv-soc-ig',  buildUrl: u => 'https://instagram.com/' + u,          svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/></svg>' },
        facebook:  { svgClass: 'rv-soc-fb',  buildUrl: u => 'https://facebook.com/' + u,           svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>' },
        youtube:   { svgClass: 'rv-soc-yt',  buildUrl: u => 'https://youtube.com/@' + u,           svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/></svg>' },
        pinterest: { svgClass: 'rv-soc-pt',  buildUrl: u => 'https://pinterest.com/' + u,          svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.853 0 1.267.641 1.267 1.408 0 .858-.546 2.141-.828 3.329-.236.995.499 1.806 1.476 1.806 1.772 0 3.137-1.868 3.137-4.561 0-2.386-1.715-4.054-4.163-4.054-2.836 0-4.498 2.127-4.498 4.326 0 .856.33 1.775.741 2.276a.3.3 0 0 1 .069.286c-.076.313-.244.995-.277 1.134-.044.183-.146.222-.337.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>' },
        linkedin:  { svgClass: 'rv-soc-li',  buildUrl: u => 'https://linkedin.com/in/' + u,        svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>' },
        x:         { svgClass: 'rv-soc-x',   buildUrl: u => 'https://x.com/' + u,                  svg: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' },
        website:   { svgClass: 'rv-soc-web', buildUrl: u => /^https?:\/\//.test(u) ? u : 'https://' + u, svg: GLOBE_SVG },
        /* common "Other" platforms with known URL patterns */
        tiktok:    { svgClass: 'rv-soc-other', buildUrl: u => 'https://tiktok.com/@' + u,           svg: GLOBE_SVG },
        threads:   { svgClass: 'rv-soc-other', buildUrl: u => 'https://threads.net/@' + u,          svg: GLOBE_SVG },
        snapchat:  { svgClass: 'rv-soc-other', buildUrl: u => 'https://snapchat.com/add/' + u,      svg: GLOBE_SVG },
        telegram:  { svgClass: 'rv-soc-other', buildUrl: u => 'https://t.me/' + u,                  svg: GLOBE_SVG },
        reddit:    { svgClass: 'rv-soc-other', buildUrl: u => 'https://reddit.com/u/' + u,          svg: GLOBE_SVG },
        medium:    { svgClass: 'rv-soc-other', buildUrl: u => 'https://medium.com/@' + u,           svg: GLOBE_SVG },
        behance:   { svgClass: 'rv-soc-other', buildUrl: u => 'https://behance.net/' + u,           svg: GLOBE_SVG },
        dribbble:  { svgClass: 'rv-soc-other', buildUrl: u => 'https://dribbble.com/' + u,          svg: GLOBE_SVG },
        vimeo:     { svgClass: 'rv-soc-other', buildUrl: u => 'https://vimeo.com/' + u,             svg: GLOBE_SVG },
        discord:   { svgClass: 'rv-soc-other', buildUrl: null,                                      svg: GLOBE_SVG }
      };

      /* Strip @, full URLs and domain prefixes to get a clean username */
      function cleanHandle(raw, platformKey) {
        let h = raw.trim();
        /* If it looks like a full URL, extract the last path segment */
        if (/^https?:\/\//.test(h)) {
          try { h = new URL(h).pathname.replace(/^\/+|\/?$/g, '').split('/').pop(); } catch(e) {}
        } else {
          /* Strip domain prefix e.g. instagram.com/user or www.instagram.com/user */
          h = h.replace(/^(?:www\.)?[a-z0-9-]+\.[a-z]{2,}\/+/i, '');
        }
        /* For website platform keep the full value as-is */
        if (platformKey === 'website') return raw.trim();
        /* Strip leading @ */
        return h.replace(/^@+/, '');
      }

      const platformKey = data.socialPlatform.toLowerCase();
      const known       = KNOWN[platformKey];
      const handle      = cleanHandle(data.socialHandle, platformKey);
      const profileUrl  = known && known.buildUrl ? known.buildUrl(handle) : null;

      /* Outer row — always a span (not a link itself) */
      const socRow = document.createElement('span');
      socRow.className = 'rv-card-social';
      socRow.setAttribute('aria-label', data.socialPlatform + ': ' + handle);

      const iconWrap = document.createElement('span');
      iconWrap.className = 'rv-card-social-icon' + (known ? ' ' + known.svgClass : ' rv-soc-other');

      const labelEl = document.createElement('span');
      labelEl.className = 'rv-card-social-label';
      labelEl.textContent = escapeHtml(data.socialPlatform) + ': ';

      /* Handle: <a> if URL exists, <span> otherwise (e.g. Discord) */
      const handleEl = profileUrl
        ? document.createElement('a')
        : document.createElement('span');
      handleEl.className = 'rv-card-social-handle';
      handleEl.textContent = escapeHtml(handle);
      if (profileUrl) {
        handleEl.href   = profileUrl;
        handleEl.target = '_blank';
        handleEl.rel    = 'noopener noreferrer';
      }

      if (known) {
        iconWrap.innerHTML = known.svg;
        socRow.appendChild(iconWrap);
        socRow.appendChild(labelEl);
        socRow.appendChild(handleEl);
        meta.appendChild(socRow);
      } else {
        /* Unknown custom platform — globe first, try Simple Icons CDN */
        iconWrap.innerHTML = GLOBE_SVG;
        socRow.appendChild(iconWrap);
        socRow.appendChild(labelEl);
        socRow.appendChild(handleEl);
        meta.appendChild(socRow);

        const slug = platformKey.replace(/[^a-z0-9]/g, '');
        const img  = new Image();
        img.onload = () => {
          iconWrap.innerHTML = '<img src="' + img.src + '" alt="" width="18" height="18" style="display:block;filter:brightness(0) invert(1);opacity:.85">';
        };
        img.src = 'https://cdn.simpleicons.org/' + slug + '/ffffff';
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
