(function () {
  const stage = document.getElementById('tree-stage');
  const viewport = document.getElementById('tree-viewport');
  const centerLabel = document.getElementById('tree-center');
  const panel = document.getElementById('person-panel');
  const panelFrame = document.getElementById('person-panel-frame');
  const desktop = window.matchMedia('(min-width: 1024px)');
  let people = [], marriages = [], map = new Map();
  let centerId = '', rootId = '', aLevels = 1, dLevels = 1, zoom = 1;
  let panX = 0, panY = 0, dragging = false, startX = 0, startY = 0, pointerX = 0, pointerY = 0;
  let transformFrame = 0, dragged = false, suppressClick = false;
  stage.style.position = 'relative';

  const esc = (value = '') => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const personName = person => [person.nome, person.cognome].filter(Boolean).join(' ') || 'Senza nome';
  const normalized = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('it');
  const isMarame = person => (person.rami || []).some(branch => normalized(branch.nome) === 'marame');
  const numericYear = value => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : Infinity;
  const applyTransform = () => {
    transformFrame = 0;
    stage.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`;
  };
  const scheduleTransform = () => { if (!transformFrame) transformFrame = requestAnimationFrame(applyTransform); };

  function node(person, central = false) {
    const background = isMarame(person) ? 'bg-[#e7f0e8]' : 'bg-[#f9f9ff]';
    const border = central ? 'border-2 border-[#4a5d4e]' : 'border border-gray-200';
    const years = person.annoNascita ? `${person.annoNascita}${person.annoMorte ? `–${person.annoMorte}` : ''}` : '';
    return `<div class="tree-node ${background} ${border} rounded-lg px-2.5 py-2 inline-flex text-left min-w-[8.5rem] max-w-[12rem]" style="min-width:136px" data-person-id="${esc(person.id)}"${central ? ' data-central-node' : ''}><button type="button" data-center="${esc(person.id)}" class="w-full min-w-0 text-left" aria-label="Centra l’albero su ${esc(personName(person))}"><strong class="block text-sm leading-tight whitespace-normal [overflow-wrap:anywhere]">${esc(personName(person))}</strong>${years ? `<span class="block text-[11px] leading-tight text-gray-500 mt-0.5">${esc(years)}</span>` : ''}</button></div>`;
  }

  function parents(ids, level, seen = new Set(), connectToGeneration = true) {
    if (level < 1) return '';
    const relatives = ids.map(id => map.get(id)).filter(Boolean).filter(person => !seen.has(person.id));
    if (!relatives.length) return '';
    relatives.forEach(person => seen.add(person.id));
    const next = [...new Set(relatives.flatMap(person => [...person.padreIds, ...person.madreIds]))];
    return `${parents(next, level - 1, seen)}<div class="text-[10px] uppercase tracking-widest text-gray-400 my-2">${level === aLevels ? 'Genitori' : 'Antenati'}</div><div class="flex justify-center gap-4 mb-2">${relatives.map(person => node(person)).join('')}</div>${connectToGeneration ? '<div class="w-px h-5 bg-gray-300 mx-auto"></div>' : ''}`;
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
    return personMarriages.map((marriage, stableIndex) => {
      const spouseIds = [...marriage.maritoIds, ...marriage.moglieIds].filter(id => id !== person.id);
      const spouses = spouseIds.map(id => map.get(id)).filter(Boolean);
      const children = person.figliIds.map(id => map.get(id)).filter(Boolean).filter(child => spouseIds.some(spouseId => child.padreIds.includes(spouseId) || child.madreIds.includes(spouseId)));
      const marriageYear = numericYear(marriage.anno || String(marriage.data || '').match(/\d{4}/)?.[0]);
      const spouseYear = Math.min(...spouses.map(spouse => numericYear(spouse.annoNascita)));
      const firstChildYear = Math.min(...children.map(child => numericYear(child.annoNascita)));
      const order = Number.isFinite(marriageYear) ? marriageYear : Number.isFinite(spouseYear) ? spouseYear : firstChildYear;
      return { marriage, spouses, children, stableIndex, order };
    }).sort((a, b) => a.order - b.order || a.stableIndex - b.stableIndex);
  }

  function unassignedChildren(person, unions) {
    const assigned = new Set(unions.flatMap(union => union.children.map(child => child.id)));
    const unassigned = person.figliIds.map(id => map.get(id)).filter(Boolean).filter(child => !assigned.has(child.id)).sort((a, b) => numericYear(a.annoNascita) - numericYear(b.annoNascita) || personName(a).localeCompare(personName(b), 'it', { sensitivity: 'base' }) || a.id.localeCompare(b.id));
    if (!unassigned.length) return '';
    return `<section data-unassigned-children class="w-max mx-auto mt-3 flex flex-col items-center"><span class="block h-4" aria-hidden="true"></span><div data-children-label class="text-[10px] uppercase tracking-widest text-gray-400 my-1">Figli</div><span class="block h-4" aria-hidden="true"></span><div data-children-row class="pt-3 flex justify-center gap-4">${unassigned.map(child => `<div class="relative flex flex-col items-center">${node(child)}</div>`).join('')}</div></section>`;
  }

  function unionStack(person, unions) {
    if (!unions.length) return node(person, true);
    const unionRows = unions.map((union, index) => {
      const marriageData = union.marriage.data || union.marriage.anno || '';
      const spouseNodes = union.spouses.length ? union.spouses.map(spouse => node(spouse)).join('') : '<span class="text-xs text-gray-400">Unione</span>';
      const orderedChildren = [...union.children].sort((a, b) => numericYear(a.annoNascita) - numericYear(b.annoNascita) || personName(a).localeCompare(personName(b), 'it', { sensitivity: 'base' }) || a.id.localeCompare(b.id));
      const children = orderedChildren.length ? `<div data-children-group class="mt-2 w-max flex flex-col items-center"><span class="block h-4" aria-hidden="true"></span><div data-children-label class="text-[10px] uppercase tracking-widest text-gray-400 my-1">Figli con ${esc(union.spouses.map(personName).join(', '))}</div><span class="block h-4" aria-hidden="true"></span><div data-children-row class="pt-3 flex flex-nowrap justify-center gap-4">${orderedChildren.map(child => `<div class="relative flex flex-col items-center">${node(child)}</div>`).join('')}</div></div>` : '';
      return `<section data-union-index="${index}" class="relative"><div data-spouse-row class="flex items-center"><span class="block w-6" aria-hidden="true"></span><div data-spouse-group class="flex flex-col gap-2">${spouseNodes}</div></div>${marriageData ? `<div data-marriage-label class="ml-6 text-[10px] text-gray-500 mt-1">${esc(marriageData)}</div>` : ''}${children}</section>`;
    }).join('');
    return `<div data-union-layout class="flex items-start"><div class="shrink-0">${node(person, true)}</div><span class="block w-6" aria-hidden="true"></span><div data-union-rail class="flex flex-col gap-5">${unionRows}</div></div>`;
  }

  function alignUnionChildren() {
    const central = stage.querySelector('[data-central-node]');
    if (!central) return;
    const centralRect = central.getBoundingClientRect();
    stage.querySelectorAll('[data-union-index]').forEach(union => {
      const spouseGroup = union.querySelector('[data-spouse-group]');
      const childrenGroup = union.querySelector('[data-children-group]');
      if (!spouseGroup || !childrenGroup) return;
      childrenGroup.style.transform = 'none';
      const spouseRect = spouseGroup.getBoundingClientRect();
      const childrenRect = childrenGroup.getBoundingClientRect();
      const coupleCenter = ((centralRect.left + centralRect.right) / 2 + (spouseRect.left + spouseRect.right) / 2) / 2;
      const childrenCenter = (childrenRect.left + childrenRect.right) / 2;
      childrenGroup.style.transform = `translateX(${(coupleCenter - childrenCenter) / zoom}px)`;
    });
    drawTreeConnectors();
  }

  function drawTreeConnectors() {
    stage.querySelector('[data-tree-connectors]')?.remove();
    const central = stage.querySelector('[data-central-node]');
    if (!central) return;
    const stageRect = stage.getBoundingClientRect();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.dataset.treeConnectors = '';
    svg.setAttribute('width', stage.scrollWidth);
    svg.setAttribute('height', stage.scrollHeight);
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('absolute', 'inset-0', 'overflow-visible', 'pointer-events-none');
    const x = value => (value - stageRect.left) / zoom;
    const y = value => (value - stageRect.top) / zoom;
    const line = (x1, y1, x2, y2, marriage = false) => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      element.setAttribute('x1', x1); element.setAttribute('y1', y1);
      element.setAttribute('x2', x2); element.setAttribute('y2', y2);
      element.setAttribute('stroke', marriage ? '#4a5d4e' : '#d1d5db');
      element.setAttribute('stroke-width', '1');
      element.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(element);
    };
    const verticalAvoiding = (screenX, screenStart, screenEnd, labels, marriage = false) => {
      const gap = 4;
      let cursor = screenStart;
      const obstacles = labels.map(label => label.getBoundingClientRect()).filter(rect => screenX >= rect.left - gap && screenX <= rect.right + gap && rect.bottom >= screenStart && rect.top <= screenEnd).sort((a, b) => a.top - b.top);
      obstacles.forEach(rect => {
        if (rect.top - gap > cursor) line(x(screenX), y(cursor), x(screenX), y(rect.top - gap), marriage);
        cursor = Math.max(cursor, rect.bottom + gap);
      });
      if (cursor < screenEnd) line(x(screenX), y(cursor), x(screenX), y(screenEnd), marriage);
    };
    const centralRect = central.getBoundingClientRect();
    const rail = stage.querySelector('[data-union-rail]');
    const unions = [...stage.querySelectorAll('[data-union-index]')];
    if (rail && unions.length) {
      const railX = rail.getBoundingClientRect().left;
      const centralY = (centralRect.top + centralRect.bottom) / 2;
      const spouseCenters = unions.map(union => {
        const rect = union.querySelector('[data-spouse-group]').getBoundingClientRect();
        return { union, rect, centerY: (rect.top + rect.bottom) / 2 };
      });
      line(x(centralRect.right), y(centralY), x(railX), y(centralY), true);
      verticalAvoiding(railX, Math.min(centralY, ...spouseCenters.map(item => item.centerY)), Math.max(centralY, ...spouseCenters.map(item => item.centerY)), [...stage.querySelectorAll('[data-marriage-label], [data-children-label]')], true);
      spouseCenters.forEach(({ union, rect, centerY }) => {
        line(x(railX), y(centerY), x(rect.left), y(centerY), true);
        const group = union.querySelector('[data-children-group]');
        const row = union.querySelector('[data-children-row]');
        if (!group || !row) return;
        const groupRect = group.getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();
        const coupleX = (centralRect.left + centralRect.right + rect.left + rect.right) / 4;
        verticalAvoiding(coupleX, centerY, rowRect.top, [...union.querySelectorAll('[data-marriage-label], [data-children-label]')]);
        const children = [...row.querySelectorAll(':scope > div > .tree-node')].map(child => child.getBoundingClientRect());
        if (!children.length) return;
        const centers = children.map(child => (child.left + child.right) / 2);
        line(x(Math.min(...centers)), y(rowRect.top), x(Math.max(...centers)), y(rowRect.top));
        children.forEach((child, index) => line(x(centers[index]), y(rowRect.top), x(centers[index]), y(child.top)));
      });
    }
    const unassigned = stage.querySelector('[data-unassigned-children]');
    if (unassigned) {
      const row = unassigned.querySelector('[data-children-row]');
      const rowRect = row.getBoundingClientRect();
      const centerX = (centralRect.left + centralRect.right) / 2;
      verticalAvoiding(centerX, centralRect.bottom, rowRect.top, [...unassigned.querySelectorAll('[data-children-label]')]);
      const children = [...row.querySelectorAll(':scope > div > .tree-node')].map(child => child.getBoundingClientRect());
      const centers = children.map(child => (child.left + child.right) / 2);
      if (centers.length) line(x(Math.min(...centers)), y(rowRect.top), x(Math.max(...centers)), y(rowRect.top));
      children.forEach((child, index) => line(x(centers[index]), y(rowRect.top), x(centers[index]), y(child.top)));
    }
    stage.prepend(svg);
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
    if (desktop.matches) openPanel(id);
    render(true);
  }

  function openPanel(id) {
    if (!desktop.matches) return;
    panel.hidden = false;
    if (panelFrame.dataset.personId !== id) {
      panelFrame.dataset.personId = id;
      panelFrame.src = `scheda.html?id=${encodeURIComponent(id)}&panel=1`;
    }
  }

  function closePanel(recenter = true) {
    panel.hidden = true;
    panelFrame.removeAttribute('src');
    delete panelFrame.dataset.personId;
    if (recenter) requestAnimationFrame(centerView);
  }

  function render(autoCenter = false) {
    const person = map.get(centerId);
    if (!person) return;
    centerLabel.innerHTML = `Persona al centro: <strong>${esc(personName(person))}</strong>`;
    const unions = unionData(person);
    const siblings = people.filter(relative => relative.id !== person.id && (relative.padreIds.some(id => person.padreIds.includes(id)) || relative.madreIds.some(id => person.madreIds.includes(id))));
    const birthOrder = relative => Number.isFinite(Number(relative.annoNascita)) && Number(relative.annoNascita) > 0 ? Number(relative.annoNascita) : Infinity;
    const generation = [person, ...siblings].sort((a, b) => birthOrder(a) - birthOrder(b) || personName(a).localeCompare(personName(b), 'it', { sensitivity: 'base' }) || a.id.localeCompare(b.id));
    const parentSignature = relative => [...new Set([...relative.padreIds, ...relative.madreIds])].sort().join('|');
    const allShareTheSameParents = siblings.length > 0 && siblings.every(sibling => parentSignature(sibling) === parentSignature(person));
    const couple = unionStack(person, unions);
    const otherChildren = unassignedChildren(person, unions);
    const immediateChildren = person.figliIds.map(id => map.get(id)).filter(Boolean);
    const nextGeneration = [...new Set(immediateChildren.flatMap(child => child.figliIds))];
    const selectedBranch = `${couple}${otherChildren}${dLevels > 1 ? laterDescendants(nextGeneration, dLevels - 1) : ''}`;
    const generationRow = `<div data-generation-row class="flex justify-center items-start gap-4${allShareTheSameParents ? ' border-t border-gray-300 pt-3' : ''}">${generation.map(relative => `<div data-generation-member="${esc(relative.id)}" class="flex flex-col items-center">${allShareTheSameParents ? '<span class="w-px h-3 bg-gray-300 -mt-3 mb-0" aria-hidden="true"></span>' : ''}${relative.id === person.id ? selectedBranch : node(relative)}</div>`).join('')}</div>`;
    stage.innerHTML = `${parents([...person.padreIds, ...person.madreIds], aLevels, new Set(), !siblings.length || allShareTheSameParents)}${generationRow}`;
    alignUnionChildren();
    requestAnimationFrame(() => requestAnimationFrame(alignUnionChildren));
    document.fonts?.ready.then(alignUnionChildren);
    stage.querySelectorAll('[data-center]').forEach(button => button.addEventListener('click', () => {
      if (suppressClick) return;
      selectPerson(button.dataset.center);
    }));
    if (autoCenter) centerView(); else applyTransform();
  }

  document.getElementById('ancestors').addEventListener('click', event => { aLevels = aLevels % 3 + 1; event.currentTarget.textContent = `Antenati · ${aLevels}`; render(true); });
  document.getElementById('descendants').addEventListener('click', event => { dLevels = dLevels % 3 + 1; event.currentTarget.textContent = `Discendenti · ${dLevels}`; render(true); });
  document.getElementById('center-tree').addEventListener('click', centerView);
  document.getElementById('close-person-panel').addEventListener('click', () => closePanel());
  document.getElementById('reset-tree').addEventListener('click', () => {
    centerId = rootId; aLevels = dLevels = 1; zoom = 1; panX = panY = 0;
    document.getElementById('ancestors').textContent = 'Antenati · 1';
    document.getElementById('descendants').textContent = 'Discendenti · 1';
    history.replaceState(null, '', 'albero.html'); render(true);
  });
  document.getElementById('zoom-in').addEventListener('click', () => { zoom = Math.min(1.5, zoom + .1); centerView(); });
  document.getElementById('zoom-out').addEventListener('click', () => { zoom = Math.max(.6, zoom - .1); centerView(); });

  viewport.addEventListener('pointerdown', event => {
    if (event.target.closest('a')) return;
    dragging = true; dragged = false; pointerX = event.clientX; pointerY = event.clientY;
    startX = event.clientX - panX; startY = event.clientY - panY;
    stage.style.transition = 'none';
    viewport.setPointerCapture(event.pointerId); viewport.classList.add('dragging');
  });
  viewport.addEventListener('pointermove', event => {
    if (!dragging) return;
    if (Math.hypot(event.clientX - pointerX, event.clientY - pointerY) > 4) dragged = true;
    panX = event.clientX - startX; panY = event.clientY - startY;
    scheduleTransform();
  });
  const stopDrag = event => {
    if (!dragging) return;
    dragging = false; viewport.classList.remove('dragging');
    if (transformFrame) {
      cancelAnimationFrame(transformFrame);
      applyTransform();
    }
    stage.style.transition = '';
    if (dragged) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
    }
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
  };
  viewport.addEventListener('pointerup', stopDrag);
  viewport.addEventListener('pointercancel', stopDrag);
  desktop.addEventListener('change', event => {
    if (!event.matches && !panel.hidden) closePanel(false);
    requestAnimationFrame(centerView);
  });
  window.addEventListener('resize', alignUnionChildren);

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
