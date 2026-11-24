/* Premium 7.0 — reviews, photos, ratings, recommendations */
(() => {
'use strict';

const API='https://voaadlzlmiyuxclfqmmi.supabase.co';
const KEY='sb_publishable_hQyblRY4450gbOKLoXDabQ_dnHyGgn2';
const grid=document.getElementById('products');
if(!grid)return;

const headers={apikey:KEY};
const meta=new Map();
const ratings=new Map();
let rows=[];

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
'&':'&amp;',
'<':'&lt;',
'>':'&gt;',
'"':'&quot;',
"'":'&#39;'
}[c]));

const safe=s=>{
try{
const u=new URL(s);
return u.protocol==='https:'?u.href:'';
}catch{return ''}
};

const dialog=document.createElement('dialog');
dialog.className='p50-modal';
document.body.append(dialog);

const style=document.createElement('style');
style.textContent=`
.p70-rating{
color:#ad8050;
font-size:14px;
margin:8px 0;
font-weight:600;
}
.p70-preview{
display:block;
max-width:100%;
max-height:220px;
object-fit:contain;
border-radius:14px;
margin:12px auto;
}
.p70-preview[hidden]{
display:none;
}
.p70-upload{
background:#f8edf2;
border:1px dashed #c998ae;
padding:14px;
border-radius:14px;
margin:12px 0;
}
.p70-upload input{
width:100%;
}
.p70-photo{
max-width:100%;
max-height:300px;
object-fit:contain;
border-radius:12px;
}
`;
document.head.append(style);

async function fetchJSON(path,opts={}){
const r=await fetch(API+'/rest/v1/'+path,{
...opts,
headers:{...headers,...(opts.headers||{})}
});
if(!r.ok)throw Error('Сервер: '+r.status);
const body=await r.text();
return body.trim()?JSON.parse(body):[];
}

function money(v){
return Number(v).toLocaleString('uk-UA')+' грн';
}

function specs(p){
return [
['Розмір',p.toy_size],
['Матеріал',p.toy_material],
['Наповнювач',p.toy_filling],
['Догляд',p.toy_care],
['Індивідуальне замовлення',
p.toy_custom?'Можливе — уточніть у Яни':'']
].filter(x=>x[1]).map(([k,v])=>
'<div><strong>'+esc(k)+':</strong> '+esc(v)+'</div>'
).join('');
}

async function loadRatings(){
ratings.clear();

for(let offset=0;;offset+=500){
const data=await fetchJSON(
'toy_reviews?select=id,product_id,rating&approved=eq.true&order=id.asc&limit=500&offset='+offset
);

for(const r of data){
const value=Number(r.rating);
if(!Number.isInteger(value)||value<1||value>5)continue;

const id=String(r.product_id);
const item=ratings.get(id)||{sum:0,count:0};
item.sum+=value;
item.count++;
ratings.set(id,item);
}

if(data.length<500)break;
}
}

function ratingText(id){
const r=ratings.get(String(id));
if(!r||!r.count)return '☆ Поки немає відгуків';

const avg=r.sum/r.count;
return '★'.repeat(Math.round(avg))+
'☆'.repeat(5-Math.round(avg))+
' '+avg.toFixed(1)+' / 5 ('+r.count+')';
}

function enhance(){
for(const card of grid.querySelectorAll('article.product')){
const id=card.querySelector('[data-add]')?.dataset.add;
const p=meta.get(String(id));
if(!p)continue;

const pic=card.querySelector('.picture');
const badge=pic?.querySelector('.p3-badge');

if(badge&&p.toy_badge&&badge.textContent!==p.toy_badge){
badge.textContent=p.toy_badge;
}

const details=card.querySelector('.details');
if(!details)continue;

let rating=card.querySelector('.p70-rating');

if(!rating){
rating=document.createElement('div');
rating.className='p70-rating';
details.prepend(rating);
}

const text=ratingText(id);
if(rating.textContent!==text)rating.textContent=text;

if(!card.querySelector('.p50-review-btn')){
const b=document.createElement('button');
b.type='button';
b.className='p50-btn p50-review-btn';
b.textContent='★ Відгуки про іграшку';
b.onclick=()=>reviews(p);
details.append(b);
}
}
}

const obs=new MutationObserver(enhance);
obs.observe(grid,{childList:true});

function tile(p){
return '<article class="p50-tile">'+
'<img loading="lazy" src="'+esc(safe(p.image_url))+
'" alt="'+esc(p.name)+'">'+
'<h3>'+esc(p.name)+'</h3>'+
'<p>'+money(p.price)+'</p>'+
'<div class="p70-rating">'+esc(ratingText(p.id))+'</div>'+
(p.toy_badge?'<span class="p50-pill">'+esc(p.toy_badge)+'</span>':'')+
'<div class="p50-product-actions">'+
'<button type="button" class="p50-btn" data-p50-open="'+esc(p.id)+'">Переглянути</button>'+
'</div></article>';
}

