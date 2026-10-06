/* Utilidades de interfaz compartidas por index.html y admin.html */
(function () {
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const fmt = (n, d = 1) => (n == null || !isFinite(n)) ? '' :
    Number(n).toLocaleString('es-CR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pct = (n) => (n == null || !isFinite(n)) ? '' : fmt(n * 100, 1) + ' %';
  const opt = (value, label, selected) =>
    `<option value="${esc(value)}"${selected ? ' selected' : ''}>${esc(label)}</option>`;

  function toast(msg, ms = 2200) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg; t.setAttribute('role', 'status');
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  /* Diálogo modal. fields: [{name,label,type,value,options}] -> resuelve con objeto de valores o null */
  function dialog({ title, message = '', fields = [], okLabel = 'Aceptar', cancelLabel = 'Cancelar', danger = false }) {
    return new Promise((resolve) => {
      const back = document.createElement('div');
      back.className = 'modal-back';
      back.innerHTML = `<form class="modal" role="dialog" aria-modal="true">
        <h3>${esc(title)}</h3>
        ${message ? `<p>${message}</p>` : ''}
        ${fields.map((f) => `<label class="field" style="margin-bottom:10px"><span>${esc(f.label)}</span>${
          f.type === 'select'
            ? `<select name="${esc(f.name)}">${f.options.map((o) => opt(o.value, o.label, o.value === f.value)).join('')}</select>`
            : `<input name="${esc(f.name)}" type="${f.type || 'text'}" value="${esc(f.value ?? '')}" ${f.attrs || ''}>`
        }</label>`).join('')}
        <div class="actions">
          ${cancelLabel ? `<button type="button" class="btn" data-cancel>${esc(cancelLabel)}</button>` : ''}
          <button type="submit" class="btn ${danger ? 'danger' : 'primary'}">${esc(okLabel)}</button>
        </div></form>`;
      document.body.appendChild(back);
      const form = back.querySelector('form');
      const first = form.querySelector('input,select');
      (first || form.querySelector('[type=submit]')).focus();
      const close = (val) => { back.remove(); resolve(val); };
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const out = {};
        fields.forEach((f) => { out[f.name] = form.elements[f.name].value; });
        close(out);
      });
      const cancel = form.querySelector('[data-cancel]');
      if (cancel) cancel.addEventListener('click', () => close(null));
      back.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(null); });
    });
  }
  const confirmDlg = (title, message, okLabel = 'Eliminar') =>
    dialog({ title, message, okLabel, danger: true }).then((r) => r !== null);

  function download(filename, content, mime = 'application/json') {
    const blob = new Blob([content], { type: mime + ';charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result); r.onerror = reject; r.readAsText(file);
    });
  }
  const toCsv = (rows) => '﻿' + rows.map((r) => r.map((c) => {
    const s = String(c == null ? '' : c);
    return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(';')).join('\r\n');

  window.UI = { esc, uid, fmt, pct, opt, toast, dialog, confirmDlg, download, readFile, toCsv };
})();
