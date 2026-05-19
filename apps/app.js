'use strict';

// ─────────────────────────────────────────────
// Format version
// ─────────────────────────────────────────────
const FORMAT_VERSION = 0;

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

// YAMAHA Style Midi Note (60 = C3)
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MIDI_NOTE_LABELS = Array.from({ length: 128 }, (_, n) => {
  const name = NOTE_NAMES[n % 12];
  const octave = Math.floor(n / 12) - 2;
  return `${n}: ${name}${octave}`;
});

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
  selectedGroupIndex: 0,
  selectedArticIndex: -1,
  extraTarget: 'definition', // 'definition' | 'articulation'
};

function newEmptyDefinition() {
  return {
    FormatVersion: FORMAT_VERSION,
    Id: crypto.randomUUID(),
    Author: '',
    ManufacturerName: '',
    ProductName: '',
    PatchName: '',
    Description: '',
    ArticulationGroups: [
      { Name: 'Default', Articulations: [{ Name: 'Idle', MidiMessages: [], Extra: {} }], Extra: {} }
    ],
    Extra: {},
  };
}

function newArticulationGroup() {
  return { Name: 'New Group', Articulations: [], Extra: {} };
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
  document.getElementById('f-id').value           = d.Id || '';
  document.getElementById('f-author').value       = d.Author || '';
  document.getElementById('f-manufacturer').value = d.ManufacturerName || '';
  document.getElementById('f-product').value      = d.ProductName || '';
  document.getElementById('f-patch').value        = d.PatchName || '';
  document.getElementById('f-description').value  = d.Description || '';
}

// ─────────────────────────────────────────────
// Group Controls
// ─────────────────────────────────────────────
function renderGroupSelect() {
  const groups = state.definition.ArticulationGroups;
  const sel = document.getElementById('group-select');
  sel.innerHTML = '';
  groups.forEach((g, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = g.Name || '(unnamed)';
    if (i === state.selectedGroupIndex) opt.selected = true;
    sel.appendChild(opt);
  });
  const nameInput = document.getElementById('group-name-input');
  const grp = groups[state.selectedGroupIndex];
  nameInput.value = grp ? grp.Name || '' : '';
}

