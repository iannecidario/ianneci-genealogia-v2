const DEFAULT_BASE_ID = 'appg6dg7Eyzbu1H0T';
const PEOPLE_TABLE = 'tblMBCkm2GEzVnAkF';
const AIRTABLE_API = 'https://api.airtable.com/v0';

export function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': status === 200 ? 'public, max-age=60' : 'no-store',
            'x-content-type-options': 'nosniff'
        }
    });
}

export async function airtableRequest(env, path, params = new URLSearchParams()) {
    if (!env.AIRTABLE_TOKEN) throw new Error('Configurazione Airtable incompleta');
    const baseId = env.AIRTABLE_BASE_ID || DEFAULT_BASE_ID;
    const url = new URL(`${AIRTABLE_API}/${baseId}/${path}`);
    url.search = params.toString();
    const response = await fetch(url, { headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` } });
    if (!response.ok) {
        console.error('Airtable request failed', response.status);
        throw new Error('Impossibile leggere l’archivio genealogico');
    }
    return response.json();
}

export const peopleTable = PEOPLE_TABLE;

export function mapPerson(record) {
    const fields = record.fields || {};
    const firstPhoto = Array.isArray(fields.FOTO) ? fields.FOTO[0] : null;
    return {
        id: record.id,
        idPersona: fields['ID PERSONA'] || null,
        nomeCompleto: fields['NOME COMPLETO'] || [fields.NOME, fields.COGNOME].filter(Boolean).join(' ') || 'Senza nome',
        nome: fields.NOME || '',
        cognome: fields.COGNOME || '',
        dataNascita: fields['DATA DI NASCITA'] || '',
        annoNascita: fields['ANNO DI NASCITA'] || '',
        luogoNascita: fields['LUOGO DI NASCITA'] || '',
        abitazione: fields.ABITAZIONE || '',
        residenza: fields.RESIDENZA || '',
        dataMorte: fields['DATA DI MORTE'] || '',
        annoMorte: fields['ANNO DI MORTE'] || '',
        luogoMorte: fields['LUOGO DI MORTE'] || '',
        foto: firstPhoto?.thumbnails?.large?.url || firstPhoto?.url || '',
        note: fields.NOTE || '',
        padreIds: fields.PADRE || [],
        madreIds: fields.MADRE || []
    };
}

export function publicPerson(person) {
    const { padreIds, madreIds, ...safe } = person;
    return safe;
}
