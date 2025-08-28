(function(){
  function ready(fn){ if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true}); else fn(); }
  ready(function(){
    const modal=document.getElementById('contactModal');
    const modalTitle=document.getElementById('contactModalTitle');
    const openBtn=document.getElementById('addContact');
    const cancelBtn=document.getElementById('cancelContactBtn');
    const form=document.getElementById('contactForm');
    const list=document.getElementById('contactList');
    const saveBtn=document.getElementById('saveContactBtn');
    if(!openBtn||!modal||!form||!list||!modalTitle||!saveBtn) return;

    let editingId=null;

    function openModal(){ modal.classList.remove('hidden'); modal.classList.add('flex'); }
    function closeModal(){ modal.classList.add('hidden'); modal.classList.remove('flex'); form.reset(); editingId=null; modalTitle.textContent='New Contact'; saveBtn.textContent='Save'; }
    function escapeHTML(str){return String(str).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
    function render(){
      const data=CRM.loadData();
      const contacts=data.contacts.slice().sort((a,b)=>a.name.localeCompare(b.name));
      list.innerHTML='';
      if(!contacts.length){
        const empty=document.createElement('div');
        empty.className='p-6 bg-white dark:bg-gray-800 rounded-xl border text-center';
        empty.textContent='No contacts yet. Click Add Contact to create one.';
        list.appendChild(empty); return;
      }
      contacts.forEach(c=>{
        const card=document.createElement('div');
        card.className='p-4 bg-white dark:bg-gray-800 rounded-xl border';
        card.innerHTML=
          '<div class="flex justify-between items-start"><div>' +
          '<div class="font-semibold">'+(c.name||'Unnamed')+'</div>' +
          '<div class="text-sm text-gray-500 dark:text-gray-400">'+(c.company||'')+(c.position?(' · '+c.position):'')+'</div>' +
          '</div><button data-edit="'+c.id+'" class="px-2 py-1 text-xs rounded border">Edit</button></div>' +
          '<div class="mt-2 text-sm">'+(c.email||'')+'</div>' +
          '<div class="text-sm">'+(c.phone||'')+'</div>' +
          (c.address?('<div class="text-sm mt-1">'+escapeHTML(c.address)+'</div>'):'') +
          (c.tags&&c.tags.length?('<div class="mt-2 text-xs">'+c.tags.map(t=>'<span class="mr-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">'+escapeHTML(t)+'</span>').join('')+'</div>'):'');
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
      const c=data.contacts.find(x=>x.id===id);
      if(!c) return;
      editingId=id;
      modalTitle.textContent='Edit Contact';
      saveBtn.textContent='Update';
      document.getElementById('cName').value=c.name||'';
      document.getElementById('cEmail').value=c.email||'';
      document.getElementById('cPhone').value=c.phone||'';
      document.getElementById('cCompany').value=c.company||'';
      document.getElementById('cPosition').value=c.position||'';
      document.getElementById('cAddress').value=c.address||'';
      document.getElementById('cTags').value=(c.tags||[]).join(', ');
      document.getElementById('cNotes').value=c.notes||'';
      openModal();
    });

    form.addEventListener('submit', e=>{
      e.preventDefault();
      const data=CRM.loadData();
      const payload={
        name:document.getElementById('cName').value.trim(),
        email:document.getElementById('cEmail').value.trim(),
        phone:document.getElementById('cPhone').value.trim(),
        company:document.getElementById('cCompany').value.trim(),
        position:document.getElementById('cPosition').value.trim(),
        address:document.getElementById('cAddress').value.trim(),
        tags:document.getElementById('cTags').value.split(',').map(s=>s.trim()).filter(Boolean),
        notes:document.getElementById('cNotes').value.trim()
      };
      if(editingId){
        const idx=data.contacts.findIndex(x=>x.id===editingId);
        if(idx>-1) data.contacts[idx]={...data.contacts[idx],...payload};
      }else{
        data.contacts.push({id:CRM.uid(),createdAt:new Date().toISOString(),...payload});
      }
      CRM.saveData(data); closeModal(); render();
    });

    render();
  });
})();
