/* Myake Dyvo Premium 3.0 — progressive enhancement, no changes to Supabase/cart logic */
(() => {
 'use strict';
 const $ = (s, root=document) => root.querySelector(s);
 const grid = $('#products');
 if (!grid) return;
 const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let favorites=[];
 try { const value=JSON.parse(localStorage.getItem('yana_p3_favorites')||'[]'); favorites=Array.isArray(value)?value.map(String):[]; }catch{}
 const saveFav=()=>{try{localStorage.setItem('yana_p3_favorites',JSON.stringify(favorites));}catch{}};
 let sort='default', onlyFav=false;
 const controls=document.createElement('div'); controls.className='p3-controls';
 controls.innerHTML='<label for="p3-sort">Сортування: </label><select id="p3-sort" aria-label="Сортування товарів"><option value="default">За замовчуванням</option><option value="low">Спочатку дешевші</option><option value="high">Спочатку дорожчі</option><option value="az">За назвою</option></select><button type="button" id="p3-onlyfav" aria-pressed="false">♡ Обране</button><span class="p3-count" aria-live="polite"></span>';
 grid.before(controls);
 const dialog=document.createElement('dialog');dialog.className='p3-dialog';dialog.setAttribute('aria-label','Деталі іграшки');document.body.append(dialog);
 const nav=document.createElement('nav');nav.className='p3-nav wrap';nav.setAttribute('aria-label','Навігація магазину');nav.innerHTML='<a href="#catalog">Іграшки</a><a href="#about">Про Яну</a><a href="#p3-delivery">Доставка й оплата</a><a href="#p3-contacts">Контакти</a>';
 const header=$('.header');if(header)header.append(nav);
 const info=document.createElement('section');info.className='p3-info';info.id='p3-delivery';info.innerHTML='<div class="wrap"><div class="eyebrow">Корисна інформація</div><h2>З турботою про кожну іграшку</h2><div class="p3-info-grid"><article class="p3-info-card"><h3>♡ Ручна робота</h3><p>Кожна іграшка створена Яною вручну. Деталі та наявність уточнюйте під час замовлення.</p></article><article class="p3-info-card"><h3>📦 Доставка</h3><p>Під час оформлення вкажіть місто та відділення Нової пошти. Умови й вартість доставки узгоджуються перед відправленням.</p></article><article class="p3-info-card" id="p3-contacts"><h3>✉ Оплата й зв’язок</h3><p>У формі замовлення можна обрати післяплату або переказ. Реквізити та остаточні умови уточнюються у майстрині.</p></article></div></div>';
 const footer=$('.footer');if(footer)footer.before(info);
 const getId=card=>card.querySelector('[data-add]')?.getAttribute('data-add')||'';
 const getPrice=card=>{const s=card.querySelector('.price')?.textContent||'';const n=Number(s.replace(/[^\d,.-]/g,'').replace(/\s/g,'').replace(',','.'));return Number.isFinite(n)?n:0;};
 const enhance=()=>{
  const cards=[...grid.querySelectorAll('.product')];
  for(const card of cards){
   const id=getId(card);if(!id)continue;
   const pic=card.querySelector('.picture');
   if(pic && !pic.querySelector('.p3-fav')){
    const f=document.createElement('button');f.className='p3-fav';f.type='button';f.dataset.fav=id;f.setAttribute('aria-label','Додати або прибрати з обраного');pic.append(f);
    const badge=document.createElement('span');badge.className='p3-badge';badge.textContent=card.querySelector('[data-add]')?.disabled?'Під замовлення':'Ручна робота';pic.prepend(badge);
   }
   if(!card.querySelector('.p3-more')){
    const b=document.createElement('button');b.type='button';b.className='p3-more';b.dataset.details=id;b.textContent='Детальніше про іграшку';card.querySelector('.details')?.append(b);
   }
   const f=card.querySelector('.p3-fav');if(f){const on=favorites.includes(id);f.textContent=on?'♥':'♡';f.setAttribute('aria-pressed',String(on));}
  }
  const sorted=cards.slice();
  if(sort==='low')sorted.sort((a,b)=>getPrice(a)-getPrice(b));
  if(sort==='high')sorted.sort((a,b)=>getPrice(b)-getPrice(a));
  if(sort==='az')sorted.sort((a,b)=>(a.querySelector('h3')?.textContent||'').localeCompare(b.querySelector('h3')?.textContent||'','uk'));
  for (const c of sorted) {
  c.hidden = onlyFav && !favorites.includes(getId(c));
}

sorted.forEach((card, index) => {
  if (grid.children[index] !== card) {
    grid.insertBefore(card, grid.children[index] || null);
  }
});
  $('.p3-count',controls).textContent=`Показано: ${sorted.filter(c=>!c.hidden).length}`;
  $('#p3-onlyfav').setAttribute('aria-pressed',String(onlyFav));
  $('#p3-onlyfav').textContent=onlyFav?'♥ Показати всі':'♡ Лише обране';
 };
 // Original catalog replaces its cards when filtering; enhance again after that happens.
 let scheduled=false,internal=false;
 const observer=new MutationObserver(()=>{if(internal||scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;internal=true;observer.disconnect();enhance();observer.observe(grid,{childList:true,subtree:true});internal=false;});});
 observer.observe(grid,{childList:true,subtree:true});enhance();
 $('#p3-sort').addEventListener('change',e=>{sort=e.target.value;observer.disconnect();enhance();observer.observe(grid,{childList:true,subtree:true});});
 $('#p3-onlyfav').addEventListener('click',()=>{onlyFav=!onlyFav;observer.disconnect();enhance();observer.observe(grid,{childList:true,subtree:true});});
 grid.addEventListener('click',e=>{
  const fav=e.target.closest('[data-fav]');if(fav){const id=fav.dataset.fav;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];saveFav();observer.disconnect();enhance();observer.observe(grid,{childList:true,subtree:true});return;}
  const more=e.target.closest('[data-details]');if(!more)return;
  const card=more.closest('.product');if(!card)return;
  const name=card.querySelector('h3')?.textContent||'Іграшка';const desc=card.querySelector('.details p')?.textContent||'';const price=card.querySelector('.price')?.textContent||'';const src=card.querySelector('.picture img')?.getAttribute('src')||'';const category=card.querySelector('.tag')?.textContent||'';
  dialog.innerHTML='<div class="p3-dialog-inner"><button class="p3-dialog-close" type="button" aria-label="Закрити">×</button><img alt="'+esc(name)+'" src="'+esc(src)+'"><p class="tag">'+esc(category)+'</p><h2>'+esc(name)+'</h2><p>'+esc(desc)+'</p><p class="p3-dialog-price">'+esc(price)+'</p><p class="p3-note">Розміри та доступні кольори уточнюйте у майстрині.</p><button class="btn p3-add-detail" type="button" '+(card.querySelector('[data-add]')?.disabled?'disabled':'')+'>Додати в кошик</button></div>';
  dialog.querySelector('.p3-dialog-close').onclick=()=>dialog.close();dialog.querySelector('.p3-add-detail').onclick=()=>{card.querySelector('[data-add]')?.click();dialog.close();};dialog.showModal();
 });
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
})();
