/* М'яке диво — Premium 9.2 Custom Orders */
(() => {
  'use strict';

  const BASE = 'https://voaadlzlmiyuxclfqmmi.supabase.co';
  const KEY = 'sb_publishable_hQyblRY4450gbOKLoXDabQ_dnHyGgn2';

  const allowed = new Map();
  let sending = false;

  const style = document.createElement('style');

  style.textContent = `
    .p92-custom-btn {
      width: 100%;
      padding: 12px 6px;
      margin-top: 8px;
      background: #f4e5ec;
      color: #98516f;
      border: 1px solid #dfc3d0;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    #p92-dialog {
      width: min(92vw, 440px);
      max-height: 85dvh;
      overflow-y: auto;
      box-sizing: border-box;
      border: 0;
      border-radius: 22px;
      padding: 20px;
      background: #fffaf7;
      color: #503b46;
    }

    #p92-dialog::backdrop {
      background: rgba(30,20,28,.75);
    }

    #p92-dialog h2 {
      font-size: 23px;
      margin: 0 0 10px;
    }

    #p92-dialog label {
      display: block;
      margin: 12px 0 5px;
      font-size: 14px;
      font-weight: 600;
    }

    #p92-dialog input,
    #p92-dialog textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #dfd0d7;
      border-radius: 10px;
      padding: 11px;
      background: white;
      color: #503b46;
      font-size: 16px;
    }

    #p92-dialog textarea {
      min-height: 85px;
      resize: vertical;
    }

    #p92-submit {
      width: 100%;
      padding: 14px;
      margin-top: 16px;
      border: 0;
      border-radius: 12px;
      background: #a34e65;
      color: white;
      font-size: 15px;
      cursor: pointer;
    }

    #p92-submit:disabled {
      opacity: .6;
    }

    #p92-close {
      float: right;
      border: 0;
      background: #f1e5eb;
      color: #503b46;
      border-radius: 50%;
      width: 34px;
      height: 34px;
      font-size: 20px;
    }

    #p92-message {
      font-size: 14px;
      margin-top: 12px;
      line-height: 1.5;
    }

    #p92-product {
      background: #f3e7ed;
      padding: 12px;
      border-radius: 10px;
      font-weight: 600;
    }

    #p92-note {
      font-size: 12px;
      line-height: 1.5;
      color: #82757c;
    }
  `;

  document.head.append(style);

  function createDialog() {
    const dialog = document.createElement('dialog');
    dialog.id = 'p92-dialog';

    dialog.innerHTML = `
      <button type="button" id="p92-close">×</button>

      <h2>Індивідуальне замовлення</h2>

      <p id="p92-product"></p>

      <form id="p92-form">

        <label for="p92-name">Ваше ім'я *</label>
        <input id="p92-name"
          name="customer_name"
          minlength="2"
          maxlength="100"
          autocomplete="name"
          required>

        <label for="p92-phone">Номер телефону *</label>
        <input id="p92-phone"
          name="customer_phone"
          type="tel"
          autocomplete="tel"
          minlength="10"
          maxlength="20"
          placeholder="+380..."
          required>

        <label for="p92-color">Бажаний колір</label>
        <input id="p92-color"
          name="desired_color"
          maxlength="100"
          placeholder="Наприклад, рожевий">

        <label for="p92-size">Бажаний розмір</label>
        <input id="p92-size"
          name="desired_size"
          maxlength="100"
          placeholder="Наприклад, 15 см">

        <label for="p92-comment">Додаткові побажання</label>
        <textarea id="p92-comment"
          name="customer_comment"
          maxlength="1000"
          placeholder="Опишіть ваші побажання"></textarea>

        <p id="p92-note">
          Остаточну вартість і термін виготовлення
          майстриня узгодить із вами особисто.
          Надсилання заявки не потребує оплати.
          Ваші контактні дані використовуються
          для зв'язку щодо замовлення.
        </p>

        <button id="p92-submit" type="submit">
          Надіслати заявку
        </button>

        <div id="p92-message" role="status"></div>

      </form>
    `;

    document.body.append(dialog);

    dialog.querySelector('#p92-close')
      .addEventListener('click', () => {
        if (!sending) dialog.close();
      });

    dialog.addEventListener('cancel', event => {
      if (sending) event.preventDefault();
    });

    dialog.querySelector('form')
      .addEventListener('submit', submitOrder);

    return dialog;
  }

  function openOrder(id) {
    const product = allowed.get(String(id));

    if (!product || sending) return;

    const dialog =
      document.getElementById('p92-dialog')
      || createDialog();

    dialog.dataset.productId = String(id);

    dialog.querySelector('#p92-product')
      .textContent = product.name;

    dialog.querySelector('form').reset();

    dialog.querySelector('#p92-message')
      .textContent = '';

    dialog.querySelector('#p92-submit')
      .disabled = false;

    dialog.querySelector('#p92-submit')
      .textContent = 'Надіслати заявку';

    if (!dialog.open) dialog.showModal();
  }

  async function submitOrder(event) {
    event.preventDefault();

    if (sending) return;

    const form = event.currentTarget;
    const dialog = form.closest('dialog');
    const button = form.querySelector('#p92-submit');
    const message = form.querySelector('#p92-message');

    const data = Object.fromEntries(
      new FormData(form).entries()
    );

    Object.keys(data).forEach(key => {
      data[key] = String(data[key]).trim();
    });

    data.product_id = Number(dialog.dataset.productId);

    const digits = data.customer_phone.replace(/\D/g, '');

    if (
      data.customer_name.length < 2 ||
      digits.length < 10 ||
      digits.length > 15
    ) {
      message.style.color = '#b42318';
      message.textContent =
        "Перевірте ім'я та номер телефону.";
      return;
    }

    sending = true;
    button.disabled = true;
    button.textContent = 'Надсилання...';
    message.textContent = '';

    let success = false;

    try {
      const response = await fetch(
        BASE + '/functions/v1/submit-custom-order',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': KEY
          },
          body: JSON.stringify(data)
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || 'Не вдалося надіслати заявку'
        );
      }

      success = true;

      message.style.color = '#39734d';
      message.textContent =
        "Дякуємо! Заявку отримано. Майстриня зв'яжеться з вами.";

      form.reset();
      button.textContent = 'Заявку надіслано ✓';

    } catch (error) {
      message.style.color = '#b42318';
      message.textContent =
        error.message || 'Помилка. Спробуйте пізніше.';

    } finally {
      sending = false;

      if (!success) {
        button.disabled = false;
        button.textContent = 'Надіслати заявку';
      }
    }
  }

  function addButtons() {
    document.querySelectorAll('article.product')
      .forEach(card => {

        const add = card.querySelector('[data-add]');
        const details = card.querySelector('.details');

        if (!add || !details) return;

        const id = String(add.dataset.add);
        const existing =
          card.querySelector('.p92-custom-btn');

        if (!allowed.has(id)) {
          if (existing) existing.remove();
          return;
        }

        if (existing) return;

        const button = document.createElement('button');

        button.type = 'button';
        button.className = 'p92-custom-btn';
        button.textContent = 'Замовити індивідуально';

        button.addEventListener('click', event => {
          event.stopPropagation();
          openOrder(id);
        });

        details.append(button);
      });
  }

  async function loadAllowed() {
    try {
      const response = await fetch(
        BASE +
        '/rest/v1/products?select=id,name,toy_custom' +
        '&is_published=eq.true&toy_custom=eq.true',
        {
          headers: {
            apikey: KEY
          }
        }
      );

      if (!response.ok) {
        throw new Error('Products unavailable');
      }

      const rows = await response.json();

      allowed.clear();

      rows.forEach(product => {
        allowed.set(String(product.id), product);
      });

      addButtons();

    } catch (error) {
      console.error('Custom orders:', error);
    }
  }

  function init() {
    const grid = document.getElementById('products');

    if (!grid) return;

    let timer;

    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(addButtons, 100);
    }).observe(grid, {
      childList: true,
      subtree: true
    });

    loadAllowed();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
