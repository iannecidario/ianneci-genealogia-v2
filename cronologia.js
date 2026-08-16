(function () {
  const box = document.getElementById('timeline');
  const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]);
  window.IanneceAPI.fetchFamilyMembers().then(data => {
    const people = (data.records || []).filter(person => person.annoNascita && /iannec[ei]/i.test(person.nomeCompleto)).sort((a, b) => a.annoNascita - b.annoNascita || a.nomeCompleto.localeCompare(b.nomeCompleto, 'it'));
    box.innerHTML = people.map(person => `<a href="scheda.html?id=${encodeURIComponent(person.id)}" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"><time class="text-lg font-bold text-[#8b5a2b] w-14">${esc(person.annoNascita)}</time><div><strong class="text-sm">${esc(person.nomeCompleto)}</strong>${person.annoMorte ? `<span class="block text-xs text-gray-500">† ${esc(person.annoMorte)}</span>` : ''}</div></a>`).join('') || '<p class="text-center text-gray-500">Nessuna data disponibile.</p>';
  }).catch(error => { box.innerHTML = `<div class="bg-white p-8 rounded-2xl text-center text-sm text-gray-600">${esc(error.message)}</div>`; });
})();
