'use strict';

// ─────────────────────────────────────────────
// MIDI constants
// ─────────────────────────────────────────────
const MIDI_TYPES = [
  'Note On',
  'Note Off',
  'Control Change',
  'Program Change',
  'Pitch Bend',
  'Aftertouch',
  'Polyphonic Aftertouch',
];
const MIDI_TYPE_BASE = {
  'Note On':               0x90,
  'Note Off':              0x80,
  'Control Change':        0xB0,
  'Program Change':        0xC0,
  'Pitch Bend':            0xE0,
  'Aftertouch':            0xD0,
  'Polyphonic Aftertouch': 0xA0,
};
const MIDI_BASE_TO_TYPE = Object.fromEntries(
  Object.entries(MIDI_TYPE_BASE).map(([k, v]) => [v, k])
);

function encodeStatus(type) {
  return MIDI_TYPE_BASE[type] || 0x90;
}
function decodeStatus(byte) {
  const base = byte & 0xF0;
  return { type: MIDI_BASE_TO_TYPE[base] || 'Note On' };
}

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
let state = {
  definition: newEmptyDefinition(),
  selectedIndex: -1,
  extraTarget: 'definition', // 'definition' | 'articulation'
};

function newEmptyDefinition() {
  return {
    Id: crypto.randomUUID(),
    Author: '',
    ManufacturerName: '',
    ProductName: '',
    PatchName: '',
    Description: '',
    Articulations: [],
    Extra: {},
  };
}

function newArticulation() {
  return { Name: 'New Articulation', MidiMessages: [], Extra: {} };
}
function newMidiMessage() {
  return { type: 'Note On', Channel: -1, Data1: 0, Data2: 0 };
}

// ─────────────────────────────────────────────
// General Edit
// ─────────────────────────────────────────────
function bindGeneralEdit() {
  const fields = [
    ['f-id',           'Id'],
    ['f-author',       'Author'],
    ['f-manufacturer', 'ManufacturerName'],
    ['f-product',      'ProductName'],
    ['f-patch',        'PatchName'],
    ['f-description',  'Description'],
  ];
  fields.forEach(([id, key]) => {
    document.getElementById(id).addEventListener('input', e => {
      state.definition[key] = e.target.value;
    });
  });
}

function fillGeneralEdit() {
  const d = state.definition;
  document.getElementById('f-id').value          = d.Id || '';
  document.getElementById('f-author').value      = d.Author || '';
  document.getElementById('f-manufacturer').value = d.ManufacturerName || '';
  document.getElementById('f-product').value     = d.ProductName || '';
  document.getElementById('f-patch').value       = d.PatchName || '';
  document.getElementById('f-description').value = d.Description || '';
}

// ─────────────────────────────────────────────
// Articulation List
// ─────────────────────────────────────────────
function renderArticulationList() {
  const body = document.getElementById('artic-list-body');
  body.innerHTML = '';
  state.definition.Articulations.forEach((artic, i) => {
    const item = document.createElement('div');
    item.className = 'artic-item' + (i === state.selectedIndex ? ' selected' : '');

    const nameEl = document.createElement('span');
    nameEl.className = 'artic-name';
    nameEl.textContent = artic.Name || '(unnamed)';

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-del-artic';
    delBtn.textContent = '✕';
    delBtn.title = 'Delete';
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      state.definition.Articulations.splice(i, 1);
      if (state.selectedIndex >= state.definition.Articulations.length) {
        state.selectedIndex = state.definition.Articulations.length - 1;
      }
      renderArticulationList();
      renderArticulationEdit();
      toast('Articulation deleted', 'success');
    });

    item.appendChild(nameEl);
    item.appendChild(delBtn);
    item.addEventListener('click', () => {
      state.selectedIndex = i;
      renderArticulationList();
      renderArticulationEdit();
    });
    body.appendChild(item);
  });
}

