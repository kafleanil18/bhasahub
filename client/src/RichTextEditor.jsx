import { useRef, useEffect, useState } from 'react';
import { mediaUrl } from './utils/mediaUrl';

const FONT_SIZES = [
  { label: 'Small', value: '2' },
  { label: 'Normal', value: '3' },
  { label: 'Large', value: '5' },
  { label: 'Huge', value: '7' },
];

const COLORS = ['#1a1a1a', '#b3261e', '#1a56db', '#0f7b3f', '#a35709', '#6b21a8'];

function RichTextEditor({ value, onChange, placeholder, onUploadImage, onError }) {
  const ref = useRef(null);
  const savedRange = useRef(null);
  const fileInputRef = useRef(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    // Skip while the user is actively editing: the DOM is already the source of
    // truth for their in-progress change, and resetting innerHTML here would
    // wipe the cursor position mid-keystroke.
    if (document.activeElement === ref.current) return;
    if (ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && ref.current && ref.current.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const exec = (command, arg) => {
    ref.current?.focus();
    // Only replay the saved range if the live selection fell outside the editor
    // (e.g. after a window.prompt() or file picker stole focus). Otherwise the
    // browser's own live selection is more accurate than a replayed Range,
    // which can reset the caret to the start of a just-mutated node.
    const sel = window.getSelection();
    const stillInEditor = sel && sel.rangeCount > 0 && ref.current && ref.current.contains(sel.anchorNode);
    if (!stillInEditor) restoreSelection();
    document.execCommand(command, false, arg);
    saveSelection();
    onChange(ref.current?.innerHTML || '');
  };

  const toggleList = (command) => {
    ref.current?.focus();
    const sel0 = window.getSelection();
    const stillInEditor = sel0 && sel0.rangeCount > 0 && ref.current && ref.current.contains(sel0.anchorNode);
    if (!stillInEditor) restoreSelection();
    document.execCommand(command, false);
    // Chrome can misplace the caret at the start of the affected list item when
    // converting existing (unwrapped) text into a list. Force it back to the end
    // of that item so subsequent typing doesn't get prepended before the text.
    const sel = window.getSelection();
    if (sel && ref.current && sel.anchorNode && ref.current.contains(sel.anchorNode)) {
      let li = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
      while (li && li !== ref.current && li.tagName !== 'LI') li = li.parentElement;
      const target = li || ref.current;
      const range = document.createRange();
      range.selectNodeContents(target);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    saveSelection();
    onChange(ref.current?.innerHTML || '');
  };

  const preventBlur = (e) => e.preventDefault();

  const findAncestorTable = () => {
    let node = savedRange.current?.startContainer;
    while (node && node !== ref.current) {
      if (node.nodeType === 1 && node.tagName === 'TABLE') return node;
      node = node.parentNode;
    }
    return null;
  };

  const insertTable = () => {
    const rowsInput = window.prompt('Number of rows?', '3');
    if (rowsInput === null) return;
    const colsInput = window.prompt('Number of columns?', '3');
    if (colsInput === null) return;
    const rows = Math.min(20, Math.max(1, parseInt(rowsInput, 10) || 3));
    const cols = Math.min(10, Math.max(1, parseInt(colsInput, 10) || 3));
    let html = '<table class="rte-table"><tbody>';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) html += '<td>&nbsp;</td>';
      html += '</tr>';
    }
    html += '</tbody></table><p><br></p>';
    exec('insertHTML', html);
  };

  const addTableRow = () => {
    const table = findAncestorTable();
    if (!table) return onError?.('Click inside a table first to add a row.');
    const cols = table.rows[0] ? table.rows[0].cells.length : 1;
    const newRow = table.insertRow(-1);
    for (let i = 0; i < cols; i++) newRow.insertCell(-1).innerHTML = '&nbsp;';
    onChange(ref.current?.innerHTML || '');
  };

  const addTableColumn = () => {
    const table = findAncestorTable();
    if (!table) return onError?.('Click inside a table first to add a column.');
    for (const row of table.rows) row.insertCell(-1).innerHTML = '&nbsp;';
    onChange(ref.current?.innerHTML || '');
  };

  const handleImageChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUploadImage) return;
    setIsUploadingImage(true);
    try {
      const url = await onUploadImage(file);
      if (url) exec('insertHTML', `<img src="${mediaUrl(url)}" alt="" style="max-width:100%;border-radius:6px;" />`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <button type="button" className="rte-btn" onMouseDown={preventBlur} onClick={() => exec('bold')} title="Bold"><b>B</b></button>
        <button type="button" className="rte-btn" onMouseDown={preventBlur} onClick={() => exec('italic')} title="Italic"><i>I</i></button>
        <button type="button" className="rte-btn" onMouseDown={preventBlur} onClick={() => exec('underline')} title="Underline"><u>U</u></button>
        <select
          className="rte-select"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) exec('fontSize', e.target.value);
            e.target.value = '';
          }}
          title="Font size"
        >
          <option value="" disabled>Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <div className="rte-colors">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="rte-color-swatch"
              style={{ background: c }}
              onMouseDown={preventBlur}
              onClick={() => exec('foreColor', c)}
              title={`Text color ${c}`}
              aria-label={`Text color ${c}`}
            />
          ))}
        </div>
        <button type="button" className="rte-btn" onMouseDown={preventBlur} onClick={() => toggleList('insertUnorderedList')} title="Bullet list">• List</button>
        <button type="button" className="rte-btn" onMouseDown={preventBlur} onClick={() => toggleList('insertOrderedList')} title="Numbered list">1. List</button>
        <button type="button" className="rte-btn" onMouseDown={preventBlur} onClick={insertTable} title="Insert table">Table</button>
        <button type="button" className="rte-btn" onMouseDown={preventBlur} onClick={addTableRow} title="Add row to table">+Row</button>
        <button type="button" className="rte-btn" onMouseDown={preventBlur} onClick={addTableColumn} title="Add column to table">+Col</button>
        {onUploadImage && (
          <button
            type="button"
            className="rte-btn"
            onMouseDown={preventBlur}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage}
            title="Insert image"
          >
            {isUploadingImage ? 'Uploading…' : '+ Image'}
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChosen} />
        <button type="button" className="rte-btn" onMouseDown={preventBlur} onClick={() => exec('removeFormat')} title="Clear formatting">Clear</button>
      </div>
      <div
        ref={ref}
        className="rte-content dialogue-input"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={() => onChange(ref.current?.innerHTML || '')}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onBlur={saveSelection}
      />
    </div>
  );
}

export default RichTextEditor;
