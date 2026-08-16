(function () {
  const content = document.getElementById('person-content');
  const title = document.getElementById('page-title');
  const id = new URLSearchParams(location.search).get('id');
  const esc = (value = '') => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const available = value => value !== null && value !== undefined && !/^(?:\s*|0|—|n\/?d|non disponibile|null|undefined)$/i.test(String(value));
  const show = value => available(value) ? esc(value) : '—';
  const formatDate = value => available(value) ? new Intl.DateTimeFormat('it-IT').format(new Date(`${value}T00:00:00`)) : '';
  const personName = person => [person.nome, person.cognome].filter(available).join(' ') || 'Senza nome';
  const portrait = person => person.foto
    ? `<div class="w-10 h-10 shrink-0 rounded-full bg-[#d3daea] overflow-hidden flex items-center justify-center"><img src="${esc(person.foto)}" class="w-full h-full object-cover" alt="Ritratto di ${esc(personName(person))}" data-family-photo><span class="material-symbols-outlined text-[#4a5d4e] hidden" data-photo-fallback>person</span></div>`
    : '<div class="w-10 h-10 shrink-0 rounded-full bg-[#d3daea] flex items-center justify-center"><span class="material-symbols-outlined text-[#4a5d4e]">person</span></div>';
  const relation = (person, label) => `<a href="scheda.html?id=${encodeURIComponent(person.id)}" class="p-4 flex items-center gap-3">${portrait(person)}<div class="min-w-0"><p class="font-bold text-sm truncate">${esc(personName(person))}</p><p class="text-[10px] text-gray-500">${esc(label)}${available(person.annoNascita) ? ` · ${esc(person.annoNascita)}` : ''}</p></div></a>`;
  const detail = (label, value) => `<div class="flex justify-between gap-4 border-b border-gray-50 pb-2"><dt class="text-xs text-gray-500 font-bold uppercase">${esc(label)}</dt><dd class="text-sm text-right">${value}</dd></div>`;

  function error(message) {
    content.innerHTML = `<div class="p-4"><div class="bg-white rounded-2xl p-8 text-center"><h2 class="text-xl font-bold">Scheda non disponibile</h2><p class="text-sm text-gray-600 mt-2">${esc(message)}</p></div></div>`;
  }

  if (!id) {
    error('Identificativo mancante.');
    return;
  }

  window.IanneceAPI.fetchPerson(id).then(({ person }) => {
    const name = personName(person);
    const validBranches = (person.rami || []).filter(branch => branch && available(branch.id));
    title.textContent = name;
    const parents = [
      ...(person.padre || []).map(parent => relation(parent, 'Padre')),
      ...(person.madre || []).map(parent => relation(parent, 'Madre'))
    ];
    const children = (person.figli || []).map(child => relation(child, 'Figlio/a'));
    const deathDetails = available(person.annoMorte) ? [
      detail('Anno di morte', esc(person.annoMorte)),
      available(person.dataMorte) ? detail('Data di morte', formatDate(person.dataMorte)) : '',
      available(person.luogoMorte) ? detail('Luogo di morte', esc(person.luogoMorte)) : ''
    ].join('') : '';
    const personalDetails = [
      detail('Data di nascita', formatDate(person.dataNascita) || '—'),
      detail('Luogo di nascita', show(person.luogoNascita)),
      detail('Abitazione', show(person.abitazione)),
      detail('Residenza', show(person.residenza)),
      deathDetails
    ].join('');
    const marriageCards = (person.matrimoni || []).flatMap(marriage => (marriage.coniugi || []).map(spouse => {
      const marriageData = [formatDate(marriage.data) || marriage.anno, marriage.luogo].filter(available).join(' · ');
      return `<a href="scheda.html?id=${encodeURIComponent(spouse.id)}" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">${portrait(spouse)}<div class="min-w-0"><p class="font-bold text-sm truncate">${esc(personName(spouse))}</p>${available(spouse.annoNascita) ? `<p class="text-[10px] text-gray-500">${esc(spouse.annoNascita)}</p>` : ''}${marriageData ? `<p class="text-xs text-gray-500 mt-1">${esc(marriageData)}</p>` : ''}${marriage.note ? `<p class="text-xs text-gray-500 mt-1">${esc(marriage.note)}</p>` : ''}</div></a>`;
    }));
    const familySections = [
      parents.length ? `<section><h4 class="px-1 mb-2 text-sm font-bold text-[#4a5d4e]">Genitori</h4><div class="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm divide-y divide-gray-50">${parents.join('')}</div></section>` : '',
      marriageCards.length ? `<section><h4 class="px-1 mb-2 text-sm font-bold text-[#4a5d4e]">Matrimoni</h4><div class="space-y-3">${marriageCards.join('')}</div></section>` : '',
      children.length ? `<section><h4 class="px-1 mb-2 text-sm font-bold text-[#4a5d4e]">Figli</h4><div class="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm divide-y divide-gray-50">${children.join('')}</div></section>` : ''
    ].filter(Boolean).join('');
    const branchAction = validBranches.length === 1
      ? `<div class="px-4 mb-6"><a href="rami.html?id=${encodeURIComponent(validBranches[0].id)}" target="_top" class="w-full bg-[#f0f3ff] text-[#4a5d4e] py-4 rounded-2xl font-bold flex justify-center gap-2"><span class="material-symbols-outlined">family_history</span>Vedi ramo familiare</a></div>`
      : validBranches.length > 1
        ? `<div class="px-4 mb-6"><details class="bg-[#f0f3ff] rounded-2xl"><summary class="cursor-pointer list-none text-[#4a5d4e] py-4 font-bold flex justify-center gap-2"><span class="material-symbols-outlined">family_history</span>Vedi rami familiari</summary><div class="px-4 pb-4 space-y-2">${validBranches.map(branch => `<a href="rami.html?id=${encodeURIComponent(branch.id)}" target="_top" class="block bg-white rounded-xl p-3 text-sm font-bold text-[#4a5d4e]">${esc(branch.nome || 'Ramo familiare')}</a>`).join('')}</div></details></div>`
        : '';

    content.innerHTML = `<div class="p-4"><section class="bg-[#4a5d4e] rounded-3xl p-8 text-center text-white relative overflow-hidden${person.foto ? '' : ' min-h-[21.75rem]'}"><h2 class="text-3xl font-bold mb-1">${esc(name)}</h2>${available(person.annoNascita) ? `<p class="text-white/80 text-sm mb-2">${esc(person.annoNascita)}</p>` : ''}${validBranches.length ? `<p class="text-[#e7e0cf] text-xs font-bold uppercase mb-8">${esc(validBranches.map(branch => branch.nome).join(', '))}</p>` : '<div class="mb-8"></div>'}${person.foto ? `<button id="photo-button" class="w-48 h-48 mx-auto rounded-2xl border-4 border-white/30 bg-white/10 overflow-hidden flex items-center justify-center shadow-2xl"><img src="${esc(person.foto)}" class="w-full h-full object-cover" alt="Ritratto di ${esc(name)}"></button>` : ''}</section></div><div class="px-4 mb-6"><section class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"><h3 class="text-xl font-bold mb-3">Notizie</h3><p class="text-gray-600 text-sm whitespace-pre-line">${show(person.note)}</p></section></div><div class="px-4 mb-6"><section class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"><h3 class="text-xl font-bold mb-4">Dati personali</h3><dl class="space-y-4">${personalDetails}</dl></section></div>${familySections ? `<div class="px-4 mb-6"><h3 class="text-xl font-bold mb-4">Legami familiari</h3><div class="space-y-5">${familySections}</div></div>` : ''}${branchAction}<div class="px-4 mb-8"><a href="albero.html?id=${encodeURIComponent(person.id)}" class="w-full bg-[#f0f3ff] text-[#4a5d4e] py-4 rounded-2xl font-bold flex justify-center gap-2"><span class="material-symbols-outlined">account_tree</span>Vedi nell’albero</a></div>`;

    content.querySelectorAll('[data-family-photo]').forEach(image => {
      const useFallback = () => {
        image.hidden = true;
        image.nextElementSibling?.classList.remove('hidden');
      };
      image.addEventListener('error', useFallback, { once: true });
      if (image.complete && image.naturalWidth === 0) useFallback();
    });
    if (person.foto) document.getElementById('photo-button').addEventListener('click', () => {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 z-[100] bg-black/90 p-4 flex items-center justify-center';
      overlay.innerHTML = `<button aria-label="Chiudi fotografia" class="absolute top-5 right-5 text-white text-4xl">×</button><img src="${esc(person.foto)}" class="max-w-full max-h-full object-contain" alt="Ritratto di ${esc(name)}">`;
      overlay.addEventListener('click', () => overlay.remove());
      document.body.appendChild(overlay);
    });
  }).catch(requestError => error(requestError.message));
})();
