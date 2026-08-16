(function () {
  const input = document.getElementById('home-search');
  const box = document.getElementById('home-results');
  let people = [];
  const esc = (value = '') => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const personName = person => [person.nome, person.cognome].filter(Boolean).join(' ') || 'Senza nome';

  function render() {
    const query = input.value.trim();
    if (!query) { box.hidden = true; return; }
    const found = window.IannecePersonSearch.filterAndSort(people, query);
    box.innerHTML = found.length ? found.map(person => `<a href="scheda.html?id=${encodeURIComponent(person.id)}" class="block p-3 text-sm hover:bg-gray-50"><strong>${esc(personName(person))}</strong>${person.annoNascita ? `<span class="block text-xs text-gray-500">${esc(person.annoNascita)}</span>` : ''}${person.rami?.length ? `<span class="block text-[10px] text-[#8b5a2b]">${esc(person.rami.map(branch => branch.nome).join(', '))}</span>` : ''}</a>`).join('') : '<p class="p-3 text-sm text-gray-500">Nessun risultato.</p>';
    box.hidden = false;
  }

  input.addEventListener('input', render);
  window.IanneceAPI.fetchFamilyMembers().then(data => { people = data.records || []; input.disabled = false; }).catch(() => { input.placeholder = 'Ricerca temporaneamente non disponibile'; });
})();
