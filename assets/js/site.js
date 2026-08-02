/* ===========================================================================
   SCIPL prototype — behaviour
   ---------------------------------------------------------------------------
   One file, no dependencies, no framework, no build step. This is deliberate:
   the reference study measured Padams loading ten motion libraries (Lenis three
   times over) to produce a worse result than Snøhetta gets from one. Everything
   below — scroll reveal, parallax, hover, sticky header, image loading, the
   before/after slider, the lightbox, filter re-flow and page transitions — is
   about 400 lines and ships as a single request.

   Every effect reads --duration / --ease from the active identity, so switching
   identity also switches the motion character (Blueprint 480ms expo-out,
   Signal 180ms mechanical, Imprint 600ms slow ease-out).
   =========================================================================== */
(() => {
'use strict';

const D   = window.SCIPL || { projects: [], sectors: [], cities: [], scopes: [] };
const $   = (s, r = document) => r.querySelector(s);
const $$  = (s, r = document) => [...r.querySelectorAll(s)];
const page = document.body.dataset.page;

/* ---------------------------------------------------------------- prefs -- */
const PREF = {
  theme:  localStorage.getItem('scipl.theme')  || 'blueprint',
  units:  localStorage.getItem('scipl.units')  || 'sqft',
  motion: localStorage.getItem('scipl.motion') || 'on',
};
const setPref = (k, v) => {
  PREF[k] = v;
  localStorage.setItem('scipl.' + k, v);
  applyPrefs();
};
function applyPrefs(){
  document.documentElement.dataset.theme  = PREF.theme;
  document.documentElement.dataset.motion = PREF.motion;
  $$('[data-pref]').forEach(b => b.setAttribute('aria-pressed',
    String(PREF[b.dataset.pref] === b.dataset.val)));
  renderAreas();
}
applyPrefs();

/* --------------------------------------------------------------- units --- */
const SQM = 0.09290304;
const fmt = n => n.toLocaleString('en-IN');
function areaText(sqft){
  if (!sqft) return null;
  return PREF.units === 'sqm'
    ? fmt(Math.round(sqft * SQM)) + ' sq m'
    : fmt(sqft) + ' sq ft';
}
function renderAreas(){
  $$('[data-sqft]').forEach(el => {
    const v = Number(el.dataset.sqft);
    el.textContent = v ? areaText(v) : '—';
  });
}

/* ------------------------------------------------- awaiting-content mark -- */
/* Fields the client still owes us arrive from the generator prefixed "~".
   They are never silently rendered as fact. */
function val(v){
  if (typeof v === 'string' && v.startsWith('~')){
    return `<span class="awaiting" title="Placeholder — awaiting content from SCIPL">${v.slice(1)}</span>`;
  }
  return v == null ? '—' : String(v);
}

/* ------------------------------------------------------------- pictures -- */
/* Reserve the box from the real pixel dimensions, then let the browser pick
   the narrowest derivative that fills the slot. Nothing is ever upscaled:
   build_images.py stops the ladder at the source width. */
function picture(slug, img, sizes, opts = {}){
  const { eager = false, alt = '', cls = '' } = opts;
  const base = `assets/img/${slug}/${img.stem}`;
  const webp = img.variants.map(v => `${base}-${v.w}.webp ${v.w}w`).join(', ');
  const jpeg = img.variants.map(v => `${base}-${v.w}.jpg ${v.w}w`).join(', ');
  const last = img.variants[img.variants.length - 1];
  return `<picture class="${cls}">
    <source type="image/webp" srcset="${webp}" sizes="${sizes}">
    <img src="${base}-${last.w}.jpg" srcset="${jpeg}" sizes="${sizes}"
         width="${last.w}" height="${last.h}" alt="${alt}"
         loading="${eager ? 'eager' : 'lazy'}" ${eager ? 'fetchpriority="high"' : ''} decoding="async">
  </picture>`;
}
function ratio(img){ return `${img.src_w} / ${img.src_h}`; }

/* fade each photograph in over its reserved box, once it decodes */
function watchImages(root = document){
  $$('img', root).forEach(im => {
    if (im.complete && im.naturalWidth) im.classList.add('is-loaded');
    else im.addEventListener('load', () => im.classList.add('is-loaded'), { once: true });
  });
}

/* ------------------------------------------------------- project helpers -- */
const byGrade = g => D.projects.filter(p => p.grade === g);
const heroes  = () => D.projects.filter(p => p.grade === 'hero');
const imgOf   = (p, stem) => p.images.find(i => i.stem === stem) || p.images[0];
const heroImg = p => imgOf(p, p.hero);
const altFor  = (p, i = 0) => `${p.client}, ${p.city} — interior fit-out by SCIPL${i ? ' (view ' + (i + 1) + ')' : ''}`;
const projLine = p => [p.sector, p.city, areaText(p.area_sqft)].filter(Boolean).join(' · ');

function cardHTML(p, sizes){
  const im = heroImg(p);
  return `<a class="card rv" href="project.html?p=${p.slug}" data-nav>
    <span class="card__fig fig" style="aspect-ratio:16/10">
      ${picture(p.slug, im, sizes, { alt: altFor(p) })}
      <span class="card__over">
        <span class="meta" style="color:rgba(255,255,255,.8)">${p.sector}</span>
        <span style="display:block;margin-top:6px">${p.headline}</span>
      </span>
    </span>
    <span class="card__body">
      <span class="card__head">
        <span class="card__client">${p.client}</span>
        <span class="meta" data-sqft="${p.area_sqft || ''}"></span>
      </span>
      <span class="card__line">${p.city} · ${p.sector}</span>
    </span>
  </a>`;
}

/* ================================================================ HEADER == */
(function header(){
  const hdr = $('.hdr');
  if (!hdr) return;
  const overHero = document.body.dataset.overhero === 'true';
  let last = 0;

  const onScroll = () => {
    const y = window.scrollY;
    const heroH = overHero ? (($('.hero') || {}).offsetHeight || 0) - 90 : 0;
    hdr.classList.toggle('is-stuck', y > 40);
    hdr.classList.toggle('is-over', overHero && y < heroH);
    // hide on the way down, bring it back the moment the reader scrolls up
    hdr.classList.toggle('is-hidden', y > 320 && y > last && !document.body.classList.contains('menu-open'));
    last = y;
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  const burger = $('.burger');
  if (burger) burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open));
    // staggered arrival — 40ms apart, over before you notice it
    $$('.menu a').forEach((a, i) => a.style.transitionDelay = open ? (i * 40) + 'ms' : '0ms');
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) burger.click();
  });
})();

