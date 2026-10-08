/* Aplicación principal: Proyecto -> pestañas por nivel -> Memoria de cálculo */
(function () {
  const { esc, uid, fmt, pct, opt, toast, dialog, confirmDlg, download, readFile, toCsv } = UI;
  const S = { catalog: null, project: null, tab: 'proyecto', memLevel: 'all', saveTimer: null };
  const LAST = 'tc.lastProject.v1';
  const view = document.getElementById('view');
  const tabsEl = document.getElementById('tabs');
  const saveState = document.getElementById('saveState');

  const DEFAULT_CABLES = { utp: 'U/UTP Cat 6a', fo_in: '12 hilos', fo_inout: '12 hilos', coax: 'RG-6', multipar: '25 pares', innerduct: '' };
  const ROWS_PER_SECTION = 5;
  const SINERGIA_FILL = 0.3; // criterio Sinergia de prellenado

  // ============ Modelo ============
  const emptyPathway = () => ({ id: uid(), section: '', typeId: '', qty: {}, sel: 'auto', length: '', notes: '' });
  const emptyConduit = () => ({ id: uid(), use: '', typeId: '', qty: {}, bends: '', length: '' });
  const emptyManager = (typeId = '') => ({ id: uid(), label: '', typeId, qty: {}, notes: '' });
  const times = (n, f) => Array.from({ length: n }, () => f());

  function newLevel(code, name) {
    return {
      id: uid(), code, name,
      pathways: times(ROWS_PER_SECTION, emptyPathway),
      conduits: times(ROWS_PER_SECTION, emptyConduit),
      managers: S.catalog.managerTypes.map((t) => emptyManager(t.id))
    };
  }

  // Proyecto nuevo: datos en blanco y un solo nivel; el usuario completa y agrega niveles
  function newProject(name = '') {
    const cat = S.catalog;
    const pw = {};
    cat.pathwayTypes.forEach((t) => { pw[t.id] = Calc.brandsFor(cat, t.id)[0] || ''; });
    return {
      id: uid(), schema: 1, number: '', name, location: '', client: '',
      date: '', preparedBy: '', revision: '', notes: '',
      fillPathway: 0.3, fillManager: 0.4, brands: pw,
      cables: [
        ...cat.cableMedia.map((m) => ({
          id: uid(), mediaId: m.id,
          cableName: m.cables.some((c) => c.name === DEFAULT_CABLES[m.id]) ? DEFAULT_CABLES[m.id] : ''
        })),
        { id: uid(), mediaId: 'custom', label: 'Tipo 1', description: '', od_in: '' },
        { id: uid(), mediaId: 'custom', label: 'Tipo 2', description: '', od_in: '' }
      ],
      levels: [newLevel('N01', 'Nivel 1')]
    };
  }

  function normalizeProject(p) {
    p.cables = p.cables || [];
    p.brands = p.brands || {};
    p.levels = p.levels || [];
    // Medios de transmisión agregados al catálogo después de crear el proyecto
    S.catalog.cableMedia.forEach((m) => {
      if (!p.cables.some((c) => c.mediaId === m.id)) {
        const firstCustom = p.cables.findIndex((c) => c.mediaId === 'custom');
        const col = { id: uid(), mediaId: m.id, cableName: '' };
        if (firstCustom < 0) p.cables.push(col); else p.cables.splice(firstCustom, 0, col);
      }
    });
    p.levels.forEach((l) => {
      l.pathways = l.pathways || []; l.conduits = l.conduits || []; l.managers = l.managers || [];
      [...l.pathways, ...l.conduits, ...l.managers].forEach((r) => { r.qty = r.qty || {}; r.id = r.id || uid(); });
    });
    return p;
  }

  const level = () => S.project.levels.find((l) => l.id === S.tab);
  const ctx = () => Calc.context(S.project, S.catalog);

  // ============ Guardado ============
  function markDirty() {
    saveState.textContent = 'Guardando…';
    clearTimeout(S.saveTimer);
    S.saveTimer = setTimeout(save, 500);
  }
  async function save() {
    clearTimeout(S.saveTimer);
    const ok = await Store.saveProject(S.project);
    saveState.textContent = ok ? 'Guardado ✓ ' + new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
      : '⚠ No se pudo guardar';
  }

  // ============ Proyectos ============
  async function refreshProjectSelect() {
    const list = await Store.listProjects();
    const sel = document.getElementById('projectSelect');
    sel.innerHTML = list.map((p) => opt(p.id, (p.number ? p.number + ' · ' : '') + (p.name || 'Proyecto sin nombre'), p.id === S.project.id)).join('');
  }
  async function openProject(p, tab = 'proyecto') {
    S.project = normalizeProject(p);
    S.tab = tab; S.memLevel = 'all';
    localStorage.setItem(LAST, p.id);
    await refreshProjectSelect();
    render();
  }

  function bindToolbar() {
    document.getElementById('projectSelect').addEventListener('change', async (e) => {
      await save();
      const p = await Store.getProject(e.target.value);
      if (p) openProject(p);
    });
    document.getElementById('btnNew').addEventListener('click', async () => {
      await save();
      const p = newProject();
      await Store.saveProject(p);
      await openProject(p);
      toast('Proyecto nuevo: complete los datos del proyecto');
      const first = view.querySelector('[data-p="number"]');
      if (first) first.focus();
    });
    document.getElementById('btnDup').addEventListener('click', async () => {
      await save();
      const p = JSON.parse(JSON.stringify(S.project));
      p.id = uid(); p.name = (p.name || 'Proyecto') + ' (copia)';
      await Store.saveProject(p);
      openProject(p); toast('Proyecto duplicado');
    });
    document.getElementById('btnExport').addEventListener('click', () => {
      const data = { type: 'canalizaciones-telecom/proyecto', version: APP_CONFIG.version, exported: new Date().toISOString(), project: S.project };
      const name = (S.project.number || S.project.name || 'proyecto').replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/g, '').trim().replace(/\s+/g, '_');
      download(`${name}_canalizaciones.json`, JSON.stringify(data, null, 1));
    });
    const fileIn = document.getElementById('importFile');
    document.getElementById('btnImport').addEventListener('click', () => fileIn.click());
    fileIn.addEventListener('change', async () => {
      const f = fileIn.files[0]; fileIn.value = '';
      if (!f) return;
      try {
        const data = JSON.parse(await readFile(f));
        const p = data.project || data;
        if (!Array.isArray(p.levels) || !Array.isArray(p.cables)) throw new Error('formato');
        if (await Store.getProject(p.id)) { p.id = uid(); p.name = (p.name || 'Proyecto') + ' (importado)'; }
        await save();
        await Store.saveProject(p);
        openProject(p); toast('Proyecto importado');
      } catch (err) {
        dialog({ title: 'No se pudo importar', message: 'El archivo no es un proyecto válido de esta herramienta.', cancelLabel: '' });
      }
    });
    document.getElementById('btnDelete').addEventListener('click', async () => {
      const ok = await confirmDlg('Eliminar proyecto', `Se eliminará <b>${esc(S.project.name)}</b> de este navegador. Exporte una copia antes si la necesita.`);
      if (!ok) return;
      clearTimeout(S.saveTimer);
      await Store.deleteProject(S.project.id);
      const list = await Store.listProjects();
      let p = list.length ? await Store.getProject(list[0].id) : null;
      if (!p) { p = newProject(); await Store.saveProject(p); }
      openProject(p);
    });
  }

  // ============ Render general ============
  function render() {
    renderTabs();
    const y = window.scrollY;
    if (S.tab === 'proyecto') renderProject();
    else if (S.tab === 'memoria') renderMemoria();
    else if (S.tab === 'ayuda') renderHelp();
    else if (level()) renderLevel();
    else { S.tab = 'proyecto'; renderProject(); }
    window.scrollTo(0, y);
    document.getElementById('footerInfo').textContent =
      `v${APP_CONFIG.version} · Catálogo ${S.catalog.version || ''}${Store.hasCustomCatalog() ? ' (modificado ' + (S.catalog.updated || '') + ')' : ''}`;
  }

  function renderTabs() {
    const c = ctx();
    const lv = S.project.levels.map((l) => {
      const k = Calc.evalLevel(l, c).counts;
      const dot = k.errors ? '<i class="dot" title="Con errores"></i>' : k.warnings ? '<i class="dot warn" title="Con advertencias"></i>' : '';
      return `<button class="seccion nivel ${S.tab === l.id ? 'activa' : ''}" data-tab="${l.id}" title="${esc(l.name)}">${esc(l.code || '?')}${dot}</button>`;
    }).join('');
    tabsEl.innerHTML = `
      <button class="seccion ${S.tab === 'proyecto' ? 'activa' : ''}" data-tab="proyecto">Proyecto</button>
      <span class="seccion-sep"></span>${lv}
      <button class="seccion" data-act="addLevel" title="Agregar nivel">+ Nivel</button>
      <span class="seccion-sep"></span>
      <button class="seccion ${S.tab === 'memoria' ? 'activa' : ''}" data-tab="memoria">Memoria de cálculo</button>
      <button class="seccion ${S.tab === 'ayuda' ? 'activa' : ''}" data-tab="ayuda">Ayuda</button>`;
  }

  tabsEl.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tab) { S.tab = b.dataset.tab; render(); window.scrollTo(0, 0); }
    else if (b.dataset.act === 'addLevel') addLevel();
  });

  // ============ Pestaña Proyecto ============
  function cableRowCells(col) {
    const od = col ? col.od_in : 0;
    return `<td class="num calc" data-out="odin">${od ? fmt(od, 3) : ''}</td>
      <td class="num calc" data-out="odmm">${od ? fmt(od * 25.4, 2) : ''}</td>
      <td class="num calc" data-out="area">${od ? fmt(Calc.circleArea(od), 2) : ''}</td>`;
  }

  /* Recomendación de ANSI/TIA-569-E cap. 9 (9.7.1.1) y BICSI TDMM para el % de llenado elegido.
     Amarillo en 30 % y 40 % (con reserva limitada), rojo en 50 % (sin reserva). */
  function fillAdvice(v) {
    const f = Math.round(Calc.num(v) * 100);
    const base = 'ANSI/TIA-569-E cap. 9 (9.7.1.1) y BICSI TDMM: el llenado de canastas y escalerillas no debe exceder el 50 % del área total de la canalización.';
    const txt = {
      25: ['callout', 'Llenado inicial recomendado por TIA-569-E (25 %): deja la mitad de la capacidad para crecimiento futuro.'],
      30: ['callout warn', '<b>Criterio Sinergia de prellenado (30 %).</b> Deja un 20 % de reserva antes del máximo de 50 %. Verificar que el crecimiento previsto del cliente quepa en esa reserva.'],
      40: ['callout warn', '<b>Poco crecimiento futuro (40 %).</b> Solo queda un 10 % de reserva antes del máximo de 50 %. Usar únicamente con justificación del cliente; el criterio Sinergia es 30 %.'],
      50: ['callout err', '<b>Llenado máximo (50 %), sin reserva de crecimiento.</b> Cualquier cable adicional excede TIA-569-E. No se recomienda como criterio de diseño.']
    }[f] || ['callout', ''];
    return `<div class="${txt[0]}">${txt[1]} <span class="small">${base}</span></div>`;
  }

  function renderProject() {
    const p = S.project, cat = S.catalog, cols = Calc.projectCables(p, cat);
    const colById = Object.fromEntries(cols.map((c) => [c.id, c]));
    const fillOpts = (v) => cat.fillOptions.map((o) => opt(o.value, Math.round(o.value * 100) + ' %' + (o.value === SINERGIA_FILL ? ' — criterio Sinergia' : ''), Calc.num(v) === o.value)).join('');
    const fillDesc = (v) => esc((cat.fillOptions.find((o) => o.value === Calc.num(v)) || {}).label || '');
    const ev = Calc.evalProject(p, cat);

    const stdRows = p.cables.filter((c) => c.mediaId !== 'custom').map((c) => {
      const m = cat.cableMedia.find((x) => x.id === c.mediaId);
      if (!m) return '';
      return `<tr data-cable="${c.id}">
        <td>${esc(m.name)}${m.allowInConduit === false ? ' <span class="muted small">(solo canalizaciones)</span>' : ''}</td>
        <td><select data-k="cableName" aria-label="Tipo de ${esc(m.name)}">${opt('', '— No se usa —', !c.cableName)}${m.cables.map((x) => opt(x.name, x.name, x.name === c.cableName)).join('')}</select></td>
        ${cableRowCells(colById[c.id])}<td></td></tr>`;
    }).join('');
    const customRows = p.cables.filter((c) => c.mediaId === 'custom').map((c) => `<tr data-cable="${c.id}">
        <td><input data-k="label" value="${esc(c.label)}" placeholder="Nombre corto (columna)" aria-label="Nombre corto"></td>
        <td><input data-k="description" value="${esc(c.description)}" placeholder="Descripción del cable" aria-label="Descripción"></td>
        <td class="num"><input data-k="od_in" type="number" step="0.001" min="0" value="${esc(c.od_in)}" style="width:90px;text-align:right" aria-label="Diámetro externo en pulgadas"></td>
        <td class="num calc" data-out="odmm">${Calc.num(c.od_in) ? fmt(Calc.num(c.od_in) * 25.4, 2) : ''}</td>
        <td class="num calc" data-out="area">${Calc.num(c.od_in) ? fmt(Calc.circleArea(c.od_in), 2) : ''}</td>
        <td class="actions"><button class="btn icon danger" data-act="delCable" data-id="${c.id}" title="Quitar tipo">✕</button></td></tr>`).join('');

    const brandRows = cat.pathwayTypes.map((t) => {
      const brands = Calc.brandsFor(cat, t.id);
      const cur = Calc.brandFor({ catalog: cat, project: p }, t.id);
      return `<label class="field"><span>Marca — ${esc(t.name)}</span>${brands.length > 1
        ? `<select data-p="brand" data-type="${t.id}">${brands.map((b) => opt(b, b, b === cur)).join('')}</select>`
        : `<input value="${esc(brands[0] || 'Sin productos en catálogo')}" disabled>`}</label>`;
    }).join('');

    const levelRows = p.levels.map((l, i) => {
      const k = ev.levels[i].counts;
      return `<tr data-lvl="${l.id}">
        <td class="rownum">${i + 1}</td>
        <td><input data-k="code" value="${esc(l.code)}" style="width:110px" aria-label="Código de pestaña"></td>
        <td><input data-k="name" value="${esc(l.name)}" aria-label="Nombre del nivel"></td>
        <td class="num calc">${k.pathways}</td><td class="num calc">${k.conduits}</td><td class="num calc">${k.managers}</td>
        <td class="center calc">${k.errors ? `<span class="badge err">${k.errors}</span>` : ''} ${k.warnings ? `<span class="badge warn">${k.warnings}</span>` : ''}${!k.errors && !k.warnings ? '<span class="badge ok">OK</span>' : ''}</td>
        <td class="actions">
          <button class="btn icon" data-act="lvlUp" data-id="${l.id}" title="Subir" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn icon" data-act="lvlDown" data-id="${l.id}" title="Bajar" ${i === p.levels.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn sm" data-act="openLevel" data-id="${l.id}">Abrir</button>
          <button class="btn icon" data-act="dupLevel" data-id="${l.id}" title="Duplicar nivel">⧉</button>
          <button class="btn icon danger" data-act="delLevel" data-id="${l.id}" title="Eliminar nivel">✕</button>
        </td></tr>`;
    }).join('');

    view.innerHTML = `
    <section class="card">
      <div class="card-head"><h2>A. Datos del proyecto <span class="en">/ Project data</span></h2></div>
      <div class="grid">
        <label class="field"><span>Proyecto # / Project #</span><input data-p="number" value="${esc(p.number)}"></label>
        <label class="field" style="grid-column:span 2"><span>Nombre / Name</span><input data-p="name" value="${esc(p.name)}"></label>
        <label class="field"><span>Cliente / Client</span><input data-p="client" value="${esc(p.client)}"></label>
        <label class="field" style="grid-column:span 2"><span>Ubicación / Location</span><input data-p="location" value="${esc(p.location)}"></label>
        <label class="field"><span>Fecha / Date</span><input data-p="date" type="date" value="${esc(p.date)}"></label>
        <label class="field"><span>Elaboró / Prepared by</span><input data-p="preparedBy" value="${esc(p.preparedBy)}"></label>
        <label class="field"><span>Revisión / Revision</span><input data-p="revision" value="${esc(p.revision)}"></label>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h2>B. Tipos de cable a utilizar <span class="en">/ Cable types</span></h2></div>
      <p class="muted small" style="margin-top:-6px">Para cada medio de transmisión seleccione el tipo de cable. Cada tipo definido se convierte en una columna de cantidades en las pestañas de nivel.</p>
      <div class="table-wrap"><table>
        <thead><tr><th>Medio de TX / TX media</th><th>Tipo / Type</th><th class="num">OD (in)</th><th class="num">OD (mm)</th><th class="num">Área (mm²)</th><th></th></tr></thead>
        <tbody>${stdRows}</tbody>
        <thead><tr><th colspan="6">C–E. Tipos adicionales (nombre, descripción y diámetro externo en pulgadas) <span class="en">/ Additional cable types</span></th></tr></thead>
        <tbody>${customRows}</tbody>
      </table></div>
      <div style="margin-top:8px"><button class="btn sm" data-act="addCable">+ Agregar tipo de cable</button></div>
    </section>

    <section class="card">
      <div class="card-head"><h2>F. Criterios de diseño <span class="en">/ Design criteria</span></h2></div>
      <div class="grid">
        <label class="field"><span>Canalizaciones: % de llenado / Fill ratio</span><select data-p="fillPathway">${fillOpts(p.fillPathway)}</select></label>
        <div class="field" style="grid-column:span 2"><span>&nbsp;</span><div class="small">${fillDesc(p.fillPathway)}</div></div>
        <div style="grid-column:1/-1">${fillAdvice(p.fillPathway)}</div>
        ${brandRows}
        <label class="field"><span>Organizadores de cable: % de llenado</span><select data-p="fillManager">${fillOpts(p.fillManager)}</select></label>
        <div class="field" style="grid-column:span 2"><span>&nbsp;</span><div class="small">${fillDesc(p.fillManager)}</div></div>
      </div>
      <p class="note">Aplican a todo el edificio. Tuberías: NEC 2020 Cap. 9 Tabla 1 (1 cable 53 %, 2 cables 31 %, 3 o más 40 %).</p>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>Niveles del edificio <span class="en">/ Building levels</span></h2>
        <button class="btn sm" data-act="addLevel">+ Agregar nivel</button>
        <button class="btn sm" data-act="genLevels">Generar varios niveles</button>
      </div>
      <p class="muted small" style="margin-top:-6px">Cada nivel tiene su propia pestaña para llenar los tramos de canalizaciones, tuberías y organizadores. El código es el nombre de la pestaña (N01, S1, AZOTEA…).</p>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Código / Tab</th><th>Nombre del nivel / Level</th><th class="num">Tramos canal.</th><th class="num">Tramos tubería</th><th class="num">Organizadores</th><th class="center">Estado</th><th></th></tr></thead>
        <tbody>${levelRows || '<tr><td colspan="8" class="muted">Sin niveles. Agregue al menos uno.</td></tr>'}</tbody>
      </table></div>
    </section>`;
  }

  function onProjectInput(e) {
    const t = e.target, p = S.project;
    if (t.dataset.p) {
      const k = t.dataset.p;
      if (k === 'brand') p.brands[t.dataset.type] = t.value;
      else if (k === 'fillPathway' || k === 'fillManager') p[k] = parseFloat(t.value);
      else p[k] = t.value;
      markDirty();
      if (k === 'name' || k === 'number') refreshProjectSelect();
      if (t.tagName === 'SELECT') render();
      return;
    }
    const cr = t.closest('tr[data-cable]');
    if (cr && t.dataset.k) {
      const c = p.cables.find((x) => x.id === cr.dataset.cable);
      c[t.dataset.k] = t.value;
      markDirty();
      if (t.dataset.k === 'od_in') {
        const od = Calc.num(t.value);
        cr.querySelector('[data-out=odmm]').textContent = od ? fmt(od * 25.4, 2) : '';
        cr.querySelector('[data-out=area]').textContent = od ? fmt(Calc.circleArea(od), 2) : '';
      }
      if (t.tagName === 'SELECT') render();
      return;
    }
    const lr = t.closest('tr[data-lvl]');
    if (lr && t.dataset.k) {
      const l = p.levels.find((x) => x.id === lr.dataset.lvl);
      l[t.dataset.k] = t.value;
      markDirty(); renderTabs();
    }
  }

  // ============ Niveles: alta, baja, orden ============
  function nextCode() {
    const nums = S.project.levels.map((l) => (/^N(\d+)$/i.exec(l.code || '') || [])[1]).filter(Boolean).map(Number);
    const n = nums.length ? Math.max(...nums) + 1 : 1;
    return { code: 'N' + String(n).padStart(2, '0'), name: 'Nivel ' + n };
  }
  async function addLevel() {
    const d = nextCode();
    const r = await dialog({
      title: 'Agregar nivel',
      fields: [{ name: 'code', label: 'Código de la pestaña (ej. N02, S1, AZOTEA)', value: d.code }, { name: 'name', label: 'Nombre del nivel', value: d.name }],
      okLabel: 'Agregar'
    });
    if (!r) return;
    const l = newLevel(r.code.trim() || d.code, r.name.trim() || d.name);
    S.project.levels.push(l);
    S.tab = l.id; markDirty(); render(); window.scrollTo(0, 0);
  }
  async function genLevels() {
    const r = await dialog({
      title: 'Generar varios niveles',
      message: 'Se agregan niveles consecutivos al final de la lista.',
      fields: [
        { name: 'count', label: 'Cantidad de niveles', type: 'number', value: 3, attrs: 'min="1" max="200"' },
        { name: 'prefix', label: 'Prefijo del código', value: 'N' },
        { name: 'start', label: 'Número inicial', type: 'number', value: nextCode().code.slice(1) * 1, attrs: 'min="0"' },
        { name: 'name', label: 'Nombre base', value: 'Nivel' }
      ],
      okLabel: 'Generar'
    });
    if (!r) return;
    const n = Math.min(200, Math.max(1, parseInt(r.count, 10) || 0));
    const s = parseInt(r.start, 10) || 1;
    for (let i = 0; i < n; i++) {
      const k = s + i;
      S.project.levels.push(newLevel(`${r.prefix}${String(k).padStart(2, '0')}`, `${r.name} ${k}`.trim()));
    }
    markDirty(); render(); toast(`${n} niveles agregados`);
  }
  function cloneLevel(l) {
    const c = JSON.parse(JSON.stringify(l));
    c.id = uid(); c.code = (l.code || '') + '-copia'; c.name = (l.name || '') + ' (copia)';
    [...c.pathways, ...c.conduits, ...c.managers].forEach((r) => { r.id = uid(); });
    return c;
  }

  // ============ Pestaña de nivel ============
  function cableHeaders(c) {
    return c.definedCables.map((col) => `<th class="cable-col" title="${esc(col.mediaName)}: ${esc(col.name)} — OD ${col.od_in} in">${esc(col.header)}<small>${col.od_in}"</small></th>`).join('');
  }
  function qtyCells(row, c) {
    return c.definedCables.map((col) => `<td class="center"><input class="qty" type="number" min="0" step="1" inputmode="numeric" data-k="q" data-c="${col.id}" value="${esc(row.qty[col.id] ?? '')}" aria-label="Cantidad ${esc(col.header)}"></td>`).join('');
  }
  const msgs = (r) => [
    ...r.errors.map((m) => `<div class="e">❌ ${esc(m)}</div>`),
    ...r.warnings.map((m) => `<div class="w">⚠ ${esc(m)}</div>`),
    ...(r.info || []).map((m) => `<div class="i">✓ ${esc(m)}</div>`)
  ].join('');
  // Verde: dentro del criterio de diseño · amarillo: sobre el criterio · rojo: excede el máximo (50 % TIA-569-E)
  function fillBadge(f, limit, max = 1) {
    if (f == null) return '';
    const cls = f > max + 1e-9 ? 'err' : f > limit + 1e-9 ? 'warn' : 'ok';
    return `<span class="badge ${cls}">${pct(f)}</span>`;
  }
  const actionCells = (sec, id) => `<td class="actions no-print">
    <button class="btn icon" data-act="dupRow" data-sec="${sec}" data-id="${id}" title="Duplicar fila">⧉</button>
    <button class="btn icon danger" data-act="delRow" data-sec="${sec}" data-id="${id}" title="Eliminar fila">✕</button></td>`;

  // Celdas calculadas (se actualizan sin redibujar la fila completa)
  function pathwayOut(r) {
    const rec = r.rec ? r.rec.label : (r.area > 0 && r.type ? 'No disponible / Unavailable' : '-');
    return {
      area: r.area ? fmt(r.area, 1) : '',
      rec: esc(rec),
      recpn: r.rec ? `<span class="pn">${esc(r.rec.partNumber || '—')}</span>` : '',
      selpn: r.sel ? `<span class="pn">${esc(r.sel.partNumber || '—')}</span>` + (r.selMode === 'auto' ? ' <span class="muted small">(auto)</span>' : '') : '',
      fill: fillBadge(r.fill, r.limit, r.max),
      msgs: msgs(r)
    };
  }
  function conduitOut(r) {
    return {
      area: r.area ? fmt(r.area, 1) : '',
      nec: r.nec ? Math.round(r.nec * 100) + ' %' : '',
      size: esc(r.sizeLabel || (r.n ? '' : '-')),
      mm: r.mm ? r.mm : '',
      fill: r.fillReal != null ? pct(r.fillReal) : '',
      msgs: msgs(r)
    };
  }
  function managerOut(r) {
    return {
      area: r.area ? fmt(r.area, 1) : '',
      rec: esc(r.rec ? r.rec.label : (r.area > 0 ? 'No disponible / Unavailable' : '-')),
      recpn: r.rec ? `<span class="pn">${esc(r.rec.partNumber)}</span>` : '',
      fill: r.fill != null ? pct(r.fill) : '',
      msgs: msgs(r)
    };
  }
  const out = (key, html, cls = 'calc') => `<td class="${cls}" data-out="${key}">${html}</td>`;

  function selectOptions(row, r) {
    const opts = r.options || [];
    let html = opt('auto', 'Automática (recomendada)', row.sel === 'auto') + opt('', '— Sin selección —', row.sel === '');
    if (row.sel && row.sel !== 'auto' && !opts.some((p) => p.id === row.sel)) html += opt(row.sel, '⚠ selección no válida', true);
    html += opts.map((p) => opt(p.id, `${p.label}${p.partNumber ? ' · ' + p.partNumber : ''}`, p.id === row.sel)).join('');
    return html;
  }

  function pathwayRow(row, i, c) {
    const r = Calc.evalPathway(row, c), o = pathwayOut(r);
    return `<tr data-sec="pathways" data-id="${row.id}">
      <td class="rownum">${i + 1}</td>
      <td><input class="sec" data-k="section" value="${esc(row.section)}" placeholder="Sección / tramo" aria-label="Sección"></td>
      <td><select class="type" data-k="typeId" aria-label="Tipo de canalización">${opt('', '—', !row.typeId)}${S.catalog.pathwayTypes.map((t) => opt(t.id, t.name, t.id === row.typeId)).join('')}</select></td>
      ${qtyCells(row, c)}
      ${out('area', o.area, 'num calc')}${out('rec', o.rec)}${out('recpn', o.recpn)}
      <td><select class="selpw" data-k="sel" aria-label="Canalización seleccionada" ${row.typeId ? '' : 'disabled'}>${selectOptions(row, r)}</select></td>
      ${out('selpn', o.selpn)}${out('fill', o.fill, 'center calc')}
      <td><input class="len" type="number" min="0" step="0.1" data-k="length" value="${esc(row.length)}" aria-label="Distancia (m)"></td>
      ${out('msgs', o.msgs, 'msgs calc')}
      ${actionCells('pathways', row.id)}</tr>`;
  }
  function conduitRow(row, i, c) {
    const r = Calc.evalConduit(row, c), o = conduitOut(r);
    const types = S.catalog.conduitTypes.filter((t) => t.enabled !== false || t.id === row.typeId);
    return `<tr data-sec="conduits" data-id="${row.id}">
      <td class="rownum">${i + 1}</td>
      <td><input class="sec" data-k="use" value="${esc(row.use)}" placeholder="Uso / tramo" aria-label="Uso de la tubería"></td>
      <td><select class="type" data-k="typeId" aria-label="Tipo de tubería">${opt('', '—', !row.typeId)}${types.map((t) => opt(t.id, t.id === 'RNC40' ? 'RNC Sch 40 & HDPE' : t.id === 'RNC80' ? 'RNC Sch 80' : t.id, t.id === row.typeId)).join('')}</select></td>
      ${qtyCells(row, c)}
      ${out('area', o.area, 'num calc')}${out('nec', o.nec, 'num calc')}${out('size', o.size, 'center calc')}${out('mm', o.mm, 'num calc')}${out('fill', o.fill, 'num calc')}
      <td><input class="len" type="number" min="0" step="1" data-k="bends" value="${esc(row.bends)}" style="width:56px" aria-label="Curvas de 90°"></td>
      <td><input class="len" type="number" min="0" step="0.1" data-k="length" value="${esc(row.length)}" aria-label="Distancia (m)"></td>
      ${out('msgs', o.msgs, 'msgs calc')}
      ${actionCells('conduits', row.id)}</tr>`;
  }
  function managerRow(row, i, c) {
    const r = Calc.evalManager(row, c), o = managerOut(r);
    return `<tr data-sec="managers" data-id="${row.id}">
      <td class="rownum">${i + 1}</td>
      <td><input class="sec" data-k="label" value="${esc(row.label)}" placeholder="Rack / gabinete" aria-label="Identificación"></td>
      <td><select class="type" data-k="typeId" aria-label="Tipo de organizador">${opt('', '—', !row.typeId)}${S.catalog.managerTypes.map((t) => opt(t.id, t.name, t.id === row.typeId)).join('')}</select></td>
      ${qtyCells(row, c)}
      ${out('area', o.area, 'num calc')}${out('rec', o.rec)}${out('recpn', o.recpn)}${out('fill', o.fill, 'num calc')}
      ${out('msgs', o.msgs, 'msgs calc')}
      ${actionCells('managers', row.id)}</tr>`;
  }

  function levelStats(l, c) {
    const k = Calc.evalLevel(l, c).counts;
    return `
      <div class="stat"><b>${k.pathways}</b><span>Tramos canal.</span></div>
      <div class="stat"><b>${k.conduits}</b><span>Tramos tubería</span></div>
      <div class="stat"><b>${k.managers}</b><span>Organizadores</span></div>
      <div class="stat ${k.errors ? 'err' : ''}"><b>${k.errors}</b><span>Errores ❌</span></div>
      <div class="stat ${k.warnings ? 'warn' : ''}"><b>${k.warnings}</b><span>Advertencias ⚠</span></div>
      <div class="stat"><b>${fmt(k.lenPathways, 1)}</b><span>Long. canal. (m)</span></div>
      <div class="stat"><b>${fmt(k.lenConduits, 1)}</b><span>Long. tubería (m)</span></div>`;
  }

  function renderLevel() {
    const l = level(), c = ctx(), p = S.project;
    const nCab = c.definedCables.length;
    const brands = S.catalog.pathwayTypes.filter((t) => Calc.brandsFor(S.catalog, t.id).length > 1)
      .map((t) => `${esc(t.name)}: <b>${esc(Calc.brandFor(c, t.id))}</b>`).join(' · ');
    const noCables = nCab ? '' : '<p class="callout warn">No hay tipos de cable definidos. Defínalos en la pestaña <b>Proyecto</b> (sección B).</p>';
    const fillTxt = (v) => esc((S.catalog.fillOptions.find((o) => o.value === v) || {}).label || '');

    view.innerHTML = `
    <section class="card">
      <div class="card-head">
        <h2>Nivel <span class="en">/ Level</span></h2>
        <button class="btn sm" data-act="dupLevel" data-id="${l.id}">Duplicar nivel</button>
        <button class="btn sm danger" data-act="delLevel" data-id="${l.id}">Eliminar nivel</button>
        <button class="btn sm" data-act="print">Imprimir</button>
      </div>
      <div class="grid" style="margin-bottom:12px">
        <label class="field"><span>Código de pestaña</span><input data-lv="code" value="${esc(l.code)}"></label>
        <label class="field"><span>Nombre del nivel / Level</span><input data-lv="name" value="${esc(l.name)}"></label>
        <div class="field"><span>Proyecto</span><div>${esc([p.number, p.name].filter(Boolean).join(' '))}</div></div>
        <div class="field"><span>Ubicación</span><div>${esc(p.location)}</div></div>
      </div>
      <div class="stats" id="levelStats">${levelStats(l, c)}</div>
    </section>
    ${noCables}
    <section class="card">
      <div class="card-head">
        <h3><span class="sec-code">${esc(l.code)}-A</span> Canalizaciones <span class="en">/ Pathways</span> — canasta, escalera, aeroducto, ducto de fibra</h3>
      </div>
      <p class="small muted" style="margin:-6px 0 8px">% de llenado: <b>${Math.round(c.fill * 100)} %</b> ${fillTxt(c.fill)}${brands ? ' · ' + brands : ''} <span class="muted">(se definen en Proyecto)</span> · <a href="#tipos-canalizacion" data-act="verTipos" class="no-print">¿Qué tipo usar?</a></p>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Sección o nivel / Section</th><th>Tipo de canalización / Pathway type</th>${cableHeaders(c)}
          <th class="num">Área total (mm²)</th><th>Recomendada* (H×W)</th><th>P/N recomendado</th><th>Selección / Selected</th><th>P/N seleccionado</th><th class="center" title="Verde: dentro del criterio · Amarillo: supera el criterio de diseño · Rojo: excede el 50 % (TIA-569-E cap. 9 / BICSI)">% llenado<br><small>(área total)</small></th><th>Distancia (m)</th><th>Observaciones</th><th class="no-print"></th></tr></thead>
        <tbody>${l.pathways.map((r, i) => pathwayRow(r, i, c)).join('')}</tbody>
      </table></div>
      <div class="row-inline no-print" style="margin-top:8px">
        <button class="btn sm" data-act="addRow" data-sec="pathways">+ Agregar tramo</button>
        <button class="btn sm" data-act="addRows" data-sec="pathways">+ 5 tramos</button>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h3><span class="sec-code">${esc(l.code)}-B</span> Tuberías <span class="en">/ Conduits</span><sup>+</sup></h3></div>
      <p class="small muted" style="margin:-6px 0 8px">NO SE DEBEN MEZCLAR DISTINTOS TIPOS DE CABLES DENTRO DE UNA MISMA TUBERÍA / Different cable types should not be mixed within the same conduit.</p>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Uso de la tubería / Use</th><th>Tipo de tubería / Type</th>${cableHeaders(c)}
          <th class="num">Área total (mm²)</th><th class="num">% NEC</th><th class="center">Diámetro (in)</th><th class="num">(mm)</th><th class="num">% llenado real</th><th>Curvas 90°</th><th>Distancia (m)</th><th>Advertencias / Warnings</th><th class="no-print"></th></tr></thead>
        <tbody>${l.conduits.map((r, i) => conduitRow(r, i, c)).join('')}</tbody>
      </table></div>
      <div class="row-inline no-print" style="margin-top:8px">
        <button class="btn sm" data-act="addRow" data-sec="conduits">+ Agregar tubería</button>
        <button class="btn sm" data-act="addRows" data-sec="conduits">+ 5 tuberías</button>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h3><span class="sec-code">${esc(l.code)}-C</span> Organizadores de cable <span class="en">/ Cable managers</span></h3></div>
      <p class="small muted" style="margin:-6px 0 8px">% de llenado: <b>${Math.round(c.fillMgr * 100)} %</b> ${fillTxt(c.fillMgr)}. Organizadores doble lado: ingrese el total de cables de ambos lados (frontal + posterior).</p>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Identificación</th><th>Tipo de organizador / Type</th>${cableHeaders(c)}
          <th class="num">Área total (mm²)</th><th>Organizador recomendado</th><th>P/N recomendado</th><th class="num">% llenado real</th><th>Observaciones</th><th class="no-print"></th></tr></thead>
        <tbody>${l.managers.map((r, i) => managerRow(r, i, c)).join('')}</tbody>
      </table></div>
      <div class="row-inline no-print" style="margin-top:8px">
        <button class="btn sm" data-act="addRow" data-sec="managers">+ Agregar organizador</button>
      </div>
    </section>
    ${footnotes()}`;
  }

  function footnotes() {
    return `<section class="card note">
      <p><b>*</b> Capacidad de canastas y escaleras según ANSI/TIA-569-E, Cap. 9, Sec. 9.7.1.1, reforzado por BICSI TDMM v14, Cap. 6-78. Aeroducto según NEC 2020, Cap. 3, Art. 376.22(A) (20 % del área).</p>
      <p><b>+</b> Capacidad de tuberías según NEC 2020, Cap. 9, Tabla 1, reforzado con ANSI/TIA-569-E, Cap. 8, Sec. 8.8.2.3, Tablas 9-10-11. Tamaño mínimo 3/4" (21). Tramos ≤ 30 m y máximo 2 curvas de 90° entre cajas de paso.</p>
      <p><b>^</b> El innerduct únicamente se utiliza para proteger la fibra óptica en tirajes sobre canasta, escalera o aeroducto. En tuberías NO se utiliza.</p>
      <p><b>˜</b> Sufijo de acabado Panduit: BL (negro), WH (blanco), EZ (electrozinc).</p>
    </section>`;
  }

  function updateRow(tr) {
    const l = level(), sec = tr.dataset.sec, c = ctx();
    const row = l[sec].find((r) => r.id === tr.dataset.id);
    const fns = { pathways: [Calc.evalPathway, pathwayOut], conduits: [Calc.evalConduit, conduitOut], managers: [Calc.evalManager, managerOut] }[sec];
    const o = fns[1](fns[0](row, c));
    Object.entries(o).forEach(([k, html]) => { const td = tr.querySelector(`[data-out="${k}"]`); if (td) td.innerHTML = html; });
    document.getElementById('levelStats').innerHTML = levelStats(l, c);
  }
  function replaceRow(tr, focusKey) {
    const l = level(), sec = tr.dataset.sec, c = ctx();
    const i = l[sec].findIndex((r) => r.id === tr.dataset.id);
    const fn = { pathways: pathwayRow, conduits: conduitRow, managers: managerRow }[sec];
    const tmp = document.createElement('tbody');
    tmp.innerHTML = fn(l[sec][i], i, c);
    const nt = tmp.firstElementChild;
    tr.replaceWith(nt);
    if (focusKey) { const el = nt.querySelector(`[data-k="${focusKey}"]`); if (el) el.focus(); }
    document.getElementById('levelStats').innerHTML = levelStats(l, c);
  }

  function onLevelInput(e) {
    const t = e.target, l = level();
    if (t.dataset.lv) { l[t.dataset.lv] = t.value; markDirty(); renderTabs(); return; }
    const tr = t.closest('tr[data-sec]');
    if (!tr || !t.dataset.k) return;
    const row = l[tr.dataset.sec].find((r) => r.id === tr.dataset.id);
    const k = t.dataset.k;
    if (k === 'q') {
      if (t.value === '') delete row.qty[t.dataset.c]; else row.qty[t.dataset.c] = t.value;
    } else row[k] = t.value;
    markDirty();
    if (k === 'typeId' && e.type === 'change') {
      if (tr.dataset.sec === 'pathways') row.sel = 'auto';
      replaceRow(tr, 'typeId');
    } else if (k !== 'typeId') updateRow(tr);
  }

  // ============ Memoria de cálculo ============
  function memoriaData() {
    const p = S.project, cat = S.catalog;
    const full = Calc.evalProject(p, cat);
    const scoped = S.memLevel === 'all' ? full
      : Calc.evalProject({ ...p, levels: p.levels.filter((l) => l.id === S.memLevel) }, cat);
    return { full, scoped };
  }

  function renderMemoria() {
    const p = S.project, cat = S.catalog;
    const { full, scoped } = memoriaData();
    const c = full.ctx;
    const t = full.totals;
    const fillLbl = (x) => Math.round(x * 100) + ' % — ' + ((cat.fillOptions.find((o) => o.value === x) || {}).label || '');
    const brandTxt = cat.pathwayTypes.map((x) => `${x.name}: ${Calc.brandFor(c, x.id) || '—'}`).join('; ');
    const nec = cat.necFill;
    const lim = cat.conduitLimits;
    const scopeName = S.memLevel === 'all' ? 'edificio completo' : (p.levels.find((l) => l.id === S.memLevel) || {}).code;
    // Formato Sinergia: ninguna celda en blanco; la raya indica "sin dato"
    const v = (x) => (x === null || x === undefined || x === '') ? '—' : esc(x);
    const n1 = (x) => (x ? fmt(x, 1) : '—');
    let tn = 0;
    const tabla = (name, heads, rows, emptyText = 'Sin tramos') => {
      tn++;
      const ths = heads.map(([h, cls]) => `<th${cls ? ` class="${cls}"` : ''}>${h}</th>`).join('');
      return `<figure class="doc-table">
        <figcaption>Tabla No. ${tn}<br><span>${name}</span></figcaption>
        <div class="table-wrap"><table><thead><tr>${ths}</tr></thead>
        <tbody>${rows.length ? rows.join('') : `<tr><td colspan="${heads.length}">— ${esc(emptyText)}</td></tr>`}</tbody></table></div>
      </figure>`;
    };
    const crit = (r) => [
      ...r.errors.map((m) => `<span class="crit-err">${esc(m)}</span>`),
      ...r.warnings.map((m) => `<span class="crit-warn">${esc(m)}</span>`),
      ...(r.info || []).map((m) => esc(m))
    ].join('; ') || '—';
    const fillTxt = (f, limit, max) => {
      if (f == null) return '—';
      const cls = max != null && f > max + 1e-9 ? 'crit-err' : limit != null && f > limit + 1e-9 ? 'crit-warn' : '';
      return cls ? `<span class="${cls}">${pct(f)}</span>` : pct(f);
    };

    const levelRows = full.levels.map((lv, i) => `<tr><td class="num">${i + 1}</td><td>${v(lv.level.code)}</td><td>${v(lv.level.name)}</td>
      <td class="num">${lv.counts.pathways}</td><td class="num">${lv.counts.conduits}</td><td class="num">${lv.counts.managers}</td>
      <td class="num">${lv.counts.errors ? `<span class="crit-err">${lv.counts.errors}</span>` : 0}</td><td class="num">${lv.counts.warnings ? `<span class="crit-warn">${lv.counts.warnings}</span>` : 0}</td>
      <td class="num">${fmt(lv.counts.lenPathways, 1)}</td><td class="num">${fmt(lv.counts.lenConduits, 1)}</td></tr>`);
    if (levelRows.length) {
      levelRows.push(`<tr class="total"><td class="num">—</td><td>—</td><td>Total edificio</td><td class="num">${t.pathways || 0}</td><td class="num">${t.conduits || 0}</td><td class="num">${t.managers || 0}</td><td class="num">${t.errors || 0}</td><td class="num">${t.warnings || 0}</td><td class="num">${fmt(t.lenPathways || 0, 1)}</td><td class="num">${fmt(t.lenConduits || 0, 1)}</td></tr>`);
    }
    const pwRows = scoped.pathwayGroups.map((g) => `<tr><td>${v(g.type)}</td><td>${v(g.size)}</td><td>${v(g.brand)}</td><td class="pn">${v(g.pn)}</td><td class="num">${g.count}</td><td class="num">${fmt(g.length, 1)}</td></tr>`);
    const cdRows = scoped.conduitGroups.map((g) => `<tr><td>${v(g.type)}</td><td>${v(g.size)}</td><td class="num">${g.count}</td><td class="num">${fmt(g.length, 1)}</td></tr>`);
    const mgRows = scoped.managerGroups.map((g) => `<tr><td>${v(g.type)}</td><td>${v(g.model)}</td><td class="pn">${v(g.pn)}</td><td class="num">${g.count}</td></tr>`);
    const cabRows = c.definedCables.map((x) => `<tr><td>${v(x.mediaName)}</td><td>${v(x.custom ? x.header + (x.name && x.name !== x.header ? ' — ' + x.name : '') : x.name)}</td><td class="num">${fmt(x.od_in, 3)}</td><td class="num">${fmt(x.od_in * 25.4, 2)}</td><td class="num">${fmt(x.area, 2)}</td></tr>`);
    const critRows = [
      ['Canalizaciones (canasta, escalera, aeroducto, ducto de fibra)', fillLbl(c.fill)],
      ['Llenado máximo de canalizaciones', 'ANSI/TIA-569-E cap. 9, sec. 9.7.1.1 y BICSI TDMM 14: 50 % del área total; aeroducto NEC 2020 art. 376.22(A): 20 %'],
      ['Criterio Sinergia de prellenado', '30 % del área total (deja reserva de crecimiento hasta el máximo de 50 %)'],
      ['Fabricante', brandTxt],
      ['Organizadores de cable', fillLbl(c.fillMgr)],
      ['Tuberías', `NEC 2020 cap. 9 tabla 1: 1 cable ${Math.round(nec.one * 100)} %, 2 cables ${Math.round(nec.two * 100)} %, 3 o más ${Math.round(nec.more * 100)} %; tamaño mínimo 3/4" (21)`],
      ['Limitaciones', `Tuberías: tramos ≤ ${lim.maxLength_m} m con máx. ${lim.maxBends} curvas de 90° (reducir 15 % por curva adicional). No mezclar tipos de cable en una tubería.`]
    ].map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`);

    const detPw = [], detCd = [], detMg = [];
    scoped.levels.forEach((lv) => {
      lv.pathways.forEach(({ row, res }) => {
        if (!res.active) return;
        detPw.push(`<tr><td>${v(lv.level.code)}-A</td><td>${v(row.section)}</td><td>${v(res.type ? res.type.name : '')}</td><td>${v(res.text)}</td>
          <td class="num">${fmt(res.area, 1)}</td><td>${res.sel ? esc(res.sel.label) : '<span class="crit-warn">Sin selección</span>'}</td><td class="pn">${v(res.sel ? res.sel.partNumber : '')}</td>
          <td class="num">${fillTxt(res.fill, res.limit, res.max)}</td><td class="num">${n1(res.length)}</td><td class="obs">${crit(res)}</td></tr>`);
      });
      lv.conduits.forEach(({ row, res }) => {
        if (!res.active) return;
        detCd.push(`<tr><td>${v(lv.level.code)}-B</td><td>${v(row.use)}</td><td>${v(row.typeId)}</td><td>${v(res.text)}</td>
          <td class="num">${fmt(res.area, 1)}</td><td class="num">${v(res.sizeLabel)}</td><td class="num">${v(res.mm)}</td>
          <td class="num">${res.fillReal != null ? pct(res.fillReal) : '—'}</td><td class="num">${n1(res.length)}</td><td class="obs">${crit(res)}</td></tr>`);
      });
      lv.managers.forEach(({ row, res }) => {
        if (!res.active) return;
        detMg.push(`<tr><td>${v(lv.level.code)}-C</td><td>${v(row.label)}</td><td>${v(res.type ? res.type.name : '')}</td><td>${v(res.text)}</td>
          <td class="num">${fmt(res.area, 1)}</td><td>${v(res.rec ? res.rec.label : '')}</td><td class="pn">${v(res.rec ? res.rec.partNumber : '')}</td>
          <td class="num">${res.fill != null ? pct(res.fill) : '—'}</td><td class="obs">${crit(res)}</td></tr>`);
      });
    });

    view.innerHTML = `
    <div class="card no-print row-inline">
      <label class="field"><span>Alcance de los resúmenes</span>
        <select id="memLevel">${opt('all', 'Edificio completo', S.memLevel === 'all')}${p.levels.map((l) => opt(l.id, `${l.code} — ${l.name}`, l.id === S.memLevel)).join('')}</select></label>
      <button class="btn primary" data-act="print">Imprimir / Guardar PDF</button>
      <button class="btn" data-act="csv">Exportar CSV</button>
      <span class="muted small">Formato Sinergia: hoja carta, márgenes 3,0 / 2,5 cm. Verifique la impresión en el PDF.</span>
    </div>
    <article class="report doc">
      <header class="doc-head">
        <img class="doc-logo" src="img/logo-sinergia.png" alt="Sinergia Ingeniería">
        <div class="doc-addr">Sinergia Consultoría Mecánica y Eléctrica S.A<br>Oficentro Plaza Roble, Edificio Pórtico, Escazú</div>
      </header>
      <h1 class="doc-title">Memoria de cálculo de canalizaciones para telecomunicaciones</h1>
      <p class="doc-sub">${esc(p.name || '')}${p.number ? ' · proyecto ' + esc(p.number) : ''} · alcance: ${esc(scopeName)}</p>

      <h2>1. Datos del proyecto</h2>
      <dl class="kv">
        <dt>proyecto #</dt><dd>${v(p.number)}</dd>
        <dt>nombre</dt><dd>${v(p.name)}</dd>
        <dt>cliente</dt><dd>${v(p.client)}</dd>
        <dt>ubicación</dt><dd>${v(p.location)}</dd>
        <dt>fecha</dt><dd>${v(p.date)}</dd>
        <dt>elaboró</dt><dd>${v(p.preparedBy)}</dd>
        <dt>revisión</dt><dd>${v(p.revision)}</dd>
      </dl>

      <h2>2. Criterios de diseño</h2>
      ${tabla('Criterios de diseño aplicados', [['elemento'], ['criterio']], critRows)}

      <h2>3. Tipos de cable</h2>
      ${tabla('Tipos de cable utilizados en el proyecto', [['medio de transmisión'], ['tipo'], ['OD (in)', 'num'], ['OD (mm)', 'num'], ['área (mm²)', 'num']], cabRows, 'Sin cables definidos')}

      <h2>4. Niveles del edificio</h2>
      ${tabla('Resumen por nivel', [['#', 'num'], ['pestaña'], ['nivel'], ['tramos canalización', 'num'], ['tramos tubería', 'num'], ['organizadores', 'num'], ['errores', 'num'], ['advertencias', 'num'], ['long. canalización (m)', 'num'], ['long. tubería (m)', 'num']], levelRows, 'Sin niveles')}

      <h2>5. Canalizaciones por tamaño</h2>
      ${tabla(`Canalizaciones seleccionadas — ${esc(scopeName)}`, [['tipo'], ['tamaño seleccionado'], ['marca'], ['número de parte'], ['tramos', 'num'], ['longitud (m)', 'num']], pwRows)}

      <h2>6. Tuberías por diámetro</h2>
      ${tabla(`Tuberías por diámetro — ${esc(scopeName)}`, [['tipo'], ['diámetro'], ['tramos', 'num'], ['longitud (m)', 'num']], cdRows)}

      <h2>7. Organizadores de cable</h2>
      ${tabla(`Organizadores de cable — ${esc(scopeName)}`, [['tipo'], ['modelo'], ['número de parte'], ['cantidad', 'num']], mgRows, 'Sin organizadores')}

      <h2>8. Detalle de tramos por nivel</h2>
      ${tabla('Detalle de canalizaciones (sección A de cada nivel)', [['sección'], ['tramo'], ['tipo'], ['cables'], ['área (mm²)', 'num'], ['canalización final'], ['número de parte'], ['llenado real (% área total)', 'num'], ['distancia (m)', 'num'], ['observaciones']], detPw)}
      ${tabla('Detalle de tuberías (sección B de cada nivel)', [['sección'], ['uso'], ['tipo'], ['cables'], ['área (mm²)', 'num'], ['diámetro (in)', 'num'], ['diámetro (mm)', 'num'], ['llenado real (%)', 'num'], ['distancia (m)', 'num'], ['advertencias']], detCd)}
      ${tabla('Detalle de organizadores (sección C de cada nivel)', [['sección'], ['identificación'], ['tipo'], ['cables'], ['área (mm²)', 'num'], ['organizador'], ['número de parte'], ['llenado real (%)', 'num'], ['observaciones']], detMg, 'Sin organizadores')}
      ${footnotes()}
    </article>`;
  }

  function exportCsv() {
    const p = S.project;
    const { full, scoped } = memoriaData();
    const rows = [
      ['MEMORIA DE CÁLCULO — CANALIZACIONES PARA TELECOMUNICACIONES'],
      ['Proyecto', p.number, p.name], ['Ubicación', p.location], ['Fecha', p.date], [],
      ['NIVELES'], ['#', 'Pestaña', 'Nivel', 'Tramos canal.', 'Tramos tubería', 'Organizadores', 'Errores', 'Advertencias', 'Long. canal. (m)', 'Long. tubería (m)'],
      ...full.levels.map((l, i) => [i + 1, l.level.code, l.level.name, l.counts.pathways, l.counts.conduits, l.counts.managers, l.counts.errors, l.counts.warnings, l.counts.lenPathways, l.counts.lenConduits]),
      [], ['CANALIZACIONES POR TAMAÑO'], ['Tipo', 'Tamaño', 'Marca', 'P/N', 'Tramos', 'Longitud (m)'],
      ...scoped.pathwayGroups.map((g) => [g.type, g.size, g.brand, g.pn, g.count, g.length]),
      [], ['TUBERÍAS POR DIÁMETRO'], ['Tipo', 'Diámetro', 'Tramos', 'Longitud (m)'],
      ...scoped.conduitGroups.map((g) => [g.type, g.size, g.count, g.length]),
      [], ['ORGANIZADORES'], ['Tipo', 'Modelo', 'P/N', 'Cantidad'],
      ...scoped.managerGroups.map((g) => [g.type, g.model, g.pn, g.count]),
      [], ['DETALLE CANALIZACIONES'], ['Nivel', 'Sección', 'Tipo', 'Cables', 'Área (mm²)', 'Canalización final', 'P/N', '% llenado (área total)', 'Distancia (m)', 'Observaciones']
    ];
    const notes = (r) => [...r.errors, ...r.warnings, ...(r.info || [])].join(' | ');
    scoped.levels.forEach((lv) => lv.pathways.forEach(({ row, res }) => {
      if (res.active) rows.push([lv.level.code, row.section, res.type ? res.type.name : '', res.text, Math.round(res.area * 10) / 10, res.sel ? res.sel.label : 'Sin selección', res.sel ? res.sel.partNumber : '', res.fill != null ? Math.round(res.fill * 1000) / 10 + '%' : '', res.length || '', notes(res)]);
    }));
    rows.push([], ['DETALLE TUBERÍAS'], ['Nivel', 'Uso', 'Tipo', 'Cables', 'Área (mm²)', 'Diámetro (in)', '(mm)', '% llenado', 'Distancia (m)', 'Advertencias']);
    scoped.levels.forEach((lv) => lv.conduits.forEach(({ row, res }) => {
      if (res.active) rows.push([lv.level.code, row.use, row.typeId, res.text, Math.round(res.area * 10) / 10, res.sizeLabel, res.mm || '', res.fillReal != null ? Math.round(res.fillReal * 1000) / 10 + '%' : '', res.length || '', notes(res)]);
    }));
    download(`${(p.number || p.name || 'proyecto').replace(/\s+/g, '_')}_memoria.csv`, toCsv(rows), 'text/csv');
  }

  // ============ Ayuda ============
  // Glosario básico de tipos de canalización (presentación "Tipos de Canastas" de Sinergia)
  function tiposCanalizacion() {
    const foto = (archivo, pie) => `<figure class="foto"><img src="img/tipos/${archivo}" alt="${esc(pie)}" loading="lazy"><figcaption>${esc(pie)}</figcaption></figure>`;
    return `
    <section class="card glosario" id="tipos-canalizacion">
      <h2 style="margin-bottom:6px">Tipos de canalización <span class="en">/ glosario básico</span></h2>
      <p><b>Bandejas portacables</b> es el término general que abarca todas las canalizaciones tipo bandeja o canasta. Las variantes más utilizadas son la canasta tipo malla y la canasta tipo escalera.</p>

      <div class="glosario-tipo">
        <div>
          <h3>Canasta tipo malla <span class="en">/ wire mesh</span></h3>
          <p>Se utiliza en el sistema de telecomunicaciones, principalmente para cableado de cobre (UTP), y en el sistema eléctrico para conductores de calibre 1/0 AWG o mayores, o para cable armado.</p>
          <p>Es adecuada para cables cuyo peso no sea muy elevado y cuyo radio de curvatura sea pequeño.</p>
          <p class="small muted">En la herramienta: tipo «Canasta / Wire mesh» (Panduit, Cablofil).</p>
        </div>
        <div class="fotos">
          ${foto('canasta-malla-utp.jpg', 'Canasta tipo malla con cableado UTP')}
          ${foto('canasta-malla-cable-armado.jpg', 'Canasta tipo malla con cable armado')}
        </div>
      </div>

      <div class="glosario-tipo">
        <div>
          <h3>Canasta tipo escalera <span class="en">/ ladder tray</span></h3>
          <p>Se utiliza cuando la densidad de cableado es alta y, por ende, su peso es alto.</p>
          <p>También se usa cuando los conductores son muy rígidos y su radio de curvatura es más amplio.</p>
          <p class="small muted">En la herramienta: tipo «Escalera / Ladder tray».</p>
        </div>
        <div class="fotos">
          ${foto('escalera.jpg', 'Canasta tipo escalera')}
          ${foto('escalera-instalada.jpg', 'Escalera instalada con derivaciones')}
          ${foto('escalera-centro-datos.jpg', 'Escalera en centro de datos')}
        </div>
      </div>

      <h3 style="margin:14px 0 6px">Materiales y acabados</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>Material / acabado</th><th>Uso recomendado</th><th class="center">Costo relativo</th></tr></thead>
        <tbody>
          <tr><td>Acero</td><td>La opción más económica. Para ambientes sin exposición a humedad ni a factores corrosivos.</td><td class="center">$</td></tr>
          <tr><td>Galvanizado en frío</td><td>Común en entornos que requieren resistencia moderada a la corrosión.</td><td class="center">$$</td></tr>
          <tr><td><b>Galvanizado en caliente</b></td><td>Ideal para ambientes industriales o exteriores expuestos a condiciones climáticas severas; el recubrimiento de zinc es mucho más resistente a la corrosión. <b>Es la opción preferente</b> cuando se utilicen este tipo de canastas.</td><td class="center">$$$</td></tr>
          <tr><td>Aluminio</td><td>Opción ligera y resistente.</td><td class="center">$$$$$</td></tr>
          <tr><td>Acero inoxidable</td><td>Industria alimentaria, médica y otros sectores donde la higiene y la resistencia a la corrosión son cruciales.</td><td class="center">$$$$$</td></tr>
        </tbody>
      </table></div>

      <div class="glosario-tipo" style="margin-top:16px">
        <div>
          <h3>Bandejas para fibra <span class="en">/ fiber duct</span></h3>
          <p>Sistema de canales fabricados con polímeros no conductores, exclusivo del sistema de telecomunicaciones. Es una variante de las bandejas tradicionales, diseñada para el enrutamiento de cables de fibra óptica, aunque también puede usarse con cableado de cobre (UTP).</p>
          <p>Los mayores fabricantes son Panduit (FiberRunner) y CommScope (FiberGuide).</p>
          <p><b>Ventajas:</b> permite instalar la fibra óptica sin elementos adicionales (como el innerduct); son ligeras y de fácil instalación.</p>
          <p><b>Desventajas:</b> se fabrican en tamaños reducidos y requieren los accesorios específicos de cada solución para una correcta instalación.</p>
          <p class="small muted">En la herramienta: tipo «Ducto para fibra / Fiber duct» (Panduit FiberRunner 2×2 a 24×4).</p>
        </div>
        <div class="fotos completas">
          ${foto('fibra-transicion.jpg', 'Ejemplo de transición')}
          ${foto('fibra-instalacion.jpg', 'Ejemplo de instalación')}
        </div>
      </div>
      ${foto('fibra-tamanos.jpg', 'Tamaños típicos (Panduit FiberRunner)')}
    </section>`;
  }

  function renderHelp() {
    view.innerHTML = `
    <section class="card">
      <h2 style="margin-bottom:10px">Cómo usar la herramienta <span class="en">/ How to use</span></h2>
      <ol>
        <li><b>Proyecto (A):</b> llene los datos del proyecto (aplican a todo el edificio).</li>
        <li><b>Tipos de cable (B):</b> para cada medio de transmisión seleccione el tipo de cable. Si requiere otro tipo, use los <b>tipos adicionales (C–E)</b>: nombre, descripción y diámetro externo en pulgadas.</li>
        <li><b>Criterios (F):</b> seleccione el % de llenado de canalizaciones y de organizadores, y la marca de canasta.</li>
        <li><b>Niveles:</b> agregue los niveles del edificio (N01, N02, S1, AZOTEA…). Cada nivel aparece como una pestaña.</li>
        <li><b>Sección A de cada nivel (N01-A, canalizaciones):</b> identifique cada sección de canalización, seleccione el tipo y la cantidad de cables de cada tipo. La herramienta muestra la canalización recomendada y su número de parte. En <i>Selección</i> deje "Automática" o elija otra; el % de llenado real se calcula con la canalización elegida.</li>
        <li><b>Sección B (N01-B, tuberías):</b> identifique cada tubería, su tipo y la cantidad de cables (un solo tipo de cable por tubería). Se muestra el diámetro requerido según NEC y las advertencias (jam ratio, longitud, curvas).</li>
        <li><b>Sección C (N01-C, organizadores):</b> seleccione el tipo de organizador e ingrese la cantidad de cables.</li>
        <li><b>Memoria de cálculo:</b> consolida niveles, tramos por tamaño, tuberías por diámetro, organizadores y el detalle de tramos. Puede imprimirse o guardarse como PDF y exportarse a CSV.</li>
      </ol>
      <div class="callout">Los proyectos se guardan automáticamente en este navegador. Use <b>Exportar</b> para respaldar o compartir un proyecto (.json) e <b>Importar</b> para abrirlo en otro equipo. En una siguiente etapa los datos se guardarán en la base de datos (Supabase).</div>
    </section>
    ${tiposCanalizacion()}
    <section class="card">
      <h3 style="margin-bottom:8px">Símbolos</h3>
      <p>% de llenado real de canalizaciones, sobre el área total: <span class="badge ok">28 %</span> dentro del criterio de diseño · <span class="badge warn">42 %</span> supera el criterio de diseño · <span class="badge err">55 %</span> excede el máximo de 50 % (TIA-569-E cap. 9 / BICSI; aeroducto 20 % NEC 376.22).</p><p>Criterio Sinergia de prellenado: <b>30 %</b>.</p>
      <p>❌ error que impide el cálculo · ⚠ advertencia a revisar · ✓ verificación correcta.</p>
    </section>
    <section class="card">
      <h3 style="margin-bottom:8px">Referencias bibliográficas <span class="en">/ References</span></h3>
      <ul>
        <li>ANSI/TIA-569-E — Telecommunications Pathways and Spaces (Cap. 8, Sec. 8.8.2.3, Tablas 9-10-11; Cap. 9, Sec. 9.7.1.1).</li>
        <li>BICSI — Telecommunications Distribution Methods Manual (TDMM), 14.ª ed., Cap. 6.</li>
        <li>NFPA 70 — National Electrical Code 2020, Cap. 9 Tabla 1 y Art. 376.22(A).</li>
        <li>Catálogos Panduit (canasta Wyr-Grid, FiberRunner, organizadores) y Legrand Cablofil.</li>
      </ul>
    </section>
    ${footnotes()}`;
  }

  // ============ Eventos de la vista ============
  view.addEventListener('input', (e) => {
    if (S.tab === 'proyecto') onProjectInput(e);
    else if (level()) onLevelInput(e);
  });
  view.addEventListener('change', (e) => {
    if (e.target.id === 'memLevel') { S.memLevel = e.target.value; renderMemoria(); return; }
    if (level() && e.target.dataset.k === 'typeId') onLevelInput(e);
    if (level() && e.target.dataset.k !== 'typeId') renderTabs();
  });

  view.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act, p = S.project;
    const lvlIdx = (id) => p.levels.findIndex((l) => l.id === id);
    switch (act) {
      case 'addCable':
        p.cables.push({ id: uid(), mediaId: 'custom', label: 'Tipo ' + (p.cables.filter((c) => c.mediaId === 'custom').length + 1), description: '', od_in: '' });
        markDirty(); render(); break;
      case 'delCable': {
        const ok = await confirmDlg('Quitar tipo de cable', 'Las cantidades ingresadas para este tipo en los niveles dejarán de considerarse.', 'Quitar');
        if (!ok) return;
        p.cables = p.cables.filter((c) => c.id !== b.dataset.id);
        markDirty(); render(); break;
      }
      case 'addLevel': addLevel(); break;
      case 'genLevels': genLevels(); break;
      case 'openLevel': S.tab = b.dataset.id; render(); window.scrollTo(0, 0); break;
      case 'lvlUp': case 'lvlDown': {
        const i = lvlIdx(b.dataset.id), j = act === 'lvlUp' ? i - 1 : i + 1;
        if (j < 0 || j >= p.levels.length) return;
        [p.levels[i], p.levels[j]] = [p.levels[j], p.levels[i]];
        markDirty(); render(); break;
      }
      case 'dupLevel': {
        const i = lvlIdx(b.dataset.id);
        const c = cloneLevel(p.levels[i]);
        p.levels.splice(i + 1, 0, c);
        S.tab = c.id; markDirty(); render(); window.scrollTo(0, 0); toast('Nivel duplicado');
        break;
      }
      case 'delLevel': {
        const l = p.levels[lvlIdx(b.dataset.id)];
        const ok = await confirmDlg('Eliminar nivel', `Se eliminará el nivel <b>${esc(l.code)} — ${esc(l.name)}</b> con todos sus tramos.`);
        if (!ok) return;
        p.levels = p.levels.filter((x) => x.id !== l.id);
        if (S.tab === l.id) S.tab = 'proyecto';
        markDirty(); render(); break;
      }
      case 'addRow': case 'addRows': {
        const l = level(), sec = b.dataset.sec;
        const mk = { pathways: emptyPathway, conduits: emptyConduit, managers: () => emptyManager() }[sec];
        const n = act === 'addRows' ? 5 : 1;
        for (let i = 0; i < n; i++) l[sec].push(mk());
        markDirty(); render(); break;
      }
      case 'dupRow': {
        const l = level(), arr = l[b.dataset.sec];
        const i = arr.findIndex((r) => r.id === b.dataset.id);
        const c = JSON.parse(JSON.stringify(arr[i])); c.id = uid();
        arr.splice(i + 1, 0, c);
        markDirty(); render(); break;
      }
      case 'delRow': {
        const l = level(), sec = b.dataset.sec;
        l[sec] = l[sec].filter((r) => r.id !== b.dataset.id);
        markDirty(); render(); break;
      }
      case 'verTipos':
        e.preventDefault();
        S.tab = 'ayuda'; render();
        document.getElementById('tipos-canalizacion').scrollIntoView({ behavior: 'smooth' });
        break;
      case 'print': window.print(); break;
      case 'csv': exportCsv(); break;
    }
  });

  // ============ Inicio ============
  // «← Suite» lleva al portal (APP_CONFIG.suiteUrl)
  document.getElementById('volverSuite').href = APP_CONFIG.suiteUrl || 'index.html';
  window.addEventListener('beforeunload', () => { if (S.saveTimer) save(); });
  window.addEventListener('storage', async (e) => {
    if (e.key === 'tc.catalog.v1') { S.catalog = await Store.getCatalog(); render(); toast('Catálogo actualizado'); }
  });

  async function init() {
    S.catalog = await Store.getCatalog();
    bindToolbar();
    const list = await Store.listProjects();
    const last = localStorage.getItem(LAST);
    let p = last ? await Store.getProject(last) : null;
    if (!p && list.length) p = await Store.getProject(list[0].id);
    if (!p) { p = newProject(); await Store.saveProject(p); }
    // enlace directo: index.html#memoria, #ayuda o #<código de nivel> (ej. #N01)
    const hashTab = decodeURIComponent(location.hash.slice(1));
    const hashLevel = (p.levels || []).find((l) => l.code === hashTab);
    await openProject(p, ['memoria', 'ayuda'].includes(hashTab) ? hashTab : hashLevel ? hashLevel.id : 'proyecto');
    saveState.textContent = 'Guardado ✓';
  }
  init();
})();
