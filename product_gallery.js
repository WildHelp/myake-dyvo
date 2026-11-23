
/* М'яке диво від Яни — Premium 4.5 */
(() => {
  'use strict';

  const API =
    'https://voaadlzlmiyuxclfqmmi.supabase.co';
  const KEY =
    'sb_publishable_hQyblRY4450gbOKLoXDabQ_dnHyGgn2';

  const grid = document.getElementById('products');
  if (!grid || document.getElementById('yg-viewer')) return;

  const css = document.createElement('style');
  css.textContent = `
    #yg-viewer {
      position:fixed;
      inset:0;
      z-index:99999;
      display:none;
      align-items:center;
      justify-content:center;
      background:rgba(17,12,19,.96);
      padding:14px;
      box-sizing:border-box;
    }
    #yg-viewer.yg-visible {display:flex}
    .yg-stage {
      position:relative;
      width:100%;
      max-width:900px;
      height:100%;
      display:flex;
      align-items:center;
      justify-content:center;
      flex-direction:column;
      gap:14px;
    }
    .yg-photo {
      display:block;
      max-width:100%;
      max-height:76vh;
      object-fit:contain;
      border-radius:12px;
      touch-action:pan-y;
      user-select:none;
    }
    .yg-top {
      position:absolute;
      top:10px;
      left:0;
      right:0;
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:10px;
      color:white;
      z-index:2;
    }
    .yg-title {
      font-size:16px;
      font-weight:700;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    #yg-viewer button {
      border:0;
      background:rgba(255,255,255,.18);
      color:white;
      border-radius:50%;
      width:46px;
      height:46px;
      font-size:25px;
      cursor:pointer;
      flex-shrink:0;
    }
    .yg-controls {
      position:absolute;
      left:0;
      right:0;
      top:50%;
      display:flex;
      justify-content:space-between;
      transform:translateY(-50%);
      pointer-events:none;
    }
    .yg-controls button {pointer-events:auto}
    .yg-counter {
      color:white;
      font-size:15px;
      font-weight:600;
      text-align:center;
    }
    .yg-thumbs {
      display:flex;
      justify-content:center;
      gap:8px;
      max-width:100%;
      overflow-x:auto;
      padding:4px;
    }
    .yg-thumbs img {
      width:54px;
      height:54px;
      object-fit:cover;
      border-radius:8px;
      cursor:pointer;
      border:2px solid transparent;
      opacity:.65;
    }
    .yg-thumbs img.active {
      border-color:#f4b5ca;
      opacity:1;
    }
    #products .picture img {cursor:zoom-in}
    @media(max-width:600px) {
      .yg-photo {max-height:65vh}
      .yg-controls button {width:40px;height:40px}
      .yg-thumbs img {width:46px;height:46px}
    }
  `;
  document.head.append(css);

  const viewer = document.createElement('div');
  viewer.id = 'yg-viewer';
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.setAttribute('aria-label', 'Галерея товару');

  viewer.innerHTML = `
    <div class="yg-stage">
      <div class="yg-top">
        <span class="yg-title"></span>
        <button class="yg-close" type="button"
          aria-label="Закрити">×</button>
      </div>
      <img class="yg-photo" alt="Фото іграшки">
      <div class="yg-controls">
        <button class="yg-prev" type="button"
          aria-label="Попереднє фото">‹</button>
        <button class="yg-next" type="button"
          aria-label="Наступне фото">›</button>
      </div>
      <div class="yg-counter"></div>
      <div class="yg-thumbs"></div>
    </div>
  `;
  document.body.append(viewer);

  const photo = viewer.querySelector('.yg-photo');
  const title = viewer.querySelector('.yg-title');
  const counter = viewer.querySelector('.yg-counter');
  const thumbs = viewer.querySelector('.yg-thumbs');
  const prev = viewer.querySelector('.yg-prev');
  const next = viewer.querySelector('.yg-next');

  let images = [];
  let current = 0;
  let startX = null;
  let requestId = 0;
  let oldOverflow = '';
  let previousFocus = null;

  function safeUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.href : '';
    } catch {
      return '';
    }
  }

  function draw() {
    if (!images.length) return;

    photo.src = images[current];
    photo.alt = title.textContent +
      ', фотографія ' + (current + 1);

    counter.textContent =
      (current + 1) + ' / ' + images.length;

    prev.hidden = images.length < 2;
    next.hidden = images.length < 2;

    thumbs.replaceChildren();

    if (images.length < 2) return;

    images.forEach((url, index) => {
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Мініатюра ' + (index + 1);
      img.className = index === current ? 'active' : '';
      img.loading = 'lazy';
      img.onclick = () => {
        current = index;
        draw();
      };
      thumbs.append(img);
    });
  }

  function change(direction) {
    if (images.length < 2) return;
    current =
      (current + direction + images.length) % images.length;
    draw();
  }

  function close() {
    requestId++;
    viewer.classList.remove('yg-visible');
    document.body.style.overflow = oldOverflow;
    previousFocus?.focus?.();
  }

  async function open(id, name, fallback) {
    const myRequest = ++requestId;
    previousFocus = document.activeElement;

    images = fallback ? [fallback] : [];
    current = 0;
    title.textContent = name;
    oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    viewer.classList.add('yg-visible');
    counter.textContent = 'Завантаження…';

    if (images.length) draw();

    try {
      const endpoint =
        API + '/rest/v1/products' +
        '?select=image_url,images' +
        '&id=eq.' + encodeURIComponent(id) +
        '&is_published=eq.true&limit=1';

      const response = await fetch(endpoint, {
        headers: {
          apikey: KEY,
          Authorization: 'Bearer ' + KEY
        }
      });

      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }

      const rows = await response.json();
      if (myRequest !== requestId) return;

      const product = rows[0];
      if (!product) throw new Error('Товар не знайдено');

      const list = [
        product.image_url,
        ...(Array.isArray(product.images)
          ? product.images : [])
      ];

      images = [...new Set(
        list.map(safeUrl).filter(Boolean)
      )].slice(0, 6);

      if (!images.length && fallback) {
        images = [fallback];
      }

      if (images.length) {
        draw();
      } else {
        counter.textContent = 'Фотографій поки немає';
      }
    } catch (error) {
      console.error('Помилка галереї:', error);
      if (myRequest !== requestId) return;

      if (images.length) {
        draw();
      } else {
        counter.textContent =
          'Не вдалося завантажити фотографії';
      }
    }
  }

  grid.addEventListener('click', event => {
    const image = event.target.closest('.picture img');
    if (!image || !grid.contains(image)) return;

    const card = image.closest('article.product');
    if (!card) return;

    const addButton = card.querySelector('[data-add]');
    if (!addButton) return;

    const id = addButton.dataset.add;
    const name =
      card.querySelector('h3')?.textContent || 'Іграшка';

    open(id, name, safeUrl(image.src));
  });

  viewer.querySelector('.yg-close').onclick = close;
  prev.onclick = () => change(-1);
  next.onclick = () => change(1);

  viewer.addEventListener('click', event => {
    if (event.target === viewer) close();
  });

  document.addEventListener('keydown', event => {
    if (!viewer.classList.contains('yg-visible')) return;

    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') change(-1);
    if (event.key === 'ArrowRight') change(1);
  });

  photo.addEventListener('touchstart', event => {
    startX = event.changedTouches[0]?.screenX ?? null;
  }, {passive:true});

  photo.addEventListener('touchend', event => {
    if (startX === null) return;
    const endX = event.changedTouches[0]?.screenX;
    if (endX === undefined) return;

    const delta = endX - startX;
    startX = null;

    if (Math.abs(delta) > 45) {
      change(delta < 0 ? 1 : -1);
    }
  }, {passive:true});
})();
