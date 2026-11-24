/* М'яке диво від Яни — Premium 8.0 Analytics */
(() => {
  'use strict';

  let period = 7;
  let requestId = 0;

  function init() {
    const panel = document.getElementById('adminPanel');
    if (!panel || document.getElementById('p80-analytics')) return;

    const style = document.createElement('style');

    style.textContent = `
      #p80-analytics {
        margin:24px 0;
        padding:20px;
        background:#fff9f7;
        color:#503b46;
        border:1px solid #ecdde2;
        border-radius:20px;
        box-sizing:border-box;
      }
      #p80-analytics h2 {
        font-size:24px;
        margin:0 0 8px;
      }
      .p80-periods {
        display:flex;
        flex-wrap:wrap;
        gap:7px;
        margin:16px 0;
      }
      .p80-periods button {
        padding:10px 13px;
        border:1px solid #ecdde2;
        border-radius:12px;
        background:white;
        color:#503b46;
        cursor:pointer;
      }
      .p80-periods button.active {
        background:#a43e65;
        color:white;
      }
      .p80-grid {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:10px;
      }
      .p80-stat {
        background:white;
        border:1px solid #ecdde2;
        border-radius:16px;
        padding:15px;
        overflow-wrap:anywhere;
      }
      .p80-stat span {
        display:block;
        font-size:13px;
        color:#806c77;
      }
      .p80-stat strong {
        display:block;
        font-size:30px;
        color:#a43e65;
        margin-top:6px;
      }
      .p80-chart {
        display:flex;
        align-items:flex-end;
        gap:8px;
        height:150px;
        overflow-x:auto;
        padding:12px 0;
      }
      .p80-column {
        flex:1;
        min-width:32px;
        max-width:65px;
        text-align:center;
        font-size:10px;
      }
      .p80-bar {
        background:linear-gradient(#d69ab2,#a43e65);
        border-radius:6px 6px 0 0;
        min-height:2px;
        margin:4px 0;
      }
      .p80-product {
        background:white;
        padding:12px;
        margin:8px 0;
        border-radius:12px;
        border:1px solid #ecdde2;
      }
      .p80-progress {
        height:7px;
        background:#f2e4eb;
        border-radius:10px;
        overflow:hidden;
        margin:8px 0;
      }
      .p80-progress div {
        height:100%;
        background:#a43e65;
        border-radius:10px;
      }
      .p80-muted {
        color:#806c77;
        font-size:13px;
      }
      #p80-refresh {
        background:#a43e65;
        color:white;
        border:0;
        border-radius:12px;
        padding:12px 18px;
        cursor:pointer;
        margin-top:12px;
      }
    `;

    document.head.append(style);

    const section = document.createElement('section');
    section.id = 'p80-analytics';

    section.innerHTML = `
      <h2>📊 Аналітика магазину</h2>
      <div class="p80-muted">
        Активність відвідувачів
      </div>

      <div class="p80-periods">
        <button type="button" data-days="1">Сьогодні</button>
        <button type="button" data-days="7" class="active">7 днів</button>
        <button type="button" data-days="30">30 днів</button>
        <button type="button" data-days="0">Увесь час</button>
      </div>

      <div class="p80-grid">
        <div class="p80-stat">
          <span>🌐 Відвідування</span>
          <strong id="p80-visits">—</strong>
        </div>
        <div class="p80-stat">
          <span>👁 Перегляди товарів</span>
          <strong id="p80-views">—</strong>
        </div>
        <div class="p80-stat">
          <span>🛒 Додавання в кошик</span>
          <strong id="p80-cart">—</strong>
        </div>
        <div class="p80-stat">
          <span>👥 Унікальні сесії</span>
          <strong id="p80-sessions">—</strong>
        </div>
      </div>

      <h3>Активність за днями</h3>
      <div id="p80-chart" class="p80-chart"></div>

      <h3>Популярні іграшки</h3>
      <div id="p80-products"></div>

      <button type="button" id="p80-refresh">
        ↻ Оновити статистику
      </button>

      <p id="p80-status" class="p80-muted"></p>
    `;

    panel.append(section);

    const el = id => document.getElementById(id);

    function dayKey(value) {
      return new Intl.DateTimeFormat('sv-SE', {
        timeZone:'Europe/Kyiv',
        year:'numeric',
        month:'2-digit',
        day:'2-digit'
      }).format(new Date(value));
    }

    function firstDay(days) {
      const date = new Date(dayKey(new Date()) + 'T12:00:00Z');
      date.setUTCDate(date.getUTCDate() - days + 1);
      return date.toISOString().slice(0,10);
    }

    async function load() {
      if (panel.hidden) return;

      const current = ++requestId;

      el('p80-status').textContent = 'Завантаження…';

      try {
        if (typeof db === 'undefined' || !db) {
          throw new Error('Supabase unavailable');
        }

        let rows = [];
        const cutoff = period ? firstDay(period) : null;

        for (let offset = 0; ; offset += 500) {
          let query = db
            .from('shop_analytics')
            .select('id,event_type,product_id,session_id,created_at')
            .order('id', {ascending:true});

          if (cutoff) {
            const start = new Date(cutoff + 'T00:00:00Z');
            start.setUTCDate(start.getUTCDate() - 1);
            query = query.gte('created_at', start.toISOString());
          }

          const {data,error} = await query.range(offset,offset+499);

          if (error) throw error;
          if (current !== requestId || panel.hidden) return;

          rows.push(...(data || []));

          if (!data || data.length < 500) break;
        }

        if (cutoff) {
          rows = rows.filter(r => dayKey(r.created_at) >= cutoff);
        }

        const visits = rows.filter(r => r.event_type === 'page_view');
        const views = rows.filter(r => r.event_type === 'product_view');
        const carts = rows.filter(r => r.event_type === 'add_to_cart');

        el('p80-visits').textContent = visits.length;
        el('p80-views').textContent = views.length;
        el('p80-cart').textContent = carts.length;

        el('p80-sessions').textContent =
          new Set(rows.map(r => r.session_id).filter(Boolean)).size;

        const daily = new Map();

        rows.forEach(r => {
          const day = dayKey(r.created_at);
          daily.set(day,(daily.get(day)||0)+1);
        });

        const chart = el('p80-chart');
        chart.replaceChildren();

        const days = [...daily.entries()].sort().slice(-30);
        const maximum = Math.max(1,...days.map(d => d[1]));

        days.forEach(([day,count]) => {
          const column = document.createElement('div');
          column.className = 'p80-column';

          const number = document.createElement('div');
          number.textContent = count;

          const bar = document.createElement('div');
          bar.className = 'p80-bar';
          bar.style.height = (count/maximum*105)+'px';

          const label = document.createElement('div');
          label.textContent = day.slice(8,10)+'.'+day.slice(5,7);

          column.append(number,bar,label);
          chart.append(column);
        });

        if (!days.length) {
          chart.textContent = 'Поки немає активності';
        }

        const popularity = new Map();

        [...views,...carts].forEach(r => {
          if (r.product_id == null) return;

          const id = String(r.product_id);
          const item = popularity.get(id) || {views:0,carts:0};

          if (r.event_type === 'product_view') item.views++;
          if (r.event_type === 'add_to_cart') item.carts++;

          popularity.set(id,item);
        });

        const top = [...popularity.entries()]
          .sort((a,b) => b[1].views-a[1].views ||
            b[1].carts-a[1].carts)
          .slice(0,10);

        const names = new Map();

        if (top.length) {
          const {data,error} = await db
            .from('products')
            .select('id,name')
            .in('id',top.map(item => item[0]));

          if (error) throw error;

          (data||[]).forEach(p => {
            names.set(String(p.id),p.name);
          });
        }

        if (current !== requestId || panel.hidden) return;

        const list = el('p80-products');
        list.replaceChildren();

        const maxViews = Math.max(1,...top.map(item => item[1].views));

        top.forEach(([id,item]) => {
          const card = document.createElement('div');
          card.className = 'p80-product';

          const name = document.createElement('strong');
          name.textContent = names.get(id) || 'Товар №'+id;

          const progress = document.createElement('div');
          progress.className = 'p80-progress';

          const fill = document.createElement('div');
          fill.style.width = (item.views/maxViews*100)+'%';

          progress.append(fill);

          const info = document.createElement('div');
          info.className = 'p80-muted';

          info.textContent =
            '👁 '+item.views+' переглядів · 🛒 '+item.carts+' додавань';

          card.append(name,progress,info);
          list.append(card);
        });

        if (!top.length) {
          list.textContent = 'Поки немає переглядів товарів';
        }

        el('p80-status').textContent =
          'Оновлено: '+new Date().toLocaleString('uk-UA')+
          '. Графік: до 30 останніх активних днів.';

      } catch(error) {
        if (current !== requestId || panel.hidden) return;

        console.error('Analytics:',error);

        el('p80-status').textContent =
          'Не вдалося завантажити статистику. Спробуйте оновити.';
      }
    }

    section.querySelectorAll('[data-days]').forEach(button => {
      button.addEventListener('click',() => {
        period = Number(button.dataset.days);

        section.querySelectorAll('[data-days]').forEach(b => {
          b.classList.toggle('active',b === button);
        });

        load();
      });
    });

    el('p80-refresh').addEventListener('click',load);

    new MutationObserver(() => {
      if (!panel.hidden) {
        load();
      } else {
        requestId++;

        ['p80-visits','p80-views','p80-cart','p80-sessions']
          .forEach(id => el(id).textContent = '—');

        el('p80-chart').replaceChildren();
        el('p80-products').replaceChildren();
        el('p80-status').textContent = '';
      }
    }).observe(panel,{
      attributes:true,
      attributeFilter:['hidden']
    });

    if (!panel.hidden) load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',init);
  } else {
    init();
  }
})();
