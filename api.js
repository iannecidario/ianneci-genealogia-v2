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
        fetchPerson: (id) => request(`/api/persona?id=${encodeURIComponent(id)}`)
    };
})();