// ─────────────────────────────────────────────
// Articulation Edit
// ─────────────────────────────────────────────
function renderArticulationEdit() {
  const container = document.getElementById('artic-edit-content');
  container.innerHTML = '';

  const artic = state.definition.Articulations[state.selectedIndex];
  if (!artic) {
    const p = document.createElement('p');
    p.id = 'artic-edit-placeholder';
    p.textContent = '← Select or add an articulation';
    container.appendChild(p);
    return;
  }

  // Name
  const nameRow = document.createElement('div');
  nameRow.className = 'field-row';
  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Name';
  nameLabel.setAttribute('for', 'artic-name-input');
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'artic-name-input';
  nameInput.value = artic.Name || '';
  nameInput.addEventListener('input', e => {
    artic.Name = e.target.value;
    renderArticulationList();
  });
  nameRow.appendChild(nameLabel);
  nameRow.appendChild(nameInput);
  container.appendChild(nameRow);

  // Midi Messages
  const midiTitle = document.createElement('div');
  midiTitle.className = 'midi-section-title';
  midiTitle.textContent = 'Midi Messages';
  container.appendChild(midiTitle);

  artic.MidiMessages.forEach((msg, mi) => {
    container.appendChild(createMidiRow(msg, mi, artic));
  });

  const addMidiBtn = document.createElement('button');
  addMidiBtn.id = 'btn-add-midi';
  addMidiBtn.textContent = 'Add';
  addMidiBtn.addEventListener('click', () => {
    artic.MidiMessages.push(newMidiMessage());
    renderArticulationEdit();
  });
  container.appendChild(addMidiBtn);

  // Extra
  const extraTitle = document.createElement('div');
  extraTitle.className = 'midi-section-title';
  extraTitle.textContent = 'Extra';
  container.appendChild(extraTitle);

  const extraBtn = document.createElement('button');
  extraBtn.id = 'btn-artic-extra';
  extraBtn.textContent = 'Edit';
  extraBtn.addEventListener('click', () => openExtraModal('articulation'));
  container.appendChild(extraBtn);
}

function createMidiRow(msg, mi, artic) {
  const row = document.createElement('div');
  row.className = 'midi-msg-row';

  const idx = document.createElement('span');
  idx.className = 'midi-idx';
  idx.textContent = `[${mi}]`;

  const statusLabel = document.createElement('span');
  statusLabel.className = 'midi-label';
  statusLabel.textContent = 'Status';
  const statusSel = document.createElement('select');
  MIDI_TYPES.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    if (t === msg.type) opt.selected = true;
    statusSel.appendChild(opt);
  });
  statusSel.addEventListener('change', e => { msg.type = e.target.value; });

  const chLabel = document.createElement('span');
  chLabel.className = 'midi-label';
  chLabel.textContent = 'Channel';
  const chInput = document.createElement('input');
  chInput.type = 'number';
  chInput.min = -1; chInput.max = 15;
  chInput.value = msg.Channel !== undefined ? msg.Channel : -1;
  chInput.placeholder = '-1';
  chInput.addEventListener('input', e => {
    const v = parseInt(e.target.value);
    msg.Channel = isNaN(v) ? -1 : Math.max(-1, Math.min(15, v));
  });

  const d1Label = document.createElement('span');
  d1Label.className = 'midi-label';
  d1Label.textContent = 'Data1';
  const d1Input = document.createElement('input');
  d1Input.type = 'number';
  d1Input.min = 0; d1Input.max = 127;
  d1Input.value = msg.Data1 !== undefined ? msg.Data1 : '';
  d1Input.placeholder = '–';
  d1Input.addEventListener('input', e => {
    const v = e.target.value;
    msg.Data1 = v === '' ? undefined : (parseInt(v) || 0);
  });

  const d2Label = document.createElement('span');
  d2Label.className = 'midi-label';
  d2Label.textContent = 'Data2';
  const d2Input = document.createElement('input');
  d2Input.type = 'number';
  d2Input.min = 0; d2Input.max = 127;
  d2Input.value = msg.Data2 !== undefined ? msg.Data2 : '';
  d2Input.placeholder = '–';
  d2Input.addEventListener('input', e => {
    const v = e.target.value;
    msg.Data2 = v === '' ? undefined : (parseInt(v) || 0);
  });

  const delBtn = document.createElement('button');
  delBtn.className = 'btn-del-midi';
  delBtn.textContent = '✕';
  delBtn.addEventListener('click', () => {
    artic.MidiMessages.splice(mi, 1);
    renderArticulationEdit();
  });

  row.append(idx, chLabel, chInput, statusLabel, statusSel, d1Label, d1Input, d2Label, d2Input, delBtn);
  return row;
}

// ─────────────────────────────────────────────
// Extra Modal
// ─────────────────────────────────────────────
function openExtraModal(target) {
  state.extraTarget = target;
  renderExtraRows();
  document.getElementById('modal-overlay').classList.add('open');
}
function closeExtraModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function getExtraObject() {
  if (state.extraTarget === 'definition') return state.definition.Extra;
  const artic = state.definition.Articulations[state.selectedIndex];
  return artic ? artic.Extra : {};
}

