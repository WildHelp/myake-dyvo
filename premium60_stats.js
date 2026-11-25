/* М'яке диво від Яни — Premium 6.0 Statistics */
(() => {
  'use strict';

  const init = () => {
    const admin = document.getElementById('adminPanel');
    if (!admin || document.getElementById('p60-stats')) return;

    const style = document.createElement('style');
    style.textContent = `
      #p60-stats {
        background:#fffaf7;
        color:#493641;
        border:1px solid #eadce2;
        border-radius:22px;
        padding:18px;
        margin:20px 0;
      }
      #p60-stats h2 {
        margin:0 0 16px;
        font-size:24px;
      }
      #p60-stats h3 {
        margin:22px 0 12px;
      }
      .p60-periods {
        display:flex;
        flex-wrap:wrap;
        gap:7px;
        margin-bottom:16px;
      }
      .p60-periods button {
        border:0;
        border-radius:12px;
        padding:10px 13px;
        background:#f3e5ec;
        color:#75465e;
        cursor:pointer;
      }
      .p60-periods button.active {
        background:#a43e65;
        color:white;
      }
      .p60-metrics {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:10px;
      }
      .p60-metric {
        background:white;
        border:1px solid #eadce2;
        border-radius:16px;
        padding:14px;
      }
      .p60-metric small {
        display:block;
        color:#88717e;
        margin-bottom:8px;
      }
      .p60-metric strong {
        font-size:22px;
        color:#a43e65;
        overflow-wrap:anywhere;
      }
      .p60-chart {
        display:flex;
        align-items:flex-end;
        gap:8px;
        overflow-x:auto;
        min-height:190px;
        padding:10px 0;
      }
      .p60-column {
        flex:1;
        min-width:42px;
        text-align:center;
        font-size:10px;
      }
      .p60-bar {
        background:linear-gradient(#ca8ba6,#a43e65);
        border-radius:7px 7px 0 0;
        margin:5px auto;
        width:75%;
      }
      .p60-line {
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:10px;
        padding:12px 0;
        border-bottom:1px solid #eadce2;
      }
      .p60-progress {
        background:#efdee7;
        border-radius:8px;
        height:8px;
        overflow:hidden;
      }
      .p60-progress div {
        height:100%;
        background:#a43e65;
        border-radius:8px;
      }
      .p60-warning {
        color:#b77919;
        font-weight:700;
      }
      .p60-danger {
        color:#b52d48;
        font-weight:700;
      }
      #p60-status {
        font-size:12px;
        color:#88717e;
        margin-top:14px;
      }
      @media(max-width:480px) {
        #p60-stats {padding:12px}
        .p60-metric {padding:11px}
        .p60-metric strong {font-size:18px}
      }
    `;
    document.head.append(style);

    const panel = document.createElement('section');
    panel.id = 'p60-stats';

    panel.innerHTML = `
      <h2>📊 Статистика магазину</h2>

      <div class="p60-periods">
        <button type="button" data-period="1">Сьогодні</button>
        <button type="button" data-period="7">7 днів</button>
        <button type="button" data-period="30" class="active">30 днів</button>
        <button type="button" data-period="0">Увесь час</button>
        <button type="button" id="p60-refresh">↻ Оновити</button>
      </div>

      <div class="p60-metrics">
        <div class="p60-metric">
          <small>💰 Виручка</small>
          <strong id="p60-revenue">—</strong>
        </div>
        <div class="p60-metric">
          <small>📦 Замовлення</small>
          <strong id="p60-orders">—</strong>
        </div>
        <div class="p60-metric">
          <small>🧾 Середній чек</small>
          <strong id="p60-average">—</strong>
        </div>
        <div class="p60-metric">
          <small>🎟 Надані знижки</small>
          <strong id="p60-discounts">—</strong>
        </div>
        <div class="p60-metric">
          <small>✓ Завершені</small>
          <strong id="p60-completed">—</strong>
        </div>
        <div class="p60-metric">
          <small>✕ Скасовані</small>
          <strong id="p60-cancelled">—</strong>
        </div>
      </div>

      <h3>📈 Динаміка продажів</h3>
      <div id="p60-chart" class="p60-chart"></div>

      <h3>🏆 Найпопулярніші іграшки</h3>
      <div id="p60-popular"></div>

      <h3>⚠️ Низькі залишки товарів</h3>
      <div id="p60-lowstock"></div>

      <div id="p60-status"></div>
    `;

    admin.prepend(panel);

    const $ = id => document.getElementById(id);

    const money = value =>
      Number(value || 0).toLocaleString('uk-UA', {
        maximumFractionDigits:2
      }) + ' грн';

    const esc = value =>
      String(value ?? '').replace(
        /[&<>"']/g,
        c => ({
          '&':'&amp;',
          '<':'&lt;',
          '>':'&gt;',
          '"':'&quot;',
          "'":'&#39;'
        })[c]
      );

    const dateKey = value =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone:'Europe/Kyiv',
        year:'numeric',
        month:'2-digit',
        day:'2-digit'
      }).format(new Date(value));

    let orders = [];
    let products = [];
    let period = 30;
    let loading = false;

    function render() {
      const today = dateKey(new Date());

      const start = new Date(today + 'T12:00:00Z');
      start.setUTCDate(
        start.getUTCDate() - Math.max(0, period - 1)
      );

      const startKey = start.toISOString().slice(0,10);

      const selected = orders.filter(o => {
        const day = dateKey(o.created_at);
        return day <= today &&
          (!period || day >= startKey);
      });

      const completed = selected.filter(
        o => o.status === 'completed'
      );

      const cancelled = selected.filter(
        o => o.status === 'cancelled'
      );

      const revenue = completed.reduce(
        (sum,o) => sum + Number(o.total_amount || 0),0
      );

      const discounts = completed.reduce(
        (sum,o) => sum + Number(o.discount_amount || 0),0
      );

      $('p60-revenue').textContent = money(revenue);
      $('p60-orders').textContent = selected.length;
      $('p60-completed').textContent = completed.length;
      $('p60-cancelled').textContent = cancelled.length;
      $('p60-discounts').textContent = money(discounts);

      $('p60-average').textContent = money(
        completed.length ? revenue / completed.length : 0
      );

      const days = {};
      const popular = {};

      completed.forEach(order => {
        const day = dateKey(order.created_at);

        days[day] = (days[day] || 0) +
          Number(order.total_amount || 0);

        const items = Array.isArray(order.items)
          ? order.items : [];

        items.forEach(item => {
          const id = String(item.id ?? item.name);

          if (!popular[id]) {
            popular[id] = {
              name:item.name || 'Іграшка',
              qty:0
            };
          }

          popular[id].qty += Number(item.qty || 0);
        });
      });

      if (period) {
        for (let i = 0; i < period; i++) {
          const d = new Date(start);
          d.setUTCDate(d.getUTCDate() + i);
          const key = d.toISOString().slice(0,10);
          if (!(key in days)) days[key] = 0;
        }
      }

      const chart = Object.entries(days)
        .sort((a,b) => a[0].localeCompare(b[0]));

      const max = Math.max(1,...chart.map(x => x[1]));

      $('p60-chart').innerHTML = completed.length
        ? chart.map(([day,value]) => `
          <div class="p60-column">
            <span>${money(value)}</span>
            <div class="p60-bar"
              style="height:${Math.max(2,value/max*130)}px">
            </div>
            <span>${day.slice(8,10)}.${day.slice(5,7)}</span>
          </div>
        `).join('')
        : '<p>Завершених продажів за цей період ще немає.</p>';

      const best = Object.values(popular)
        .sort((a,b) => b.qty-a.qty)
        .slice(0,5);

      $('p60-popular').innerHTML = best.length
        ? best.map(item => `
          <div class="p60-line">
            <span>${esc(item.name)}</span>
            <strong>${item.qty} шт.</strong>
          </div>
          <div class="p60-progress">
            <div style="width:${item.qty/best[0].qty*100}%"></div>
          </div>
        `).join('')
        : '<p>Поки немає статистики продажів.</p>';

      const low = products
        .filter(p => p.is_published && Number(p.stock)<=2)
        .sort((a,b) => Number(a.stock)-Number(b.stock));

      $('p60-lowstock').innerHTML = low.length
        ? low.map(p => `
          <div class="p60-line">
            <span>${esc(p.name)}</span>
            <span class="${Number(p.stock)<=0
              ? 'p60-danger' : 'p60-warning'}">
              ${Number(p.stock)<=0
                ? 'Закінчився'
                : Number(p.stock)+' шт.'}
            </span>
          </div>
        `).join('')
        : '<p>✓ Залишки товарів достатні.</p>';

      $('p60-status').textContent =
        'Виручка, середній чек і знижки — за завершеними ' +
        'замовленнями, включно з архівними. ' +
        'Період визначається датою створення замовлення.';
    }

    async function fetchAll(table, columns) {
      const result = [];
      const size = 500;

      for (let offset = 0; ; offset += size) {
        const response = await db
          .from(table)
          .select(columns)
          .order('id',{ascending:true})
          .range(offset,offset+size-1);

        if (response.error) throw response.error;

        const rows = response.data || [];
        result.push(...rows);

        if (rows.length < size) break;
      }

      return result;
    }

    async function load() {
      if (loading || admin.hidden || admin.classList.contains('hidden')) return;
      loading = true;

      $('p60-status').textContent = 'Завантаження статистики…';

      try {
        const result = await Promise.all([
          fetchAll(
            'orders',
            'id,created_at,status,total_amount,discount_amount,items'
          ),
          fetchAll(
            'products',
            'id,name,stock,is_published'
          )
        ]);

        orders = result[0];
        products = result[1];

        render();
      } catch(error) {
        console.error('Premium Statistics:',error);

        $('p60-status').textContent =
          'Не вдалося завантажити статистику. Натисніть «Оновити».';
      } finally {
        loading = false;
      }
    }

    panel.querySelectorAll('[data-period]').forEach(button => {
      button.onclick = () => {
        period = Number(button.dataset.period);

        panel.querySelectorAll('[data-period]').forEach(b => {
          b.classList.toggle('active',b===button);
        });

        render();
      };
    });

    $('p60-refresh').onclick = load;

    const observer = new MutationObserver(() => {
      if (!admin.hidden && !admin.classList.contains('hidden')) {
        load();
      } else {
        orders = [];
        products = [];
        render();
      }
    });

    observer.observe(admin,{
      attributes:true,
      attributeFilter:['hidden','class']
    });

    if (!admin.hidden && !admin.classList.contains('hidden')) load();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',init);
  } else {
    init();
  }
})();

