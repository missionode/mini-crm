(async function(){
  function ready(fn){ if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true}); else fn(); }
  async function loadBranding(){ try{const r=await fetch('assets/data/branding.json'); const b=await r.json(); const el=document.getElementById('appName'); if(el) el.textContent=b.appName||'Mini CRM';}catch(e){} }

  function uid(){return 'id_'+Math.random().toString(36).slice(2,10)+Date.now().toString(36);}
  function loadData(){ try{const raw=localStorage.getItem('crmData'); if(!raw) return {leads:[],contacts:[],interactions:[]}; const p=JSON.parse(raw); return {leads:p.leads||[],contacts:p.contacts||[],interactions:p.interactions||[]};}catch(e){return {leads:[],contacts:[],interactions:[]};} }
  function saveData(d){ localStorage.setItem('crmData', JSON.stringify(d)); }
  function findContactName(contacts,id){ const c=contacts.find(x=>x.id===id); return c?c.name:''; }
  function todayISO(){ const d=new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
  function isOverdue(s){ if(!s) return false; const a=new Date(s+'T00:00:00'); const b=new Date(); const bm=new Date(b.getFullYear(),b.getMonth(),b.getDate()); return a<bm; }
  function esc(str){return String(str||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

  window.CRM = { uid, loadData, saveData, findContactName, todayISO, isOverdue, esc };

  ready(loadBranding);

  ready(function dashboardInit(){
    const dueWrap=document.getElementById('dueToday');
    const overWrap=document.getElementById('overdueList');
    const statsWrap=document.getElementById('quickStats');
    const recentWrap=document.getElementById('recentInteractions');

    const donutWrap=document.getElementById('chartStageDonut');
    const donutLegend=document.getElementById('donutLegend');
    const donutTotal=document.getElementById('donutTotal');

    const sparkWrap=document.getElementById('chartActivitySpark');
    const sparkSummary=document.getElementById('sparkSummary');

    const barsWrap=document.getElementById('chartDueBars');
    const dueSummary=document.getElementById('dueSummary');

    if (!dueWrap && !overWrap && !statsWrap && !recentWrap && !donutWrap && !sparkWrap && !barsWrap) return;

    const data = loadData();
    const contacts = data.contacts;
    const leads = data.leads;
    const t = todayISO();

    const due = leads.filter(l=>l.nextActionDate===t);
    const overdue = leads.filter(l=>l.nextActionDate && isOverdue(l.nextActionDate));

    function stageClass(s){
      if(s==='Won')return'bg-emerald-100 text-emerald-700';
      if(s==='Lost')return'bg-red-100 text-red-700';
      if(s==='Qualified')return'bg-indigo-100 text-indigo-700';
      if(s==='Contacted')return'bg-amber-100 text-amber-700';
      return'bg-gray-100 text-gray-700';
    }
    function leadCard(ld){
      const od = ld.nextActionDate && isOverdue(ld.nextActionDate);
      return '<div class="p-4 bg-white dark:bg-gray-800 rounded-xl border">'+
        '<div class="flex justify-between"><div>'+
        '<div class="font-semibold">'+(esc(ld.title)||'Untitled Lead')+'</div>'+
        '<div class="text-sm text-gray-500 dark:text-gray-400">'+esc(ld.company||'')+'</div>'+
        '<div class="text-sm mt-1">'+esc(findContactName(contacts, ld.contactId)||'')+'</div>'+
        '</div><span class="px-2 py-1 text-xs rounded '+stageClass(ld.stage)+'">'+(ld.stage||'New')+'</span></div>'+
        '<div class="mt-2 text-sm">Value: '+(Number(ld.value)||0)+'</div>'+
        '<div class="mt-1 text-sm '+(od?'text-red-600':'')+'">Next: '+(ld.nextActionDate||'—')+'</div>'+
      '</div>';
    }

    if (dueWrap) {
      dueWrap.innerHTML = due.length ? due.map(leadCard).join('') :
        '<div class="p-6 bg-white dark:bg-gray-800 rounded-xl border text-center">Nothing due today.</div>';
    }
    if (overWrap) {
      overWrap.innerHTML = overdue.length ? overdue.map(leadCard).join('') :
        '<div class="p-6 bg-white dark:bg-gray-800 rounded-xl border text-center">No overdue items.</div>';
    }

    const byStage = leads.reduce((acc,l)=>{const k=l.stage||'New'; acc[k]=(acc[k]||0)+1; return acc;},{});
    if (statsWrap) {
      statsWrap.innerHTML = Object.keys(byStage).length ? Object.entries(byStage).sort().map(([s,c])=>
        '<div class="p-4 bg-white dark:bg-gray-800 rounded-xl border flex items-center justify-between"><span class="text-sm">'+esc(s)+'</span><span class="text-lg font-semibold">'+c+'</span></div>'
      ).join('') : '<div class="p-6 bg-white dark:bg-gray-800 rounded-xl border text-center">No leads yet.</div>';
    }

    const recent = data.interactions.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
    if (recentWrap) {
      recentWrap.innerHTML = recent.length ? recent.map(i=>{
        const tag=i.type||'note';
        const linkTxt=i.leadId?'Lead':(i.contactId?'Contact':'');
        const name=i.leadTitle||i.contactName||'';
        return '<div class="p-4 bg-white dark:bg-gray-800 rounded-xl border">'+
          '<div class="flex items-center gap-2"><span class="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">'+esc(tag)+'</span>'+
          '<span class="text-xs text-gray-500">'+new Date(i.date).toLocaleString()+'</span></div>'+
          '<div class="mt-1 text-sm">'+esc(i.summary||'')+'</div>'+
          (linkTxt?'<div class="mt-1 text-xs text-gray-500">'+linkTxt+': '+esc(name)+'</div>':'')+
        '</div>';
      }).join('') : '<div class="p-6 bg-white dark:bg-gray-800 rounded-xl border text-center">No interactions yet.</div>';
    }

    const COLORS = {
      Won:'#10b981', Lost:'#ef4444', Qualified:'#6366f1', Contacted:'#f59e0b', New:'#9ca3af', Other:'#3b82f6'
    };

    function describeArc(cx, cy, r, start, end){
      const s = (start-90)*Math.PI/180, e=(end-90)*Math.PI/180;
      const sx=cx+r*Math.cos(s), sy=cy+r*Math.sin(s);
      const ex=cx+r*Math.cos(e), ey=cy+r*Math.sin(e);
      const large = end-start<=180 ? 0 : 1;
      return `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`;
    }

    function renderDonut(container, legend, totalEl, dataPairs){
      if (!container) return;
      const total = dataPairs.reduce((a,[,v])=>a+v,0);
      if (totalEl) totalEl.textContent = total ? total+' leads' : '0 leads';
      const w=220, h=180, cx=110, cy=90, r=70;
      const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.setAttribute('class','w-full h-full');

      if (!total) {
        const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');
        circle.setAttribute('cx',cx); circle.setAttribute('cy',cy); circle.setAttribute('r',r);
        circle.setAttribute('fill','#e5e7eb');
        svg.appendChild(circle);
        container.innerHTML=''; container.appendChild(svg);
        if (legend) legend.innerHTML='';
        return;
      }

      let angle=0;
      dataPairs.forEach(([k,v])=>{
        const share=(v/total)*360;
        const path=document.createElementNS('http://www.w3.org/2000/svg','path');
        path.setAttribute('d', describeArc(cx,cy,r,angle,angle+share));
        path.setAttribute('fill', COLORS[k] || COLORS.Other);
        path.setAttribute('opacity','0.9');
        path.style.cursor='pointer';
        path.addEventListener('mouseenter',()=>{ path.setAttribute('opacity','1'); });
        path.addEventListener('mouseleave',()=>{ path.setAttribute('opacity','0.9'); });
        svg.appendChild(path);
        angle += share;
      });
      container.innerHTML=''; container.appendChild(svg);

      if (legend) {
        legend.innerHTML = dataPairs.map(([k,v])=>{
          const c = COLORS[k] || COLORS.Other;
          return '<div class="flex items-center gap-2"><span class="h-3 w-3 rounded-full" style="background:'+c+'"></span><span>'+esc(k)+'</span><span class="ml-auto font-semibold">'+v+'</span></div>';
        }).join('');
      }
    }

    function renderSparkline(container, points){
      if (!container) return;
      const w=320, h=80, pad=8;
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
      svg.setAttribute('class','w-full h-full');

      const max=Math.max(1, ...points);
      const step=(w-2*pad)/Math.max(1, points.length-1);
      const coords=points.map((v,i)=>{
        const x=pad+i*step;
        const y=h-pad-(v/max)*(h-2*pad);
        return `${x},${y}`;
      }).join(' ');

      const poly=document.createElementNS('http://www.w3.org/2000/svg','polyline');
      poly.setAttribute('fill','none');
      poly.setAttribute('stroke','#2563eb');
      poly.setAttribute('stroke-width','2');
      poly.setAttribute('points',coords);
      svg.appendChild(poly);

      const area=document.createElementNS('http://www.w3.org/2000/svg','polygon');
      const base=` ${w-pad},${h-pad} ${pad},${h-pad}`;
      area.setAttribute('points',coords + base);
      area.setAttribute('fill','#93c5fd');
      area.setAttribute('opacity','0.3');
      svg.appendChild(area);

      container.innerHTML=''; container.appendChild(svg);
    }

    function renderBars(container, buckets, labels){
      if (!container) return;
      const w=320, h=100, pad=10;
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
      svg.setAttribute('class','w-full h-full');

      const max=Math.max(1, ...buckets);
      const gap=6;
      const barW=(w-2*pad - gap*(buckets.length-1))/buckets.length;

      buckets.forEach((v,i)=>{
        const x=pad+i*(barW+gap);
        const barH=(v/max)*(h-28);
        const y=h-18-barH;

        const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
        rect.setAttribute('x',x); rect.setAttribute('y',y);
        rect.setAttribute('width',barW); rect.setAttribute('height',barH);
        rect.setAttribute('rx','4'); rect.setAttribute('fill','#10b981');
        rect.setAttribute('opacity','0.9');
        rect.style.cursor='pointer';
        rect.addEventListener('mouseenter',()=>{ rect.setAttribute('opacity','1'); });
        rect.addEventListener('mouseleave',()=>{ rect.setAttribute('opacity','0.9'); });
        svg.appendChild(rect);

        const lab=document.createElementNS('http://www.w3.org/2000/svg','text');
        lab.setAttribute('x', x+barW/2);
        lab.setAttribute('y', h-6);
        lab.setAttribute('text-anchor','middle');
        lab.setAttribute('font-size','9');
        lab.setAttribute('fill','#6b7280');
        lab.textContent = labels[i];
        svg.appendChild(lab);
      });

      container.innerHTML=''; container.appendChild(svg);
    }

    if (donutWrap) {
      const pairs = Object.entries(byStage).sort((a,b)=>a[0].localeCompare(b[0]));
      renderDonut(donutWrap, donutLegend, donutTotal, pairs);
    }

    if (sparkWrap) {
      const days=14;
      const map = new Map();
      for(let i=days-1;i>=0;i--){
        const d=new Date(); d.setDate(d.getDate()-i);
        const key=d.toISOString().slice(0,10);
        map.set(key,0);
      }
      data.interactions.forEach(it=>{
        const key=(new Date(it.date)).toISOString().slice(0,10);
        if (map.has(key)) map.set(key, map.get(key)+1);
      });
      const series = Array.from(map.values());
      const totalActs = series.reduce((a,b)=>a+b,0);
      if (sparkSummary) sparkSummary.textContent = totalActs+' events';
      renderSparkline(sparkWrap, series);
    }

    if (barsWrap) {
      const days=7;
      const labels=[];
      const counts=[];
      for(let i=0;i<days;i++){
        const d=new Date(); d.setDate(d.getDate()+i);
        const key=d.toISOString().slice(0,10);
        const dayLabel = d.toLocaleDateString(undefined,{weekday:'short'});
        labels.push(dayLabel);
        counts.push(leads.filter(l=>l.nextActionDate===key).length);
      }
      if (dueSummary) dueSummary.textContent = counts.reduce((a,b)=>a+b,0)+' total';
      renderBars(barsWrap, counts, labels);
    }
  });
})();
