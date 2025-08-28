(async function(){
  function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  async function getBrand(){
    try{const r=await fetch('assets/data/branding.json'); if(!r.ok) throw new Error('fetch'); return await r.json();}catch(e){return {};}
  }
  function merge(a,b){
    if(Array.isArray(a) && Array.isArray(b)) return b.length?b:a;
    if(a && typeof a==='object' && b && typeof b==='object'){
      const out={...a};
      for(const k of Object.keys(b)){
        out[k]=k in a ? merge(a[k], b[k]) : b[k];
      }
      return out;
    }
    return b===undefined ? a : b;
  }
  const DEFAULT_HELP = {
    pageTitle: 'Help & Documentation',
    gettingStarted: {
      title:'Getting Started',
      intro:'Mini CRM is a simple, local-first CRM to track leads, contacts, and interactions.',
      bullets:[
        'Open Preferences to toggle dark mode and manage backups.',
        'Use Contacts to add people/companies.',
        'Use Leads to track opportunities and set a Next Action Date.',
        'Use Timeline to log calls, emails, meetings, and notes.',
        'Dashboard shows Due Today, Overdue, Quick Stats, and Recent Interactions.'
      ],
      notes:['All data is stored locally in your browser (LocalStorage). Export regularly.']
    },
    leads:{
      title:'Leads',
      intro:'Leads represent opportunities (project, deal, engagement).',
      bullets:[
        'Click Add Lead; fill title, company, optional contact, stage, value, and Next Action Date.',
        'Stages: New, Contacted, Qualified, Won, Lost.',
        'Overdue items highlight in red on lists and dashboard.',
        'Edit any lead via the Edit button on the card.'
      ]
    },
    contacts:{
      title:'Contacts',
      intro:'Contacts are the people you talk to; you can link one primary contact to a lead.',
      bullets:[
        'Add name, email, phone, company, and position.',
        'Use tags (e.g., vip, repeat) to group.',
        'Edits propagate where the contact is shown.'
      ]
    },
    interactions:{
      title:'Interactions & Timeline',
      intro:'Log calls, emails, meetings, and notes. Optionally link to a lead or contact.',
      bullets:[
        'Set Type and Date/Time; link to Lead/Contact for context.',
        'Setting Next Action Date updates the linked lead’s follow-up.',
        'Filter by type or link to focus.'
      ],
      notes:['Newest interactions appear first.']
    },
    dashboard:{
      title:'Dashboard',
      intro:'Your daily command center.',
      bullets:[
        'Due Today: leads with Next Action Date equal to today.',
        'Overdue: leads with a past Next Action Date.',
        'Quick Stats: lead counts by stage.',
        'Recent Interactions: latest activity across the system.'
      ]
    },
    preferences:{
      title:'Preferences',
      intro:'Appearance and backup settings.',
      bullets:[
        'Toggle dark mode.',
        'Export JSON for a complete backup.',
        'Import JSON to restore.',
        'Testing Utilities: seed demo data, add due/overdue leads.'
      ]
    },
    importExport:{
      title:'Import & Export',
      intro:'Your data stays local; back it up when needed.',
      bullets:[
        'Export JSON bundles leads, contacts, and interactions.',
        'Import JSON replaces current data with the file you choose.',
        'Clear Data resets the app locally.'
      ],
      notes:['Downloads work even without special APIs—standard save dialog is used.']
    },
    faq:[
      {q:'Why does Dashboard say “Nothing due today”?', a:'No lead has a Next Action Date equal to today. Set a date on a lead or use Preferences → Testing Utilities to add one due today.'},
      {q:'Where is my data stored?', a:'In your browser’s LocalStorage. Export regularly.'},
      {q:'Can I link multiple contacts to a lead?', a:'This mini app uses a single primary contact per lead to keep it simple.'},
      {q:'How do I mark a deal as won or lost?', a:'Edit the lead and change its Stage to Won or Lost.'},
      {q:'What happens when I set Next Action Date on an interaction?', a:'If linked to a lead, the lead’s Next Action Date is updated.'}
    ],
    privacy:{
      title:'Your Data & Privacy',
      intro:'No server; 100% local-first.',
      bullets:['Data is stored locally in your browser.','You control backups via Export/Import JSON.']
    },
    support:{
      title:'Contact & Support',
      intro:'Having trouble? Reach out with the details below.'
    }
  };

  const brand = await getBrand();
  const appNameText = brand.appName || 'Mini CRM';
  const helpMerged = merge(DEFAULT_HELP, brand.help || {});
  const titleEl = document.getElementById('helpPageTitle');
  const appNameEl = document.getElementById('helpAppName');
  const taglineEl = document.getElementById('helpTagline');
  const toc = document.getElementById('helpTOC');
  const content = document.getElementById('helpContent');

  if (titleEl) titleEl.textContent = helpMerged.pageTitle || 'Help & Documentation';
  if (appNameEl) appNameEl.textContent = appNameText;
  if (taglineEl) taglineEl.textContent = brand.tagline || 'Track leads, contacts, and interactions';

  const sections = [
    { id:'getting-started', data:helpMerged.gettingStarted, toc:'Getting Started' },
    { id:'leads', data:helpMerged.leads, toc:'Leads' },
    { id:'contacts', data:helpMerged.contacts, toc:'Contacts' },
    { id:'interactions', data:helpMerged.interactions, toc:'Interactions & Timeline' },
    { id:'dashboard', data:helpMerged.dashboard, toc:'Dashboard' },
    { id:'preferences', data:helpMerged.preferences, toc:'Preferences' },
    { id:'import-export', data:helpMerged.importExport, toc:'Import & Export' },
    { id:'faq', data:helpMerged.faq, toc:'FAQs' },
    { id:'privacy', data:helpMerged.privacy, toc:'Privacy' },
    { id:'support', data:helpMerged.support, toc:'Support' }
  ];

  function tocItem(href,label){
    const a=document.createElement('a');
    a.href=href; a.textContent=label;
    a.className='block hover:underline';
    return a;
  }
  function ul(items){return '<ul>'+items.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul>';}

  function sectionList(id,obj){
    const wrap=document.createElement('article'); wrap.id=id;
    wrap.innerHTML =
      '<h2>'+esc(obj.title||'')+'</h2>'+
      (obj.intro?('<p>'+esc(obj.intro)+'</p>'):'')+
      (obj.bullets && obj.bullets.length ? ul(obj.bullets) : '')+
      (obj.notes && obj.notes.length ? ('<div>'+obj.notes.map(n=>'<p>'+esc(n)+'</p>').join('')+'</div>') : '');
    return wrap;
  }
  function sectionFAQ(id,items){
    const wrap=document.createElement('article'); wrap.id=id;
    wrap.innerHTML='<h2>FAQs</h2>' + items.map(x=>
      '<details class="border rounded-lg p-3 bg-white dark:bg-gray-800">'+
      '<summary class="font-medium">'+esc(x.q)+'</summary>'+
      '<div class="mt-2 text-sm">'+esc(x.a)+'</div></details>').join('');
    return wrap;
  }
  function sectionSupport(id,obj){
    const phone = brand.phone ? '<p><strong>Phone:</strong> '+esc(brand.phone)+'</p>' : '';
    const email = brand.supportEmail ? '<p><strong>Email:</strong> '+esc(brand.supportEmail)+'</p>' : '';
    const addr = brand.address ? '<p><strong>Address:</strong> '+esc(brand.address)+'</p>' : '';
    const wrap=document.createElement('article'); wrap.id=id;
    wrap.innerHTML =
      '<h2>'+esc(obj.title||'Support')+'</h2>'+
      (obj.intro?('<p>'+esc(obj.intro)+'</p>'):'')+
      phone+email+addr;
    return wrap;
  }

  if (toc) {
    sections.forEach(s=>{
      if(!s.data || (Array.isArray(s.data) && !s.data.length)) return;
      toc.appendChild(tocItem('#'+s.id, s.toc));
    });
  }

  if (content) {
    sections.forEach(s=>{
      if(!s.data || (Array.isArray(s.data) && !s.data.length)) return;
      if (Array.isArray(s.data)) content.appendChild(sectionFAQ(s.id, s.data));
      else if (s.id==='support') content.appendChild(sectionSupport(s.id, s.data));
      else content.appendChild(sectionList(s.id, s.data));
    });
  }
})();
