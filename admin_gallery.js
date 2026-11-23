
/* М'яке диво від Яни — Premium 4.4: галерея товарів */
(() => {
  'use strict';

  const MAX = 6;
  const $ = id => document.getElementById(id);
  let selectedId = null;
  let photos = [];
  let busy = false;

  const style = document.createElement('style');
  style.textContent = `
    .yg-grid {
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:10px;
      margin:15px 0;
    }
    .yg-item {
      border:1px solid #eadbdc;
      border-radius:14px;
      padding:7px;
      background:#fff9f6;
    }
    .yg-item img {
      width:100%;
      height:115px;
      object-fit:cover;
      border-radius:9px;
    }
    .yg-item small {
      display:block;
      margin:5px 0;
      color:#82757c;
    }
    .yg-item button {
      width:100%;
      padding:8px 5px;
      font-size:12px;
      background:#9b3549;
    }
    .yg-note {
      font-size:13px;
      color:#82757c;
    }
    @media(max-width:480px) {
      .yg-grid {
        grid-template-columns:repeat(2,minmax(0,1fr));
      }
    }
  `;
  document.head.append(style);

  function status(message, error = false) {
    const el = $('yg-status');
    if (!el) return;
    el.textContent = message;
    el.className = 'status ' + (error ? 'error' : '');
  }

  function validPhotos(list) {
    return [...new Set(
      list.filter(url =>
        typeof url === 'string' &&
        /^https:\/\//i.test(url)
      )
    )];
  }

  function render() {
    const grid = $('yg-grid');
    if (!grid) return;

    grid.replaceChildren();

    photos.forEach((url, index) => {
      const box = document.createElement('div');
      box.className = 'yg-item';

      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Фото ' + (index + 1);
      img.loading = 'lazy';

      const label = document.createElement('small');
      label.textContent = index === 0
        ? 'Головне фото'
        : 'Фото ' + (index + 1);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Прибрати';
      remove.disabled = busy;

      remove.onclick = () => {
        photos.splice(index, 1);
        render();
        status('Зміни ще не збережено.');
      };

      box.append(img, label, remove);
      grid.append(box);
    });

    $('yg-count').textContent =
      photos.length + ' із ' + MAX + ' фотографій';
  }

  async function openGallery(id) {
    if (busy) return;

    const product = products.find(
      p => String(p.id) === String(id)
    );
    if (!product) return;

    selectedId = product.id;

    try {
      const {data, error} = await db
        .from('products')
        .select('images')
        .eq('id', id)
        .single();

      if (error) throw error;

      photos = validPhotos([
        product.image_url,
        ...(Array.isArray(data.images) ? data.images : [])
      ]).slice(0, MAX);

    } catch (error) {
      console.error(error);
      photos = validPhotos([product.image_url]);
      status('Не вдалося отримати всі фотографії.', true);
    }

    $('yg-title').textContent =
      '📷 Фотографії: ' + product.name;

    $('yg-picker').value = '';
    $('yg-card').classList.remove('hidden');

    render();

    status('Перша фотографія буде головною.');

    $('yg-card').scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  async function saveGallery() {
    if (busy || selectedId === null) return;

    if (!session) {
      status('Увійдіть в адмінпанель.', true);
      return;
    }

    const files = [...$('yg-picker').files];

    if (photos.length + files.length > MAX) {
      status('Максимум 6 фотографій.', true);
      return;
    }

    if (!photos.length && !files.length) {
      status('Додайте хоча б одну фотографію.', true);
      return;
    }

    for (const file of files) {
      if (![
        'image/jpeg',
        'image/png',
        'image/webp'
      ].includes(file.type)) {
        status('Потрібні JPG, PNG або WebP.', true);
        return;
      }

      if (file.size > 6 * 1024 * 1024) {
        status('Кожне фото має бути до 6 МБ.', true);
        return;
      }
    }

    busy = true;
    $('yg-save').disabled = true;

    try {
      const next = [...photos];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        status(
          'Завантаження фото ' +
          (i + 1) + ' із ' + files.length
        );

        const ext = file.type === 'image/png'
          ? 'png'
          : file.type === 'image/webp'
          ? 'webp'
          : 'jpg';

        const path =
          session.user.id + '/' +
          Date.now() + '-' +
          Math.random().toString(36).slice(2, 10) +
          '.' + ext;

        const {error} = await db.storage
          .from('product-images')
          .upload(path, file, {
            contentType: file.type,
            upsert: false
          });

        if (error) throw error;

        const url = db.storage
          .from('product-images')
          .getPublicUrl(path).data.publicUrl;

        next.push(url);
      }

      status('Зберігаємо фотографії…');

      const {data, error} = await db
        .from('products')
        .update({
          image_url: next[0],
          images: next
        })
        .eq('id', selectedId)
        .select('id')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Запис не підтверджено.');

      photos = next;
      $('yg-picker').value = '';

      render();

      if (typeof loadProducts === 'function') {
        await loadProducts();
      }

      status('✓ Галерею успішно збережено.');

    } catch (error) {
      console.error(error);
      status('Помилка: ' + error.message, true);
    } finally {
      busy = false;
      $('yg-save').disabled = false;
      render();
    }
  }

  function init() {
    if (!$('productsList') || !$('editorCard')) return;
    if ($('yg-card')) return;

    const card = document.createElement('section');
    card.id = 'yg-card';
    card.className = 'card hidden';

    card.innerHTML = `
      <h2 id="yg-title">Галерея іграшки</h2>
      <p class="yg-note">
        До 6 фотографій. Перше фото — головне.
        Видалення зі списку застосовується
        після збереження.
      </p>
      <div id="yg-count" class="muted"></div>
      <div id="yg-grid" class="yg-grid"></div>
      <label for="yg-picker">
        Додати фотографії з телефону
      </label>
      <input
        id="yg-picker"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
      >
      <p class="yg-note">
        JPG, PNG або WebP. До 6 МБ кожне.
      </p>
      <div class="actions">
        <button id="yg-save" type="button">
          Зберегти фотографії
        </button>
        <button
          id="yg-close"
          type="button"
          class="secondary"
        >
          Закрити
        </button>
      </div>
      <div id="yg-status"
        class="status"
        role="status"></div>
    `;

    $('editorCard').after(card);

    $('yg-save').onclick = saveGallery;

    $('yg-close').onclick = () => {
      if (!busy) card.classList.add('hidden');
    };

    const list = $('productsList');

    function enhance() {
      const rows = [...list.querySelectorAll('.product')];

      rows.forEach((row, index) => {
        if (row.querySelector('.yg-open')) return;

        const product = products[index];
        if (!product) return;

        const actions = row.querySelector('.actions');
        if (!actions) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'secondary yg-open';
        button.textContent = '📷 Галерея';

        button.onclick = () => openGallery(product.id);

        actions.append(button);
      });
    }

    const observer = new MutationObserver(enhance);
    observer.observe(list, {childList: true});

    enhance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
                                