/* ======================================================== SCROLL REVEAL == */
function observeReveals(root = document){
  if (PREF.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches){
    $$('.rv, .rv-stagger', root).forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });

  $$('.rv, .rv-stagger', root).forEach((el, i) => {
    // siblings inside a grid arrive in quick succession rather than all at once
    if (!el.style.transitionDelay) el.style.transitionDelay = Math.min(i % 6, 5) * 60 + 'ms';
    $$('.rv-stagger > *', el.parentElement === null ? document : el).forEach((c, j) =>
      c.style.transitionDelay = Math.min(j, 8) * 60 + 'ms');
    io.observe(el);
  });
}

/* ============================================================== PARALLAX == */
function parallax(){
  const media = $('.hero__media');
  if (!media) return;
  if (PREF.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const amount = parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue('--parallax')) || 0.15;
  let raf = 0;
  const run = () => {
    raf = 0;
    const hero = media.parentElement;
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    // the photograph drifts up more slowly than the page
    media.style.transform = `translate3d(0, ${(-rect.top * amount).toFixed(2)}px, 0)`;
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(run); }, { passive: true });
  run();
}

/* ====================================================== PAGE TRANSITION == */
(function transitions(){
  const veil = document.createElement('div');
  veil.className = 'pt';
  document.body.appendChild(veil);
  requestAnimationFrame(() => veil.classList.add('is-gone'));

  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-nav]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    if (PREF.motion === 'off'){ location.href = url.href; return; }
    veil.classList.remove('is-gone');
    setTimeout(() => location.href = url.href, 340);
  });
  addEventListener('pageshow', e => { if (e.persisted) veil.classList.add('is-gone'); });
})();

