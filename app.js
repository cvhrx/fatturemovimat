
// Local-only PWA with autosave draft (fixed)
const KEY='spese_records_local_v5';
const DRAFT_KEY='spese_drafts_v1';
const UI_KEY='spese_ui_large';
const state={current:new Date(),records:{},drafts:{}};

function fmt2(n){return String(n).padStart(2,'0');}
function fmtDate(d){return `${d.getFullYear()}-${fmt2(d.getMonth()+1)}-${fmt2(d.getDate())}`;}
function parseDateStr(s){const [y,m,dd]=s.split('-').map(Number);return new Date(y,m-1,dd);}
function euro(n){return '€ '+(n||0).toFixed(2).replace('.',',');}
function clean(v){if(v==null||v==='')return 0;v=String(v).replace(',','.');const n=parseFloat(v);return isNaN(n)?0:Math.round(n*100)/100;}
function byId(id){return document.getElementById(id);}
function showToast(msg){const t=byId('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800);}

function loadLocal(){try{const raw=localStorage.getItem(KEY);state.records=raw?JSON.parse(raw):{};}catch{state.records={};}}
function saveLocal(){localStorage.setItem(KEY,JSON.stringify(state.records));}
function loadDrafts(){try{const raw=localStorage.getItem(DRAFT_KEY);state.drafts=raw?JSON.parse(raw):{};}catch{state.drafts={};}}
function saveDrafts(){localStorage.setItem(DRAFT_KEY,JSON.stringify(state.drafts));}

function budgetFor(t){return t?110:20;}

function snapshotForm(){
  return {
    trasferta: byId('trasferta').checked,
    pranzo: byId('pranzo').value,
    cena: byId('cena').value,
    hotel: byId('hotel').value,
    collega: byId('collega').value,
    cliente: byId('cliente').value,
    ts: Date.now()
  };
}
function applyDraft(d){
  byId('trasferta').checked = !!d.trasferta;
  byId('pranzo').value = d.pranzo||'';
  byId('cena').value = d.cena||'';
  byId('hotel').value = d.hotel||'';
  byId('collega').value = d.collega||'';
  byId('cliente').value = d.cliente||'';
  updateBudgetLabel(); updateExtraVisibility();
}
function saveDraftFor(dateStr){
  const d = snapshotForm();
  state.drafts[dateStr]=d; saveDrafts();
}
function clearDraftFor(dateStr){
  if(state.drafts[dateStr]){ delete state.drafts[dateStr]; saveDrafts(); }
}

function setFormFromRecord(dateStr){
  const rec=state.records[dateStr];
  const trasf=rec?!!rec.trasferta:false;
  byId('trasferta').checked=trasf;
  byId('pranzo').value=rec&&rec.pranzo!=null?String(rec.pranzo).replace('.',','):'';
  byId('cena').value=trasf&&rec&&rec.cena!=null?String(rec.cena).replace('.',','):'';
  byId('hotel').value=trasf&&rec&&rec.hotel!=null?String(rec.hotel).replace('.',','):'';
  byId('collega').value=rec?(rec.collega||''):'';
  byId('cliente').value=rec?(rec.cliente||''):'';

  const dr=state.drafts[dateStr];
  if(dr){
    applyDraft(dr);
    showToast('Bozza ripristinata');
  }

  updateBudgetLabel(); updateExtraVisibility();
}

function updateBudgetLabel(){const b=budgetFor(byId('trasferta').checked);byId('budget').textContent=euro(b);}
function updateExtraVisibility(){const on=byId('trasferta').checked;byId('cena_wrap').classList.toggle('hidden',!on);byId('hotel_wrap').classList.toggle('hidden',!on);}

function saveDay(){
  const dateStr=byId('date').value;if(!dateStr){alert('Seleziona una data');return;}
  const trasf=byId('trasferta').checked;
  const budget=budgetFor(trasf);
  const pranzo=clean(byId('pranzo').value);
  const cena=trasf?clean(byId('cena').value):0;
  const hotel=trasf?clean(byId('hotel').value):0;
  const collega=byId('collega').value.trim();
  const cliente=byId('cliente').value.trim();
  const totale_div2=Math.round(((pranzo+cena+hotel)/2)*100)/100;
  const sforato=totale_div2>budget;
  state.records[dateStr]={trasferta:trasf,budget,pranzo,cena,hotel,collega,cliente,totale_div2,sforato};
  saveLocal();
  clearDraftFor(dateStr);
  renderMonth();
  showToast('Giorno salvato');
}

function changeDay(delta){
  const cur=parseDateStr(byId('date').value||fmtDate(new Date()));
  cur.setDate(cur.getDate()+delta);
  const s=fmtDate(cur);
  byId('date').value=s;
  setFormFromRecord(s);
  renderMonth();
}

function renderMonth(){
  const curStr=byId('date').value||fmtDate(new Date());
  const d0=parseDateStr(curStr);
  const y=d0.getFullYear(), m=d0.getMonth();
  const first=new Date(y,m,1), last=new Date(y,m+1,0);
  let monthTotal=0, monthBudget=0;
  const cards=byId('cards'); cards.innerHTML='';

  for(let d=new Date(first); d<=last; d.setDate(d.getDate()+1)){
    const wd=d.getDay(); if(wd===0||wd===6) continue;
    const key=fmtDate(d); const rec=state.records[key];
    const trasf=rec?!!rec.trasferta:false;
    const budget=rec?rec.budget:budgetFor(false);
    const pranzo=rec?rec.pranzo:0, cena=rec?rec.cena:0, hotel=rec?rec.hotel:0;
    const tot2=rec?rec.totale_div2:0; const sforato=rec?!!rec.sforato:false;

    monthTotal+=tot2; monthBudget+=budget;

    const card=document.createElement('div'); card.className='daycard'+(sforato?' open':'');
    const head=document.createElement('div'); head.className='dayhead';
    const title=document.createElement('div'); title.className='daytitle';
    title.textContent=d.toLocaleDateString('it-IT',{weekday:'short',day:'2-digit',month:'2-digit'});
    const pills=document.createElement('div'); pills.className='pills';
    const p1=document.createElement('div'); p1.className='pill'; p1.textContent='Budget '+euro(budget);
    const p2=document.createElement('div'); p2.className='pill'+(sforato?' warn':''); p2.textContent='Tot/2 '+euro(tot2);
    const p3=document.createElement('div'); p3.className='pill'; p3.textContent=trasf?'Pernottamento':'Giornaliera';
    pills.append(p1,p2,p3); head.append(title,pills);

    const details=document.createElement('div'); details.className='daydetails';
    const grid=document.createElement('div'); grid.className='daygrid';
    grid.innerHTML = `
      <div><span class="small">Pranzo</span><div>${euro(pranzo)}</div></div>
      <div><span class="small">Cena</span><div>${euro(cena)}</div></div>
      <div><span class="small">Hotel</span><div>${euro(hotel)}</div></div>
      <div><span class="small">Collega</span><div>${(rec&&rec.collega)||''}</div></div>
      <div><span class="small">Cliente</span><div>${(rec&&rec.cliente)||''}</div></div>
    `;
    details.appendChild(grid);
    card.append(head, details);
    card.addEventListener('click', ()=>{ card.classList.toggle('open'); });
    cards.appendChild(card);
  }
  byId('month_total').textContent=euro(monthTotal);
  byId('month_budget').textContent=euro(monthBudget);
}

// Excel export
function escapeXML(s){
  return s
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/\"/g,'&quot;')
    .replace(/\\'/g,'&apos;');
}
function exportExcel(){
  const headers=['Data','Pernottamento','Budget','Pranzo','Cena','Hotel','Collega','Cliente','Totale/2','Sforato'];
  const keys=Object.keys(state.records).sort();
  const rows=keys.map(k=>{const r=state.records[k];return [k.split('-').reverse().join('/'), r.trasferta?'Sì':'No', r.budget||0, r.pranzo||0, r.cena||0, r.hotel||0, (r.collega||''), (r.cliente||''), r.totale_div2||0, r.sforato?'Sì':'No'];});
  let xml='<?xml version=\"1.0\"?>'+'<?mso-application progid=\"Excel.Sheet\"?>'+'<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\" xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:x=\"urn:schemas-microsoft-com:office:excel\" xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\">'+'<Styles>'+'<Style ss:ID=\"hdr\"><Font ss:Bold=\"1\" ss:Color=\"#FFFFFF\"/><Interior ss:Color=\"#111111\" ss:Pattern=\"Solid\"/></Style>'+'<Style ss:ID=\"cur\"><NumberFormat ss:Format=\"€ #,##0.00\"/></Style>'+'</Styles>'+'<Worksheet ss:Name=\"Spese\">'+'<Table>';
  xml+='<Row>'+headers.map(h=>`<Cell ss:StyleID=\"hdr\"><Data ss:Type=\"String\">${escapeXML(h)}</Data></Cell>`).join('')+'</Row>';
  rows.forEach(r=>{xml+='<Row>'+r.map((c,i)=>{if([2,3,4,5,8].includes(i))return `<Cell ss:StyleID=\"cur\"><Data ss:Type=\"Number\">${Number(c).toFixed(2)}</Data></Cell>`;return `<Cell><Data ss:Type=\"String\">${escapeXML(String(c))}</Data></Cell>`;}).join('')+'</Row>';});
  xml+='</Table></Worksheet></Workbook>';
  const blob=new Blob([xml],{type:'application/vnd.ms-excel'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='spese_ditta.xls'; a.click(); URL.revokeObjectURL(a.href);
}

function applyLargeFromStorage(){
  const isLarge=localStorage.getItem(UI_KEY)==='1';
  document.body.classList.toggle('large',isLarge);
  const btn=byId('btn-large'); if(btn){ btn.setAttribute('aria-pressed',isLarge?'true':'false'); btn.textContent=isLarge?'Dimensioni: Large':'Dimensioni: Normale'; }
}
function toggleLarge(){ const next=!document.body.classList.contains('large'); document.body.classList.toggle('large',next); localStorage.setItem(UI_KEY,next?'1':'0'); applyLargeFromStorage(); }

function addAutosaveListeners(){
  const ids=['trasferta','pranzo','cena','hotel','collega','cliente'];
  const debounced = (()=>{ let t; return ()=>{ clearTimeout(t); t=setTimeout(()=>{ const ds=byId('date').value; if(ds) saveDraftFor(ds); }, 300); }; })();
  ids.forEach(id=>{
    const el=byId(id);
    const ev = (id==='trasferta') ? 'change' : 'input';
    el.addEventListener(ev, debounced);
  });
}

function init(){
  loadLocal();
  loadDrafts();
  byId('date').value=fmtDate(new Date());
  updateBudgetLabel(); updateExtraVisibility();
  setFormFromRecord(byId('date').value);
  applyLargeFromStorage();
  addAutosaveListeners();

  byId('trasferta').addEventListener('change',()=>{updateBudgetLabel();updateExtraVisibility();});
  byId('date').addEventListener('change',e=>{const s=e.target.value; setFormFromRecord(s); renderMonth();});
  byId('prev').addEventListener('click',()=>changeDay(-1));
  byId('next').addEventListener('click',()=>changeDay(1));
  byId('save').addEventListener('click',saveDay);
  byId('btn-large').addEventListener('click',toggleLarge);
  byId('export_xls').addEventListener('click',exportExcel);

  renderMonth();
}

window.addEventListener('load',()=>{
  init();
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('./service-worker.js'); }
});
