/* Progressive enhancement only: original navigation and ordering remain intact. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const header = document.querySelector('.site-header, .header');
  const frame = document.querySelector('.hero-video-frame');
  const video = frame?.querySelector('video');
  const ribbons = [...document.querySelectorAll('.hero-ribbon, .side-ribbon')];
  let scheduled = false;
  let pointerX = 0, pointerY = 0;
  const updateMotion = () => {
    const scroll = window.scrollY;
    header?.classList.toggle('is-scrolled', scroll > 16);
    if (!reduced.matches) {
      ribbons.forEach((ribbon, index) => { ribbon.style.backgroundPosition = `0 ${scroll * .12 * (index ? -1 : 1)}px`; });
      if (frame && video) {
        const progress = Math.max(0, Math.min(1, scroll / Math.max(frame.offsetHeight, 1)));
        frame.style.transform = `scale(${1 - progress * .025})`;
        video.style.transform = `translate3d(${pointerX * 4}px,${pointerY * 3}px,0) scale(${1.025 + progress * .025})`;
      }
    } else {
      ribbons.forEach(ribbon => ribbon.style.backgroundPosition = '0 0');
      if (frame && video) { frame.style.transform = ''; video.style.transform = ''; }
    }
    scheduled = false;
  };
  const requestMotion = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateMotion); } };
  addEventListener('scroll', requestMotion, { passive: true });
  addEventListener('resize', requestMotion, { passive: true });
  reduced.addEventListener('change', requestMotion);
  updateMotion();

  if (frame && video) {
    const controls = document.createElement('div');
    controls.className = 'cinema-controls';
    const play = document.createElement('button');
    const sound = document.createElement('button');
    const bar = document.createElement('div');
    const fill = document.createElement('span');
    const status = document.createElement('span');
    status.className = 'video-status';
    status.setAttribute('role', 'status');
    bar.className = 'video-progress';
    bar.setAttribute('aria-hidden', 'true');
    bar.append(fill);
    [play,sound].forEach(button => { button.type = 'button'; button.className = 'cinema-control'; });
    controls.append(play, sound);
    frame.append(controls, bar, status);
    const icon = path => `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
    const sync = () => {
      play.setAttribute('aria-label', video.paused ? 'Play brand video' : 'Pause brand video');
      play.innerHTML = video.paused ? icon('<path d="m9 5 11 7-11 7Z"/>') : icon('<path d="M8 5v14M16 5v14"/>');
      sound.setAttribute('aria-label', video.muted ? 'Unmute brand video' : 'Mute brand video');
      sound.setAttribute('aria-pressed', String(!video.muted));
      sound.innerHTML = icon('<path d="M11 5 6 9H3v6h3l5 4Z"/>' + (video.muted ? '<path d="m16 9 5 6m0-6-5 6"/>' : '<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'));
    };
    let explicitlyPaused = reduced.matches;
    let visible = true;
    const tryPlay = async () => {
      try { await video.play(); status.textContent = ''; }
      catch { status.textContent = 'Press play to watch the brand film.'; }
      sync();
    };
    play.addEventListener('click', () => {
      if (video.paused) { explicitlyPaused = false; tryPlay(); }
      else { explicitlyPaused = true; video.pause(); }
    });
    sound.addEventListener('click', () => { video.muted = !video.muted; sync(); });
    ['play','pause','volumechange','loadedmetadata'].forEach(event => video.addEventListener(event, sync));
    video.addEventListener('timeupdate', () => { fill.style.transform = `scaleX(${Number.isFinite(video.duration) && video.duration > 0 ? video.currentTime / video.duration : 0})`; });
    video.addEventListener('error', () => { status.textContent = 'The brand film could not load. Please try reloading.'; });
    const visibility = () => {
      if (document.hidden || !visible) video.pause();
      else if (!explicitlyPaused) tryPlay();
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { visible = entries[0].isIntersecting; visibility(); }, { threshold: .05 }).observe(frame);
    }
    document.addEventListener('visibilitychange', visibility);
    reduced.addEventListener('change', () => { if (reduced.matches) { explicitlyPaused = true; video.pause(); } });
    frame.addEventListener('pointermove', event => {
      if (!fine.matches || reduced.matches) return;
      const rect = frame.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - .5;
      pointerY = (event.clientY - rect.top) / rect.height - .5;
      requestMotion();
    }, { passive: true });
    frame.addEventListener('pointerleave', () => { pointerX = pointerY = 0; requestMotion(); });
    if (reduced.matches) { video.autoplay = false; video.pause(); }
    sync();
  }

  const mobileNav = document.getElementById('mobile-nav');
  const toggle = document.getElementById('menu-toggle');
  const closeNav = (restoreFocus = false) => {
    if (!mobileNav?.classList.contains('open')) return;
    mobileNav.classList.remove('open');
    toggle?.setAttribute('aria-expanded','false');
    toggle?.setAttribute('aria-label','Open navigation menu');
    if (toggle) toggle.textContent = '☰';
    if (restoreFocus) toggle?.focus();
  };
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeNav(true); });
  document.addEventListener('click', event => { if (mobileNav && !mobileNav.contains(event.target) && !toggle?.contains(event.target)) closeNav(); });
  mobileNav?.addEventListener('click', event => { if (event.target.closest('a')) toggle?.setAttribute('aria-label','Open navigation menu'); });
  const desktopNav = matchMedia('(min-width: 791px)');
  desktopNav.addEventListener('change', event => { if (event.matches) closeNav(); });

  // Keep the day/night appearance consistent when moving between the two pages.
  const themeToggle = document.getElementById('theme-toggle');
  try {
    const saved = localStorage.getItem('delisse-original-theme');
    if ((saved === 'night' || saved === 'day') && saved !== document.documentElement.dataset.theme) themeToggle?.click();
  } catch { /* Browsers may disable local storage for local files. */ }
  themeToggle?.addEventListener('click', () => {
    try { localStorage.setItem('delisse-original-theme', document.documentElement.dataset.theme); } catch {}
  });

  const sections = [...document.querySelectorAll('main > section[id]')];
  if ('IntersectionObserver' in window && sections.length) {
    const tracker = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current','location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
    sections.forEach(section => tracker.observe(section));
  }
})();