/* ============================================================== LIGHTBOX == */
const Lightbox = (() => {
  let items = [], idx = 0, el = null;
  function build(){
    el = document.createElement('div');
    el.className = 'lb';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML = `
      <button class="lb__x" aria-label="Close">&times;</button>
      <button class="lb__nav lb__prev" aria-label="Previous">&#8249;</button>
      <img alt="">
      <button class="lb__nav lb__next" aria-label="Next">&#8250;</button>
      <div class="lb__bar"><span class="lb__cap"></span><span class="lb__n"></span></div>`;
    document.body.appendChild(el);
    el.querySelector('.lb__x').onclick = close;
    el.querySelector('.lb__prev').onclick = () => go(-1);
    el.querySelector('.lb__next').onclick = () => go(1);
    el.addEventListener('click', e => { if (e.target === el) close(); });
    // swipe on touch devices
    let x0 = null;
    el.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
    el.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 46) go(dx < 0 ? 1 : -1);
      x0 = null;
    });
  }
  function paint(){
    const it = items[idx];
    el.querySelector('img').src = it.src;
    el.querySelector('img').alt = it.alt;
    el.querySelector('.lb__cap').textContent = it.cap || '';
    el.querySelector('.lb__n').textContent = `${idx + 1} / ${items.length}`;
  }
  function go(d){ idx = (idx + d + items.length) % items.length; paint(); }
  function close(){ el.classList.remove('is-open'); document.body.style.overflow = ''; }
  function open(list, i){
    if (!el) build();
    items = list; idx = i; paint();
    el.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    el.querySelector('.lb__x').focus();
  }
  addEventListener('keydown', e => {
    if (!el || !el.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });
  return { open };
})();

/* ======================================================== BEFORE / AFTER == */
function beforeAfter(node){
  const after = $('.ba__after', node), handle = $('.ba__handle', node);
  let dragging = false;

  // keep the clipped side the full width of the frame so both halves show the
  // same crop — otherwise the wipe reveals a different framing, not a change
  const sizeUp = () => node.style.setProperty('--ba-w', node.getBoundingClientRect().width + 'px');
  sizeUp();
  addEventListener('resize', sizeUp);
  if (window.ResizeObserver) new ResizeObserver(sizeUp).observe(node);
  const set = clientX => {
    const r = node.getBoundingClientRect();
    const pct = Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100));
    after.style.width = pct + '%';
    handle.style.left = pct + '%';
  };
  const down = e => { dragging = true; set(e.clientX ?? e.touches[0].clientX); };
  const move = e => { if (dragging) set(e.clientX ?? e.touches[0].clientX); };
  const up   = () => dragging = false;
  node.addEventListener('mousedown', down);
  node.addEventListener('touchstart', down, { passive: true });
  addEventListener('mousemove', move);
  addEventListener('touchmove', move, { passive: true });
  addEventListener('mouseup', up);
  addEventListener('touchend', up);
  node.addEventListener('click', e => { if (!dragging) set(e.clientX); });
}

/* ============================================================ PREFS PANEL = */
(function prefsPanel(){
  const host = $('.prefs');
  if (!host) return;
  $('.prefs__btn', host).addEventListener('click', () => host.classList.toggle('is-open'));
  document.addEventListener('click', e => {
    if (!host.contains(e.target)) host.classList.remove('is-open');
  });
  $$('[data-pref]', host).forEach(b =>
    b.addEventListener('click', () => setPref(b.dataset.pref, b.dataset.val)));
})();

/* the header's unit switch drives the same preference */
$$('.units [data-pref]').forEach(b =>
  b.addEventListener('click', () => setPref(b.dataset.pref, b.dataset.val)));

/* ============================================================ PROTO BAR == */
(function protobar(){
  const bar = $('.protobar');
  if (!bar) return;
  document.body.classList.add('protobar-on');
  $('.protobar button', bar).addEventListener('click', () => {
    bar.remove();
    document.body.classList.remove('protobar-on');
  });
})();

