(function () {
    const content = document.getElementById('person-content');
    const title = document.getElementById('page-title');
    const id = new URLSearchParams(window.location.search).get('id');
    const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
    const display = (value) => value ? escapeHtml(value) : '—';
    const formatDate = (value) => value ? new Intl.DateTimeFormat('it-IT').format(new Date(`${value}T00:00:00`)) : '—';
    const relation = (person, label) => `<a href="scheda.html?id=${encodeURIComponent(person.id)}" class="p-4 flex items-center gap-3"><div class="w-10 h-10 rounded-full bg-[#d3daea] flex items-center justify-center"><span class="material-symbols-outlined text-[#4a5d4e]">person</span></div><div><p class="font-bold text-sm">${escapeHtml(person.nomeCompleto)}</p><p class="text-[10px] text-gray-500">${label}</p></div></a>`;

    function showError(message) {
        content.innerHTML = `<div class="p-4"><div class="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center"><span class="material-symbols-outlined text-[#8b5a2b] text-5xl">error</span><h2 class="text-xl font-bold my-3">Scheda non disponibile</h2><p class="text-sm text-gray-600">${escapeHtml(message)}</p></div></div>`;
    }
    if (!id) { showError('Identificativo della persona mancante.'); return; }

    window.IanneceAPI.fetchPerson(id).then(({ person }) => {
        title.textContent = person.nomeCompleto;
        const relations = [...(person.padre || []).map((p) => relation(p, 'Padre')), ...(person.madre || []).map((p) => relation(p, 'Madre'))];
        content.innerHTML = `<div class="p-4"><section class="bg-[#4a5d4e] rounded-3xl p-8 text-center text-white relative overflow-hidden"><div class="absolute top-4 left-1/2 -translate-x-1/2 bg-white/20 px-3 py-1 rounded-full text-[10px] backdrop-blur-sm">ID persona: ${display(person.idPersona)}</div><h2 class="text-3xl font-bold mt-4 mb-2">${escapeHtml(person.nomeCompleto)}</h2><p class="text-white/80 text-sm italic mb-8">${display([person.annoNascita, person.annoMorte].filter(Boolean).join(' – '))}</p><div class="w-48 h-48 mx-auto rounded-2xl border-4 border-white/30 bg-white/10 overflow-hidden flex items-center justify-center shadow-2xl">${person.foto ? `<img src="${escapeHtml(person.foto)}" class="w-full h-full object-cover" alt="Ritratto di ${escapeHtml(person.nomeCompleto)}">` : '<span class="material-symbols-outlined text-7xl text-white/70">person</span>'}</div></section></div><div class="px-4 mb-6"><section class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"><h3 class="text-xl font-bold mb-3">Notizie</h3><p class="text-gray-600 text-sm leading-relaxed whitespace-pre-line">${display(person.note)}</p></section></div><div class="px-4 mb-6"><section class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"><h3 class="text-xl font-bold mb-4">Dati personali</h3><dl class="space-y-4">${[['Data di nascita',formatDate(person.dataNascita)],['Luogo di nascita',display(person.luogoNascita)],['Abitazione',display(person.abitazione)],['Residenza',display(person.residenza)],['Data di morte',formatDate(person.dataMorte)],['Luogo di morte',display(person.luogoMorte)]].map(([key,value]) => `<div class="flex justify-between gap-4 border-b border-gray-50 pb-2"><dt class="text-xs text-gray-500 font-bold uppercase">${key}</dt><dd class="text-sm font-medium text-right">${value}</dd></div>`).join('')}</dl></section></div><div class="px-4 mb-8"><h3 class="text-xl font-bold mb-4">Legami familiari</h3><div class="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm divide-y divide-gray-50">${relations.length ? relations.join('') : '<p class="p-6 text-sm text-gray-600">Nessun legame disponibile.</p>'}</div></div>`;
    }).catch((error) => showError(error.message));
})();
