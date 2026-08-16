(function () {
    const list = document.getElementById('people-list');
    const status = document.getElementById('people-status');
    const search = document.getElementById('person-search');
    let people = [];

    const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
    const years = (person) => [person.annoNascita, person.annoMorte].filter(Boolean).join(' – ') || 'Date non disponibili';

    function render(items) {
        if (!items.length) {
            list.innerHTML = '<div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center"><p class="text-sm text-gray-600">Nessuna persona trovata.</p></div>';
            return;
        }
        const groups = new Map();
        for (const person of items) {
            const letter = (person.nomeCompleto || '?').trim().charAt(0).toUpperCase();
            if (!groups.has(letter)) groups.set(letter, []);
            groups.get(letter).push(person);
        }
        list.innerHTML = [...groups.entries()].map(([letter, members]) => `<section><h3 class="text-sm font-bold text-gray-400 mb-3 px-2">${escapeHtml(letter)}</h3><div class="space-y-4">${members.map((person) => `<a href="scheda.html?id=${encodeURIComponent(person.id)}" class="block bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"><div class="w-16 h-16 shrink-0 rounded-full bg-[#d3daea] overflow-hidden flex items-center justify-center">${person.foto ? `<img src="${escapeHtml(person.foto)}" class="w-full h-full object-cover" alt="">` : '<span class="material-symbols-outlined text-[#4a5d4e] text-3xl">person</span>'}</div><div class="min-w-0"><h4 class="font-bold text-[#1a1c1e] text-lg truncate">${escapeHtml(person.nomeCompleto)}</h4><span class="text-xs text-gray-500">${escapeHtml(years(person))}</span></div></a>`).join('')}</div></section>`).join('');
    }

    search.addEventListener('input', () => {
        const query = search.value.trim().toLocaleLowerCase('it');
        render(people.filter((person) => person.nomeCompleto.toLocaleLowerCase('it').includes(query)));
    });

    window.IanneceAPI.fetchFamilyMembers().then((data) => {
        people = data.records || [];
        status.hidden = true;
        list.hidden = false;
        search.disabled = false;
        render(people);
    }).catch((error) => {
        status.innerHTML = `<div class="w-16 h-16 rounded-full bg-[#e7e0cf] flex items-center justify-center mx-auto mb-4"><span class="material-symbols-outlined text-[#8b5a2b] text-3xl">cloud_off</span></div><h2 class="text-xl font-bold mb-2">Archivio non disponibile</h2><p class="text-sm text-gray-600">${escapeHtml(error.message)}</p>`;
    });
})();
