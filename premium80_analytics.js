/* М'яке диво від Яни — Premium 8.0 Analytics */
(() => {
  'use strict';

  const API = 'https://voaadlzlmiyuxclfqmmi.supabase.co/functions/v1/record-shop-analytics';

  const KEY = 'sb_publishable_hQyblRY4450gbOKLoXDabQ_dnHyGgn2';

  const STORAGE_KEY = 'myake_analytics_session';

  let sessionId;

  try {
    sessionId = sessionStorage.getItem(STORAGE_KEY);

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(STORAGE_KEY, sessionId);
    }
  } catch {
    sessionId = crypto.randomUUID();
  }

  const recent = new Map();

  async function record(eventType, productId = null) {
    const key = eventType + ':' + productId;
    const now = Date.now();

    if (now - (recent.get(key) || 0) < 1000) return;

    recent.set(key, now);

    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: {
          apikey: KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: eventType,
          product_id: productId,
          session_id: sessionId
        }),
        keepalive: true
      });

      if (!response.ok) {
        console.warn('Analytics:', response.status);
      }
    } catch (error) {
      console.warn('Analytics unavailable');
    }
  }

  function getQty(id) {
    try {
      return Number(
        (window.getCheckoutItems?.() || [])
          .find(item =>
            String(item.id) === String(id)
          )?.qty || 0
      );
    } catch {
      return 0;
    }
  }

  function init() {
    if (window.myakeAnalyticsReady) return;

    window.myakeAnalyticsReady = true;

    record('page_view');

    document.addEventListener('click', event => {
      const target = event.target;

      if (!(target instanceof Element)) return;

      const image = target.closest(
        '#products .picture img'
      );

      if (image) {
        const card = image.closest('article.product');
        const button = card?.querySelector('[data-add]');
        const id = Number(button?.dataset.add);

        if (Number.isSafeInteger(id) && id > 0) {
          record('product_view', id);
        }
      }

      const add = target.closest(
        '#products [data-add]'
      );

      if (add && !add.disabled) {
        const id = Number(add.dataset.add);

        if (!Number.isSafeInteger(id) || id <= 0) return;

        const before = getQty(id);

        setTimeout(() => {
          if (getQty(id) > before) {
            record('add_to_cart', id);
          }
        }, 0);
      }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
