import { airtableRequest, json, mapPerson, peopleTable, publicPerson } from './_airtable.js';

const recordIdPattern = /^rec[a-zA-Z0-9]{14}$/;

async function loadRelation(env, id) {
    const record = await airtableRequest(env, `${peopleTable}/${id}`);
    const person = mapPerson(record);
    return { id: person.id, nomeCompleto: person.nomeCompleto };
}

export async function onRequestGet({ request, env }) {
    const id = new URL(request.url).searchParams.get('id') || '';
    if (!recordIdPattern.test(id)) return json({ error: 'Identificativo persona non valido' }, 400);
    try {
        const record = await airtableRequest(env, `${peopleTable}/${id}`);
        const mapped = mapPerson(record);
        const [padre, madre] = await Promise.all([
            Promise.all(mapped.padreIds.map((relationId) => loadRelation(env, relationId))),
            Promise.all(mapped.madreIds.map((relationId) => loadRelation(env, relationId)))
        ]);
        return json({ person: { ...publicPerson(mapped), padre, madre } });
    } catch (error) {
        return json({ error: error.message }, 503);
    }
}