/* Premium 9.2 — Compact Statistics */
(() => {
  'use strict';

  const style = document.createElement('style');

  style.textContent = `
    #p60-stats {
      padding: 12px !important;
      margin: 10px 0 !important;
      border-radius: 14px !important;
    }

    #p60-stats h2 {
      font-size: 20px !important;
      margin: 0 0 12px !important;
    }

    #p60-stats h3 {
      font-size: 16px !important;
      margin: 16px 0 8px !important;
    }

    #p60-stats .p60-periods {
      display: grid;
      grid-template-columns: repeat(4, minmax(0,1fr));
      gap: 5px;
      margin-bottom: 12px;
    }

    #p60-stats .p60-periods button {
      font-size: 11px;
      padding: 8px 3px;
      border-radius: 8px;
    }

    #p60-refresh {
      grid-column: 1 / -1;
    }

    #p60-stats .p60-metrics {
      grid-template-columns: repeat(3, minmax(0,1fr));
      gap: 6px;
    }

    #p60-stats .p60-metric {
      padding: 9px 7px !important;
      border-radius: 10px;
    }

    #p60-stats .p60-metric small {
      font-size: 11px;
      line-height: 1.3;
      margin-bottom: 5px;
    }

    #p60-stats .p60-metric strong {
      font-size: 17px !important;
      line-height: 1.2;
    }

    #p60-chart {
      min-height: 165px;
      gap: 5px;
    }

    #p60-chart:has(> p:only-child) {
      min-height: 0 !important;
      display: block;
      padding: 0 !important;
      overflow: visible;
    }

    #p60-chart p,
    #p60-popular p,
    #p60-lowstock p {
      font-size: 13px;
      color: #82757c;
      margin: 6px 0;
      padding: 10px;
      background: #f5edf0;
      border-radius: 8px;
    }

    #p60-stats .p60-line {
      padding: 8px 0;
      font-size: 13px;
    }

    #p60-stats .p60-progress {
      height: 5px;
    }

    #p60-status {
      font-size: 10px !important;
      line-height: 1.4;
      margin-top: 12px;
    }

    @media(max-width: 350px) {
      #p60-stats .p60-metrics {
        grid-template-columns: repeat(2,minmax(0,1fr));
      }

      #p60-stats .p60-periods {
        grid-template-columns: repeat(2,minmax(0,1fr));
      }
    }
  `;

  document.head.append(style);
})();
