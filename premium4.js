/* Premium 4.0 storefront: additive only; does not touch cart, checkout or Supabase. */
(() => {
  'use strict';
  if (document.getElementById('p4-trust')) return;
  const main = document.querySelector('main');
  if (!main) return;
  const trust = document.createElement('section');
  trust.className = 'p4-trust'; trust.id = 'p4-trust';
  trust.innerHTML = `<div class="wrap p4-trust-grid">
    <div class="p4-trust-item"><strong>🧶 Ручна робота</strong><p>Кожна іграшка створюється Яною вручну.</p></div>
    <div class="p4-trust-item"><strong>📦 Нова пошта</strong><p>Вибір міста й відділення під час замовлення.</p></div>
    <div class="p4-trust-item"><strong>♡ З турботою</strong><p>Деталі замовлення узгоджуються з майстринею.</p></div>
  </div>`;
  const catalog = document.getElementById('catalog');
  if (catalog) catalog.before(trust); else main.prepend(trust);
  const care = document.createElement('section');
  care.className='p4-care'; care.id='p4-care';
  care.innerHTML=`<div class="wrap"><div class="eyebrow">Корисно знати</div>
    <h2>Питання та догляд</h2>
    <details><summary>Як доглядати за в'язаною іграшкою?</summary><p>Рекомендації залежать від пряжі та наповнювача. Перед пранням уточніть інструкцію для конкретної іграшки у Яни.</p></details>
    <details><summary>Чи можна замовити інший колір?</summary><p>Можливість індивідуального виготовлення та строки потрібно погодити з Яною перед оплатою.</p></details>
    <details><summary>Як відбувається доставка?</summary><p>Під час оформлення виберіть населений пункт і відділення Нової пошти. Вартість доставки та умови оплати узгоджуються перед відправленням.</p></details>
    <details><summary>Чи можна повернути товар?</summary><p>Умови повернення залежать від типу товару та чинного законодавства України. Уточніть деталі до покупки.</p></details>
  </div>`;
  main.append(care);
  const nav=document.querySelector('.p3-nav');
  if(nav && !nav.querySelector('a[href="#p4-care"]')){
    const a=document.createElement('a');a.href='#p4-care';a.textContent='Питання та догляд';nav.append(a);
  }
  const top=document.createElement('button');top.className='p4-back';top.type='button';top.textContent='↑';top.title='Нагору';top.setAttribute('aria-label','Повернутися нагору');document.body.append(top);
  top.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  const update=()=>top.classList.toggle('visible',window.scrollY>650);
  window.addEventListener('scroll',update,{passive:true});update();
})();
