(function () {
  const stage = document.getElementById('tree-stage');
  const viewport = document.getElementById('tree-viewport');
  const centerLabel = document.getElementById('tree-center');
  let people = [], marriages = [], map = new Map();
  let centerId = '', rootId = '', aLevels = 1, dLevels = 1, zoom = 1;
  let panX = 0, panY = 0, dragging = false, startX = 0, startY = 0;

  const esc = (value = '') => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const personName = person => [person.nome, person.cognome].filter(Boolean).join(' ') || 'Senza nome';
  const normalized = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('it');
  const isMarame = person => (person.rami || []).some(branch => normalized(branch.nome) === 'marame');
  const applyTransform = () => { stage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`; };

  function node(person, central = false) {
    const background = isMarame(person) ? 'bg-[#e7f0e8]' : 'bg-[#f9f9ff]';
    const border = central ? 'border-2 border-[#4a5d4e]' : 'border border-gray-200';
    const years = `${person.annoNascita || 'Anno non disponibile'}${person.annoMorte ? `–${person.annoMorte}` : ''}`;
    return `<div class="tree-node ${background} ${border} rounded-lg px-2.5 py-2 inline-flex items-center gap-1.5 text-left min-w-[8.5rem] max-w-[12rem]" style="min-width:136px" data-person-id="${esc(person.id)}"${central ? ' data-central-node' : ''}><button type="button" data-center="${esc(person.id)}" class="flex-1 min-w-0 text-left" aria-label="Centra l’albero su ${esc(personName(person))}"><strong class="block text-sm leading-tight truncate">${esc(personName(person))}</strong><span class="block text-[11px] leading-tight text-gray-500 mt-0.5">${esc(years)}</span></button><a href="scheda.html?id=${encodeURIComponent(person.id)}&from=albero" aria-label="Apri la scheda di ${esc(personName(person))}" class="material-symbols-outlined text-[#4a5d4e] text-xl p-0.5">person</a></div>`;
  }

  function parents(ids, level, seen = new Set()) {
    if (level < 1) return '';
    const relatives = ids.map(id => map.get(id)).filter(Boolean).filter(person => !seen.has(person.id));
    if (!relatives.length) return '';
    relatives.forEach(person => seen.add(person.id));
    const next = [...new Set(relatives.flatMap(person => [...person.padreIds, ...person.madreIds]))];
    return `${parents(next, level - 1, seen)}<div class="text-[10px] uppercase tracking-widest text-gray-400 my-2">${level === aLevels ? 'Genitori' : 'Antenati'}</div><div class="flex justify-center gap-4 mb-2">${relatives.map(person => node(person)).join('')}</div><div class="w-px h-5 bg-gray-300 mx-auto"></div>`;
  }

  function laterDescendants(ids, level, seen = new Set()) {
    if (level < 1) return '';
    const relatives = ids.map(id => map.get(id)).filter(Boolean).filter(person => !seen.has(person.id));
    if (!relatives.length) return '';
    relatives.forEach(person => seen.add(person.id));
    const next = [...new Set(relatives.flatMap(person => person.figliIds))];
    return `<div class="w-px h-5 bg-gray-300 mx-auto"></div><div class="text-[10px] uppercase tracking-widest text-gray-400 my-2">Generazione successiva</div><div class="flex justify-center gap-4 mb-2">${relatives.map(person => node(person)).join('')}</div>${laterDescendants(next, level - 1, seen)}`;
  }

  function unionData(person) {
    const personMarriages = marriages.filter(marriage => [...marriage.maritoIds, ...marriage.moglieIds].includes(person.id));
    return personMarriages.map(marriage => {
      const spouseIds = [...marriage.maritoIds, ...marriage.moglieIds].filter(id => id !== person.id);
      const spouses = spouseIds.map(id => map.get(id)).filter(Boolean);
      const children = person.figliIds.map(id => map.get(id)).filter(Boolean).filter(child => spouseIds.some(spouseId => child.padreIds.includes(spouseId) || child.madreIds.includes(spouseId)));
      return { marriage, spouses, children };
    });
  }

  function childGroups(person, unions) {
    const assigned = new Set(unions.flatMap(union => union.children.map(child => child.id)));
    const groups = unions.filter(union => union.children.length).map(union => ({
      label: union.spouses.length ? `Figli con ${union.spouses.map(personName).join(', ')}` : 'Figli',
      children: union.children
    }));
    const unassigned = person.figliIds.map(id => map.get(id)).filter(Boolean).filter(child => !assigned.has(child.id));
    if (unassigned.length) groups.push({ label: 'Figli', children: unassigned });
    if (!groups.length) return '';
    return `<div class="w-px h-5 bg-gray-300 mx-auto"></div><div class="flex justify-center gap-6 items-start">${groups.map(group => `<section class="relative"><div class="text-[10px] uppercase tracking-widest text-gray-400 mb-2">${esc(group.label)}</div><div class="border-t border-gray-300 pt-3 flex justify-center gap-4">${group.children.map(child => node(child)).join('')}</div></section>`).join('')}</div>`;
  }

  function centerView() {
    stage.style.transition = 'none';
    stage.style.transform = 'none';
    stage.getBoundingClientRect();
    requestAnimationFrame(() => {
      const central = stage.querySelector('[data-central-node]');
      if (!central) return;
      const viewportRect = viewport.getBoundingClientRect();
      const nodeRect = central.getBoundingClientRect();
      panX = viewportRect.left + viewportRect.width / 2 - (nodeRect.left + nodeRect.width / 2);
      panY = viewportRect.top + Math.min(180, viewportRect.height / 3) - (nodeRect.top + nodeRect.height / 2);
      stage.style.transition = '';
      requestAnimationFrame(applyTransform);
    });
  }

  function selectPerson(id) {
    if (!map.has(id)) return;
    centerId = id;
    zoom = 1;
    history.replaceState(null, '', `albero.html?id=${encodeURIComponent(centerId)}`);
    render(true);
  }

  function render(autoCenter = false) {
    const person = map.get(centerId);
    if (!person) return;
    centerLabel.innerHTML = `Persona al centro: <strong>${esc(personName(person))}</strong>`;
    const unions = unionData(person);
    const spouses = [...new Map(unions.flatMap(union => union.spouses).map(spouse => [spouse.id, spouse])).values()];
    const siblings = people.filter(relative => relative.id !== person.id && (relative.padreIds.some(id => person.padreIds.includes(id)) || relative.madreIds.some(id => person.madreIds.includes(id))));
    const marriageRows = unions.map(union => [union.marriage.data || union.marriage.anno, union.marriage.luogo].filter(Boolean).join(' · ')).filter(Boolean);
    const spousesLeft = spouses.filter((_, index) => index % 2 === 1).reverse();
    const spousesRight = spouses.filter((_, index) => index % 2 === 0);
    const couple = `<div class="grid grid-cols-[1fr_auto_1fr] items-center"><div class="flex items-center justify-end gap-2">${spousesLeft.map(spouse => `${node(spouse)}<span class="block w-6 h-px bg-[#4a5d4e]" aria-hidden="true"></span>`).join('')}</div>${node(person, true)}<div class="flex items-center justify-start gap-2">${spousesRight.map(spouse => `<span class="block w-6 h-px bg-[#4a5d4e]" aria-hidden="true"></span>${node(spouse)}`).join('')}</div></div>${marriageRows.length ? `<div class="text-[10px] text-gray-500 mt-2">${marriageRows.map(esc).join(' | ')}</div>` : ''}`;
    const groups = childGroups(person, unions);
    const immediateChildren = person.figliIds.map(id => map.get(id)).filter(Boolean);
    const nextGeneration = [...new Set(immediateChildren.flatMap(child => child.figliIds))];
    stage.innerHTML = `${parents([...person.padreIds, ...person.madreIds], aLevels)}${siblings.length ? `<div class="text-[10px] uppercase tracking-widest text-gray-400 my-2">Fratelli e sorelle</div><div class="flex justify-center gap-4 mb-3">${siblings.map(sibling => node(sibling)).join('')}</div><div class="w-px h-4 bg-gray-300 mx-auto"></div>` : ''}${couple}${groups}${dLevels > 1 ? laterDescendants(nextGeneration, dLevels - 1) : ''}`;
    stage.querySelectorAll('[data-center]').forEach(button => button.addEventListener('click', () => selectPerson(button.dataset.center)));
    if (autoCenter) centerView(); else applyTransform();
  }

  document.getElementById('ancestors').addEventListener('click', event => { aLevels = aLevels % 3 + 1; event.currentTarget.textContent = `Antenati · ${aLevels}`; render(true); });
  document.getElementById('descendants').addEventListener('click', event => { dLevels = dLevels % 3 + 1; event.currentTarget.textContent = `Discendenti · ${dLevels}`; render(true); });
  document.getElementById('center-tree').addEventListener('click', centerView);
  document.getElementById('reset-tree').addEventListener('click', () => {
    centerId = rootId; aLevels = dLevels = 1; zoom = 1; panX = panY = 0;
    document.getElementById('ancestors').textContent = 'Antenati · 1';
    document.getElementById('descendants').textContent = 'Discendenti · 1';
    history.replaceState(null, '', 'albero.html'); render(true);
  });
  document.getElementById('zoom-in').addEventListener('click', () => { zoom = Math.min(1.5, zoom + .1); centerView(); });
  document.getElementById('zoom-out').addEventListener('click', () => { zoom = Math.max(.6, zoom - .1); centerView(); });

  viewport.addEventListener('pointerdown', event => {
    if (event.target.closest('a,button')) return;
    dragging = true; startX = event.clientX - panX; startY = event.clientY - panY;
    viewport.setPointerCapture(event.pointerId); viewport.classList.add('dragging');
  });
  viewport.addEventListener('pointermove', event => { if (dragging) { panX = event.clientX - startX; panY = event.clientY - startY; applyTransform(); } });
  const stopDrag = event => {
    if (!dragging) return;
    dragging = false; viewport.classList.remove('dragging');
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
  };
  viewport.addEventListener('pointerup', stopDrag);
  viewport.addEventListener('pointercancel', stopDrag);

  window.IanneceAPI.fetchFamilyMembers().then(data => {
    people = data.records || [];
    marriages = data.marriages || [];
    map = new Map(people.map(person => [person.id, person]));
    rootId = people.find(person => person.nomeCompleto.includes('STIPITE DEI RAMI MODERNI'))?.id || people.find(person => !person.padreIds.length && !person.madreIds.length)?.id || people[0]?.id;
    const requested = new URLSearchParams(location.search).get('id');
    centerId = map.has(requested) ? requested : rootId;
    render(true);
  }).catch(error => { stage.innerHTML = `<p class="text-sm text-gray-600">${esc(error.message)}</p>`; });
})();
