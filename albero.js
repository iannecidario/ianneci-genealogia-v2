(function () {
  const stage = document.getElementById('tree-stage');
  const viewport = document.getElementById('tree-viewport');
  const centerLabel = document.getElementById('tree-center');
  let people = [], marriages = [], map = new Map();
  let centerId = '', rootId = '', aLevels = 1, dLevels = 1, zoom = 1;
  let panX = 0, panY = 0, dragging = false, startX = 0, startY = 0;

  const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]);
  const life = p => `${p.annoNascita || '…'}–${p.annoMorte || '…'}`;
  const applyTransform = () => { stage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`; };
  const node = p => `<div class="tree-node bg-[#f9f9ff] border border-gray-200 rounded-xl p-3 inline-flex items-center gap-2 text-left"><a href="scheda.html?id=${encodeURIComponent(p.id)}&from=albero" class="flex-1"><strong class="block text-sm">${esc(p.nomeCompleto)}</strong><span class="text-[10px] text-gray-500">${esc(life(p))}</span></a><button data-center="${esc(p.id)}" aria-label="Metti al centro ${esc(p.nomeCompleto)}" class="material-symbols-outlined text-[#4a5d4e]">my_location</button></div>`;

  function parents(ids, level, seen = new Set()) {
    if (level < 1) return '';
    const ps = ids.map(id => map.get(id)).filter(Boolean).filter(p => !seen.has(p.id));
    if (!ps.length) return '';
    ps.forEach(p => seen.add(p.id));
    const next = [...new Set(ps.flatMap(p => [...p.padreIds, ...p.madreIds]))];
    return `${parents(next, level - 1, seen)}<div class="text-[10px] uppercase tracking-widest text-gray-400 my-2">${level === aLevels ? 'Antenati' : 'Generazione'}</div><div class="flex justify-center gap-4 mb-4">${ps.map(node).join('')}</div><div class="text-gray-300">│</div>`;
  }

  function descendants(ids, level, seen = new Set()) {
    if (level < 1) return '';
    const ps = ids.map(id => map.get(id)).filter(Boolean).filter(p => !seen.has(p.id));
    if (!ps.length) return '';
    ps.forEach(p => seen.add(p.id));
    const next = [...new Set(ps.flatMap(p => p.figliIds))];
    return `<div class="text-gray-300">│</div><div class="text-[10px] uppercase tracking-widest text-gray-400 my-2">Figli</div><div class="flex justify-center gap-4 mb-4">${ps.map(node).join('')}</div>${descendants(next, level - 1, seen)}`;
  }

  function render() {
    const p = map.get(centerId);
    if (!p) return;
    centerLabel.innerHTML = `Persona al centro: <strong>${esc(p.nomeCompleto)}</strong>`;
    const ms = marriages.filter(m => [...m.maritoIds, ...m.moglieIds].includes(p.id));
    const spouseIds = [...new Set(ms.flatMap(m => [...m.maritoIds, ...m.moglieIds]).filter(id => id !== p.id))];
    const spouses = spouseIds.map(id => map.get(id)).filter(Boolean);
    const siblings = people.filter(x => x.id !== p.id && (x.padreIds.some(id => p.padreIds.includes(id)) || x.madreIds.some(id => p.madreIds.includes(id))));
    stage.innerHTML = `${parents([...p.padreIds, ...p.madreIds], aLevels)}${siblings.length ? `<div class="text-[10px] uppercase tracking-widest text-gray-400 my-2">Fratelli e sorelle</div><div class="flex justify-center gap-4 mb-4">${siblings.map(node).join('')}</div>` : ''}<div class="flex justify-center">${node(p)}</div>${spouses.length ? `<div class="text-[10px] uppercase tracking-widest text-gray-400 my-2">Coniugi e unioni</div><div class="flex justify-center gap-4 mb-2">${spouses.map(node).join('')}</div><div class="text-xs text-gray-500 mb-3">${ms.map(m => [m.anno || m.data, m.luogo].filter(Boolean).join(' · ')).filter(Boolean).map(esc).join(' | ')}</div>` : ''}${descendants(p.figliIds, dLevels)}`;
    applyTransform();
    stage.querySelectorAll('[data-center]').forEach(button => button.addEventListener('click', () => {
      centerId = button.dataset.center; panX = panY = 0;
      history.replaceState(null, '', `albero.html?id=${encodeURIComponent(centerId)}`);
      render();
    }));
  }

  document.getElementById('ancestors').addEventListener('click', event => { aLevels = aLevels % 3 + 1; event.currentTarget.textContent = `Antenati · ${aLevels}`; render(); });
  document.getElementById('descendants').addEventListener('click', event => { dLevels = dLevels % 3 + 1; event.currentTarget.textContent = `Discendenti · ${dLevels}`; render(); });
  document.getElementById('center-tree').addEventListener('click', () => { panX = panY = 0; applyTransform(); });
  document.getElementById('reset-tree').addEventListener('click', () => {
    centerId = rootId; aLevels = dLevels = 1; zoom = 1; panX = panY = 0;
    document.getElementById('ancestors').textContent = 'Antenati · 1';
    document.getElementById('descendants').textContent = 'Discendenti · 1';
    history.replaceState(null, '', 'albero.html'); render();
  });
  document.getElementById('zoom-in').addEventListener('click', () => { zoom = Math.min(1.5, zoom + .1); applyTransform(); });
  document.getElementById('zoom-out').addEventListener('click', () => { zoom = Math.max(.6, zoom - .1); applyTransform(); });

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
    people = data.records || []; marriages = data.marriages || []; map = new Map(people.map(p => [p.id, p]));
    rootId = people.find(p => p.nomeCompleto.includes('STIPITE DEI RAMI MODERNI'))?.id || people.find(p => !p.padreIds.length && !p.madreIds.length)?.id || people[0]?.id;
    const requested = new URLSearchParams(location.search).get('id');
    centerId = map.has(requested) ? requested : rootId; render();
  }).catch(error => { stage.innerHTML = `<p class="text-sm text-gray-600">${esc(error.message)}</p>`; });
})();
