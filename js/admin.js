/* Panel de administración de catálogos (solo administradores) */
(function () {
  const { esc, fmt, opt, toast, dialog, confirmDlg, download, readFile } = UI;
  const view = document.getElementById('view');
  const tabsEl = document.getElementById('tabs');
  const savebar = document.getElementById('savebar');
  const A = { cat: null, dirty: false, tab: 'cables', pType: 'all', pBrand: 'all', ctIdx: 0 };
  const TABS = [
    ['cables', 'Tipos de cable'], ['pathways', 'Canalizaciones y marcas'], ['conduits', 'Tuberías'],
    ['managers', 'Organizadores'], ['criteria', 'Criterios'], ['backup', 'Respaldo y seguridad']
  ];
  const num = Calc.num;
  const slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'id';

  // ---------- utilidades de enlace de datos ----------
  const getPath = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), A.cat);
  function setPath(path, val) {
    const ks = path.split('.');
    const parent = ks.slice(0, -1).reduce((o, k) => o[k], A.cat);
    parent[ks[ks.length - 1]] = val;
  }
  const inp = (path, cls = 'w-txt', type = 'text', extra = '') => {
    const v = getPath(path);
    return `<input class="${cls}" data-b="${path}" data-t="${type === 'number' ? 'n' : 's'}" type="${type}" ${type === 'number' ? 'step="any"' : ''} value="${esc(v ?? '')}" ${extra}>`;
  };
  const chk = (path) => `<input type="checkbox" data-b="${path}" data-t="b" ${getPath(path) !== false ? 'checked' : ''}>`;
  const del = (arrPath, i, what = 'fila') => `<button class="btn icon danger" data-del="${arrPath}" data-i="${i}" title="Eliminar ${what}">✕</button>`;

  function setDirty(v = true) {
    A.dirty = v;
    savebar.classList.toggle('hidden', !v);
  }

  // ---------- Login ----------
  async function start() {
    if (await Store.auth.isAdmin()) return openAdmin();
    tabsEl.classList.add('hidden');
    view.innerHTML = `
      <form class="card login" id="loginForm">
        <h2 style="margin-bottom:6px">Acceso de administrador</h2>
        <p class="muted small">Solo los administradores pueden agregar o modificar marcas, tipos de canastas, tuberías, organizadores y tipos de cableado.</p>
        <label class="field" style="margin:12px 0"><span>Contraseña</span><input type="password" name="pw" autocomplete="current-password" required autofocus></label>
        <p class="small" id="loginErr" style="color:var(--err);min-height:1em"></p>
        <button class="btn primary" type="submit">Ingresar</button>
      </form>`;
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const ok = await Store.auth.login(e.target.pw.value);
      if (ok) openAdmin();
      else document.getElementById('loginErr').textContent = 'Contraseña incorrecta.';
    });
  }

  async function openAdmin() {
    A.cat = await Store.getCatalog();
    setDirty(false);
    document.getElementById('btnLogout').classList.remove('hidden');
    tabsEl.classList.remove('hidden');
    render();
  }

  document.getElementById('btnLogout').addEventListener('click', async () => {
    if (A.dirty && !(await confirmDlg('Cerrar sesión', 'Hay cambios sin guardar que se perderán.', 'Cerrar sesión'))) return;
    await Store.auth.logout(); setDirty(false);
    document.getElementById('btnLogout').classList.add('hidden');
    start();
  });
  document.getElementById('btnSave').addEventListener('click', saveCatalog);
  document.getElementById('btnDiscard').addEventListener('click', async () => {
    if (!(await confirmDlg('Descartar cambios', 'Se volverá al último catálogo guardado.', 'Descartar'))) return;
    A.cat = await Store.getCatalog(); setDirty(false); render();
  });
  window.addEventListener('beforeunload', (e) => { if (A.dirty) { e.preventDefault(); e.returnValue = ''; } });

  async function saveCatalog() {
    const problems = validate();
    if (problems.length) {
      dialog({ title: 'Revise el catálogo', message: '<ul>' + problems.slice(0, 12).map((p) => `<li>${esc(p)}</li>`).join('') + '</ul>', cancelLabel: '' });
      return;
    }
    try {
      await Store.saveCatalog(A.cat);
      setDirty(false); toast('Catálogo guardado');
    } catch (err) {
      dialog({ title: 'No se pudo guardar', message: esc(err.message), cancelLabel: '' });
    }
  }

  function validate() {
    const c = A.cat, out = [];
    c.cableMedia.forEach((m) => {
      if (!m.name) out.push(`Medio "${m.id}" sin nombre.`);
      m.cables.forEach((x) => { if (!x.name || !(num(x.od_in) > 0)) out.push(`${m.name}: cable "${x.name || '(sin nombre)'}" requiere nombre y OD > 0.`); });
    });
    c.pathwayProducts.forEach((p) => {
      if (!p.label || !p.brand || !p.typeId) out.push(`Canalización "${p.label || p.id}": requiere tipo, marca y descripción.`);
      if (!(num(p.totalArea_mm2) > 0)) out.push(`Canalización "${p.label}" (${p.brand}): área total debe ser > 0.`);
    });
    c.conduitTypes.forEach((t) => t.sizes.forEach((s) => {
      if (!(num(s.trade) > 0) || !(num(s.id_in) > 0)) out.push(`Tubería ${t.id}: tamaño comercial e ID deben ser > 0.`);
    }));
    c.managerTypes.forEach((t) => t.products.forEach((p) => {
      if (!(num(p.area_in2) > 0)) out.push(`Organizador ${t.name}: "${p.label}" requiere área > 0.`);
    }));
    return out;
  }

  // ---------- Render ----------
  function render() {
    tabsEl.innerHTML = TABS.map(([id, label]) => `<button class="tab ${A.tab === id ? 'active' : ''}" data-tab="${id}">${label}</button>`).join('');
    const y = window.scrollY;
    ({ cables: renderCables, pathways: renderPathways, conduits: renderConduits, managers: renderManagers, criteria: renderCriteria, backup: renderBackup })[A.tab]();
    window.scrollTo(0, y);
  }
  tabsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    A.tab = b.dataset.tab; render(); window.scrollTo(0, 0);
  });

  // Cables
  function renderCables() {
    const c = A.cat;
    view.innerHTML = `
      <section class="card">
        <div class="card-head"><h2>Tipos de cable por medio de transmisión</h2>
          <button class="btn sm" data-act="addMedia">+ Agregar medio de transmisión</button></div>
        <p class="muted small" style="margin-top:-6px">El diámetro externo (OD) se ingresa en pulgadas; el área se calcula como π·(OD/2)². Cada medio aparece como una fila en la sección B del proyecto.</p>
        ${c.cableMedia.map((m, mi) => `
          <div class="media-card">
            <div class="row-inline" style="margin-bottom:8px">
              <label class="field"><span>Nombre del medio</span>${inp(`cableMedia.${mi}.name`)}</label>
              <label class="field"><span>Nombre corto (encabezado)</span>${inp(`cableMedia.${mi}.short`, 'w-pn')}</label>
              <label class="field" style="flex-direction:row;align-items:center;gap:6px;padding-bottom:6px">${chk(`cableMedia.${mi}.allowInConduit`)}<span>Permitido en tuberías</span></label>
              <span class="muted small" style="padding-bottom:8px">id: ${esc(m.id)}</span>
              <span style="flex:1"></span>
              ${del('cableMedia', mi, 'medio de transmisión')}
            </div>
            <div class="table-wrap"><table>
              <thead><tr><th>Tipo de cable</th><th class="num">OD (in)</th><th class="num">OD (mm)</th><th class="num">Área (mm²)</th><th></th></tr></thead>
              <tbody>${m.cables.map((x, i) => `<tr data-calc="cable" data-p="cableMedia.${mi}.cables.${i}">
                <td>${inp(`cableMedia.${mi}.cables.${i}.name`)}</td>
                <td class="num">${inp(`cableMedia.${mi}.cables.${i}.od_in`, 'w-num', 'number', 'min="0"')}</td>
                ${cableCalc(x)}
                <td class="actions">${del(`cableMedia.${mi}.cables`, i, 'cable')}</td></tr>`).join('')}</tbody>
            </table></div>
            <button class="btn sm" style="margin-top:6px" data-add="cableMedia.${mi}.cables" data-tpl="cable">+ Agregar tipo de cable</button>
          </div>`).join('')}
      </section>`;
  }
  const cableCalc = (x) => `<td class="num calc" data-c>${num(x.od_in) ? fmt(num(x.od_in) * 25.4, 2) : ''}</td>
    <td class="num calc" data-c>${num(x.od_in) ? fmt(Calc.circleArea(x.od_in), 2) : ''}</td>`;

  // Canalizaciones
  function brandsOf(typeId) {
    return [...new Set(A.cat.pathwayProducts.filter((p) => typeId === 'all' || p.typeId === typeId).map((p) => p.brand))].sort();
  }
  function productCalc(p) {
    const t = A.cat.pathwayTypes.find((x) => x.id === p.typeId);
    const u = Calc.usableArea(p, t);
    return `<td class="num calc" data-c>${fmt(u, 0)}</td><td class="num calc" data-c>${fmt(u * 0.8, 0)}</td>`;
  }
  function renderPathways() {
    const c = A.cat;
    const allBrands = brandsOf('all');
    const rows = c.pathwayProducts.map((p, i) => ({ p, i }))
      .filter(({ p }) => (A.pType === 'all' || p.typeId === A.pType) && (A.pBrand === 'all' || p.brand === A.pBrand));
    view.innerHTML = `
      <section class="card">
        <div class="card-head"><h2>Tipos de canalización</h2>
          <button class="btn sm" data-act="addPType">+ Agregar tipo</button></div>
        <div class="table-wrap"><table>
          <thead><tr><th>id</th><th>Nombre</th><th class="num">Factor de área útil</th><th>Base normativa</th><th class="num">Productos</th><th></th></tr></thead>
          <tbody>${c.pathwayTypes.map((t, i) => `<tr>
            <td class="muted">${esc(t.id)}</td><td>${inp(`pathwayTypes.${i}.name`)}</td>
            <td class="num">${inp(`pathwayTypes.${i}.usableFactor`, 'w-num', 'number', 'min="0" max="1"')}</td>
            <td>${inp(`pathwayTypes.${i}.basis`, 'w-txt', 'text', 'style="min-width:320px"')}</td>
            <td class="num">${c.pathwayProducts.filter((p) => p.typeId === t.id).length}</td>
            <td class="actions">${del('pathwayTypes', i, 'tipo')}</td></tr>`).join('')}</tbody>
        </table></div>
        <p class="note">Factor de área útil: canasta y escalera 0,5 (TIA-569-E); aeroducto 0,2 (NEC 376.22). La capacidad de diseño = área total × factor × (% llenado / 50 %).</p>
      </section>
      <section class="card">
        <div class="card-head"><h2>Productos por marca</h2>
          <button class="btn sm" data-act="addBrand">+ Agregar marca</button>
          <button class="btn sm" data-act="addProduct">+ Agregar producto</button>
          <button class="btn sm" data-act="sortProducts" title="Ordena por tipo, marca y capacidad">Ordenar por capacidad</button></div>
        <div class="filters">
          <label class="field"><span>Tipo</span><select id="fType">${opt('all', 'Todos', A.pType === 'all')}${c.pathwayTypes.map((t) => opt(t.id, t.name, t.id === A.pType)).join('')}</select></label>
          <label class="field"><span>Marca</span><select id="fBrand">${opt('all', 'Todas', A.pBrand === 'all')}${brandsOf(A.pType).map((b) => opt(b, b, b === A.pBrand)).join('')}</select></label>
          <span class="muted small" style="padding-bottom:8px">${rows.length} productos · marcas: ${esc(allBrands.join(', '))}</span>
        </div>
        <datalist id="brandList">${allBrands.map((b) => `<option value="${esc(b)}">`).join('')}</datalist>
        <div class="table-wrap"><table>
          <thead><tr><th>Tipo</th><th>Marca</th><th>Descripción (Alto × Ancho)</th><th>Número de parte</th><th class="num">Ancho (mm)</th><th class="num">Alto (mm)</th><th class="num">Área total (mm²)</th><th class="num">Factor útil (opcional)</th><th class="num">Área útil (mm²)</th><th class="num">Capacidad @40 % (mm²)</th><th></th></tr></thead>
          <tbody>${rows.map(({ p, i }) => `<tr data-calc="product" data-p="pathwayProducts.${i}">
            <td><select data-b="pathwayProducts.${i}.typeId" data-t="s">${c.pathwayTypes.map((t) => opt(t.id, t.name, t.id === p.typeId)).join('')}</select></td>
            <td>${inp(`pathwayProducts.${i}.brand`, 'w-pn', 'text', 'list="brandList"')}</td>
            <td>${inp(`pathwayProducts.${i}.label`)}</td>
            <td>${inp(`pathwayProducts.${i}.partNumber`, 'w-pn')}</td>
            <td class="num">${inp(`pathwayProducts.${i}.width_mm`, 'w-num', 'number')}</td>
            <td class="num">${inp(`pathwayProducts.${i}.height_mm`, 'w-num', 'number')}</td>
            <td class="num">${inp(`pathwayProducts.${i}.totalArea_mm2`, 'w-num', 'number')}</td>
            <td class="num">${inp(`pathwayProducts.${i}.usableFactor`, 'w-num', 'number', 'placeholder="del tipo"')}</td>
            ${productCalc(p)}
            <td class="actions"><button class="btn icon" data-act="areaWH" data-i="${i}" title="Área total = ancho × alto">W×H</button> ${del('pathwayProducts', i, 'producto')}</td></tr>`).join('') || '<tr><td colspan="11" class="muted">Sin productos para este filtro.</td></tr>'}</tbody>
        </table></div>
        <p class="note">Las listas de selección en la herramienta muestran los productos del tipo y marca elegidos en el proyecto, ordenados por capacidad. Para Cablofil el área total corresponde al área de llenado del fabricante (in² × 645,16).</p>
      </section>`;
  }

  // Tuberías
  function sizeCalc(s) {
    const a = Calc.circleArea(s.id_in);
    return `<td class="num calc" data-c>${num(s.id_in) ? fmt(a / Calc.IN2_TO_MM2, 3) : ''}</td>
      <td class="num calc" data-c>${num(s.id_in) ? fmt(a, 1) : ''}</td>
      <td class="num calc" data-c>${num(s.id_in) ? fmt(a * 0.4, 1) : ''}</td>`;
  }
  function renderConduits() {
    const c = A.cat;
    A.ctIdx = Math.min(A.ctIdx, c.conduitTypes.length - 1);
    const t = c.conduitTypes[A.ctIdx];
    view.innerHTML = `
      <section class="card">
        <div class="card-head"><h2>Tipos de tubería</h2><button class="btn sm" data-act="addCType">+ Agregar tipo</button></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Habilitada</th><th>id</th><th>Nombre</th><th class="num">Tamaño mínimo (in)</th><th class="num">Tamaños</th><th></th></tr></thead>
          <tbody>${c.conduitTypes.map((x, i) => `<tr${i === A.ctIdx ? ' style="background:var(--primary-soft)"' : ''}>
            <td class="center">${chk(`conduitTypes.${i}.enabled`)}</td><td>${esc(x.id)}</td>
            <td>${inp(`conduitTypes.${i}.name`, 'w-txt', 'text', 'style="min-width:280px"')}</td>
            <td class="num">${inp(`conduitTypes.${i}.minSize`, 'w-num', 'number')}</td>
            <td class="num">${x.sizes.length}</td>
            <td class="actions"><button class="btn sm" data-act="editCType" data-i="${i}">Editar tamaños</button> ${del('conduitTypes', i, 'tipo de tubería')}</td></tr>`).join('')}</tbody>
        </table></div>
        <p class="note">Solo los tipos habilitados aparecen en la lista de la herramienta. Tamaño mínimo para telecomunicaciones: 3/4" (EB: 2").</p>
      </section>
      ${t ? `<section class="card">
        <div class="card-head"><h2>Tamaños — ${esc(t.name)}</h2><button class="btn sm" data-add="conduitTypes.${A.ctIdx}.sizes" data-tpl="size">+ Agregar tamaño</button></div>
        <div class="table-wrap"><table>
          <thead><tr><th class="num">Tamaño comercial (in)</th><th class="num">Diámetro interno ID (in)</th><th class="num">Área (in²)</th><th class="num">Área (mm²)</th><th class="num">Área al 40 % (mm²)</th><th></th></tr></thead>
          <tbody>${t.sizes.map((s, i) => `<tr data-calc="size" data-p="conduitTypes.${A.ctIdx}.sizes.${i}">
            <td class="num">${inp(`conduitTypes.${A.ctIdx}.sizes.${i}.trade`, 'w-num', 'number')}</td>
            <td class="num">${inp(`conduitTypes.${A.ctIdx}.sizes.${i}.id_in`, 'w-num', 'number')}</td>
            ${sizeCalc(s)}
            <td class="actions">${del(`conduitTypes.${A.ctIdx}.sizes`, i, 'tamaño')}</td></tr>`).join('')}</tbody>
        </table></div>
        <p class="note">Fuente: NEC 2020, Cap. 9, Tabla 4. Los tamaños se ordenan automáticamente al calcular.</p>
      </section>` : ''}`;
  }

  // Organizadores
  function renderManagers() {
    const c = A.cat;
    view.innerHTML = `
      <section class="card">
        <div class="card-head"><h2>Organizadores de cable</h2><button class="btn sm" data-act="addMType">+ Agregar tipo de organizador</button></div>
        <p class="muted small" style="margin-top:-6px">Área de llenado del fabricante en in². Capacidad de diseño = área × 645,16 × (% llenado / 50 %).</p>
        ${c.managerTypes.map((t, ti) => `<div class="media-card">
          <div class="row-inline" style="margin-bottom:8px">
            <label class="field"><span>Tipo de organizador</span>${inp(`managerTypes.${ti}.name`, 'w-txt', 'text', 'style="min-width:320px"')}</label>
            <label class="field"><span>Marca</span>${inp(`managerTypes.${ti}.brand`, 'w-pn')}</label>
            <span class="muted small" style="padding-bottom:8px">id: ${esc(t.id)}</span><span style="flex:1"></span>${del('managerTypes', ti, 'tipo de organizador')}
          </div>
          <div class="table-wrap"><table>
            <thead><tr><th>Descripción</th><th>Número de parte</th><th class="num">Área (in²)</th><th class="num">Área (mm²)</th><th></th></tr></thead>
            <tbody>${t.products.map((p, i) => `<tr data-calc="mgr" data-p="managerTypes.${ti}.products.${i}">
              <td>${inp(`managerTypes.${ti}.products.${i}.label`)}</td>
              <td>${inp(`managerTypes.${ti}.products.${i}.partNumber`, 'w-pn')}</td>
              <td class="num">${inp(`managerTypes.${ti}.products.${i}.area_in2`, 'w-num', 'number')}</td>
              <td class="num calc" data-c>${fmt(num(p.area_in2) * Calc.IN2_TO_MM2, 1)}</td>
              <td class="actions">${del(`managerTypes.${ti}.products`, i, 'organizador')}</td></tr>`).join('')}</tbody>
          </table></div>
          <button class="btn sm" style="margin-top:6px" data-add="managerTypes.${ti}.products" data-tpl="mgr">+ Agregar modelo</button>
        </div>`).join('')}
      </section>`;
  }

  // Criterios
  function renderCriteria() {
    const c = A.cat;
    view.innerHTML = `
      <section class="card">
        <div class="card-head"><h2>Opciones de % de llenado</h2><button class="btn sm" data-add="fillOptions" data-tpl="fill">+ Agregar opción</button></div>
        <div class="table-wrap"><table>
          <thead><tr><th class="num">% de llenado (0–0,5)</th><th>Descripción</th><th></th></tr></thead>
          <tbody>${c.fillOptions.map((f, i) => `<tr><td class="num">${inp(`fillOptions.${i}.value`, 'w-num', 'number', 'min="0.05" max="0.5"')}</td>
            <td>${inp(`fillOptions.${i}.label`, 'w-txt', 'text', 'style="min-width:520px"')}</td><td class="actions">${del('fillOptions', i, 'opción')}</td></tr>`).join('')}</tbody>
        </table></div>
        <p class="note">El % se aplica sobre el área total; 50 % equivale a la canalización al 100 % de su área útil.</p>
      </section>
      <section class="card">
        <h2 style="margin-bottom:10px">Tuberías — NEC 2020 Cap. 9 Tabla 1</h2>
        <div class="grid">
          <label class="field"><span>1 cable</span>${inp('necFill.one', 'w-num', 'number')}</label>
          <label class="field"><span>2 cables</span>${inp('necFill.two', 'w-num', 'number')}</label>
          <label class="field"><span>3 o más cables</span>${inp('necFill.more', 'w-num', 'number')}</label>
          <label class="field"><span>Jam ratio mínimo</span>${inp('jamRatio.min', 'w-num', 'number')}</label>
          <label class="field"><span>Jam ratio máximo</span>${inp('jamRatio.max', 'w-num', 'number')}</label>
          <label class="field"><span>Factor jam ratio (1,05 × ID / OD)</span>${inp('jamRatio.factor', 'w-num', 'number')}</label>
          <label class="field"><span>Longitud máxima entre cajas (m)</span>${inp('conduitLimits.maxLength_m', 'w-num', 'number')}</label>
          <label class="field"><span>Curvas de 90° máximas</span>${inp('conduitLimits.maxBends', 'w-num', 'number')}</label>
        </div>
      </section>`;
  }

  // Respaldo
  function renderBackup() {
    view.innerHTML = `
      <section class="card">
        <h2 style="margin-bottom:10px">Versión del catálogo</h2>
        <div class="row-inline">
          <label class="field"><span>Versión</span>${inp('version', 'w-pn')}</label>
          <span class="muted small" style="padding-bottom:8px">Última actualización: ${esc(A.cat.updated || '—')} · ${Store.hasCustomCatalog() ? 'catálogo modificado guardado en este navegador' : 'usando el catálogo por defecto del repositorio'}</span>
        </div>
      </section>
      <section class="card">
        <h2 style="margin-bottom:10px">Respaldo</h2>
        <div class="row-inline">
          <button class="btn" data-act="exportCat">Exportar catálogo (.json)</button>
          <button class="btn" data-act="importCat">Importar catálogo (.json)</button>
          <button class="btn danger" data-act="resetCat">Restaurar catálogo por defecto</button>
          <input type="file" id="catFile" accept=".json,application/json" hidden>
        </div>
        <p class="note">Mientras no exista la base de datos, los cambios se guardan en este navegador. Para publicarlos a todos los usuarios exporte el catálogo y reemplace <code>js/catalog-default.js</code> en el repositorio (o espere a la etapa con Supabase).</p>
      </section>
      <section class="card">
        <h2 style="margin-bottom:10px">Contraseña de administrador</h2>
        <form id="pwForm" class="row-inline">
          <label class="field"><span>Contraseña actual</span><input type="password" name="cur" autocomplete="current-password" required></label>
          <label class="field"><span>Nueva contraseña</span><input type="password" name="next" minlength="8" autocomplete="new-password" required></label>
          <button class="btn" type="submit">Cambiar</button>
        </form>
        <p class="callout warn" style="margin-top:12px">Este acceso es provisional y solo protege la interfaz en este navegador. La seguridad real de permisos (usuarios y rol administrador) se implementará con Supabase Auth y políticas RLS en la siguiente etapa.</p>
      </section>`;
    document.getElementById('pwForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const ok = await Store.auth.changePassword(e.target.cur.value, e.target.next.value);
      if (ok) { e.target.reset(); toast('Contraseña actualizada'); }
      else dialog({ title: 'No se pudo cambiar', message: 'La contraseña actual no es correcta.', cancelLabel: '' });
    });
    const f = document.getElementById('catFile');
    f.addEventListener('change', async () => {
      const file = f.files[0]; f.value = '';
      if (!file) return;
      try {
        const data = JSON.parse(await readFile(file));
        const cat = data.catalog || data;
        if (!Array.isArray(cat.cableMedia) || !Array.isArray(cat.pathwayProducts) || !Array.isArray(cat.conduitTypes)) throw new Error();
        A.cat = cat; setDirty(true); render(); toast('Catálogo importado: revise y guarde');
      } catch (err) {
        dialog({ title: 'Archivo no válido', message: 'El archivo no contiene un catálogo de esta herramienta.', cancelLabel: '' });
      }
    });
  }

  // ---------- Eventos ----------
  const TPL = {
    cable: () => ({ name: '', od_in: '' }),
    size: () => ({ trade: '', id_in: '' }),
    mgr: () => ({ label: '', partNumber: '', area_in2: '' }),
    fill: () => ({ value: '', label: '' })
  };
  const CALC = {
    cable: (x) => cableCalc(x), product: (p) => productCalc(p), size: (s) => sizeCalc(s),
    mgr: (p) => `<td class="num calc" data-c>${fmt(num(p.area_in2) * Calc.IN2_TO_MM2, 1)}</td>`
  };

  view.addEventListener('input', (e) => {
    const t = e.target;
    if (!t.dataset.b) return;
    let v = t.value;
    if (t.dataset.t === 'n') v = v === '' ? '' : parseFloat(v);
    if (t.dataset.t === 'b') v = t.checked;
    setPath(t.dataset.b, v);
    setDirty(true);
    const tr = t.closest('tr[data-calc]');
    if (tr) {
      const tmp = document.createElement('tr');
      tmp.innerHTML = CALC[tr.dataset.calc](getPath(tr.dataset.p));
      const olds = tr.querySelectorAll('[data-c]'), news = tmp.querySelectorAll('[data-c]');
      olds.forEach((o, i) => { o.innerHTML = news[i].innerHTML; });
    }
  });
  view.addEventListener('change', (e) => {
    if (e.target.id === 'fType') { A.pType = e.target.value; A.pBrand = 'all'; render(); }
    else if (e.target.id === 'fBrand') { A.pBrand = e.target.value; render(); }
    else if (e.target.tagName === 'SELECT' && e.target.dataset.b) render();
  });

  view.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const c = A.cat;
    if (b.dataset.del) {
      const arr = getPath(b.dataset.del), i = +b.dataset.i;
      const big = /^(cableMedia|pathwayTypes|conduitTypes|managerTypes)$/.test(b.dataset.del);
      if (big && !(await confirmDlg('Eliminar', 'Se eliminará el elemento y todo su contenido. Los proyectos que lo usen mostrarán una advertencia.'))) return;
      if (b.dataset.del === 'pathwayTypes') {
        const id = arr[i].id;
        c.pathwayProducts = c.pathwayProducts.filter((p) => p.typeId !== id);
      }
      arr.splice(i, 1); setDirty(true); render(); return;
    }
    if (b.dataset.add) { getPath(b.dataset.add).push(TPL[b.dataset.tpl]()); setDirty(true); render(); return; }
    switch (b.dataset.act) {
      case 'addMedia': {
        const r = await dialog({ title: 'Nuevo medio de transmisión', fields: [{ name: 'name', label: 'Nombre (ej. Cable de control)' }, { name: 'short', label: 'Nombre corto (encabezado de columna)' }], okLabel: 'Agregar' });
        if (!r || !r.name.trim()) return;
        let id = slug(r.name); while (c.cableMedia.some((m) => m.id === id)) id += '_2';
        c.cableMedia.push({ id, name: r.name.trim(), short: r.short.trim() || r.name.trim(), allowInConduit: true, cables: [TPL.cable()] });
        setDirty(true); render(); break;
      }
      case 'addPType': {
        const r = await dialog({ title: 'Nuevo tipo de canalización', fields: [{ name: 'name', label: 'Nombre (ej. Bandeja sólida / Solid tray)' }, { name: 'factor', label: 'Factor de área útil (0–1)', type: 'number', value: 0.5, attrs: 'step="any" min="0" max="1"' }], okLabel: 'Agregar' });
        if (!r || !r.name.trim()) return;
        let id = slug(r.name); while (c.pathwayTypes.some((t) => t.id === id)) id += '_2';
        c.pathwayTypes.push({ id, name: r.name.trim(), usableFactor: num(r.factor) || 0.5, basis: '' });
        setDirty(true); render(); break;
      }
      case 'addBrand': {
        const r = await dialog({
          title: 'Agregar marca', message: 'Se crea la marca con un primer producto vacío para completar.',
          fields: [{ name: 'type', label: 'Tipo de canalización', type: 'select', value: A.pType !== 'all' ? A.pType : c.pathwayTypes[0].id, options: c.pathwayTypes.map((t) => ({ value: t.id, label: t.name })) },
            { name: 'brand', label: 'Marca' }], okLabel: 'Agregar'
        });
        if (!r || !r.brand.trim()) return;
        c.pathwayProducts.push(newProduct(r.type, r.brand.trim()));
        A.pType = r.type; A.pBrand = r.brand.trim(); setDirty(true); render(); break;
      }
      case 'addProduct': {
        const type = A.pType !== 'all' ? A.pType : c.pathwayTypes[0].id;
        const brand = A.pBrand !== 'all' ? A.pBrand : (brandsOf(type)[0] || 'Genérico');
        c.pathwayProducts.push(newProduct(type, brand));
        setDirty(true); render(); break;
      }
      case 'sortProducts': {
        const order = (id) => c.pathwayTypes.findIndex((t) => t.id === id);
        c.pathwayProducts.sort((a, b2) => order(a.typeId) - order(b2.typeId) || a.brand.localeCompare(b2.brand) ||
          Calc.usableArea(a, c.pathwayTypes[order(a.typeId)]) - Calc.usableArea(b2, c.pathwayTypes[order(b2.typeId)]));
        setDirty(true); render(); break;
      }
      case 'areaWH': {
        const p = c.pathwayProducts[+b.dataset.i];
        p.totalArea_mm2 = Math.round(num(p.width_mm) * num(p.height_mm) * 100) / 100;
        setDirty(true); render(); break;
      }
      case 'addCType': {
        const r = await dialog({ title: 'Nuevo tipo de tubería', fields: [{ name: 'id', label: 'Código (ej. PEAD)' }, { name: 'name', label: 'Nombre' }], okLabel: 'Agregar' });
        if (!r || !r.id.trim()) return;
        const id = r.id.trim().toUpperCase();
        if (c.conduitTypes.some((t) => t.id === id)) { toast('Ya existe ese código'); return; }
        c.conduitTypes.push({ id, name: r.name.trim() || id, minSize: 0.75, enabled: true, sizes: [TPL.size()] });
        A.ctIdx = c.conduitTypes.length - 1; setDirty(true); render(); break;
      }
      case 'editCType': A.ctIdx = +b.dataset.i; render(); break;
      case 'addMType': {
        const r = await dialog({ title: 'Nuevo tipo de organizador', fields: [{ name: 'name', label: 'Nombre' }, { name: 'brand', label: 'Marca' }], okLabel: 'Agregar' });
        if (!r || !r.name.trim()) return;
        let id = slug(r.name); while (c.managerTypes.some((t) => t.id === id)) id += '_2';
        c.managerTypes.push({ id, name: r.name.trim(), brand: r.brand.trim(), products: [TPL.mgr()] });
        setDirty(true); render(); break;
      }
      case 'exportCat':
        download(`catalogo_canalizaciones_v${c.version || ''}.json`, JSON.stringify({ type: 'canalizaciones-telecom/catalogo', catalog: c }, null, 1));
        break;
      case 'importCat': document.getElementById('catFile').click(); break;
      case 'resetCat':
        if (!(await confirmDlg('Restaurar catálogo', 'Se descartarán todas las modificaciones y se usará el catálogo por defecto del repositorio.', 'Restaurar'))) return;
        A.cat = await Store.resetCatalog(); setDirty(false); render(); toast('Catálogo restaurado');
        break;
    }
  });

  function newProduct(typeId, brand) {
    return { id: `${typeId}-${slug(brand)}-${UI.uid()}`, typeId, brand, label: '', partNumber: '', width_mm: '', height_mm: '', totalArea_mm2: '' };
  }

  start();
})();
