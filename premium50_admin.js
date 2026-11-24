/* Premium 7.0 — admin metadata and photo review moderation */
(() => {
'use strict';

const $=id=>document.getElementById(id);

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

const style=document.createElement('style');

style.textContent=`
.p70-admin-review{
padding:16px 0;
border-bottom:1px solid #eadbdc;
}
.p70-admin-photo{
display:block;
max-width:100%;
max-height:260px;
object-fit:contain;
border-radius:14px;
margin:12px 0;
cursor:zoom-in;
}
.p70-admin-photo[hidden]{
display:none;
}
.p70-admin-state{
display:inline-block;
padding:5px 10px;
border-radius:12px;
font-size:12px;
margin:6px 0;
}
.p70-approved{
background:#e0f2e4;
color:#287344;
}
.p70-pending{
background:#fff0d5;
color:#95621c;
}
.p70-admin-viewer{
border:0;
border-radius:18px;
padding:12px;
max-width:95vw;
max-height:90vh;
}
.p70-admin-viewer::backdrop{
background:rgba(0,0,0,.85);
}
.p70-admin-viewer img{
display:block;
max-width:85vw;
max-height:75vh;
object-fit:contain;
margin:auto;
}
`;

document.head.append(style);

const meta=document.createElement('section');
meta.className='card hidden';
meta.id='p50-admin-meta';

meta.innerHTML=`
<h2>Характеристики іграшки</h2>
<p id="p50-edit-name"></p>
<form id="p50-meta-form">
<label>Розмір
<input name="toy_size" maxlength="100" placeholder="Наприклад, 10 см">
</label>
<label>Матеріал
<input name="toy_material" maxlength="200" placeholder="Бавовняна пряжа">
</label>
<label>Наповнювач
<input name="toy_filling" maxlength="200">
</label>
<label>Догляд
<textarea name="toy_care" maxlength="600"></textarea>
</label>
<label>Позначка
<select name="toy_badge">
<option value="">Без позначки</option>
<option>Новинка</option>
<option>Хіт продажів</option>
<option>Під замовлення</option>
</select>
</label>
<label>
<input type="checkbox" name="toy_custom" style="width:auto;display:inline">
Можливе індивідуальне замовлення
</label>
<label>
<input type="checkbox" name="toy_featured" style="width:auto;display:inline">
Рекомендувати на головній
</label>
<div class="actions">
<button type="submit">Зберегти характеристики</button>
<button type="button" class="secondary" id="p50-meta-close">Закрити</button>
</div>
<p id="p50-meta-status" role="status"></p>
</form>
`;

const rev=document.createElement('section');
rev.className='card';
rev.id='p50-admin-reviews';

rev.innerHTML=`
<h2>★ Відгуки покупців</h2>
<p id="p70-review-count"></p>
<label>Показати
<select id="p70-review-filter">
<option value="all">Усі відгуки</option>
<option value="pending">Очікують перевірки</option>
<option value="approved">Опубліковані</option>
<option value="photos">З фотографіями</option>
</select>
</label>
<button type="button" id="p50-refresh-reviews">
↻ Оновити відгуки
</button>
<div id="p50-review-list"></div>
`;

const viewer=document.createElement('dialog');
viewer.className='p70-admin-viewer';

viewer.innerHTML=`
<button type="button" class="secondary">Закрити ×</button>
<img alt="Фото покупця">
`;

document.body.append(viewer);

viewer.querySelector('button').onclick=()=>viewer.close();

viewer.addEventListener('close',()=>{
viewer.querySelector('img').removeAttribute('src');
});

let current=null;
let reviewRows=[];
let requestVersion=0;

async function edit(id){

current=id;
meta.classList.remove('hidden');

$('p50-edit-name').textContent='Товар №'+id;
$('p50-meta-status').textContent='Завантаження…';

meta.scrollIntoView({behavior:'smooth'});

const {data,error}=await db
.from('products')
.select('name,toy_size,toy_material,toy_filling,toy_care,toy_custom,toy_badge,toy_featured')
.eq('id',id)
.single();

if(current!==id)return;

if(error){
$('p50-meta-status').textContent=error.message;
return;
}

$('p50-edit-name').textContent=data.name;

const form=$('p50-meta-form');

for(const key of [
'toy_size',
'toy_material',
'toy_filling',
'toy_care',
'toy_badge'
]){
form.elements[key].value=data[key]||'';
}

for(const key of [
'toy_custom',
'toy_featured'
]){
form.elements[key].checked=!!data[key];
}

$('p50-meta-status').textContent='';
}

async function photoURL(r){

if(r.photo_path){

const {data,error}=await db.storage
.from('review-images')
.createSignedUrl(r.photo_path,300);

if(error)throw error;

return safe(data.signedUrl);
}

return safe(r.photo_url);
}

async function showPhoto(r){

try{
const url=await photoURL(r);

if(!url)throw Error('Фото недоступне');

viewer.querySelector('img').src=url;

if(!viewer.open)viewer.showModal();

}catch(e){
alert('Помилка фотографії: '+e.message);
}
}

async function changeReview(r,action){

const {data:sessionData,error:sessionError}=
await db.auth.getSession();

if(sessionError)throw sessionError;

if(!sessionData?.session){
throw Error('Увійдіть до адмінпанелі повторно.');
}

const q=db.from('toy_reviews');

const {data:changed,error}=action==='delete'
?await q.delete().eq('id',r.id).select('id')
:await q.update({
approved:action==='approve'
}).eq('id',r.id).select('id,approved');

if(error)throw error;

if(!changed?.length){
throw Error('Запис не змінено. Перевірте права адміністратора.');
}

await reviews();

alert(
action==='delete'
?'Відгук видалено'
:action==='approve'
?'Відгук схвалено'
:'Відгук приховано'
);
}

function renderReviews(){

const root=$('p50-review-list');
const filter=$('p70-review-filter').value;

root.replaceChildren();

const pending=reviewRows.filter(r=>!r.approved).length;

$('p70-review-count').textContent=
'Усього: '+reviewRows.length+
' · Очікують перевірки: '+pending;

const selected=reviewRows.filter(r=>{
if(filter==='pending')return !r.approved;
if(filter==='approved')return r.approved;
if(filter==='photos')return !!(r.photo_path||r.photo_url);
return true;
});

if(!selected.length){
root.textContent='Відгуків немає.';
return;
}

for(const r of selected){

const div=document.createElement('div');
div.className='p70-admin-review';

const rating=Math.max(
0,Math.min(5,Math.round(Number(r.rating)||0))
);

div.innerHTML=`
<strong>${esc(r.reviewer_name)}</strong>
<p>Товар №${esc(r.product_id)}</p>
<p style="color:#ad8050">
${'★'.repeat(rating)}${'☆'.repeat(5-rating)}
${rating}/5
</p>
<span class="p70-admin-state ${r.approved?'p70-approved':'p70-pending'}">
${r.approved?'✓ Опубліковано':'Очікує перевірки'}
</span>
<p>${esc(r.review_text)}</p>
<div class="p70-admin-photo-box"></div>
<div class="actions"></div>
`;

if(r.photo_path||r.photo_url){

const box=div.querySelector('.p70-admin-photo-box');

const img=document.createElement('img');
img.className='p70-admin-photo';
img.alt='Фото покупця';
img.hidden=true;

const status=document.createElement('p');
status.textContent='Завантаження фото…';

const open=document.createElement('button');
open.type='button';
open.className='secondary';
open.textContent='🔍 Збільшити фотографію';

open.onclick=()=>showPhoto(r);
img.onclick=()=>showPhoto(r);

box.append(status,img,open);

photoURL(r).then(url=>{

if(!div.isConnected)return;

if(!url){
status.textContent='Фото недоступне';
return;
}

img.src=url;
img.hidden=false;
status.textContent='📷 Фото покупця';

}).catch(()=>{
status.textContent='Не вдалося завантажити фото';
});

img.onerror=()=>{
img.hidden=true;
status.textContent='Не вдалося відкрити фото';
};
}

const actions=div.querySelector('.actions');

const buttons=[
r.approved
?['Приховати','hide']
:['Схвалити','approve'],
['Видалити','delete']
];

for(const [label,action] of buttons){

const b=document.createElement('button');

b.type='button';
b.textContent=label;
b.className=action==='delete'?'danger':'secondary';

b.onclick=async()=>{

if(action==='delete'&&
!confirm('Видалити відгук назавжди?'))return;

actions.querySelectorAll('button').forEach(
button=>button.disabled=true
);

try{
await changeReview(r,action);
}catch(e){
alert('Помилка: '+e.message);
}finally{
actions.querySelectorAll('button').forEach(
button=>button.disabled=false
);
}
};

actions.append(b);
}

root.append(div);
}
}

async function reviews(){

const root=$('p50-review-list');
const version=++requestVersion;

root.textContent='Завантаження…';

try{

const result=[];

for(let offset=0;;offset+=100){

const {data,error}=await db
.from('toy_reviews')
.select('id,product_id,reviewer_name,rating,review_text,photo_url,photo_path,approved,created_at')
.order('created_at',{ascending:false})
.order('id',{ascending:false})
.range(offset,offset+99);

if(error)throw error;

result.push(...(data||[]));

if(!data||data.length<100)break;
}

if(version!==requestVersion)return;

reviewRows=result;
renderReviews();

}catch(e){

if(version===requestVersion){
root.textContent='Помилка: '+e.message;
}
}
}

function init(){

const admin=$('adminPanel');
const list=$('productsList');

if(!admin||!list||!window.supabase)return;

$('editorCard').after(meta);
admin.append(rev);

$('p50-meta-close').onclick=()=>{
meta.classList.add('hidden');
};

$('p50-meta-form').onsubmit=async e=>{

e.preventDefault();

if(current===null)return;

const f=e.target;
const btn=f.querySelector('[type=submit]');

btn.disabled=true;

try{

const payload={};

for(const key of [
'toy_size',
'toy_material',
'toy_filling',
'toy_care',
'toy_badge'
]){
payload[key]=f.elements[key].value.trim();
}

for(const key of [
'toy_custom',
'toy_featured'
]){
payload[key]=f.elements[key].checked;
}

const {error}=await db
.from('products')
.update(payload)
.eq('id',current);

if(error)throw error;

$('p50-meta-status').textContent='✓ Збережено';

}catch(e){

$('p50-meta-status').textContent='Помилка: '+e.message;

}finally{
btn.disabled=false;
}
};

$('p50-refresh-reviews').onclick=reviews;

$('p70-review-filter').onchange=renderReviews;

list.addEventListener('click',e=>{

const b=e.target.closest('.p50-meta-btn');

if(b)edit(b.dataset.id);
});

function enhanceProducts(){

const cards=[...list.querySelectorAll('.product')];

cards.forEach((card,i)=>{

if(card.querySelector('.p50-meta-btn'))return;

const p=products[i];
if(!p)return;

const b=document.createElement('button');

b.className='secondary p50-meta-btn';
b.type='button';
b.dataset.id=p.id;
b.textContent='Характеристики';

card.querySelector('.actions')?.append(b);
});
}

const obs=new MutationObserver(enhanceProducts);

obs.observe(list,{
childList:true,
subtree:false
});

enhanceProducts();

const adminObserver=new MutationObserver(()=>{

if(!admin.hidden){

db.auth.getSession().then(({data})=>{
if(data?.session&&!admin.hidden)reviews();
});

}else{

requestVersion++;
reviewRows=[];
$('p50-review-list').replaceChildren();
$('p70-review-count').textContent='';
meta.classList.add('hidden');

if(viewer.open)viewer.close();
}
});

adminObserver.observe(admin,{
attributes:true,
attributeFilter:['hidden']
});

db.auth.getSession().then(({data})=>{
if(data?.session&&!admin.hidden)reviews();
});
}

if(document.readyState==='loading'){
document.addEventListener('DOMContentLoaded',init);
}else{
init();
}
})();