function sections(){
if(document.getElementById('p50-recommended'))return;

const rec=document.createElement('section');
rec.id='p50-recommended';
rec.className='p50-section p50-feature';

const featured=rows.filter(p=>p.toy_featured);

rec.innerHTML='<div class="p50-wrap">'+
'<h2>♡ Іграшки, які можуть сподобатися</h2>'+
'<p class="p50-lead">Добірка авторських іграшок Яни.</p>'+
'<div class="p50-grid">'+
(featured.length?featured:rows).slice(0,4).map(tile).join('')+
'</div></div>';

document.getElementById('catalog')?.after(rec);

const hero=document.querySelector('.hero .wrap');

if(hero){
const b=document.createElement('a');
b.className='p50-btn';
b.href='#p50-recommended';
b.textContent='♡ Рекомендовані іграшки';
b.style.cssText='display:inline-block;text-decoration:none;margin-top:12px';
hero.querySelector('div')?.append(b);
}

rec.addEventListener('click',e=>{
const b=e.target.closest('[data-p50-open]');
if(!b)return;

const card=[...grid.querySelectorAll('article.product')]
.find(c=>c.querySelector('[data-add]')?.dataset.add===b.dataset.p50Open);

if(card){
card.scrollIntoView({behavior:'smooth',block:'center'});
card.querySelector('.picture img')?.click();
}else{
document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'});
}
});
}

async function compressPhoto(file){
if(!file.type.startsWith('image/')){
throw Error('Оберіть фотографію');
}

if(file.size>20*1024*1024){
throw Error('Початкове фото завелике');
}

const url=URL.createObjectURL(file);

try{
const img=new Image();
img.src=url;
await img.decode();

const scale=Math.min(1,1200/Math.max(img.width,img.height));

const canvas=document.createElement('canvas');
canvas.width=Math.max(1,Math.round(img.width*scale));
canvas.height=Math.max(1,Math.round(img.height*scale));

const ctx=canvas.getContext('2d');
ctx.fillStyle='#ffffff';
ctx.fillRect(0,0,canvas.width,canvas.height);
ctx.drawImage(img,0,0,canvas.width,canvas.height);

const blob=await new Promise(resolve=>
canvas.toBlob(resolve,'image/jpeg',0.78)
);

if(!blob||blob.size>2*1024*1024){
throw Error('Не вдалося стиснути фото');
}

return blob;

}finally{
URL.revokeObjectURL(url);
}
}

async function uploadPhoto(blob){
const response=await fetch(
API+'/functions/v1/upload-review-photo',{
method:'POST',
headers:{
apikey:KEY,
'Content-Type':'image/jpeg'
},
body:blob
});

const data=await response.json();

if(!response.ok||!data.photo_path){
throw Error(data.error||'Помилка завантаження фото');
}

return data.photo_path;
}

async function signedPhoto(path){
const response=await fetch(
API+'/storage/v1/object/sign/review-images/'+encodeURIComponent(path),{
method:'POST',
headers:{
apikey:KEY,
'Content-Type':'application/json'
},
body:JSON.stringify({expiresIn:300})
});

if(!response.ok)return '';

const data=await response.json();
const signed=data.signedURL||data.signedUrl;

if(!signed)return '';

if(signed.startsWith('https://'))return safe(signed);

return API+'/storage/v1'+signed;
}