function renderExtraRows() {
  const container = document.getElementById('extra-rows-container');
  container.innerHTML = '';
  const extra = getExtraObject();
  Object.entries(extra).forEach(([k, v]) => {
    container.appendChild(createExtraRow(k, v, extra));
  });
}

function createExtraRow(key, value, extra) {
  const row = document.createElement('div');
  row.className = 'extra-row';

  const keyInput = document.createElement('input');
  keyInput.type = 'text';
  keyInput.value = key;
  keyInput.placeholder = 'Key';

  const valInput = document.createElement('input');
  valInput.type = 'text';
  valInput.value = value;
  valInput.placeholder = 'Value';

  const delBtn = document.createElement('button');
  delBtn.className = 'btn-del-extra';
  delBtn.textContent = '✕';

  let currentKey = key;
  const saveRow = () => {
    const newKey = keyInput.value;
    const newVal = valInput.value;
    if (newKey !== currentKey) {
      delete extra[currentKey];
      currentKey = newKey;
    }
    extra[currentKey] = newVal;
  };
  keyInput.addEventListener('blur', saveRow);
  valInput.addEventListener('blur', saveRow);
  valInput.addEventListener('input', () => { extra[currentKey] = valInput.value; });

  delBtn.addEventListener('click', () => {
    delete extra[currentKey];
    renderExtraRows();
  });

  row.append(keyInput, valInput, delBtn);
  return row;
}

// ─────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────
function toast(message, type = 'success') {
  const tc = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  tc.appendChild(el);
  const dur = type === 'error' ? 3000 : 2000;
  setTimeout(() => {
    el.classList.add('fadeout');
    setTimeout(() => el.remove(), 450);
  }, dur);
}

