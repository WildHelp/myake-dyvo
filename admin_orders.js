(() => {
  const db = window.supabase.createClient(
    'https://voaadlzlmiyuxclfqmmi.supabase.co',
    'sb_publishable_hQyblRY4450gbOKLoXDabQ_dnHyGgn2'
  );
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
  const statuses = {
    new:'Нове', confirmed:'Підтверджено',
    shipped:'Відправлено', completed:'Виконано',
    cancelled:'Скасовано'
  };
  const panel = document.getElementById('adminPanel');
  if (!panel) return;
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = '<h2>📦 Замовлення</h2><button type="button" id="refreshOrders">Оновити замовлення</button><p id="ordersMessage"></p><div id="ordersList"></div>';
  panel.appendChild(section);
  const message = section.querySelector('#ordersMessage');
  const list = section.querySelector('#ordersList');
  section.querySelector('#refreshOrders').onclick = loadOrders;

  async function loadOrders() {
    message.textContent = 'Завантаження...';
    list.replaceChildren();
    const { data: auth } = await db.auth.getUser();
    if (!auth?.user) {
      message.textContent = 'Увійдіть як адміністратор.';
      return;
    }
    const { data, error } = await db.from('orders')
      .select('*').order('created_at', { ascending:false });
    if (error) {
      message.textContent = 'Помилка: ' + error.message;
      return;
    }
    message.textContent = data.length ? '' : 'Замовлень поки немає.';
    for (const o of data) {
      const card = document.createElement('div');
      card.style.cssText = 'border:1px solid #ddd;border-radius:12px;padding:14px;margin:12px 0';
      const items = Array.isArray(o.items) ? o.items : [];
      card.innerHTML =
        '<strong>Замовлення '+esc(String(o.id).slice(0,8))+'</strong>'+
        '<p>'+esc(o.customer_name)+' · '+esc(o.customer_phone)+'</p>'+
        '<p>'+esc(o.city)+', '+esc(o.delivery_branch)+'</p>'+
        '<p>Оплата: '+esc(o.payment_method)+'</p>'+
        '<p>'+items.map(i => esc(i.name)+' × '+esc(i.qty)).join(', ')+'</p>'+
        '<strong>'+esc(o.total_amount)+' грн</strong><p>Статус:</p>';
      const select = document.createElement('select');
      for (const [value,label] of Object.entries(statuses)) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
      }
      select.value = o.status;
      select.onchange = async () => {
        select.disabled = true;
        const { error } = await db.from('orders')
          .update({status:select.value}).eq('id',o.id);
        if (error) alert('Помилка: '+error.message);
        select.disabled = false;
        if (error) loadOrders();
      };
      card.appendChild(select);
      list.appendChild(card);
    }
  }
  db.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') setTimeout(loadOrders, 0);
    if (event === 'SIGNED_OUT') {
      list.replaceChildren();
      message.textContent = 'Увійдіть як адміністратор.';
    }
  });
  loadOrders();
})();
