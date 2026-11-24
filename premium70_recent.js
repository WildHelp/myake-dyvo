
/* М'яке диво — Premium 7.0 Recently Viewed */
(() => {
  'use strict';

  const KEY = 'myake_dyvo_recent_v1';
  const LIMIT = 6;

  function init() {
    const grid = document.getElementById('products');
    const catalog = document.getElementById('catalog');

    if (!grid || !catalog ||
        document.getElementById('p70-recent')) return;

    let history = [];

    try {
      const saved = JSON.parse(
        localStorage.getItem(KEY) || '[]'
      );

      if (Array.isArray(saved)) {
        history = saved
          .filter(id => /^\d+$/.test(String(id)))
          .map(String)
          .slice(0, LIMIT);
      }
    } catch {}

    const css = document.createElement('style');

    css.textContent = `
      #p70-recent[hidden] {
        display:none !important;
      }

      #p70-recent {
        padding:28px 0;
        background:#fff3f4;
        border-top:1px solid #eadbd6;
      }

      #p70-recent h2 {
        font-size:clamp(23px,4vw,34px);
        margin:8px 0 16px;
      }

      .p70-recent-list {
        display:flex;
        gap:12px;
        overflow-x:auto;
        padding:4px 0 12px;
        scroll-snap-type:x mandatory;
        scrollbar-width:thin;
      }

      .p70-recent-card {
        flex:0 0 155px;
        min-width:0;
        border:1px solid #eadbd6;
        border-radius:16px;
        padding:9px;
        background:#fffdfa;
        color:#503d49;
        text-align:left;
        scroll-snap-align:start;
        cursor:pointer;
      }

      .p70-recent-card img {
        display:block;
        width:100%;
        aspect-ratio:1;
        object-fit:cover;
        border-radius:11px;
      }

      .p70-recent-name {
        display:block;
        font-size:14px;
        font-weight:700;
        margin:7px 0 3px;
        overflow-wrap:anywhere;
      }

      .p70-recent-price {
        display:block;
        color:#86566f;
        font-size:15px;
        font-weight:800;
      }

      .p70-recent-clear {
        display:block;
        margin:8px 0 0 auto;
        border:0;
        background:none;
        color:#897b80;
        font-size:12px;
        padding:8px;
        cursor:pointer;
      }

      @media(max-width:600px) {
        .p70-recent-card {
          flex-basis:125px;
        }

        .p70-recent-list {
          gap:8px;
        }
      }
    `;

    document.head.append(css);

    const section = document.createElement('section');

    section.id = 'p70-recent';
    section.hidden = true;

    section.innerHTML = `
      <div class="wrap">
        <div class="eyebrow">
          Ваша історія переглядів
        </div>
        <h2>Ви нещодавно переглядали ♡</h2>
        <div class="p70-recent-list"></div>
        <button type="button"
          class="p70-recent-clear">
          Очистити історію
        </button>
      </div>
    `;

    catalog.after(section);

    const list = section.querySelector(
      '.p70-recent-list'
    );

    function save() {
      try {
        localStorage.setItem(
          KEY, JSON.stringify(history)
        );
      } catch {}
    }

    function findCard(id) {
      return [...grid.querySelectorAll(
        'article.product'
      )].find(card =>
        String(card.querySelector('[data-add]')
          ?.dataset.add) === String(id)
      );
    }

    function render() {
      list.replaceChildren();

      history.forEach(id => {
        const card = findCard(id);
        if (!card) return;

        const image = card.querySelector(
          '.picture img'
        );

        if (!image) return;

        const name = card.querySelector('h3')
          ?.textContent || 'Іграшка';

        const price = card.querySelector('.price')
          ?.textContent || '';

        const tile = document.createElement('button');

        tile.type = 'button';
        tile.className = 'p70-recent-card';
        tile.setAttribute(
          'aria-label', 'Переглянути ' + name
        );

        const photo = document.createElement('img');
        photo.src = image.src;
        photo.alt = name;
        photo.loading = 'lazy';

        const title = document.createElement('span');
        title.className = 'p70-recent-name';
        title.textContent = name;

        const cost = document.createElement('span');
        cost.className = 'p70-recent-price';
        cost.textContent = price;

        tile.append(photo, title, cost);

        tile.addEventListener('click', () => {
          const original = findCard(id)
            ?.querySelector('.picture img');

          if (original) original.click();
        });

        list.append(tile);
      });

      section.hidden = !list.children.length;
    }

    grid.addEventListener('click', event => {
      const image = event.target.closest(
        '.picture img'
      );

      if (!image || !grid.contains(image)) return;

      const card = image.closest('article.product');

      const id = card?.querySelector('[data-add]')
        ?.dataset.add;

      if (!id) return;

      history = [
        String(id),
        ...history.filter(item => item !== String(id))
      ].slice(0, LIMIT);

      save();
      render();
    }, true);

    section.querySelector('.p70-recent-clear')
      .addEventListener('click', () => {
        history = [];
        save();
        render();
      });

    let scheduled = false;

    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;

      requestAnimationFrame(() => {
        scheduled = false;
        render();
      });
    });

    observer.observe(grid, {
      childList:true,
      subtree:true,
      characterData:true
    });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded', init
    );
  } else {
    init();
  }
})();
        