/* ================================================================ HOME ==== */
function renderHome(){
  const hs = heroes();

  // opening image — only a hero-grade photograph is allowed to run full-bleed
  const lead = hs.find(p => p.slug === 'ultratech-ahura-center-mumbai') || hs[0];
  const li = heroImg(lead);
  const media = $('.hero__media');
  if (media){
    media.innerHTML = picture(lead.slug, li, '100vw', { eager: true, alt: altFor(lead) });
    $('.hero__meta').innerHTML =
      `<p class="meta" style="color:rgba(255,255,255,.72)">${lead.client} · ${lead.city}</p>`;
  }

  // selected work — two features then a three-up
  const sel = hs.slice(0, 5);
  const f = $('#featured');
  if (f){
    f.innerHTML = sel.slice(0, 2).map((p, i) => {
      const im = heroImg(p);
      return `<article class="feature ${i % 2 ? 'feature--flip' : ''} rv" style="margin-bottom:var(--space-9)">
        <a class="fig" href="project.html?p=${p.slug}" data-nav style="aspect-ratio:${ratio(im)}">
          ${picture(p.slug, im, '(max-width:860px) 100vw, 58vw', { alt: altFor(p) })}
        </a>
        <div class="feature__txt">
          <p class="meta">${p.sector} · ${p.city}</p>
          <h3 style="margin-top:var(--space-3)">${p.client}</h3>
          <p class="muted" style="margin-top:var(--space-3)">${p.headline}.</p>
          <p style="margin-top:var(--space-5)">
            <a class="arw u" href="project.html?p=${p.slug}" data-nav>View project
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
                <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" stroke-width="1.4"/></svg></a>
          </p>
        </div>
      </article>`;
    }).join('') +
    `<div class="grid grid--3">${sel.slice(2, 5)
      .map(p => cardHTML(p, '(max-width:860px) 100vw, 30vw')).join('')}</div>`;
  }

  // clients — typographic until SCIPL supplies individual logo files
  const CLIENTS = ['Bosch','Colgate Palmolive','Oracle','Toyota','L&T','Ultratech','FedEx','UPS',
    'Vodafone','Godrej','Allianz','ICICI Prudential','TATA AIG','Knight Frank','NTT DATA','Fidelity',
    'Cummins','Suzlon','WNS','Mercer','Blue Dart','Toshiba','Druva','GRASIM'];
  const cw = $('#clients');
  if (cw) cw.innerHTML = CLIENTS.map(c => `<div>${c}</div>`).join('');

  // capabilities
  const CAPS = [
    ['Civil &amp; interior works', 'Structural alterations, flooring, partitions, wet areas and the full builder’s work package.', 'Self-performed'],
    ['Carpentry &amp; customised furniture', 'Site joinery and bespoke units built to the architect’s detail.', 'Self-performed'],
    ['False ceiling &amp; POP', 'Grid, gypsum, plaster and specialist ceiling systems.', 'Self-performed'],
    ['MEP services', 'HVAC, electrical, plumbing and networking, coordinated as one package.', '~Mixed — to confirm'],
    ['Fire &amp; life safety', 'Fire alarm systems, sprinklers and statutory approvals.', '~To confirm'],
    ['Glazing, metal &amp; ACP cladding', 'Façade elements, fabrication and exterior furnishing.', '~To confirm'],
  ];
  const cp = $('#caps');
  if (cp) cp.innerHTML = CAPS.map(([h, p, s]) => `<a href="#" class="rv">
      <h4>${h}</h4><p>${p}</p><span class="self">${val(s)}</span></a>`).join('');

  // sectors, with a live project count
  const sc = $('#sectorgrid');
  if (sc) sc.innerHTML = D.sectors.map(s => {
    const n = D.projects.filter(p => p.sector === s).length;
    return `<a href="work.html?sector=${encodeURIComponent(s)}" data-nav class="rv">
      <h4>${s}</h4><p>${n} project${n > 1 ? 's' : ''} in the portfolio</p></a>`;
  }).join('');

  watchImages();
}

