import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../DataContext.jsx';
import { cellVal, inRange, rangeText } from '../utils.js';
import { exportExcel, exportPdf } from '../export.js';
import DataTable from './DataTable.jsx';
import { Confirm, DateRangeFilter, Modal, PageHeader, PrintHead, SummaryCard } from './ui.jsx';

// Generic list page: search + filters + sort + add/edit/delete + exports
export default function CrudPage({
  title, collection, rows, columns, Form, filters = [], summary, addLabel = '+ Add New',
  editable = () => true, lockedNote, beforeDelete, extraActions, openNew, onNewHandled,
  note, noDate, defaultSort = { key: 'date', dir: 'desc' }, deleteText,
}) {
  const { remove, notify } = useData();
  const [q, setQ] = useState('');
  const [range, setRange] = useState({ preset: 'all' });
  const [fv, setFv] = useState({});
  const [sort, setSort] = useState(defaultSort);
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (openNew) { setModal({ row: null }); onNewHandled && onNewHandled(); } }, [openNew]); // eslint-disable-line

  const view = useMemo(() => {
    let r = rows.filter((x) => noDate || !x.date || inRange(x.date, range));
    filters.forEach((f) => { if (fv[f.key]) r = r.filter((x) => (f.get ? f.get(x) : x[f.key]) === fv[f.key]); });
    const s = q.trim().toLowerCase();
    if (s) r = r.filter((x) => columns.map((c) => cellVal(c, x)).join(' ').toLowerCase().includes(s));
    const col = columns.find((c) => c.key === sort.key);
    if (col) {
      r = [...r].sort((a, b) => {
        const x = cellVal(col, a), y = cellVal(col, b);
        const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''));
        return sort.dir === 'asc' ? c : -c;
      });
    }
    return r;
  }, [rows, range, fv, q, sort, columns, filters, noDate]);

  const onSort = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));
  const sections = [{ title, columns, rows: view }];
  const sum = summary ? summary(view) : [];
  const rt = noDate ? '' : rangeText(range);

  const doDelete = async () => {
    setBusy(true);
    try { await remove(del.source || del.collection, del.id); notify('Deleted'); setDel(null); }
    catch (e) { notify(e.message, 'err'); } finally { setBusy(false); }
  };
  const askDelete = (row) => {
    const problem = beforeDelete && beforeDelete(row);
    if (problem) return notify(problem, 'err');
    setDel({ ...row, collection });
  };

  return (
    <div>
      <PrintHead title={`${title} ${rt ? '(' + rt + ')' : ''}`} />
      <PageHeader title={title}>
        <button className="btn primary big" onClick={() => setModal({ row: null })}>{addLabel}</button>
      </PageHeader>
      {note && <p className="note no-print">{note}</p>}
      {sum.length > 0 && <div className="grid sums">{sum.map(([l, v, t]) => <SummaryCard key={l} label={l} value={v} tone={t} />)}</div>}

      <div className="filters no-print">
        <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
          <input className="search" placeholder="🔍 Search records..." value={q} onChange={(e) => setQ(e.target.value)} />
          {q && <button type="button" className="btn sm ghost" onClick={() => setQ('')} aria-label="Clear search">✕</button>}
        </div>
        {!noDate && <DateRangeFilter value={range} onChange={setRange} />}
        {filters.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
            {filters.map((f) => (
              <select key={f.key} value={fv[f.key] || ''} onChange={(e) => setFv({ ...fv, [f.key]: e.target.value })} aria-label={f.label} style={{ flex: '1 1 140px' }}>
                <option value="">{f.label}: All</option>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
          </div>
        )}
        <div className="export-btns">
          <button className="btn sm ghost" onClick={() => window.print()}>🖨 Print</button>
          <button className="btn sm ghost" onClick={() => exportExcel(title, sections, sum, rt)}>📗 Excel</button>
          <button className="btn sm ghost" onClick={() => exportPdf(title, title, rt, sections, sum)}>📕 PDF</button>
        </div>
      </div>

      <div className="card flush">
        <DataTable
          columns={columns} rows={view} sort={sort} onSort={onSort}
          empty={rows.length ? 'Nothing matches your search or filters' : `No records yet. Tap "${addLabel}" to add the first one.`}
          actions={(r) => (
            <>
              {extraActions && extraActions(r)}
              {editable(r) ? (
                <>
                  <button className="btn sm" onClick={() => setModal({ row: r })}>✏️ Edit</button>
                  <button className="btn sm danger-o" onClick={() => askDelete(r)}>🗑 Delete</button>
                </>
              ) : <span className="muted">{lockedNote ? lockedNote(r) : ''}</span>}
            </>
          )}
        />
      </div>

      {modal && (
        <Modal title={modal.row ? `Edit ${title}` : addLabel.replace('+ ', '')} onClose={() => setModal(null)}>
          <Form initial={modal.row} onDone={() => setModal(null)} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {del && <Confirm busy={busy} text={deleteText ? deleteText(del) : 'Delete this record permanently? This cannot be undone.'} onYes={doDelete} onNo={() => setDel(null)} />}
    </div>
  );
}