// ─────────────────────────────────────────────
// Articulation List
// ─────────────────────────────────────────────
function renderArticulationList() {
  renderGroupSelect();
  const body = document.getElementById('artic-list-body');
  body.innerHTML = '';
  const grp = state.definition.ArticulationGroups[state.selectedGroupIndex];
  if (!grp) return;

  grp.Articulations.forEach((artic, i) => {
    const item = document.createElement('div');
    item.className = 'artic-item' + (i === state.selectedArticIndex ? ' selected' : '');

    const nameEl = document.createElement('span');
    nameEl.className = 'artic-name';
    nameEl.textContent = artic.Name || '(unnamed)';

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-del-artic';
    delBtn.textContent = '✕';
    delBtn.title = 'Delete';
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      grp.Articulations.splice(i, 1);
      if (state.selectedArticIndex >= grp.Articulations.length) {
        state.selectedArticIndex = grp.Articulations.length - 1;
      }
      renderArticulationList();
      renderArticulationEdit();
      toast('Articulation deleted', 'success');
    });

    item.appendChild(nameEl);
    item.appendChild(delBtn);
    item.addEventListener('click', () => {
      state.selectedArticIndex = i;
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

  const grp = state.definition.ArticulationGroups[state.selectedGroupIndex];
  const artic = grp ? grp.Articulations[state.selectedArticIndex] : null;
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

function buildD1NumberInput(msg) {
  const el = document.createElement('input');
  el.type = 'number'; el.min = 0; el.max = 127;
  el.value = msg.Data1 !== undefined ? msg.Data1 : '';
  el.placeholder = '–';
  el.addEventListener('input', e => {
    const v = e.target.value;
    msg.Data1 = v === '' ? undefined : (parseInt(v) || 0);
  });
  return el;
}

function buildD1NoteSelect(msg) {
  const el = document.createElement('select');
  MIDI_NOTE_LABELS.forEach((label, n) => {
    const opt = document.createElement('option');
    opt.value = n;
    opt.textContent = label;
    if (n === (msg.Data1 ?? 0)) opt.selected = true;
    el.appendChild(opt);
  });
  el.addEventListener('change', e => {
    msg.Data1 = parseInt(e.target.value);
  });
  return el;
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
  const d1Wrap = document.createElement('span');
  const isNoteType = t => t === 'Note On' || t === 'Note Off';
  function refreshD1() {
    d1Wrap.innerHTML = '';
    d1Wrap.appendChild(isNoteType(msg.type) ? buildD1NoteSelect(msg) : buildD1NumberInput(msg));
  }
  refreshD1();

  statusSel.addEventListener('change', e => {
    msg.type = e.target.value;
    refreshD1();
  });

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

  row.append(idx, chLabel, chInput, statusLabel, statusSel, d1Label, d1Wrap, d2Label, d2Input, delBtn);
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
  const grp = state.definition.ArticulationGroups[state.selectedGroupIndex];
  if (state.extraTarget === 'group') return grp ? grp.Extra : {};
  const artic = grp ? grp.Articulations[state.selectedArticIndex] : null;
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

  lines.push(`FormatVersion: ${FORMAT_VERSION}`);
  lines.push(`Id: ${yamlQuote(d.Id)}`);
  lines.push(`Author: ${yamlQuote(d.Author)}`);
  lines.push(`ManufacturerName: ${yamlQuote(d.ManufacturerName)}`);
  lines.push(`ProductName: ${yamlQuote(d.ProductName)}`);
  lines.push(`PatchName: ${yamlQuote(d.PatchName)}`);
  if (d.Description) lines.push(`Description: ${yamlQuote(d.Description)}`);

  lines.push('ArticulationGroups:');
  if (d.ArticulationGroups.length === 0) {
    lines[lines.length - 1] += ' []';
  } else {
    d.ArticulationGroups.forEach(grp => {
      lines.push(`  - Name: ${yamlQuote(grp.Name)}`);
      lines.push(`    Articulations:`);
      if (grp.Articulations.length === 0) {
        lines[lines.length - 1] += ' []';
      } else {
        grp.Articulations.forEach(artic => {
          lines.push(`      - Name: ${yamlQuote(artic.Name)}`);
          lines.push(`        MidiMessages:`);
          if (artic.MidiMessages.length === 0) {
            lines[lines.length - 1] += ' []';
          } else {
            artic.MidiMessages.forEach(msg => {
              const status = encodeStatus(msg.type);
              lines.push(`          - Status: ${status}`);
              if (msg.Channel !== undefined && msg.Channel !== -1) {
                lines.push(`            Channel: ${msg.Channel}`);
              }
              if (msg.Data1 !== undefined && msg.Data1 !== null && msg.Data1 !== '') {
                lines.push(`            Data1: ${msg.Data1}`);
              }
              if (msg.Data2 !== undefined && msg.Data2 !== null && msg.Data2 !== '') {
                lines.push(`            Data2: ${msg.Data2}`);
              }
            });
          }
          const articExtraEntries = Object.entries(artic.Extra || {});
          if (articExtraEntries.length > 0) {
            lines.push(`        Extra:`);
            articExtraEntries.forEach(([k, v]) => {
              lines.push(`          ${yamlQuote(k)}: ${yamlQuote(v)}`);
            });
          }
        });
      }
      const grpExtraEntries = Object.entries(grp.Extra || {});
      if (grpExtraEntries.length > 0) {
        lines.push(`    Extra:`);
        grpExtraEntries.forEach(([k, v]) => {
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
  if (!obj || typeof obj !== 'object') return null;

  const fv = obj.FormatVersion;
  if (fv === undefined || fv === null) {
    alert('FormatVersion is missing in the file. Loading aborted.');
    return null;
  }
  if (fv !== FORMAT_VERSION) {
    alert(`FormatVersion mismatch. Expected: ${FORMAT_VERSION}, Got: ${fv}`);
    return null;
  }
  if (!Array.isArray(obj.ArticulationGroups)) {
    alert('Invalid file format: ArticulationGroups is missing. Loading aborted.');
    return null;
  }

  const def = newEmptyDefinition();
  if (obj.Id)                       def.Id               = String(obj.Id);
  if (obj.Author != null)           def.Author           = String(obj.Author);
  if (obj.ManufacturerName != null) def.ManufacturerName = String(obj.ManufacturerName);
  if (obj.ProductName != null)      def.ProductName      = String(obj.ProductName);
  if (obj.PatchName != null)        def.PatchName        = String(obj.PatchName);
  if (obj.Description != null)      def.Description      = String(obj.Description);
  if (obj.Extra && typeof obj.Extra === 'object') {
    def.Extra = Object.fromEntries(
      Object.entries(obj.Extra).map(([k, v]) => [String(k), String(v ?? '')])
    );
  }

  def.ArticulationGroups = obj.ArticulationGroups.map(g => {
    const grp = { Name: '', Articulations: [], Extra: {} };
    if (g.Name != null) grp.Name = String(g.Name);
    if (g.Extra && typeof g.Extra === 'object') {
      grp.Extra = Object.fromEntries(
        Object.entries(g.Extra).map(([k, v]) => [String(k), String(v ?? '')])
      );
    }
    if (Array.isArray(g.Articulations)) {
      grp.Articulations = g.Articulations.map(a => {
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
    return grp;
  });

  return def;
}

// ─────────────────────────────────────────────
// New / Load / Save
// ─────────────────────────────────────────────
function doNew() {
  state.definition = newEmptyDefinition();
  state.selectedGroupIndex = 0;
  state.selectedArticIndex = -1;
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
      const def = loadDefinitionFromObj(parsed);
      if (!def) { e.target.value = ''; return; }
      state.definition = def;
      state.selectedGroupIndex = 0;
      state.selectedArticIndex = -1;
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
// Group events
// ─────────────────────────────────────────────
document.getElementById('group-select').addEventListener('change', e => {
  state.selectedGroupIndex = parseInt(e.target.value);
  state.selectedArticIndex = -1;
  renderArticulationList();
  renderArticulationEdit();
});

document.getElementById('group-name-input').addEventListener('input', e => {
  const grp = state.definition.ArticulationGroups[state.selectedGroupIndex];
  if (!grp) return;
  grp.Name = e.target.value;
  const sel = document.getElementById('group-select');
  if (sel.options[state.selectedGroupIndex]) {
    sel.options[state.selectedGroupIndex].textContent = e.target.value || '(unnamed)';
  }
});

document.getElementById('btn-add-group').addEventListener('click', () => {
  state.definition.ArticulationGroups.push(newArticulationGroup());
  state.selectedGroupIndex = state.definition.ArticulationGroups.length - 1;
  state.selectedArticIndex = -1;
  renderArticulationList();
  renderArticulationEdit();
  toast('Group added', 'success');
});

document.getElementById('btn-del-group').addEventListener('click', () => {
  if (state.definition.ArticulationGroups.length <= 1) {
    toast('Cannot delete the last group', 'error');
    return;
  }
  state.definition.ArticulationGroups.splice(state.selectedGroupIndex, 1);
  if (state.selectedGroupIndex >= state.definition.ArticulationGroups.length) {
    state.selectedGroupIndex = state.definition.ArticulationGroups.length - 1;
  }
  state.selectedArticIndex = -1;
  renderArticulationList();
  renderArticulationEdit();
  toast('Group deleted', 'success');
});

// ─────────────────────────────────────────────
// Extra modal events
// ─────────────────────────────────────────────
document.getElementById('btn-def-extra').addEventListener('click', () => openExtraModal('definition'));
document.getElementById('btn-group-extra').addEventListener('click', () => openExtraModal('group'));
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
  const grp = state.definition.ArticulationGroups[state.selectedGroupIndex];
  if (!grp) return;
  grp.Articulations.push(newArticulation());
  state.selectedArticIndex = grp.Articulations.length - 1;
  renderArticulationList();
  renderArticulationEdit();
});

// ─────────────────────────────────────────────
// Resize handle
// ─────────────────────────────────────────────
(function () {
  const handle = document.getElementById('resize-handle');
  const list   = document.getElementById('articulation-list');
  let dragging = false, startX = 0, startWidth = 0;

  handle.addEventListener('mousedown', e => {
    dragging   = true;
    startX     = e.clientX;
    startWidth = list.offsetWidth;
    handle.classList.add('dragging');
    document.body.style.userSelect = 'none';
    document.body.style.cursor     = 'col-resize';
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const w = Math.max(140, Math.min(500, startWidth + e.clientX - startX));
    list.style.width = w + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    document.body.style.userSelect = '';
    document.body.style.cursor     = '';
  });
})();

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────
bindGeneralEdit();
fillGeneralEdit();
renderArticulationList();
renderArticulationEdit();
