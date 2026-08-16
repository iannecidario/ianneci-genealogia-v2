(function () {
  const input = document.getElementById('home-search');
  const box = document.getElementById('home-results');
  let people = [];
  const esc = (value = '') => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const personName = person => [person.nome, person.cognome].filter(Boolean).join(' ') || 'Senza nome';
  const birthYear = person => Number.isFinite(Number(person.annoNascita)) && Number(person.annoNascita) > 0 ? Number(person.annoNascita) : Infinity;
  const searchOrder = (a, b) => (a.nome || '').localeCompare(b.nome || '', 'it', { sensitivity: 'base' }) || birthYear(a) - birthYear(b) || (a.cognome || '').localeCompare(b.cognome || '', 'it', { sensitivity: 'base' }) || a.id.localeCompare(b.id);

  function render() {
    const terms = input.value.trim().toLocaleLowerCase('it').split(/\s+/).filter(Boolean);
    if (!terms.length) { box.hidden = true; return; }
    const found = people.filter(person => terms.every(term => `${person.nome} ${person.cognome} ${person.nomeCompleto} ${person.annoNascita} ${person.annoMorte}`.toLocaleLowerCase('it').includes(term))).sort(searchOrder).slice(0, 8);
    box.innerHTML = found.length ? found.map(person => `<a href="scheda.html?id=${encodeURIComponent(person.id)}" class="block p-3 text-sm hover:bg-gray-50"><strong>${esc(personName(person))}</strong>${person.annoNascita ? `<span class="block text-xs text-gray-500">${esc(person.annoNascita)}</span>` : ''}${person.rami?.length ? `<span class="block text-[10px] text-[#8b5a2b]">${esc(person.rami.map(branch => branch.nome).join(', '))}</span>` : ''}</a>`).join('') : '<p class="p-3 text-sm text-gray-500">Nessun risultato.</p>';
    box.hidden = false;
  }

  input.addEventListener('input', render);
  window.IanneceAPI.fetchFamilyMembers().then(data => { people = data.records || []; input.disabled = false; }).catch(() => { input.placeholder = 'Ricerca temporaneamente non disponibile'; });
})();
