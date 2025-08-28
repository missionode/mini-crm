(function(){
  function ready(fn){ if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true}); else fn(); }
  ready(function(){
    const addBtn=document.getElementById('addInteraction');
    const modal=document.getElementById('interactionModal');
    const modalTitle=document.getElementById('interactionModalTitle');
    const cancelBtn=document.getElementById('cancelInteraction');
    const form=document.getElementById('interactionForm');
    const list=document.getElementById('timelineList');
    const filterType=document.getElementById('filterType');
    const filterLink=document.getElementById('filterLink');
    const linkKindSel=document.getElementById('iLinkKind');
    const linkIdSel=document.getElementById('iLinkId');
    const linkWrap=document.getElementById('iLinkWrap');
    if(!addBtn||!modal||!form||!list||!modalTitle) return;

    let editingId=null;

    function toLocalDTValue(iso){ if(!iso) return ''; const d=new Date(iso); const t=new Date(d.getTime()-d.getTimezoneOffset()*60000); return t.toISOString().slice(0,16); }
    function nowLocal(){ const n=new Date(); return new Date(n.getTime()-n.getTimezoneOffset()*60000).toISOString().slice(0,16); }

    function openModal(){
      populateLinkOptions('');
      if(!editingId) document.getElementById('iDate').value = nowLocal();
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
    function closeModal(){
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      form.reset();
      linkIdSel.innerHTML='';
      editingId=null;
      modalTitle.textContent='New Interaction';
    }

    function populateLinkOptions(selectedId){
      const data=CRM.loadData();
      linkIdSel.innerHTML='';
      const kind=linkKindSel.value;
      if(!kind){ linkWrap.classList.add('opacity-50'); return; }
      linkWrap.classList.remove('opacity-50');
      if(kind==='lead'){
        data.leads.forEach(l=>{
          const o=document.createElement('option');
          o.value=l.id; o.textContent=(l.title||'Untitled')+(l.company?(' · '+l.company):'');
          if(selectedId&&selectedId===l.id) o.selected=true;
          linkIdSel.appendChild(o);
        });
      }else{
        data.contacts.forEach(c=>{
          const o=document.createElement('option');
          o.value=c.id; o.textContent=c.name+(c.company?(' · '+c.company):'');
          if(selectedId&&selectedId===c.id) o.selected=true;
          linkIdSel.appendChild(o);
        });
      }
    }

    function render(){
      const data=CRM.loadData();
      let rows=data.interactions.slice();
      const ft=filterType.value; const fl=filterLink.value;
      if(ft) rows=rows.filter(r=>r.type===ft);
      if(fl==='lead') rows=rows.filter(r=>r.leadId);
      if(fl==='contact') rows=rows.filter(r=>r.contactId);
      rows.sort((a,b)=>new Date(b.date)-new Date(a.date));
      list.innerHTML=rows.map(r=>{
        const tag=r.type||'note';
        const who=r.leadTitle||r.contactName||'';
        const linkTxt=r.leadId?'Lead':(r.contactId?'Contact':'');
        return '<div class="p-4 bg-white dark:bg-gray-800 rounded-xl border">' +
          '<div class="flex items-center justify-between"><div class="flex items-center gap-2">' +
          '<span class="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">'+CRM.esc(tag)+'</span>' +
          '<span class="text-xs text-gray-500">'+new Date(r.date).toLocaleString()+'</span>' +
          '</div><button data-edit="'+r.id+'" class="px-2 py-1 text-xs rounded border">Edit</button></div>' +
          '<div class="mt-1 text-sm">'+CRM.esc(r.summary||'')+'</div>' +
          (linkTxt?'<div class="mt-1 text-xs text-gray-500">'+linkTxt+': '+CRM.esc(who)+'</div>':'') +
          (r.nextActionDate?'<div class="mt-1 text-xs '+(CRM.isOverdue(r.nextActionDate)?'text-red-600':'')+'">Next: '+r.nextActionDate+'</div>':'') +
        '</div>';
      }).join('') || '<div class="p-6 bg-white dark:bg-gray-800 rounded-xl border text-center">No interactions yet.</div>';
    }

    addBtn.addEventListener('click', () => { editingId=null; modalTitle.textContent='New Interaction'; openModal(); });
    cancelBtn && cancelBtn.addEventListener('click', closeModal);
    linkKindSel.addEventListener('change', ()=>populateLinkOptions(''));
    filterType.addEventListener('change', render);
    filterLink.addEventListener('change', render);

    list.addEventListener('click', e=>{
      const btn=e.target.closest('button[data-edit]');
      if(!btn) return;
      const id=btn.getAttribute('data-edit');
      const data=CRM.loadData();
      const it=data.interactions.find(x=>x.id===id);
      if(!it) return;
      editingId=id;
      modalTitle.textContent='Edit Interaction';
      document.getElementById('iDate').value=toLocalDTValue(it.date);
      document.getElementById('iType').value=it.type||'note';
      const kind=it.leadId?'lead':(it.contactId?'contact':'');
      document.getElementById('iLinkKind').value=kind;
      populateLinkOptions(it.leadId||it.contactId||'');
      document.getElementById('iSummary').value=it.summary||'';
      document.getElementById('iNextDate').value=it.nextActionDate||'';
      openModal();
    });

    form.addEventListener('submit', e=>{
      e.preventDefault();
      const data=CRM.loadData();
      const kind=document.getElementById('iLinkKind').value;
      const selected=document.getElementById('iLinkId').value;
      let leadId='', contactId='', leadTitle='', contactName='';
      if(kind==='lead' && selected){
        leadId=selected; const lead=data.leads.find(l=>l.id===leadId); if(lead) leadTitle=lead.title||'Untitled';
      }else if(kind==='contact' && selected){
        contactId=selected; const c=data.contacts.find(x=>x.id===contactId); if(c) contactName=c.name;
      }
      const payload={
        date: document.getElementById('iDate').value || new Date().toISOString(),
        type: document.getElementById('iType').value,
        summary: document.getElementById('iSummary').value.trim(),
        nextActionDate: document.getElementById('iNextDate').value || '',
        leadId, contactId, leadTitle, contactName
      };
      if(editingId){
        const idx=data.interactions.findIndex(x=>x.id===editingId);
        if(idx>-1) data.interactions[idx]={...data.interactions[idx], ...payload};
      }else{
        data.interactions.push({id:CRM.uid(), ...payload});
      }
      if(payload.nextActionDate && leadId){
        const lead=data.leads.find(l=>l.id===leadId);
        if(lead) lead.nextActionDate=payload.nextActionDate;
      }
      CRM.saveData(data); closeModal(); render();
    });

    render();
  });
})();
