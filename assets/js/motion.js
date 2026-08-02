/* ===========================================================================
   SCIPL prototype — MOTION PROFILES
   ---------------------------------------------------------------------------
   Three identities, three motion vocabularies. Same content, same structure.

     WORKSHOP  480ms expo-out. Nothing fades in isolation — content is REVEALED
               from behind an edge, the way a drawing is unrolled. Rules and the
               gold bars draw themselves. Restrained parallax. Crosshair cursor.

     MARQUE    180ms mechanical. Snap, don't glide. Column grid lines draw down,
               the isometric mark bleeds in, mono labels resolve character by
               character, selected work pans horizontally under a pin, and the
               ticker never stops. Dot cursor with a label.

     MEASURE   600ms unhurried. Serif display rises word by word out of a mask,
               photographs settle from 1.06 to 1, parallax is the deepest of the
               three, and page changes wipe through a maroon field.

   Built on GSAP + ScrollTrigger + Lenis, vendored locally and pinned. One
   motion library, not the ten the reference study found on a competitor.
   =========================================================================== */
(() => {
'use strict';

const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
if (!hasGSAP) { window.SCIPLMotion = { boot(){}, reboot(){}, ok:false }; return; }

gsap.registerPlugin(ScrollTrigger);

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = () =>
  document.documentElement.dataset.motion === 'off' ||
  matchMedia('(prefers-reduced-motion: reduce)').matches;

/* per-identity character. Durations mirror each brand document exactly. */
const PROFILE = {
  blueprint: { dur:.9,  ease:'expo.out',  stagger:.09, lerp:.09, name:'Workshop' },
  signal:    { dur:.42, ease:'power3.out', stagger:.045, lerp:.16, name:'Marque' },
  imprint:   { dur:1.15, ease:'power3.out', stagger:.11, lerp:.06, name:'Measure' },
};

let lenis = null, touched = [], cursorAPI = null, tickerTweens = [];

/* -------------------------------------------------------------- helpers -- */
const track = el => { if (el) touched.push(el); return el; };

/* Word-level masking. Robust where true line detection is not: no dependency
   on fonts having settled, and it reflows correctly on resize. */
function splitWords(el){
  if (!el || el.dataset.split) return [];
  const text = el.textContent;
  if (!text.trim() || el.children.length) return [];
  el.dataset.split = '1';
  el.dataset.orig = text;
  el.innerHTML = text.trim().split(/\s+/)
    .map(w => `<span class="wd"><span>${w}</span></span>`).join(' ');
  return $$('.wd > span', el);
}
function unsplit(el){
  if (el && el.dataset.split){ el.textContent = el.dataset.orig; delete el.dataset.split; delete el.dataset.orig; }
}

function smoothScroll(lerp){
  if (lenis){ lenis.destroy(); lenis = null; }
  if (reduced()) return;
  lenis = new Lenis({ lerp, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis && lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ------------------------------------------------------- shared elements -- */
function scrollProgress(){
  const bar = $('.progress');
  if (!bar) return;
  track(bar);
  gsap.to(bar, { scaleX: 1, ease: 'none',
    scrollTrigger: { start: 0, end: () => document.body.scrollHeight - innerHeight, scrub: .2 } });
}

function cursor(mode){
  const c = $('.cur');
  if (!c || matchMedia('(hover:none)').matches) return null;
  const dot = $('.cur__dot', c), ring = $('.cur__ring', c), lbl = $('.cur__lbl', c);
  ring.style.borderRadius = mode === 'dot' ? '50%' : '0';
  dot.style.borderRadius  = mode === 'dot' ? '50%' : '0';
  ring.style.display = mode === 'none' ? 'none' : 'block';

  const xr = gsap.quickTo(ring, 'x', { duration: .5, ease: 'power3' });
  const yr = gsap.quickTo(ring, 'y', { duration: .5, ease: 'power3' });
  const xd = gsap.quickTo(dot, 'x', { duration: .12, ease: 'power3' });
  const yd = gsap.quickTo(dot, 'y', { duration: .12, ease: 'power3' });
  const xl = gsap.quickTo(lbl, 'x', { duration: .5, ease: 'power3' });
  const yl = gsap.quickTo(lbl, 'y', { duration: .5, ease: 'power3' });

  const move = e => { xr(e.clientX); yr(e.clientY); xd(e.clientX); yd(e.clientY);
                      xl(e.clientX); yl(e.clientY + 46); c.classList.add('is-on'); };
  addEventListener('mousemove', move);

  const over = e => {
    const media = e.target.closest('.card, .gal button, .fig, .ba');
    c.classList.toggle('is-media', !!media);
    if (media) lbl.textContent = media.closest('.ba') ? 'Drag' :
      (media.matches('.gal button') ? 'Enlarge' : 'View');
  };
  addEventListener('mouseover', over);
  return { destroy(){ removeEventListener('mousemove', move); removeEventListener('mouseover', over);
                      c.classList.remove('is-on', 'is-media'); } };
}

function magnetic(strength){
  $$('.mag').forEach(m => {
    const inner = m.firstElementChild; if (!inner) return;
    track(m); track(inner);
    const xm = gsap.quickTo(m, 'x', { duration: .4, ease: 'power3' });
    const ym = gsap.quickTo(m, 'y', { duration: .4, ease: 'power3' });
    m._enter = e => {};
    m._move = e => {
      const r = m.getBoundingClientRect();
      xm((e.clientX - (r.left + r.width / 2)) * strength);
      ym((e.clientY - (r.top + r.height / 2)) * strength);
    };
    m._leave = () => { xm(0); ym(0); };
    m.addEventListener('mousemove', m._move);
    m.addEventListener('mouseleave', m._leave);
  });
}

function marquee(){
  $$('.tick__row').forEach(row => {
    track(row);
    if (!row.dataset.dup){ row.innerHTML += row.innerHTML; row.dataset.dup = '1'; }
    const w = row.scrollWidth / 2;
    tickerTweens.push(gsap.fromTo(row, { x: 0 }, {
      x: -w, duration: w / 55, ease: 'none', repeat: -1,
    }));
  });
}

/* ============================================================== PROFILES == */

/* ---- 01 WORKSHOP: content is uncovered from behind an edge --------------- */
function workshop(p){
  smoothScroll(p.lerp);

  $$('.rv, .rv-stagger').forEach(el => {
    el.classList.add('is-in');
    const kids = el.classList.contains('rv-stagger') ? [...el.children] : [el];
    kids.forEach(track);
    gsap.fromTo(kids,
      { clipPath: 'inset(0% 0% 100% 0%)', y: 26 },
      { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: p.dur, ease: p.ease,
        stagger: p.stagger,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  // the hairline rules draw themselves in
  $$('.sec-head').forEach(h => {
    h.classList.add('is-in');
    track(h);
    gsap.fromTo(h, { '--rule-scale': 0 }, {
      scrollTrigger: { trigger: h, start: 'top 92%', once: true },
      duration: p.dur, ease: p.ease,
    });
    gsap.fromTo(h, { borderBottomColor: 'rgba(0,0,0,0)' },
      { borderBottomColor: getComputedStyle(document.documentElement).getPropertyValue('--rule'),
        duration: p.dur, ease: p.ease,
        scrollTrigger: { trigger: h, start: 'top 92%', once: true } });
  });

  // photographs are uncovered, never faded. Clip the <img>, never the
  // <picture> — see the note in site.css about inline boxes.
  $$('.fig, .card__fig, .hero__media').forEach(f => {
    const im = $('img', f); if (!im) return;
    track(im);
    gsap.fromTo(im, { clipPath: 'inset(0% 0% 100% 0%)', scale: 1.04 },
      { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.15, ease: p.ease,
        scrollTrigger: { trigger: f, start: 'top 92%', once: true } });
  });

  heroParallax(.12);
  scrollProgress();
  cursorAPI = cursor('cross');
}

/* ---- 02 MARQUE: snap, grid, pan, tick ----------------------------------- */
function marque(p){
  smoothScroll(p.lerp);

  $$('.rv, .rv-stagger').forEach(el => {
    el.classList.add('is-in');
    const kids = el.classList.contains('rv-stagger') ? [...el.children] : [el];
    kids.forEach(track);
    gsap.fromTo(kids, { autoAlpha: 0, y: 14 },
      { autoAlpha: 1, y: 0, duration: p.dur, ease: p.ease, stagger: p.stagger,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });

  // the column grid draws down through each section divider
  $$('.gridlines').forEach(g => {
    if (!g.children.length) g.innerHTML = '<i></i>'.repeat(12);
    [...g.children].forEach(track);
    gsap.to([...g.children], { scaleY: 1, duration: .5, ease: 'power2.out', stagger: .03,
      scrollTrigger: { trigger: g.parentElement, start: 'top 80%', once: true } });
  });

  // the isometric mark bleeds in off the edge
  $$('.orn').forEach(o => {
    track(o);
    gsap.fromTo(o, { x: 80, autoAlpha: 0 }, { x: 0, autoAlpha: .06, duration: 1, ease: 'power2.out',
      scrollTrigger: { trigger: o.parentElement, start: 'top 78%', once: true } });
  });

  // mono labels resolve character by character
  const GLYPH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  $$('.sec-head .meta, .datarow__k').slice(0, 24).forEach(el => {
    const final = el.textContent; if (final.length > 60) return;
    track(el);
    ScrollTrigger.create({
      trigger: el, start: 'top 94%', once: true,
      onEnter(){
        let f = 0;
        const id = setInterval(() => {
          f++;
          el.textContent = final.split('').map((ch, i) =>
            i < f / 1.6 || ch === ' ' ? ch : GLYPH[(Math.random() * GLYPH.length) | 0]).join('');
          if (f / 1.6 >= final.length){ clearInterval(id); el.textContent = final; }
        }, 26);
      },
    });
  });

  // selected work pans sideways under a pin
  const rail = $('.rail'), vpTrack = $('.rail__track');
  if (rail && vpTrack && innerWidth > 860){
    track(vpTrack);
    const dist = () => Math.max(0, vpTrack.scrollWidth - innerWidth + 40);
    gsap.to(vpTrack, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: rail, start: 'top top', end: () => '+=' + dist(),
        pin: true, scrub: .5, invalidateOnRefresh: true, anticipatePin: 1 },
    });
  }

  marquee();
  magnetic(.28);
  heroParallax(.18);
  scrollProgress();
  cursorAPI = cursor('dot');
}

/* ---- 03 MEASURE: serif rises out of a mask, images settle --------------- */
function measure(p){
  smoothScroll(p.lerp);

  // display type and headings arrive word by word from behind a mask
  $$('.display, h2, .statement, .pull__q').forEach(el => {
    const words = splitWords(el);
    if (!words.length) return;
    track(el);
    gsap.fromTo(words, { yPercent: 115 }, {
      yPercent: 0, duration: p.dur, ease: p.ease, stagger: .045,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  $$('.rv, .rv-stagger').forEach(el => {
    el.classList.add('is-in');
    const kids = el.classList.contains('rv-stagger') ? [...el.children] : [el];
    kids.forEach(track);
    gsap.fromTo(kids, { autoAlpha: 0, y: 34 },
      { autoAlpha: 1, y: 0, duration: p.dur, ease: p.ease, stagger: p.stagger,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  // photographs settle rather than appear
  $$('.fig img, .card__fig img, .hero__media img').forEach(im => {
    track(im);
    gsap.fromTo(im, { scale: 1.06 }, { scale: 1, duration: 1.6, ease: 'power2.out',
      scrollTrigger: { trigger: im.closest('.fig, .card__fig, .hero__media'), start: 'top 92%', once: true } });
  });

  heroParallax(.22);
  scrollProgress();
  cursorAPI = cursor('none');
}

/* ------------------------------------------------------- shared parallax -- */
function heroParallax(amount){
  const media = $('.hero__media');
  if (!media || reduced()) return;
  track(media);
  gsap.fromTo(media, { yPercent: -amount * 50 }, {
    yPercent: amount * 50, ease: 'none',
    scrollTrigger: { trigger: media.parentElement, start: 'top bottom', end: 'bottom top', scrub: .6 },
  });
}

/* =============================================================== control == */
function teardown(){
  ScrollTrigger.getAll().forEach(t => t.kill(true));
  tickerTweens.forEach(t => t.kill()); tickerTweens = [];
  gsap.globalTimeline.clear();
  if (cursorAPI){ cursorAPI.destroy(); cursorAPI = null; }
  $$('.mag').forEach(m => {
    if (m._move) m.removeEventListener('mousemove', m._move);
    if (m._leave) m.removeEventListener('mouseleave', m._leave);
  });
  $$('[data-split]').forEach(unsplit);
  if (touched.length) gsap.set(touched, { clearProps: 'all' });
  touched = [];
  if (lenis){ lenis.destroy(); lenis = null; }
  $$('.tick__row').forEach(r => { if (r.dataset.dup){ r.innerHTML = r.innerHTML.slice(0, r.innerHTML.length / 2); delete r.dataset.dup; } });
}

/* ⭐ The rule we hold every competitor to: motion enhances, it never reveals.
   GSAP's from-states are driven by requestAnimationFrame, and rAF stalls in a
   background tab, on a throttled device, or if the main thread is saturated.
   This watchdog runs on setTimeout — which does NOT stall — and force-completes
   any entrance whose trigger is already on screen. Content can never be trapped
   behind an effect that failed to run. */
function watchdog(){
  const sweep = () => {
    ScrollTrigger.getAll().forEach(t => {
      if (t.vars && t.vars.scrub) return;              // parallax + progress bar
      const a = t.animation;
      if (a && a.progress() === 0 && t.start <= scrollY + innerHeight) a.progress(1);
    });
    $$('.rv, .rv-stagger, .sec-head').forEach(el => el.classList.add('is-in'));
  };
  setTimeout(sweep, 1800);
  setTimeout(sweep, 4000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(() => ScrollTrigger.refresh(), 120);
  });
}

function boot(){
  const theme = document.documentElement.dataset.theme || 'blueprint';
  const p = PROFILE[theme] || PROFILE.blueprint;

  if (reduced()){
    $$('.rv, .rv-stagger, .sec-head').forEach(el => el.classList.add('is-in'));
    $$('.gridlines i').forEach(i => i.style.transform = 'scaleY(1)');
    $$('.orn').forEach(o => o.style.opacity = '.06');
    return;
  }

  if (theme === 'signal')      marque(p);
  else if (theme === 'imprint') measure(p);
  else                          workshop(p);

  requestAnimationFrame(() => ScrollTrigger.refresh());
  setTimeout(() => ScrollTrigger.refresh(), 400);
  watchdog();
}

window.SCIPLMotion = {
  ok: true,
  boot,
  reboot(){ teardown(); scrollTo(0, scrollY); boot(); },
  profileName(){ return (PROFILE[document.documentElement.dataset.theme] || {}).name || ''; },
};

})();
