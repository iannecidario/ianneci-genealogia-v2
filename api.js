/** Client per le Cloudflare Pages Functions. Nessuna credenziale Airtable è presente nel browser. */
(function () {
    async function request(path) {
        const response = await fetch(path, { headers: { Accept: 'application/json' } });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Richiesta non riuscita (${response.status})`);
        return data;
    }

    window.IanneceAPI = {
        fetchFamilyMembers: () => request('/api/persone'),
        fetchPerson: (id) => request(`/api/persona?id=${encodeURIComponent(id)}`),
        fetchBranches: () => request('/api/rami')
    };

    const normalizeSearchText = (value = '') => String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('it')
        .replace(/\s+/g, ' ')
        .trim();
    const birthYear = person => {
        const year = Number(person.annoNascita);
        return Number.isFinite(year) && year > 0 ? year : Infinity;
    };
    const alphabeticalOrder = (a, b) => [a.nome, a.cognome].filter(Boolean).join(' ').localeCompare(
        [b.nome, b.cognome].filter(Boolean).join(' '),
        'it',
        { sensitivity: 'base' }
    ) || String(a.id).localeCompare(String(b.id));

    window.IannecePersonSearch = {
        normalize: normalizeSearchText,
        matches(person, query) {
            const terms = normalizeSearchText(query).split(' ').filter(Boolean);
            const searchableName = normalizeSearchText([person.nome, person.cognome].filter(Boolean).join(' '));
            return terms.every(term => searchableName.includes(term));
        },
        chronologicalOrder: (a, b) => birthYear(a) - birthYear(b) || alphabeticalOrder(a, b),
        filterAndSort(people, query) {
            return people.filter(person => this.matches(person, query)).sort(this.chronologicalOrder);
        }
    };
})();
