(function () {
  const TAP_SELECTOR = 'a, button, [role="button"], input[type="submit"]';

  function isLocalNavigationLink(link) {
    if (!link || link.target || link.hasAttribute('download')) return false;
    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('javascript:')) return false;
    try {
      return new URL(href, location.href).origin === location.origin;
    } catch {
      return false;
    }
  }

  function setPressed(el) {
    if (!el) return;
    el.classList.add('tap-active');
    window.setTimeout(() => el.classList.remove('tap-active'), 140);
  }

  document.addEventListener('pointerdown', (event) => {
    const target = event.target.closest(TAP_SELECTOR);
    if (target) setPressed(target);
  }, { passive: true });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!isLocalNavigationLink(link)) return;
    link.classList.add('is-submitting');
  }, { passive: true });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!form || form.dataset.submitting === '1') {
      event.preventDefault();
      return;
    }
    form.dataset.submitting = '1';
    const button = form.querySelector('button[type="submit"], input[type="submit"]');
    if (button) {
      button.classList.add('is-submitting');
      button.setAttribute('aria-busy', 'true');
      if (!button.dataset.originalText && button.tagName === 'BUTTON') {
        button.dataset.originalText = button.textContent;
        button.textContent = 'Chargement...';
      }
    }
  }, true);

  window.addEventListener('pageshow', () => {
    document.querySelectorAll('.is-submitting').forEach((el) => el.classList.remove('is-submitting'));
    document.querySelectorAll('form[data-submitting="1"]').forEach((form) => {
      delete form.dataset.submitting;
      const button = form.querySelector('button[data-original-text]');
      if (button) {
        button.textContent = button.dataset.originalText;
        delete button.dataset.originalText;
        button.removeAttribute('aria-busy');
      }
    });
  });
})();
