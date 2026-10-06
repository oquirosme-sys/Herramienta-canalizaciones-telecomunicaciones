/* Capa de datos.
   Hoy guarda en localStorage (navegador). Todas las funciones son async para que en el
   paso 2 se reemplacen por llamadas a Supabase sin tocar app.js ni admin.js:
     projects  -> tabla "projects" (jsonb data)
     catalog   -> tabla "catalog" (una fila por versión) editable solo por rol admin (RLS)
     auth      -> Supabase Auth + columna role en "profiles" */
(function () {
  const K = {
    projects: 'tc.projects.v1',
    catalog: 'tc.catalog.v1',
    adminHash: 'tc.adminHash.v1',
    session: 'tc.adminSession.v1'
  };

  function read(key, def) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
    catch (e) { return def; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { console.error('No se pudo guardar', e); return false; }
  }
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // SHA-256 en JS puro (crypto.subtle no está disponible al abrir el archivo con file://)
  function sha256(ascii) {
    function rr(v, n) { return (v >>> n) | (v << (32 - n)); }
    const bytes = new TextEncoder().encode(ascii);
    const K256 = [];
    const H = [];
    let isComposite = {};
    for (let c = 2, n = 0; n < 64; c++) {
      if (!isComposite[c]) {
        for (let i = 0; i < 313; i += c) isComposite[i] = c;
        if (n < 8) H[n] = (Math.pow(c, 0.5) * 0x100000000) | 0;
        K256[n++] = (Math.pow(c, 1 / 3) * 0x100000000) | 0;
      }
    }
    const l = bytes.length;
    const words = [];
    for (let i = 0; i < l; i++) words[i >> 2] |= bytes[i] << ((3 - i) % 4) * 8;
    words[l >> 2] |= 0x80 << ((3 - l) % 4) * 8;
    const total = ((l + 8) >> 6) * 16 + 16;
    for (let i = (l >> 2) + 1; i < total; i++) words[i] = words[i] | 0;
    words[total - 1] = l * 8;
    let h = H.slice(0, 8);
    for (let j = 0; j < total; j += 16) {
      const w = words.slice(j, j + 16);
      const old = h.slice(0);
      for (let i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const a = h[0], e = h[4];
        const t1 = h[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & h[5]) ^ (~e & h[6])) + K256[i] +
          (w[i] = i < 16 ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] +
            (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        const t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & h[1]) ^ (a & h[2]) ^ (h[1] & h[2]));
        h = [(t1 + t2) | 0].concat(h);
        h[4] = (h[4] + t1) | 0;
        h.length = 8;
      }
      for (let i = 0; i < 8; i++) h[i] = (h[i] + old[i]) | 0;
    }
    return h.map((v) => ('00000000' + (v >>> 0).toString(16)).slice(-8)).join('');
  }

  window.Store = {
    // ---------- Proyectos ----------
    async listProjects() {
      const all = read(K.projects, {});
      return Object.values(all)
        .map((p) => ({ id: p.id, name: p.name, number: p.number, updated: p.updated }))
        .sort((a, b) => String(b.updated || '').localeCompare(String(a.updated || '')));
    },
    async getProject(id) {
      const all = read(K.projects, {});
      return all[id] ? clone(all[id]) : null;
    },
    async saveProject(project) {
      const all = read(K.projects, {});
      project.updated = new Date().toISOString();
      all[project.id] = clone(project);
      return write(K.projects, all);
    },
    async deleteProject(id) {
      const all = read(K.projects, {});
      delete all[id];
      return write(K.projects, all);
    },

    // ---------- Catálogo (bases de datos de cables, canalizaciones, tuberías...) ----------
    async getCatalog() {
      const c = read(K.catalog, null);
      return c ? c : clone(window.DEFAULT_CATALOG);
    },
    async saveCatalog(catalog) {
      if (!(await this.auth.isAdmin())) throw new Error('Se requieren permisos de administrador');
      catalog.updated = new Date().toISOString().slice(0, 10);
      return write(K.catalog, catalog);
    },
    async resetCatalog() {
      if (!(await this.auth.isAdmin())) throw new Error('Se requieren permisos de administrador');
      localStorage.removeItem(K.catalog);
      return clone(window.DEFAULT_CATALOG);
    },
    hasCustomCatalog() { return !!read(K.catalog, null); },

    // ---------- Autenticación de administrador (provisional) ----------
    auth: {
      async isAdmin() {
        const s = read(K.session, null);
        return !!(s && s.expires > Date.now());
      },
      async login(password) {
        const hash = read(K.adminHash, null) || window.APP_CONFIG.adminPasswordHash;
        if (sha256(password) !== hash) return false;
        write(K.session, { expires: Date.now() + 8 * 3600 * 1000 });
        return true;
      },
      async logout() { localStorage.removeItem(K.session); },
      async changePassword(current, next) {
        const hash = read(K.adminHash, null) || window.APP_CONFIG.adminPasswordHash;
        if (sha256(current) !== hash) return false;
        write(K.adminHash, sha256(next));
        return true;
      }
    }
  };
})();