// ─────────────────────────────────────────────
// YAML export
// ─────────────────────────────────────────────
function yamlQuote(str) {
  str = String(str);
  if (/[:#\[\]{}&*!|>'"%@`\n\r]/.test(str) || str.trim() !== str || str === '' || /^[-?]/.test(str)) {
    return "'" + str.replace(/'/g, "''") + "'";
  }
  return str;
}

function exportYaml() {
  const d = state.definition;
  const lines = [];

  lines.push(`Id: ${yamlQuote(d.Id)}`);
  lines.push(`Author: ${yamlQuote(d.Author)}`);
  lines.push(`ManufacturerName: ${yamlQuote(d.ManufacturerName)}`);
  lines.push(`ProductName: ${yamlQuote(d.ProductName)}`);
  lines.push(`PatchName: ${yamlQuote(d.PatchName)}`);
  if (d.Description) lines.push(`Description: ${yamlQuote(d.Description)}`);

  lines.push('Articulations:');
  if (d.Articulations.length === 0) {
    lines[lines.length - 1] += ' []';
  } else {
    d.Articulations.forEach(artic => {
      lines.push(`  - Name: ${yamlQuote(artic.Name)}`);
      lines.push(`    MidiMessages:`);
      if (artic.MidiMessages.length === 0) {
        lines[lines.length - 1] += ' []';
      } else {
        artic.MidiMessages.forEach(msg => {
          const status = encodeStatus(msg.type);
          lines.push(`      - Status: ${status}`);
          if (msg.Channel !== undefined && msg.Channel !== -1) {
            lines.push(`        Channel: ${msg.Channel}`);
          }
          if (msg.Data1 !== undefined && msg.Data1 !== null && msg.Data1 !== '') {
            lines.push(`        Data1: ${msg.Data1}`);
          }
          if (msg.Data2 !== undefined && msg.Data2 !== null && msg.Data2 !== '') {
            lines.push(`        Data2: ${msg.Data2}`);
          }
        });
      }
      const extraEntries = Object.entries(artic.Extra || {});
      if (extraEntries.length > 0) {
        lines.push(`    Extra:`);
        extraEntries.forEach(([k, v]) => {
          lines.push(`      ${yamlQuote(k)}: ${yamlQuote(v)}`);
        });
      }
    });
  }

  const defExtraEntries = Object.entries(d.Extra || {});
  if (defExtraEntries.length > 0) {
    lines.push('Extra:');
    defExtraEntries.forEach(([k, v]) => {
      lines.push(`  ${yamlQuote(k)}: ${yamlQuote(v)}`);
    });
  }

  return lines.join('\n') + '\n';
}

function downloadYaml() {
  const yaml = exportYaml();
  const blob = new Blob([yaml], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const name = state.definition.PatchName || 'definition';
  a.download = name.replace(/[^a-zA-Z0-9_\-]/g, '_') + '.yaml';
  a.click();
  URL.revokeObjectURL(url);
  toast('YAML exported', 'success');
}

// ─────────────────────────────────────────────
// YAML import — minimal custom parser
// Handles the block-style YAML that YamlDotNet outputs with default settings.
// Key fix: YAML allows a sequence to start at the same indent level as its
// parent mapping key (e.g. "Articulations:\n- Name: ..."), so we accept
// same-indent sequence items as child values of a mapping key.
// ─────────────────────────────────────────────
function parseYaml(text) {
  // Strip UTF-8 BOM if present
  const clean = text.replace(/^﻿/, '');
  const lines = clean.split(/\r?\n/);
  return parseBlock(lines, 0, 0).value;
}

function getIndent(line) {
  const m = line.match(/^(\s*)/);
  return m ? m[1].length : 0;
}

function unquoteScalar(s) {
  s = s.trim();
  if (s === '' || s === 'null' || s === '~') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  if (s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1)
      .replace(/\\n/g, '\n').replace(/\\t/g, '\t')
      .replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  const num = Number(s);
  if (!isNaN(num)) return num;
  return s;
}

function findMappingColon(str) {
  let inSingle = false, inDouble = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (c === ':' && !inSingle && !inDouble) {
      if (i + 1 >= str.length || str[i + 1] === ' ' || str[i + 1] === '\t') return i;
    }
  }
  return -1;
}

function skipBlanks(lines, i) {
  while (i < lines.length && (lines[i].trim() === '' || lines[i].trim().startsWith('#'))) i++;
  return i;
}

function isSeqLine(line) {
  const t = line.trim();
  return t.startsWith('- ') || t === '-';
}

function parseBlock(lines, start, baseIndent) {
  let i = skipBlanks(lines, start);
  if (i >= lines.length) return { value: null, next: i };

  const firstLine = lines[i];
  const ind = getIndent(firstLine);
  const trimmed = firstLine.trim();

  // ── Sequence ──
  if (isSeqLine(firstLine)) {
    const arr = [];
    while (i < lines.length) {
      i = skipBlanks(lines, i);
      if (i >= lines.length) break;
      const lineInd = getIndent(lines[i]);
      if (lineInd < ind) break;
      if (lineInd === ind && isSeqLine(lines[i])) {
        const rest = lines[i].trim().slice(2).trim();
        i++;
        if (rest === '') {
          // Value is the indented block on the following lines
          const { value, next } = parseBlock(lines, i, ind + 2);
          arr.push(value);
          i = next;
        } else if (findMappingColon(rest) !== -1) {
          // Inline mapping key: treat rest + following lines as a mapping block
          const syntheticLines = [' '.repeat(ind + 2) + rest, ...lines.slice(i)];
          const { value, next } = parseBlock(syntheticLines, 0, ind + 2);
          arr.push(value);
          // next-1 because syntheticLines[0] represents no additional original line
          i += next - 1;
        } else {
          arr.push(unquoteScalar(rest));
        }
      } else {
        break;
      }
    }
    return { value: arr, next: i };
  }

  // ── Mapping ──
  if (findMappingColon(trimmed) !== -1) {
    const obj = {};
    while (i < lines.length) {
      i = skipBlanks(lines, i);
      if (i >= lines.length) break;
      const lineInd = getIndent(lines[i]);
      if (lineInd < ind) break;
      if (lineInd !== ind) { i++; continue; }

      const colonIdx = findMappingColon(lines[i].trim());
      if (colonIdx === -1) { i++; continue; }

      const rawKey = lines[i].trim().slice(0, colonIdx).trim();
      const key = String(unquoteScalar(rawKey) ?? rawKey);
      const afterColon = lines[i].trim().slice(colonIdx + 1).trim();
      i++;

      if (afterColon === '[]') {
        obj[key] = [];
      } else if (afterColon === '{}') {
        obj[key] = {};
      } else if (afterColon !== '') {
        obj[key] = unquoteScalar(afterColon);
      } else {
        // No inline value — look at next non-blank line
        const ni = skipBlanks(lines, i);
        if (ni < lines.length) {
          const nextInd = getIndent(lines[ni]);
          // Accept: deeper indent OR same-indent sequence (YAML compact notation)
          const isChild = nextInd > ind || (nextInd === ind && isSeqLine(lines[ni]));
          if (isChild) {
            const { value, next } = parseBlock(lines, ni, nextInd);
            obj[key] = value;
            i = next;
          } else {
            obj[key] = null;
          }
        } else {
          obj[key] = null;
        }
      }
    }
    return { value: obj, next: i };
  }

  // ── Scalar fallback ──
  return { value: unquoteScalar(trimmed), next: i + 1 };
}

function loadDefinitionFromObj(obj) {
  const def = newEmptyDefinition();
  if (!obj || typeof obj !== 'object') return def;
  if (obj.Id)                def.Id               = String(obj.Id);
  if (obj.Author != null)    def.Author            = String(obj.Author);
  if (obj.ManufacturerName != null) def.ManufacturerName = String(obj.ManufacturerName);
  if (obj.ProductName != null)      def.ProductName      = String(obj.ProductName);
  if (obj.PatchName != null)        def.PatchName        = String(obj.PatchName);
  if (obj.Description != null)      def.Description      = String(obj.Description);
  if (obj.Extra && typeof obj.Extra === 'object') {
    def.Extra = Object.fromEntries(
      Object.entries(obj.Extra).map(([k, v]) => [String(k), String(v ?? '')])
    );
  }
  if (Array.isArray(obj.Articulations)) {
    def.Articulations = obj.Articulations.map(a => {
      const artic = { Name: '', MidiMessages: [], Extra: {} };
      if (a.Name != null) artic.Name = String(a.Name);
      if (Array.isArray(a.MidiMessages)) {
        artic.MidiMessages = a.MidiMessages.map(m => {
          const status = parseInt(m.Status) || 0;
          const { type } = decodeStatus(status);
          const Channel = (m.Channel != null) ? parseInt(m.Channel) : -1;
          const msg = { type, Channel };
          if (m.Data1 != null) msg.Data1 = parseInt(m.Data1);
          if (m.Data2 != null) msg.Data2 = parseInt(m.Data2);
          return msg;
        });
      }
      if (a.Extra && typeof a.Extra === 'object') {
        artic.Extra = Object.fromEntries(
          Object.entries(a.Extra).map(([k, v]) => [String(k), String(v ?? '')])
        );
      }
      return artic;
    });
  }
  return def;
}

// ─────────────────────────────────────────────
// New / Load / Save
// ─────────────────────────────────────────────
function doNew() {
  state.definition = newEmptyDefinition();
  state.selectedIndex = -1;
  fillGeneralEdit();
  renderArticulationList();
  renderArticulationEdit();
  toast('New definition created', 'success');
}

document.getElementById('btn-new').addEventListener('click', doNew);

document.getElementById('btn-save').addEventListener('click', () => {
  const d = state.definition;
  if (!d.Id || !d.Author || !d.ManufacturerName || !d.ProductName || !d.PatchName) {
    toast('Please fill in all required fields (ID, Author, Manufacture, Product, Patch)', 'error');
    return;
  }
  downloadYaml();
});

document.getElementById('btn-load').addEventListener('click', () => {
  document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const parsed = parseYaml(ev.target.result);
      state.definition = loadDefinitionFromObj(parsed);
      state.selectedIndex = -1;
      fillGeneralEdit();
      renderArticulationList();
      renderArticulationEdit();
      toast('YAML loaded', 'success');
    } catch (err) {
      toast('Failed to parse YAML: ' + err.message, 'error');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
});

// ─────────────────────────────────────────────
// Extra modal events
// ─────────────────────────────────────────────
document.getElementById('btn-def-extra').addEventListener('click', () => openExtraModal('definition'));
document.getElementById('btn-modal-close').addEventListener('click', closeExtraModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeExtraModal();
});
document.getElementById('btn-add-extra').addEventListener('click', () => {
  const extra = getExtraObject();
  let key = 'New.Key';
  let n = 1;
  while (key in extra) key = `New.Key.${n++}`;
  extra[key] = '';
  renderExtraRows();
});

// Articulation list
document.getElementById('btn-add-articulation').addEventListener('click', () => {
  state.definition.Articulations.push(newArticulation());
  state.selectedIndex = state.definition.Articulations.length - 1;
  renderArticulationList();
  renderArticulationEdit();
});

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────
bindGeneralEdit();
fillGeneralEdit();
renderArticulationList();
renderArticulationEdit();
