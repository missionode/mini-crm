function todayISO(){
  if (window.CRM && CRM.todayISO) return CRM.todayISO();
  const d=new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`;
}
function offsetISO(days){
  const d=new Date(); d.setDate(d.getDate()+days);
  const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`;
}
function loadData(){
  if (window.CRM && CRM.loadData) return CRM.loadData();
  try{const raw=localStorage.getItem('crmData'); return raw?JSON.parse(raw):{leads:[],contacts:[],interactions:[]}}catch(e){return{leads:[],contacts:[],interactions:[]}}
}
function saveData(data){
  if (window.CRM && CRM.saveData) return CRM.saveData(data);
  localStorage.setItem('crmData', JSON.stringify(data));
}
function uid(){
  if (window.CRM && CRM.uid) return CRM.uid();
  return 'id_' + Math.random().toString(36).slice(2,10) + Date.now().toString(36);
}

document.addEventListener('DOMContentLoaded', () => {
  const toggleDark = document.getElementById('toggleDark');
  const exportBtn = document.getElementById('exportData');
  const importInp = document.getElementById('importData');
  const clearBtn = document.getElementById('clearData');
  const seedBtn = document.getElementById('seedDemo');
  const addDueBtn = document.getElementById('addDueLead');
  const addOverdueBtn = document.getElementById('addOverdueLead');

  if (toggleDark) toggleDark.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
  });

  if (exportBtn) exportBtn.addEventListener('click', () => {
    const data = localStorage.getItem('crmData') || "{}";
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "backup.json"; a.click();
  });

  if (importInp) importInp.addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { localStorage.setItem("crmData", ev.target.result); alert("Data imported! Open Dashboard to view."); };
    reader.readAsText(file);
  });

  if (clearBtn) clearBtn.addEventListener('click', () => {
    localStorage.removeItem('crmData'); alert('Data cleared.');
  });

  function seedDemo() {
    const data = loadData();

    const c1 = { id: uid(), name: "Priya Menon", email: "priya@example.com", phone: "+91 90000 11111", company: "Acme Co", position: "Manager", address: "Kochi", tags: ["vip"], notes: "", createdAt: new Date().toISOString() };
    const c2 = { id: uid(), name: "Ravi Kumar", email: "ravi@example.com", phone: "+91 90000 22222", company: "Globex", position: "CTO", address: "Bengaluru", tags: ["repeat"], notes: "", createdAt: new Date().toISOString() };

    const l1 = { id: uid(), title: "Website Redesign", company: "Acme Co", contactId: c1.id, stage: "Qualified", value: 75000, nextActionDate: todayISO(), notes: "Finalize scope", createdAt: new Date().toISOString() };
    const l2 = { id: uid(), title: "Annual Support", company: "Globex", contactId: c2.id, stage: "Contacted", value: 25000, nextActionDate: offsetISO(-1), notes: "Send proposal", createdAt: new Date().toISOString() };
    const l3 = { id: uid(), title: "New CRM Setup", company: "StartUpX", contactId: "", stage: "New", value: 0, nextActionDate: "", notes: "", createdAt: new Date().toISOString() };

    const i1 = { id: uid(), date: new Date().toISOString(), type: "call", summary: "Intro call with Priya", nextActionDate: todayISO(), leadId: l1.id, contactId: "", leadTitle: l1.title, contactName: "" };
    const i2 = { id: uid(), date: new Date().toISOString(), type: "email", summary: "Follow-up email to Ravi", nextActionDate: offsetISO(-1), leadId: l2.id, contactId: "", leadTitle: l2.title, contactName: "" };

    data.contacts.push(c1, c2);
    data.leads.push(l1, l2, l3);
    data.interactions.push(i1, i2);

    saveData(data);
    alert("Seeded demo data. Open Dashboard to see Due Today and Overdue.");
  }

  function addDueLead() {
    const data = loadData();
    const lead = { id: uid(), title: "Test Lead Due Today", company: "DemoCo", contactId: "", stage: "New", value: 0, nextActionDate: todayISO(), notes: "", createdAt: new Date().toISOString() };
    data.leads.push(lead);
    saveData(data);
    alert("Added lead due today. Open Dashboard.");
  }

  function addOverdueLead() {
    const data = loadData();
    const lead = { id: uid(), title: "Test Lead Overdue", company: "DemoCo", contactId: "", stage: "Contacted", value: 0, nextActionDate: offsetISO(-2), notes: "", createdAt: new Date().toISOString() };
    data.leads.push(lead);
    saveData(data);
    alert("Added overdue lead. Open Dashboard.");
  }

  if (seedBtn) seedBtn.addEventListener('click', seedDemo);
  if (addDueBtn) addDueBtn.addEventListener('click', addDueLead);
  if (addOverdueBtn) addOverdueBtn.addEventListener('click', addOverdueLead);
});