/* ================================================================ WORK ==== */
function renderWork(){
  const grid = $('#workgrid');
  if (!grid) return;

  const selSector = $('#f-sector'), selCity = $('#f-city'), selScope = $('#f-scope');
  selSector.innerHTML = `<option value="">All sectors</option>` +
    D.sectors.map(s => `<option>${s}</option>`).join('');
  selCity.innerHTML = `<option value="">All cities</option>` +
    D.cities.map(s => `<option>${s}</option>`).join('');
  selScope.innerHTML = `<option value="">All capabilities</option>` +
    D.scopes.map(s => `<option>${s}</option>`).join('');

  grid.innerHTML = D.projects
    .map(p => cardHTML(p, '(max-width:860px) 100vw, (max-width:1100px) 46vw, 30vw')
      .replace('class="card rv"', `class="card rv" data-sector="${p.sector}" data-city="${p.city}" data-scope="${p.scope.join('|')}"`))
    .join('');

  // read the opening filter state out of the URL, so a filtered view is shareable
  const q = new URLSearchParams(location.search);
  selSector.value = q.get('sector') || '';
  selCity.value   = q.get('city')   || '';
  selScope.value  = q.get('scope')  || '';

  function apply(pushUrl = true){
    const s = selSector.value, c = selCity.value, sc = selScope.value;
    const cards = $$('.card', grid);

    // FLIP — measure, change, measure, invert, play. This is what makes the
    // remaining cards glide into their new positions instead of jumping.
    const first = new Map(cards.map(el => [el, el.getBoundingClientRect()]));

    let n = 0;
    cards.forEach(el => {
      const ok = (!s || el.dataset.sector === s)
              && (!c || el.dataset.city === c)
              && (!sc || el.dataset.scope.split('|').includes(sc));
      el.hidden = !ok;
      el.classList.toggle('is-out', !ok);
      if (ok) n++;
    });
    $('#count').textContent = `${n} of ${D.projects.length} projects`;

    if (PREF.motion !== 'off' && !matchMedia('(prefers-reduced-motion: reduce)').matches){
      cards.forEach(el => {
        if (el.hidden) return;
        const a = first.get(el), b = el.getBoundingClientRect();
        const dx = a.left - b.left, dy = a.top - b.top;
        if (!dx && !dy) return;
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
          { duration: 420, easing: 'cubic-bezier(.2,0,0,1)' });
      });
    }

    if (pushUrl){
      const p = new URLSearchParams();
      if (s) p.set('sector', s);
      if (c) p.set('city', c);
      if (sc) p.set('scope', sc);
      history.replaceState(null, '', p.toString() ? '?' + p : location.pathname);
    }
  }

  [selSector, selCity, selScope].forEach(el => el.addEventListener('change', () => apply()));
  $('#reset').addEventListener('click', () => {
    selSector.value = selCity.value = selScope.value = '';
    apply();
  });

  apply(false);
  watchImages();
}

