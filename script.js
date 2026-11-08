/* =========================================================
   PORTFOLIO SCRIPT (vanilla JavaScript, no libraries)
   1. Helpers      2. Theme        3. Mobile nav
   4. Smooth scroll & active nav   5. Typing animation
   6. Project filter   7. Modal & project buttons
   8. Contact form     9. Back to top, reveal, misc
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 1. HELPERS ---------- */
  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));
  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const toast = $('#toast');
  let toastTimer;

  /** Show a short message at the bottom of the screen. */
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
  }

  /* ---------- 2. THEME (saved in localStorage) ---------- */
  const THEME_KEY = 'portfolio-theme';
  const themeToggle = $('#theme-toggle');

  function readSavedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }

  function initTheme() {
    applyTheme(readSavedTheme() === 'light' ? 'light' : 'dark');
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage unavailable: theme still applies */ }
    });
  }

  /* ---------- 3. MOBILE NAVIGATION ---------- */
  const nav = $('#primary-nav');
  const navToggle = $('#nav-toggle');

  function setNavOpen(open) {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  function initNav() {
    navToggle.addEventListener('click', () => setNavOpen(!nav.classList.contains('is-open')));
    window.addEventListener('resize', () => { if (window.innerWidth > 899) setNavOpen(false); });
  }

  /* ---------- 4. SMOOTH SCROLL & ACTIVE NAV ---------- */
  const navLinks = $$('.nav-link');
  const trackedSections = $$('main section[data-nav]');

  function initSmoothScroll() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || link.getAttribute('href').length < 2) return;
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', link.getAttribute('href'));
      setNavOpen(false); // close the mobile menu after choosing an item
    });
  }

  /** Highlight the nav link that belongs to the section currently in view. */
  function updateActiveNav() {
    const probe = window.scrollY + 120;
    let current = trackedSections[0].dataset.nav;
    trackedSections.forEach((section) => {
      if (section.getBoundingClientRect().top + window.scrollY <= probe) current = section.dataset.nav;
    });
    const atPageBottom = window.innerHeight + window.scrollY >= root.scrollHeight - 4;
    if (atPageBottom) current = 'contact';

    navLinks.forEach((link) => {
      const active = link.dataset.nav === current;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
  }

  /* ---------- 5. TYPING ANIMATION ---------- */
  function initTyping() {
    const el = $('#typed-text');
    if (!el || prefersReducedMotion) return;
    const words = el.dataset.words.split(',').map((w) => w.trim()).filter(Boolean);
    if (words.length < 2) return;

    let wordIndex = 0;
    let charCount = words[0].length;
    let deleting = true;

    function tick() {
      const word = words[wordIndex];
      charCount += deleting ? -1 : 1;
      el.textContent = word.slice(0, charCount);
      let delay = deleting ? 45 : 90;
      if (!deleting && charCount === word.length) { deleting = true; delay = 1500; }
      else if (deleting && charCount === 0) { deleting = false; wordIndex = (wordIndex + 1) % words.length; delay = 300; }
      setTimeout(tick, delay);
    }
    setTimeout(tick, 1500);
  }

  /* ---------- 6. PROJECT FILTER ---------- */
  const projectCards = $$('.project-card');

  function initFilter() {
    const buttons = $$('.filter-btn');
    const emptyNote = $('#filter-empty');

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        buttons.forEach((b) => {
          const on = b === button;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', String(on));
        });
        let visibleCount = 0;
        projectCards.forEach((card) => {
          const show = filter === 'all' || card.dataset.category.split(' ').includes(filter);
          card.hidden = !show;
          if (show) visibleCount += 1;
        });
        emptyNote.hidden = visibleCount > 0;
      });
    });
  }

  /* ---------- 7. PROJECT MODAL & GITHUB / DEMO BUTTONS ---------- */
  const modal = $('#project-modal');
  const modalImage = $('#modal-image');
  let lastFocused = null;

  /** Open the link in a new tab, or explain that it has not been added yet. */
  function handleLinkButton(button) {
    const url = (button.dataset.url || '').trim();
    if (url) window.open(url, '_blank', 'noopener');
    else showToast(button.textContent.trim() + ' link has not been added yet.');
  }

  function openModal(card) {
    lastFocused = document.activeElement;
    const img = $('img', card);

    modalImage.hidden = false;
    modalImage.src = img.getAttribute('src');
    modalImage.alt = img.alt;
    $('#modal-category').textContent = $('.project-card__category', card).textContent;
    $('#modal-title').textContent = $('.project-card__title', card).textContent;
    $('#modal-desc').textContent = $('.project-card__desc', card).textContent;
    $('#modal-details').textContent = card.dataset.details || '';

    const techList = $('#modal-tech');
    techList.replaceChildren(...$$('.tag-list li', card).map((li) => li.cloneNode(true)));
    const githubButtons = $$('[data-action="github"]', card);
    const modalGithub = $('#modal-github');
    modalGithub.textContent = githubButtons[0].textContent;
    modalGithub.dataset.url = githubButtons[0].dataset.url;
    $('#modal-extra-links').replaceChildren(...githubButtons.slice(1).map((button) => button.cloneNode(true)));
    $('#modal-demo').dataset.url = $('[data-action="demo"]', card).dataset.url;

    modal.hidden = false;
    document.body.classList.add('no-scroll');
    $('.modal__close', modal).focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('no-scroll');
    if (lastFocused) lastFocused.focus();
  }

  function initModal() {
    modalImage.addEventListener('error', () => { modalImage.hidden = true; });

    document.addEventListener('click', (event) => {
      const linkButton = event.target.closest('[data-action]');
      if (linkButton) {
        if (linkButton instanceof HTMLAnchorElement) return;
        handleLinkButton(linkButton);
        return;
      }
      if (event.target.closest('[data-close-modal]')) { closeModal(); return; }
      const card = event.target.closest('.project-card');
      if (card) openModal(card);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (!modal.hidden) closeModal();
        else if (nav.classList.contains('is-open')) { setNavOpen(false); navToggle.focus(); }
      }
      // Keep keyboard focus inside the open modal
      if (event.key === 'Tab' && !modal.hidden) {
        const focusable = $$('button', modal);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
  }

  /** If a project image file is missing, mark it so the card shows its gradient instead. */
  function initImageFallback() {
    $$('.project-card__media img').forEach((img) => {
      const markMissing = () => img.parentElement.classList.add('is-missing');
      img.addEventListener('error', markMissing);
      if (img.complete && img.naturalWidth === 0) markMissing();
    });
  }

  /* ---------- 8. CONTACT FORM VALIDATION ---------- */
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const fieldRules = {
    name: (v) => (v.length < 2 ? 'Enter your name (at least 2 characters).' : ''),
    email: (v) => (!v ? 'Enter your email address.' : !EMAIL_PATTERN.test(v) ? 'Enter a valid email, like name@example.com.' : ''),
    subject: (v) => (v.length < 3 ? 'Enter a subject (at least 3 characters).' : ''),
    message: (v) => (v.length < 10 ? 'Write a message of at least 10 characters.' : '')
  };

  function setFieldError(input, message) {
    input.closest('.field').classList.toggle('has-error', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    $('#' + input.id + '-error').textContent = message;
  }

  function validateField(input) {
    const message = fieldRules[input.name](input.value.trim());
    setFieldError(input, message);
    return !message;
  }

  function initContactForm() {
    const form = $('#contact-form');
    const status = $('#form-status');
    const submitButton = $('button[type="submit"]', form);
    const inputs = $$('input, textarea', form);

    function setStatus(text, type) {
      status.textContent = text;
      status.classList.toggle('is-success', type === 'success');
      status.classList.toggle('is-error', type === 'error');
    }

    inputs.forEach((input) => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        if (input.closest('.field').classList.contains('has-error')) validateField(input);
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('', '');

      const results = inputs.map(validateField);
      if (results.includes(false)) {
        inputs[results.indexOf(false)].focus();
        setStatus('Fix the highlighted fields and try again.', 'error');
        return;
      }

      const endpoint = (form.dataset.endpoint || '').trim();
      if (!endpoint) {
        const mailLink = $('.contact-info__list a[data-email]');
        const address = mailLink ? mailLink.dataset.email : '';
        if (!address) {
          setStatus('The contact email address is unavailable. Please try again later.', 'error');
          return;
        }

        const values = Object.fromEntries(new FormData(form));
        const subject = encodeURIComponent(values.subject);
        const body = encodeURIComponent(
          'Name: ' + values.name + '\nEmail: ' + values.email + '\n\n' + values.message
        );
        const gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&to='
          + encodeURIComponent(address) + '&su=' + subject + '&body=' + body;
        window.open(gmailUrl, '_blank', 'noopener,noreferrer');
        setStatus('Gmail should open in a new tab. Review and send your draft there. ', 'success');
        const fallbackLink = document.createElement('a');
        fallbackLink.href = gmailUrl;
        fallbackLink.target = '_blank';
        fallbackLink.rel = 'noopener noreferrer';
        fallbackLink.textContent = 'Open Gmail draft';
        status.append(fallbackLink, '.');
        return;
      }

      submitButton.disabled = true;
      setStatus('Sending...', '');
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form)))
        });
        if (!response.ok) throw new Error('Request failed with status ' + response.status);
        form.reset();
        inputs.forEach((input) => setFieldError(input, ''));
        setStatus('Message sent. Thank you, I will reply soon.', 'success');
      } catch (error) {
        setStatus('The message could not be sent. Please try again or email me directly.', 'error');
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  /* ---------- 9. BACK TO TOP, SCROLL REVEAL, FOOTER YEAR ---------- */
  function initBackToTop() {
    const button = $('#back-to-top');
    window.addEventListener('scroll', () => button.classList.toggle('is-visible', window.scrollY > 500), { passive: true });
    button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }));
  }

  function initReveal() {
    if (!('IntersectionObserver' in window) || prefersReducedMotion) return;
    root.classList.add('reveal-ready');
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    $$('.reveal').forEach((el) => observer.observe(el));
  }

  /* ---------- START ---------- */
  function init() {
    $('#year').textContent = new Date().getFullYear();
    initTheme();
    initNav();
    initSmoothScroll();
    initTyping();
    initFilter();
    initModal();
    initImageFallback();
    initContactForm();
    initBackToTop();
    initReveal();

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { updateActiveNav(); ticking = false; });
    }, { passive: true });
    updateActiveNav();
  }

  init();
})();
