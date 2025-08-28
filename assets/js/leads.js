(function(){
  function ready(fn){ if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true}); else fn(); }
  ready(function(){
    const modal=document.getElementById('leadModal');
    const modalTitle=document.getElementById('leadModalTitle');
    const openBtn=document.getElementById('addLead');
    const cancelBtn=document.getElementById('cancelLeadBtn');
    const form=document.getElementById('leadForm');
    const list=document.getElementById('leadList');
    const contactSelect=document.getElementById('leadContactId');
    const saveBtn=document.getElementById('saveLeadBtn');
    if(!openBtn||!modal||!form||!list||!modalTitle||!saveBtn) return;

    let editingId=null;

    function openModal(){
      populateContactOptions('');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
    function closeModal(){
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      form.reset();
      editingId=null;
      modalTitle.textContent='New Lead';
      saveBtn.textContent='Save';
    }
    function populateContactOptions(selectedId){
      const data=CRM.loadData();
      contactSelect.innerHTML='';
      const none=document.createElement('option');
      none.value=''; none.textContent='No contact';
      contactSelect.appendChild(none);
      data.contacts.forEach(c=>{
        const o=document.createElement('option');
        o.value=c.id; o.textContent=c.name+(c.company?(' · '+c.company):'');
        if(selectedId&&selectedId===c.id) o.selected=true;
        contactSelect.appendChild(o);
      });
    }
    function stageClass(s){ if(s==='Won')return'bg-emerald-100 text-emerald-700'; if(s==='Lost')return'bg-red-100 text-red-700'; if(s==='Qualified')return'bg-indigo-100 text-indigo-700'; if(s==='Contacted')return'bg-amber-100 text-amber-700'; return'bg-gray-100 text-gray-700'; }
    function escapeHTML(str){return String(str).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
    function render(){
      const data=CRM.loadData();
      const contacts=data.contacts;
      const leads=data.leads.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
      list.innerHTML='';
      if(!leads.length){
        const empty=document.createElement('div');
        empty.className='p-6 bg-white dark:bg-gray-800 rounded-xl border text-center';
        empty.textContent='No leads yet. Click Add Lead to create one.';
        list.appendChild(empty); return;
      }
      leads.forEach(ld=>{
        const overdue=ld.nextActionDate && new Date(ld.nextActionDate) < new Date(new Date().toDateString());
        const card=document.createElement('div');
        card.className='p-4 bg-white dark:bg-gray-800 rounded-xl border';
        card.innerHTML=
          '<div class="flex justify-between items-start"><div>' +
          '<div class="font-semibold">'+(ld.title||'Untitled Lead')+'</div>' +
          '<div class="text-sm text-gray-500 dark:text-gray-400">'+(ld.company||'')+'</div>' +
          '<div class="text-sm mt-1">'+(CRM.findContactName(contacts, ld.contactId)||'')+'</div>' +
          '</div><div class="flex items-center gap-2">' +
          '<span class="px-2 py-1 text-xs rounded '+stageClass(ld.stage)+'">'+(ld.stage||'New')+'</span>' +
          '<button data-edit="'+ld.id+'" class="px-2 py-1 text-xs rounded border">Edit</button>' +
          '</div></div>' +
          '<div class="mt-2 text-sm">Value: '+(Number(ld.value)||0)+'</div>' +
          '<div class="mt-1 text-sm '+(overdue?'text-red-600':'')+'">Next: '+(ld.nextActionDate||'—')+'</div>' +
          (ld.notes?('<div class="mt-2 text-sm">'+escapeHTML(ld.notes)+'</div>'):'');
        list.appendChild(card);
      });
    }

    openBtn.addEventListener('click', openModal);
    cancelBtn && cancelBtn.addEventListener('click', closeModal);

    list.addEventListener('click', e=>{
      const btn=e.target.closest('button[data-edit]');
      if(!btn) return;
      const id=btn.getAttribute('data-edit');
      const data=CRM.loadData();
      const ld=data.leads.find(x=>x.id===id);
      if(!ld) return;
      editingId=id;
      modalTitle.textContent='Edit Lead';
      saveBtn.textContent='Update';
      document.getElementById('leadTitle').value=ld.title||'';
      document.getElementById('leadCompany').value=ld.company||'';
      populateContactOptions(ld.contactId||'');
      document.getElementById('leadStage').value=ld.stage||'New';
      document.getElementById('leadValue').value=Number(ld.value||0);
      document.getElementById('leadNext').value=ld.nextActionDate||'';
      document.getElementById('leadNotes').value=ld.notes||'';
      openModal();
    });

    form.addEventListener('submit', e=>{
      e.preventDefault();
      const data=CRM.loadData();
      const payload={
        title:document.getElementById('leadTitle').value.trim(),
        company:document.getElementById('leadCompany').value.trim(),
        contactId:contactSelect.value||'',
        stage:document.getElementById('leadStage').value,
        value:Number(document.getElementById('leadValue').value||0),
        nextActionDate:document.getElementById('leadNext').value||'',
        notes:document.getElementById('leadNotes').value.trim()
      };
      if(editingId){
        const idx=data.leads.findIndex(x=>x.id===editingId);
        if(idx>-1) data.leads[idx]={...data.leads[idx],...payload};
      }else{
        data.leads.push({id:CRM.uid(),createdAt:new Date().toISOString(),...payload});
      }
      CRM.saveData(data); closeModal(); render();
    });

    render();
  });
})();
