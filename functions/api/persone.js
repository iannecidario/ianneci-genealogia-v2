import { airtableRequest, json, mapPerson, peopleTable, publicPerson } from './_airtable.js';

const fields = ['NOME COMPLETO', 'ID PERSONA', 'NOME', 'COGNOME', 'ANNO DI NASCITA', 'ANNO DI MORTE', 'FOTO'];

export async function onRequestGet({ env }) {
    try {
        const records = [];
        let offset = '';
        do {
            const params = new URLSearchParams({ pageSize: '100' });
            fields.forEach((field) => params.append('fields[]', field));
            params.append('sort[0][field]', 'NOME COMPLETO');
            params.append('sort[0][direction]', 'asc');
            if (offset) params.set('offset', offset);
            const page = await airtableRequest(env, peopleTable, params);
            records.push(...page.records.map((record) => publicPerson(mapPerson(record))));
            offset = page.offset || '';
        } while (offset);
        return json({ records, count: records.length });
    } catch (error) {
        return json({ error: error.message }, 503);
    }
}
