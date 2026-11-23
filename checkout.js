(() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));

  window.openCheckout = function () {
    const drawer = document.getElementById('drawer');
    if (!drawer || typeof window.openDrawer !== 'function') {
      alert('Не вдалося відкрити оформлення замовлення.');
      return;
    }

    const html = `
      <form id="checkoutForm" style="display:grid;gap:14px">
        <label>Ваше ім'я *
          <input name="customer_name" required maxlength="100"
            placeholder="Наприклад, Олена">
        </label>
        <label>Номер телефону *
          <input name="customer_phone" type="tel" required
            maxlength="20" placeholder="+380...">
        </label>
        <label>Місто доставки *
          <input name="city" required maxlength="100"
            placeholder="Наприклад, Дніпро">
        </label>
        <label>Відділення Нової пошти *
          <input name="delivery_branch" required maxlength="150"
            placeholder="Відділення №5">
        </label>
        <label>Спосіб оплати *
          <select name="payment_method" required>
            <option value="Післяплата">Післяплата</option>
            <option value="Переказ на картку">Переказ на картку</option>
          </select>
        </label>
        <label>Коментар
          <textarea name="comment" maxlength="500"
            placeholder="Побажання до замовлення"></textarea>
        </label>
        <button type="submit" class="btn" id="submitOrder">
          Підтвердити замовлення
        </button>
        <p id="checkoutMessage" role="status"></p>
      </form>`;

    window.openDrawer('Оформлення замовлення', html, '');
        document.getElementById('checkoutForm').addEventListener('submit', async e => {
      e.preventDefault();
      const form = e.currentTarget;
      const button = form.querySelector('[type="submit"]');
      const message = document.getElementById('checkoutMessage');
      const items = window.getCheckoutItems?.() || [];

      if (!items.length) {
        message.textContent = 'Кошик порожній.';
        return;
      }

      const data = Object.fromEntries(new FormData(form));
      const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

      button.disabled = true;
      message.textContent = 'Зберігаємо замовлення...';

      try {
        const response = await fetch('https://voaadlzlmiyuxclfqmmi.supabase.co/rest/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: 'sb_publishable_hQyblRY4450gbOKLoXDabQ_dnHyGgn2',
            Authorization: 'Bearer sb_publishable_hQyblRY4450gbOKLoXDabQ_dnHyGgn2',
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            city: data.city,
            delivery_branch: data.delivery_branch,
            payment_method: data.payment_method,
            items,
            total_amount: total,
            status: 'new'
          })
        });

        if (!response.ok) throw new Error('HTTP ' + response.status);
        message.textContent = 'Замовлення прийнято! Дякуємо.';
        form.reset();
      } catch (error) {
        message.textContent = 'Не вдалося зберегти замовлення. Спробуйте ще раз.';
        console.error(error);
      } finally {
        button.disabled = false;
      }
    });
    };
})();
