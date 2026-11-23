/* М'яке диво від Яни — Premium 4.1. Only improves navigation; does not touch orders/cart. */
(() => {
  'use strict';
  const init = () => {
    if (document.getElementById('p41-menu-toggle')) return;
    const nav = document.querySelector('.p3-nav');
    const head = document.querySelector('.header .head');
    if (!nav || !head) return;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'p41-menu-toggle';
    toggle.className = 'p41-menu-toggle';
    toggle.textContent = '☰';
    toggle.setAttribute('aria-label', 'Відкрити меню');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'p41-nav');
    nav.id = 'p41-nav';
    head.append(toggle);
    const close = () => {
      nav.classList.remove('p41-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Відкрити меню');
      toggle.textContent = '☰';
    };
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('p41-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Закрити меню' : 'Відкрити меню');
      toggle.textContent = isOpen ? '×' : '☰';
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) close();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') close();
    });
    document.addEventListener('click', event => {
      if (!nav.contains(event.target) && !toggle.contains(event.target)) close();
    });
    const mq = window.matchMedia('(min-width: 701px)');
    mq.addEventListener?.('change', event => { if (event.matches) close(); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
