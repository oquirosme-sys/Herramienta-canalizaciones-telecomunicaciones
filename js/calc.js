/* Motor de cálculo — reproduce las fórmulas del Excel "Calculo canalizaciones de telecomunicaciones REV1".
   Canalizaciones: ANSI/TIA-569-E 9.7.1.1 / BICSI TDMM 14 (canasta, escalera, ducto de fibra) y NEC 376.22(A) (aeroducto).
   Tuberías: NEC 2020 Cap. 9 Tabla 1 (53 % / 31 % / 40 %), tamaño mínimo por tipo, jam ratio para 3 cables. */
(function () {
  const IN2_TO_MM2 = 645.16;
  const TRADE_LABELS = {
    0.375: '3/8"', 0.5: '1/2"', 0.75: '3/4"', 1: '1"', 1.25: '1-1/4"', 1.5: '1-1/2"', 2: '2"',
    2.5: '2-1/2"', 3: '3"', 3.5: '3-1/2"', 4: '4"', 5: '5"', 6: '6"'
  };
  const EPS = 1e-9;

  const num = (v) => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
  const circleArea = (dIn) => { const d = num(dIn) * 25.4; return Math.PI * d * d / 4; };
  const tradeLabel = (t) => TRADE_LABELS[t] || (t + '"');
  const tradeLabelMm = (t) => `${tradeLabel(t)} (${Math.round(t * 25.4)} mm)`;

  /* Columnas de cable definidas en el proyecto (una por medio de transmisión + tipos personalizados). */
  function projectCables(project, catalog) {
    return (project.cables || []).map((c) => {
      let col;
      if (c.mediaId === 'custom') {
        col = {
          id: c.id, custom: true, mediaName: 'Tipo adicional',
          header: c.label || 'Otro', name: c.description || c.label || '', od_in: num(c.od_in), allowInConduit: true
        };
      } else {
        const m = catalog.cableMedia.find((x) => x.id === c.mediaId);
        if (!m) return null;
        const cab = m.cables.find((x) => x.name === c.cableName);
        const header = cab ? (m.id === 'utp' ? cab.name : `${m.short} ${cab.name}`) : m.short;
        col = {
          id: c.id, mediaId: m.id, mediaName: m.name, header, name: cab ? cab.name : '',
          od_in: cab ? num(cab.od_in) : 0, allowInConduit: m.allowInConduit !== false
        };
      }
      col.area = col.od_in > 0 ? circleArea(col.od_in) : 0;
      col.defined = col.od_in > 0;
      return col;
    }).filter(Boolean);
  }

  function context(project, catalog) {
    const fill = num(project.fillPathway) || 0.4;
    const fillMgr = num(project.fillManager) || 0.4;
    const cables = projectCables(project, catalog);
    return {
      project, catalog, cables, fill, fillMgr,
      definedCables: cables.filter((c) => c.defined),
      // Tabla K5:L11 del Excel: el % de llenado se aplica sobre el área útil (50 %) -> factor = % / 0.5
      fillLimit: fill / 0.5,
      fillLimitMgr: fillMgr / 0.5
    };
  }

  function sumCables(qty, ctx) {
    let area = 0, n = 0;
    const used = [], parts = [];
    ctx.definedCables.forEach((c) => {
      const q = Math.max(0, Math.floor(num(qty && qty[c.id])));
      if (q > 0) {
        area += q * c.area; n += q; used.push(c);
        parts.push(`${q} × ${c.header}`);
      }
    });
    return { area, n, used, text: parts.join(', ') };
  }

  // ---------- Canalizaciones (canasta, aeroducto, escalera, ducto de fibra) ----------
  function brandsFor(catalog, typeId) {
    return [...new Set(catalog.pathwayProducts.filter((p) => p.typeId === typeId).map((p) => p.brand))];
  }
  function brandFor(ctx, typeId) {
    const brands = brandsFor(ctx.catalog, typeId);
    const chosen = ctx.project.brands && ctx.project.brands[typeId];
    return brands.includes(chosen) ? chosen : brands[0];
  }
  function usableArea(p, type) {
    const f = p.usableFactor != null && p.usableFactor !== '' ? num(p.usableFactor) : num(type && type.usableFactor);
    return num(p.totalArea_mm2) * f;
  }
  function pathwayOptions(ctx, typeId) {
    const type = ctx.catalog.pathwayTypes.find((t) => t.id === typeId);
    const brand = brandFor(ctx, typeId);
    return ctx.catalog.pathwayProducts
      .filter((p) => p.typeId === typeId && p.brand === brand)
      .map((p) => ({ ...p, usable: usableArea(p, type), capacity: usableArea(p, type) * ctx.fillLimit }))
      .sort((a, b) => a.capacity - b.capacity);
  }

  function evalPathway(row, ctx) {
    const s = sumCables(row.qty, ctx);
    const r = {
      area: s.area, n: s.n, text: s.text, type: null, rec: null, sel: null, selMode: row.sel,
      fill: null, limit: null, max: null, errors: [], warnings: [], length: num(row.length), active: s.area > 0
    };
    if (!row.typeId) {
      if (s.area > 0) r.errors.push('Seleccione el tipo de canalización');
      return r;
    }
    r.type = ctx.catalog.pathwayTypes.find((t) => t.id === row.typeId) || null;
    if (!r.type) { r.errors.push('El tipo de canalización ya no existe en el catálogo'); return r; }
    const opts = pathwayOptions(ctx, row.typeId);
    r.options = opts;
    if (s.area > 0) {
      r.rec = opts.find((p) => p.capacity + EPS >= s.area) || null;
      if (!r.rec) r.errors.push('Excede la mayor canalización disponible: dividir el tramo');
    }
    if (row.sel === 'auto') r.sel = r.rec;
    else if (row.sel) {
      r.sel = opts.find((p) => p.id === row.sel) || null;
      if (!r.sel) r.warnings.push('La selección no corresponde al tipo/marca actual');
    }
    if (r.sel && s.area > 0) {
      // % de llenado real sobre el área total de la canalización.
      // Máximo = factor de área útil (50 % TIA-569-E cap. 9 / BICSI; 20 % aeroducto NEC 376.22(A)).
      r.max = r.sel.usable / num(r.sel.totalArea_mm2);
      r.limit = r.max * ctx.fillLimit;
      r.fill = s.area / num(r.sel.totalArea_mm2);
      const norma = r.type.id === 'aeroducto' ? 'NEC 2020 Art. 376.22(A)' : 'TIA-569-E cap. 9 / BICSI';
      if (r.fill > r.max + EPS) r.errors.push(`Excede el llenado máximo de ${Math.round(r.max * 100)} % (${norma})`);
      else if (r.fill > r.limit + EPS) r.warnings.push(`Supera el criterio de diseño de ${Math.round(r.limit * 100)} %`);
    }
    if (s.area > 0 && row.sel === '') r.warnings.push('Sin selección');
    return r;
  }

  // ---------- Tuberías ----------
  function necFill(n, catalog) {
    const f = catalog.necFill || { one: 0.53, two: 0.31, more: 0.4 };
    return n === 1 ? num(f.one) : n === 2 ? num(f.two) : num(f.more);
  }

  function evalConduit(row, ctx) {
    const s = sumCables(row.qty, ctx);
    const cat = ctx.catalog;
    const r = {
      area: s.area, n: s.n, text: s.text, size: null, sizeLabel: '', mm: null, nec: null, fillReal: null,
      errors: [], warnings: [], info: [], length: num(row.length), bends: num(row.bends), active: s.n > 0
    };
    if (s.n === 0) return r;
    if (s.used.some((c) => !c.allowInConduit)) r.errors.push('Innerduct no se usa en tubería / not used in conduit');
    else if (s.used.length > 1) r.errors.push('No mezclar tipos de cable / do not mix cable types');
    const ct = cat.conduitTypes.find((t) => t.id === row.typeId);
    if (!row.typeId) r.errors.push('Seleccione el tipo de tubería');
    else if (!ct) r.errors.push('El tipo de tubería ya no existe en el catálogo');
    if (r.errors.length) return r;

    r.nec = necFill(s.n, cat);
    const sizes = ct.sizes.filter((x) => num(x.trade) + EPS >= num(ct.minSize))
      .sort((a, b) => num(a.trade) - num(b.trade));
    r.size = sizes.find((x) => circleArea(x.id_in) * r.nec + EPS >= s.area) || null;
    if (!r.size) {
      r.sizeLabel = 'No disponible / Unavailable';
      r.errors.push('Excede la mayor tubería disponible: dividir en varias tuberías');
    } else {
      r.sizeLabel = tradeLabel(num(r.size.trade));
      r.mm = Math.round(num(r.size.trade) * 25.4);
      r.fillReal = s.area / circleArea(r.size.id_in);
      if (s.n === 3) {
        const jr = cat.jamRatio || { min: 2.8, max: 3.2, factor: 1.05 };
        const ratio = num(jr.factor) * num(r.size.id_in) / s.used[0].od_in;
        const rtxt = ratio.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (ratio >= num(jr.min) && ratio <= num(jr.max)) {
          r.warnings.push(`Jam ratio ${rtxt} (${jr.min}–${jr.max}): subir un tamaño / upsize one size`);
        } else r.info.push(`Jam ratio ${rtxt} OK`);
      }
    }
    const lim = cat.conduitLimits || { maxLength_m: 30, maxBends: 2 };
    if (num(lim.maxLength_m) > 0 && r.length > num(lim.maxLength_m)) {
      r.warnings.push(`Tramo > ${lim.maxLength_m} m: colocar caja de paso (TIA-569-E)`);
    }
    if (r.bends > num(lim.maxBends)) {
      r.warnings.push(`Más de ${lim.maxBends} curvas de 90°: caja de paso o reducir capacidad 15 % por curva adicional`);
    }
    return r;
  }

  // ---------- Organizadores de cable ----------
  function managerOptions(ctx, typeId) {
    const t = ctx.catalog.managerTypes.find((x) => x.id === typeId);
    if (!t) return [];
    return t.products.map((p, i) => {
      const usable = num(p.area_in2) * IN2_TO_MM2;
      return { ...p, idx: i, usable, capacity: usable * ctx.fillLimitMgr };
    }).sort((a, b) => a.capacity - b.capacity);
  }

  function evalManager(row, ctx) {
    const s = sumCables(row.qty, ctx);
    const r = { area: s.area, n: s.n, text: s.text, type: null, rec: null, fill: null, errors: [], warnings: [], active: s.area > 0 };
    r.type = ctx.catalog.managerTypes.find((t) => t.id === row.typeId) || null;
    if (s.area === 0) return r;
    if (!r.type) { r.errors.push('Seleccione el tipo de organizador'); return r; }
    const opts = managerOptions(ctx, row.typeId);
    r.rec = opts.find((p) => p.capacity + EPS >= s.area) || null;
    if (!r.rec) r.errors.push('Excede el mayor organizador disponible');
    else r.fill = s.area / r.rec.usable;
    return r;
  }

  // ---------- Nivel y proyecto ----------
  function evalLevel(level, ctx) {
    const pathways = (level.pathways || []).map((row) => ({ row, res: evalPathway(row, ctx) }));
    const conduits = (level.conduits || []).map((row) => ({ row, res: evalConduit(row, ctx) }));
    const managers = (level.managers || []).map((row) => ({ row, res: evalManager(row, ctx) }));
    const all = [...pathways, ...conduits, ...managers].map((x) => x.res);
    const counts = {
      pathways: pathways.filter((x) => x.res.active).length,
      conduits: conduits.filter((x) => x.res.active).length,
      managers: managers.filter((x) => x.res.active).length,
      errors: all.reduce((a, r) => a + (r.errors.length ? 1 : 0), 0),
      warnings: all.reduce((a, r) => a + (r.warnings.length ? 1 : 0), 0),
      lenPathways: pathways.reduce((a, x) => a + (x.row.typeId ? x.res.length : 0), 0),
      lenConduits: conduits.reduce((a, x) => a + (x.row.typeId ? x.res.length : 0), 0)
    };
    return { level, pathways, conduits, managers, counts };
  }

  function evalProject(project, catalog) {
    const ctx = context(project, catalog);
    const levels = (project.levels || []).map((l) => evalLevel(l, ctx));
    const totals = levels.reduce((t, l) => {
      Object.keys(l.counts).forEach((k) => { t[k] = (t[k] || 0) + l.counts[k]; });
      return t;
    }, {});

    // Canalizaciones agrupadas por tipo + canalización seleccionada
    const pw = new Map();
    levels.forEach((l) => l.pathways.forEach(({ row, res }) => {
      if (!res.active || !res.type) return;
      const key = res.type.id + '|' + (res.sel ? res.sel.id : '__none');
      const g = pw.get(key) || {
        type: res.type.name, typeId: res.type.id, size: res.sel ? res.sel.label : 'Sin selección / Not selected',
        pn: res.sel ? res.sel.partNumber : '', brand: res.sel ? res.sel.brand : '', count: 0, length: 0,
        order: res.sel ? res.sel.capacity : Infinity
      };
      g.count++; g.length += res.length; pw.set(key, g);
    }));
    const typeOrder = (id) => catalog.pathwayTypes.findIndex((t) => t.id === id);
    const pathwayGroups = [...pw.values()].sort((a, b) => typeOrder(a.typeId) - typeOrder(b.typeId) || a.order - b.order);

    // Tuberías agrupadas por tipo + diámetro
    const cd = new Map();
    levels.forEach((l) => l.conduits.forEach(({ row, res }) => {
      if (!res.active || !row.typeId || !res.sizeLabel) return;
      const ct = catalog.conduitTypes.find((t) => t.id === row.typeId);
      const key = row.typeId + '|' + (res.size ? res.size.trade : 'na');
      const g = cd.get(key) || {
        type: 'Tubería ' + (ct ? ct.id : row.typeId), typeName: ct ? ct.name : row.typeId, typeId: row.typeId,
        size: res.size ? tradeLabelMm(num(res.size.trade)) : 'No disponible / Unavailable',
        trade: res.size ? num(res.size.trade) : Infinity, count: 0, length: 0
      };
      g.count++; g.length += res.length; cd.set(key, g);
    }));
    const ctOrder = (id) => catalog.conduitTypes.findIndex((t) => t.id === id);
    const conduitGroups = [...cd.values()].sort((a, b) => ctOrder(a.typeId) - ctOrder(b.typeId) || a.trade - b.trade);

    // Organizadores agrupados por modelo
    const mg = new Map();
    levels.forEach((l) => l.managers.forEach(({ res }) => {
      if (!res.active || !res.type) return;
      const key = res.type.id + '|' + (res.rec ? res.rec.partNumber : 'na');
      const g = mg.get(key) || {
        type: res.type.name, model: res.rec ? res.rec.label : 'No disponible / Unavailable',
        pn: res.rec ? res.rec.partNumber : '', count: 0
      };
      g.count++; mg.set(key, g);
    }));

    return { ctx, levels, totals, pathwayGroups, conduitGroups, managerGroups: [...mg.values()] };
  }

  window.Calc = {
    IN2_TO_MM2, num, circleArea, tradeLabel, tradeLabelMm, projectCables, context, sumCables,
    brandsFor, brandFor, pathwayOptions, evalPathway, evalConduit, managerOptions, evalManager,
    evalLevel, evalProject, usableArea
  };
})();