async function reviews(p){

dialog.innerHTML=
'<button class="p50-btn p50-close" type="button">×</button>'+
'<h2>Відгуки: '+esc(p.name)+'</h2>'+
'<p>Завантаження…</p>';

dialog.querySelector('button').onclick=()=>dialog.close();

if(!dialog.open)dialog.showModal();

try{

const data=await fetchJSON(
'toy_reviews?select=id,reviewer_name,rating,review_text,photo_url,photo_path,created_at&product_id=eq.'+
encodeURIComponent(p.id)+
'&approved=eq.true&order=created_at.desc&limit=30'
);

dialog.innerHTML=
'<button class="p50-btn p50-close" type="button">×</button>'+
'<h2>Відгуки: '+esc(p.name)+'</h2>'+
'<div class="p70-rating">'+esc(ratingText(p.id))+'</div>'+

(data.length?data.map(r=>
'<div class="p50-review">'+
'<strong>'+esc(r.reviewer_name)+'</strong> '+
'<span>'+'★'.repeat(Math.max(0,Math.min(5,Number(r.rating)||0)))+'</span>'+
'<p>'+esc(r.review_text)+'</p>'+
(r.photo_path?
'<img class="p70-photo" data-photo-path="'+esc(r.photo_path)+'" alt="Фото покупця" hidden>':
safe(r.photo_url)?
'<img class="p70-photo" loading="lazy" src="'+esc(safe(r.photo_url))+'" alt="Фото покупця">':'')+
'</div>'
).join(''):'<p>Поки що немає опублікованих відгуків.</p>')+

'<h3>Залишити відгук</h3>'+
'<form id="p50-review-form">'+
'<label>Ім’я<input name="reviewer_name" maxlength="60" minlength="2" required></label>'+
'<label>Оцінка<select name="rating">'+
'<option value="5">★★★★★ — 5</option>'+
'<option value="4">★★★★ — 4</option>'+
'<option value="3">★★★ — 3</option>'+
'<option value="2">★★ — 2</option>'+
'<option value="1">★ — 1</option>'+
'</select></label>'+
'<label>Ваш відгук<textarea name="review_text" minlength="10" maxlength="1000" required></textarea></label>'+
'<div class="p70-upload">'+
'<label>📷 Додати фотографію (необов’язково)'+
'<input type="file" name="photo" accept="image/*"></label>'+
'<img class="p70-preview" alt="Попередній перегляд" hidden>'+
'<button type="button" class="p50-btn" id="p70-remove" hidden>Видалити фото</button>'+
'<p id="p70-photo-status"></p>'+
'</div>'+
'<p class="p50-note">Відгук та фотографія з’являться після перевірки майстринею.</p>'+
'<button class="p50-btn" type="submit">Надіслати на перевірку</button>'+
'<p id="p50-feedback" role="status"></p>'+
'</form>';

dialog.querySelector('.p50-close').onclick=()=>dialog.close();

for(const img of dialog.querySelectorAll('[data-photo-path]')){
signedPhoto(img.dataset.photoPath).then(url=>{
if(url&&img.isConnected){
img.src=url;
img.hidden=false;
}
}).catch(()=>{});
}

const form=dialog.querySelector('form');
const input=form.querySelector('[name=photo]');
const preview=form.querySelector('.p70-preview');
const remove=form.querySelector('#p70-remove');
const status=form.querySelector('#p70-photo-status');
const feedback=form.querySelector('#p50-feedback');
const btn=form.querySelector('[type=submit]');

let photo=null;
let previewURL='';
let uploadedPath=null;
let version=0;
let processing=false;
let submitting=false;

function clearPhoto(){
version++;
if(previewURL)URL.revokeObjectURL(previewURL);
previewURL='';
photo=null;
uploadedPath=null;
processing=false;
input.value='';
preview.removeAttribute('src');
preview.hidden=true;
remove.hidden=true;
status.textContent='';
btn.disabled=submitting;
}

remove.onclick=clearPhoto;

dialog.addEventListener('close',()=>{
if(previewURL)URL.revokeObjectURL(previewURL);
version++;
},{once:true});

input.onchange=async()=>{
const file=input.files?.[0];
clearPhoto();
if(!file)return;

const current=version;
processing=true;
btn.disabled=true;
status.textContent='Обробка фотографії…';

try{
const blob=await compressPhoto(file);
if(current!==version)return;

photo=blob;
previewURL=URL.createObjectURL(blob);
preview.src=previewURL;
preview.hidden=false;
remove.hidden=false;

status.textContent='✓ Фото готове: '+Math.ceil(blob.size/1024)+' КБ';

}catch(err){
if(current===version)status.textContent=err.message;
}finally{
if(current===version){
processing=false;
btn.disabled=false;
}
}
};

form.onsubmit=async e=>{
e.preventDefault();

if(processing||submitting)return;

submitting=true;
btn.disabled=true;
input.disabled=true;
remove.disabled=true;

const v=Object.fromEntries(new FormData(form));

try{

if(photo&&!uploadedPath){
feedback.textContent='Завантаження фотографії…';
uploadedPath=await uploadPhoto(photo);
}

feedback.textContent='Надсилання відгуку…';

await fetchJSON('toy_reviews',{
method:'POST',
headers:{
'Content-Type':'application/json',
Prefer:'return=minimal'
},
body:JSON.stringify({
product_id:p.id,
reviewer_name:v.reviewer_name.trim(),
rating:Number(v.rating),
review_text:v.review_text.trim(),
photo_url:null,
photo_path:uploadedPath,
approved:false
})
});

form.reset();
clearPhoto();

feedback.textContent='Дякуємо! Відгук надіслано на перевірку.';

}catch(err){
feedback.textContent='Не вдалося надіслати: '+err.message;
}finally{
submitting=false;
btn.disabled=false;
input.disabled=false;
remove.disabled=false;
}
};

}catch(err){
dialog.querySelector('p').textContent='Відгуки недоступні: '+err.message;
}
}

grid.addEventListener('click',e=>{
const b=e.target.closest('[data-details]');
if(!b)return;

const p=meta.get(String(b.dataset.details));
if(!p)return;

setTimeout(()=>{
const d=document.querySelector('.p3-dialog[open] .p3-dialog-inner');
if(!d||d.querySelector('.p50-specs'))return;

const block=document.createElement('div');
block.className='p50-specs';
block.innerHTML='<h3>Характеристики</h3>'+
(specs(p)||'<p>Деталі уточнюйте у майстрині.</p>');

d.querySelector('.p3-note')?.before(block);
},0);
},true);

async function load(){
try{
rows=await fetchJSON(
'products?select=id,name,price,image_url,toy_size,toy_material,toy_filling,toy_care,toy_custom,toy_badge,toy_featured&is_published=eq.true&order=id.desc'
);

rows.forEach(p=>meta.set(String(p.id),p));

try{
await loadRatings();
}catch(err){
console.warn('Ratings:',err);
}

enhance();
sections();

}catch(err){
console.warn('Premium 7.0:',err);
}
}

load();
})();
