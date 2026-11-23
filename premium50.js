/* Premium 5.0 storefront: badges, recommendations, characteristics, moderated reviews */
(() => {
 'use strict';
 const API='https://voaadlzlmiyuxclfqmmi.supabase.co';
 const KEY='sb_publishable_hQyblRY4450gbOKLoXDabQ_dnHyGgn2';
 const grid=document.getElementById('products'); if(!grid)return;
 const headers={apikey:KEY};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safe=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:''}catch{return ''}};
 const meta=new Map();let rows=[];
 const dialog=document.createElement('dialog');dialog.className='p50-modal';document.body.append(dialog);
 async function fetchJSON(path,opts={}){const r=await fetch(API+'/rest/v1/'+path,{...opts,headers:{...headers,...(opts.headers||{})}});if(!r.ok)throw Error('Сервер: '+r.status);return r.status===204?[]:r.json()}
 function money(v){return Number(v).toLocaleString('uk-UA')+' грн'}
 function specs(p){return [['Розмір',p.toy_size],['Матеріал',p.toy_material],['Наповнювач',p.toy_filling],['Догляд',p.toy_care],['Індивідуальне замовлення',p.toy_custom?'Можливе — уточніть у Яни':'']].filter(x=>x[1]).map(([k,v])=>'<div><strong>'+esc(k)+':</strong> '+esc(v)+'</div>').join('')}
 function enhance(){for(const card of grid.querySelectorAll('article.product')){const id=card.querySelector('[data-add]')?.dataset.add,p=meta.get(String(id));if(!p)continue;
 const pic=card.querySelector('.picture');const badge=pic?.querySelector('.p3-badge');if(badge&&p.toy_badge)badge.textContent=p.toy_badge;
 const details=card.querySelector('.details');if(!details)continue;
 if(!card.querySelector('.p50-review-btn')){const b=document.createElement('button');b.type='button';b.className='p50-btn p50-review-btn';b.textContent='★ Відгуки про іграшку';b.onclick=()=>reviews(p);details.append(b)}
 }}
 const obs=new MutationObserver(enhance);obs.observe(grid,{childList:true});
 function tile(p){return '<article class="p50-tile"><img loading="lazy" src="'+esc(safe(p.image_url))+'" alt="'+esc(p.name)+'"><h3>'+esc(p.name)+'</h3><p>'+money(p.price)+'</p>'+(p.toy_badge?'<span class="p50-pill">'+esc(p.toy_badge)+'</span>':'')+'<div class="p50-product-actions"><button class="p50-btn" data-p50-open="'+esc(p.id)+'">Переглянути</button></div></article>'}
 function sections(){if(document.getElementById('p50-recommended'))return;
 const rec=document.createElement('section');rec.id='p50-recommended';rec.className='p50-section p50-feature';rec.innerHTML='<div class="p50-wrap"><h2>♡ Іграшки, які можуть сподобатися</h2><p class="p50-lead">Добірка авторських іграшок Яни.</p><div class="p50-grid">'+(rows.filter(p=>p.toy_featured).length?rows.filter(p=>p.toy_featured):rows).slice(0,4).map(tile).join('')+'</div></div>';
 const catalog=document.getElementById('catalog');if(catalog)catalog.after(rec);
 const hero=document.querySelector('.hero .wrap');if(hero){const b=document.createElement('a');b.className='p50-btn';b.href='#p50-recommended';b.textContent='♡ Рекомендовані іграшки';b.style.cssText='display:inline-block;text-decoration:none;margin-top:12px';hero.querySelector('div')?.append(b)}
 rec.addEventListener('click',e=>{const b=e.target.closest('[data-p50-open]');if(!b)return;const card=[...grid.querySelectorAll('article.product')].find(c=>c.querySelector('[data-add]')?.dataset.add===b.dataset.p50Open);if(card){card.scrollIntoView({behavior:'smooth',block:'center'});card.querySelector('.picture img')?.click()}else document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'})});
 }
 async function reviews(p){dialog.innerHTML='<button class="p50-btn p50-close" type="button">×</button><h2>Відгуки: '+esc(p.name)+'</h2><p>Завантаження…</p>';dialog.querySelector('button').onclick=()=>dialog.close();dialog.showModal();
 try{const data=await fetchJSON('toy_reviews?select=id,reviewer_name,rating,review_text,photo_url,created_at&product_id=eq.'+encodeURIComponent(p.id)+'&approved=eq.true&order=created_at.desc&limit=30');
 dialog.innerHTML='<button class="p50-btn p50-close" type="button">×</button><h2>Відгуки: '+esc(p.name)+'</h2>'+(data.length?data.map(r=>'<div class="p50-review"><strong>'+esc(r.reviewer_name)+'</strong> <span aria-label="Оцінка '+r.rating+' із 5">'+'★'.repeat(r.rating)+'</span><p>'+esc(r.review_text)+'</p>'+(safe(r.photo_url)?'<img loading="lazy" src="'+esc(safe(r.photo_url))+'" alt="Фото покупця">':'')+'</div>').join(''):'<p>Поки що немає опублікованих відгуків.</p>')+'<h3>Залишити відгук</h3><form id="p50-review-form"><label>Ім’я<input name="reviewer_name" maxlength="60" minlength="2" required></label><label>Оцінка<select name="rating"><option value="5">★★★★★ — 5</option><option value="4">★★★★ — 4</option><option value="3">★★★ — 3</option><option value="2">★★ — 2</option><option value="1">★ — 1</option></select></label><label>Ваш відгук<textarea name="review_text" minlength="10" maxlength="1000" required></textarea></label><label>Посилання на фото (необов’язково)<input name="photo_url" type="url" maxlength="1000" placeholder="https://..."></label><p class="p50-note">Відгук з’явиться після перевірки майстринею. Фото наразі додається посиланням, не з телефону.</p><button class="p50-btn" type="submit">Надіслати на перевірку</button><p id="p50-feedback" role="status"></p></form>';
 dialog.querySelector('.p50-close').onclick=()=>dialog.close();const form=dialog.querySelector('form');form.onsubmit=async e=>{e.preventDefault();const btn=form.querySelector('[type=submit]');btn.disabled=true;const v=Object.fromEntries(new FormData(form));try{await fetchJSON('toy_reviews',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({product_id:p.id,reviewer_name:v.reviewer_name.trim(),rating:Number(v.rating),review_text:v.review_text.trim(),photo_url:v.photo_url.trim()||null})});form.reset();dialog.querySelector('#p50-feedback').textContent='Дякуємо! Відгук надіслано на перевірку.'}catch(err){dialog.querySelector('#p50-feedback').textContent='Не вдалося надіслати: '+err.message}finally{btn.disabled=false}};
 }catch(err){dialog.querySelector('p').textContent='Відгуки недоступні: '+err.message}}
 grid.addEventListener('click',e=>{const b=e.target.closest('[data-details]');if(!b)return;const id=b.dataset.details,p=meta.get(String(id));if(!p)return;setTimeout(()=>{const d=document.querySelector('.p3-dialog[open] .p3-dialog-inner');if(!d||d.querySelector('.p50-specs'))return;const block=document.createElement('div');block.className='p50-specs';block.innerHTML='<h3>Характеристики</h3>'+(specs(p)||'<p>Деталі уточнюйте у майстрині.</p>');d.querySelector('.p3-note')?.before(block)},0)},true);
 async function load(){try{rows=await fetchJSON('products?select=id,name,price,image_url,toy_size,toy_material,toy_filling,toy_care,toy_custom,toy_badge,toy_featured&is_published=eq.true&order=id.desc');rows.forEach(p=>meta.set(String(p.id),p));enhance();sections()}catch(err){console.warn('Premium 5.0: виконайте premium50.sql',err)}}
 load();
})();
