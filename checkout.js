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
    document.getElementById('checkoutForm')
      .addEventListener('submit', e => {
        e.preventDefault();
        document.getElementById('checkoutMessage').textContent =
          'Форма готова. Безпечне надсилання замовлень ще налаштовується.';
      });
  };
})();
