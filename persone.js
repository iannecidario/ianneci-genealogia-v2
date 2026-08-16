(function () {
  const list = document.getElementById('people-list');
  const status = document.getElementById('people-status');
  const search = document.getElementById('person-search');
  const filter = document.getElementById('branch-filter');
  const count = document.getElementById('people-count');
  let people = [];
  const esc = (value = '') => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const personName = person => [person.nome, person.cognome].filter(Boolean).join(' ') || 'Senza nome';
  const birthYear = person => Number.isFinite(Number(person.annoNascita)) && Number(person.annoNascita) > 0 ? Number(person.annoNascita) : Infinity;
  const searchOrder = (a, b) => (a.nome || '').localeCompare(b.nome || '', 'it', { sensitivity: 'base' }) || birthYear(a) - birthYear(b) || (a.cognome || '').localeCompare(b.cognome || '', 'it', { sensitivity: 'base' }) || a.id.localeCompare(b.id);

  function visible() {
    const terms = search.value.trim().toLocaleLowerCase('it').split(/\s+/).filter(Boolean);
    const branch = filter.value;
    const matches = people.filter(person => terms.every(term => `${person.nome} ${person.cognome} ${person.nomeCompleto} ${person.annoNascita} ${person.annoMorte}`.toLocaleLowerCase('it').includes(term)) && (!branch || person.ramoIds.includes(branch)));
    return terms.length ? matches.sort(searchOrder) : matches;
  }

  function render() {
    const items = visible();
    count.textContent = `${items.length} ${items.length === 1 ? 'testimonianza familiare' : 'testimonianze familiari'}`;
    if (!items.length) {
      list.innerHTML = '<div class="bg-white p-8 rounded-2xl border border-gray-100 text-center text-sm text-gray-600">Nessuna persona trovata.</div>';
      return;
    }
    const groups = new Map();
    for (const person of items) {
      const letter = personName(person).trim().charAt(0).toUpperCase() || '?';
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter).push(person);
    }
    list.innerHTML = [...groups].map(([letter, members]) => `<section><h3 class="text-sm font-bold text-gray-400 mb-3 px-2">${esc(letter)}</h3><div class="space-y-4">${members.map(person => `<a href="scheda.html?id=${encodeURIComponent(person.id)}" class="block bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"><div class="w-16 h-16 shrink-0 rounded-full bg-[#d3daea] overflow-hidden flex items-center justify-center">${person.foto ? `<img src="${esc(person.foto)}" class="w-full h-full object-cover" alt="">` : '<span class="material-symbols-outlined text-[#4a5d4e] text-3xl">person</span>'}</div><div class="min-w-0"><h4 class="font-bold text-lg truncate">${esc(personName(person))}</h4>${person.annoNascita ? `<p class="text-xs text-gray-500">${esc(person.annoNascita)}</p>` : ''}${person.rami?.length ? `<span class="text-[10px] font-bold text-[#8b5a2b] uppercase">${esc(person.rami.map(branch => branch.nome).join(', '))}</span>` : ''}</div></a>`).join('')}</div></section>`).join('');
  }

  search.addEventListener('input', render);
  filter.addEventListener('change', render);
  window.IanneceAPI.fetchFamilyMembers().then(data => {
    people = data.records || [];
    (data.branches || []).forEach(branch => filter.insertAdjacentHTML('beforeend', `<option value="${esc(branch.id)}">${esc(branch.nome)}</option>`));
    status.hidden = true; list.hidden = false; search.disabled = false; filter.disabled = false; render();
  }).catch(error => { status.innerHTML = `<span class="material-symbols-outlined text-[#8b5a2b] text-4xl">cloud_off</span><p class="mt-3 text-sm">${esc(error.message)}</p>`; });
})();