/* ============================================================= PROJECT ==== */
function renderProject(){
  const slug = new URLSearchParams(location.search).get('p');
  const p = D.projects.find(x => x.slug === slug) || heroes()[0];
  if (!p) return;
  document.title = `${p.client}, ${p.city} — SCIPL`;

  const im = heroImg(p);
  const media = $('.hero__media');
  media.innerHTML = picture(p.slug, im, '100vw', { eager: true, alt: altFor(p) });
  $('#p-client').textContent = p.client;
  $('#p-eyebrow').textContent = `${p.sector} · ${p.city}`;
  $('#p-headline').textContent = p.headline.charAt(0).toUpperCase() + p.headline.slice(1) + '.';

  // ---- facts panel
  $('#p-facts').innerHTML = `
    <dl>
      <dt>Client</dt><dd>${p.client}</dd>
      <dt>Location</dt><dd>${p.location}</dd>
      <dt>Area</dt><dd><span data-sqft="${p.area_sqft || ''}"></span></dd>
      <dt>Sector</dt><dd>${p.sector}</dd>
      <dt>Status</dt><dd>${val(p.status)}</dd>
    </dl>
    <div class="facts__extra" id="p-extra">
      <dl>
        <dt>Completed</dt><dd>${val(p.year)}</dd>
        <dt>Programme</dt><dd>${val(p.duration)}</dd>
        <dt>Environment</dt><dd>${val(p.environment)}</dd>
        <dt>Consultants</dt><dd>${val(p.consultants)}</dd>
        <dt>Certification</dt><dd>${val(p.certification)}</dd>
        <dt>Scope of works</dt><dd>${p.scope.join(' · ')}</dd>
        <dt>Project manager</dt><dd>${val(p.pm)}</dd>
        <dt>Site in charge</dt><dd>${val(p.site_lead)}</dd>
      </dl>
    </div>
    <button class="more u" id="p-more" aria-expanded="false">More details</button>`;

  $('#p-more').addEventListener('click', e => {
    const box = $('#p-extra');
    const open = box.classList.toggle('is-open');
    e.currentTarget.textContent = open ? 'Fewer details' : 'More details';
    e.currentTarget.setAttribute('aria-expanded', String(open));
  });

  // ---- table of contents
  $('#p-toc').innerHTML = `<ol>` + p.story.map((s, i) =>
    `<li><a class="u" href="#s${i + 1}"><span class="num">${i + 1}</span>${s.h}</a></li>`).join('') +
    `<li><a class="u" href="#gallery"><span class="num">${p.story.length + 1}</span>Gallery</a></li></ol>`;

  // ---- story
  $('#p-story').innerHTML = p.story.map((s, i) =>
    `<section id="s${i + 1}" class="rv"><h3><span class="num">${i + 1}</span>${s.h}</h3>
     <p>${val(s.p)}</p></section>`).join('');

  // ---- before / after (placeholder pairing until bare-shell photography exists)
  const ba = $('#p-ba');
  if (p.images.length > 1){
    const a = p.images[0], b = heroImg(p);
    ba.innerHTML = `
      <div class="ba rv" style="aspect-ratio:16/9">
        <span class="ba__lbl ba__lbl--b">Before</span>
        <span class="ba__lbl ba__lbl--a">After</span>
        ${picture(p.slug, a, '100vw', { alt: 'Space as received' })}
        <div class="ba__after">${picture(p.slug, b, '100vw', { alt: 'Space as handed over' })}</div>
        <div class="ba__handle"><span class="ba__knob">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6 4 12l5 6M15 6l5 6-5 6" stroke="#111" stroke-width="1.6"/></svg>
        </span></div>
      </div>
      <p class="credit"><span class="awaiting" title="Placeholder — awaiting content from SCIPL">Demonstration only — the “before” frame is another photograph from the same project. This slider needs SCIPL’s bare-shell site photography.</span></p>`;
    beforeAfter($('.ba', ba));
  }

  // ---- gallery + lightbox
  const shots = p.images.filter(i => i.stem !== p.hero);
  const items = shots.map((i, n) => ({
    src: `assets/img/${p.slug}/${i.stem}-${i.variants[i.variants.length - 1].w}.jpg`,
    alt: altFor(p, n), cap: `${p.client}, ${p.city}`,
  }));
  $('#p-gallery').innerHTML = shots.map((i, n) =>
    `<button type="button" style="aspect-ratio:4/3" data-i="${n}" aria-label="Enlarge photograph ${n + 1}">
      ${picture(p.slug, i, '(max-width:560px) 50vw, 240px', { alt: altFor(p, n) })}</button>`).join('');
  $$('#p-gallery button').forEach(b =>
    b.addEventListener('click', () => Lightbox.open(items, Number(b.dataset.i))));

  // ---- next project
  const idx = D.projects.findIndex(x => x.slug === p.slug);
  const nx = D.projects[(idx + 1) % D.projects.length];
  const nim = heroImg(nx);
  $('#p-next').innerHTML = `
    <a class="feature rv" href="project.html?p=${nx.slug}" data-nav style="color:inherit">
      <span class="fig" style="aspect-ratio:${ratio(nim)}">
        ${picture(nx.slug, nim, '(max-width:860px) 100vw, 58vw', { alt: altFor(nx) })}</span>
      <span class="feature__txt">
        <span class="meta">Next project</span>
        <h3 style="margin-top:var(--space-3)">${nx.client}</h3>
        <span class="card__line" style="display:block">${nx.city} · ${nx.sector}</span>
      </span>
    </a>`;

  watchImages();
}

/* ================================================================= BOOT == */
if (page === 'home')    renderHome();
if (page === 'work')    renderWork();
if (page === 'project') renderProject();

renderAreas();
observeReveals();
parallax();
watchImages();

/* re-run the reveal observer after any late render */
setTimeout(() => { observeReveals(); watchImages(); }, 60);

})();
