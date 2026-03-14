import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '../services/api';
import { LayoutGrid, List, Plus, Search, SlidersHorizontal, Upload } from 'lucide-react';

const cx = (...parts) => parts.filter(Boolean).join(' ');

const STATUSES = ['draft', 'waiting', 'ready', 'done', 'cancelled'];
const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'ready', label: 'Ready' },
  { id: 'done', label: 'Done' },
  { id: 'late', label: 'Late' },
];

const statusBadge = (status) => {
  const base = 'px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center';
  switch (status) {
    case 'late':
      return cx(base, 'bg-red-100 text-red-800');
    case 'ready':
      return cx(base, 'bg-green-100 text-green-800');
    case 'waiting':
      return cx(base, 'bg-amber-100 text-amber-800');
    case 'done':
      return cx(base, 'bg-blue-100 text-blue-800');
    case 'draft':
      return cx(base, 'bg-gray-100 text-gray-700');
    case 'cancelled':
      return cx(base, 'bg-red-100 text-red-800');
    default:
      return cx(base, 'bg-gray-100 text-gray-700');
  }
};

const Receipts = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('list');
  const [tab, setTab] = useState('all');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const response = await inventoryService.listReceipts({ q });
        if (isMounted) setRows(response.data);
      } catch (error) {
        console.error('Error fetching receipts:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [q]);

  const isLate = (row) => {
    if (!row?.schedule_date) return false;
    if (row.status === 'done' || row.status === 'cancelled') return false;
    const d = new Date(row.schedule_date);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const filteredRows = useMemo(() => {
    if (tab === 'all') return rows;
    if (tab === 'late') return rows.filter(isLate);
    return rows.filter((r) => r.status === tab);
  }, [rows, tab]);

  const counts = useMemo(() => {
    const c = { all: rows.length, late: 0 };
    for (const s of STATUSES) c[s] = 0;
    for (const r of rows) {
      c[r.status] = (c[r.status] || 0) + 1;
      if (isLate(r)) c.late += 1;
    }
    return c;
  }, [rows]);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(STATUSES.map((s) => [s, []]));
    for (const r of filteredRows) map[r.status]?.push(r);
    return map;
  }, [filteredRows]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Receipts</h2>
          <p className="text-sm text-gray-500">Track incoming stock receipts by status.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/operations?tab=receipt')}
            className="bg-violet-700 hover:bg-violet-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} /> Create
          </button>
          <button
            type="button"
            disabled
            className="bg-white border border-gray-200 text-gray-400 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm cursor-not-allowed"
          >
            <Upload size={18} /> Import
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView('list')}
              className={cx(
                'px-3 py-2 rounded-lg border text-sm flex items-center gap-2',
                view === 'list' ? 'bg-violet-700 text-white border-violet-700' : 'bg-white border-gray-200 text-gray-700'
              )}
            >
              <List size={16} /> List
            </button>
            <button
              type="button"
              onClick={() => setView('kanban')}
              className={cx(
                'px-3 py-2 rounded-lg border text-sm flex items-center gap-2',
                view === 'kanban' ? 'bg-violet-700 text-white border-violet-700' : 'bg-white border-gray-200 text-gray-700'
              )}
            >
              <LayoutGrid size={16} /> Kanban
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-[420px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by reference/supplier/contact..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <button type="button" className="px-3 py-2 rounded-lg border border-gray-200 bg-white flex items-center gap-2 hover:bg-gray-50">
              <SlidersHorizontal size={16} /> Filters
            </button>
            <div className="flex sm:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setView('list')}
                className={cx(
                  'px-3 py-2 rounded-lg border text-sm flex items-center gap-2',
                  view === 'list' ? 'bg-violet-700 text-white border-violet-700' : 'bg-white border-gray-200 text-gray-700'
                )}
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => setView('kanban')}
                className={cx(
                  'px-3 py-2 rounded-lg border text-sm flex items-center gap-2',
                  view === 'kanban' ? 'bg-violet-700 text-white border-violet-700' : 'bg-white border-gray-200 text-gray-700'
                )}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-gray-100 overflow-x-auto">
          <div className="inline-flex items-center gap-2">
            {FILTER_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cx(
                  'px-3 py-1.5 rounded-full text-sm border transition-colors',
                  tab === t.id ? 'bg-violet-100 text-violet-800 border-violet-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                )}
              >
                {t.label}
                <span className="ml-2 text-xs text-gray-500">{counts[t.id] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-gray-500">Loading receipts...</div>
        ) : view === 'list' ? (
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Reference</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Contact</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Scheduled Date</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Destination</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic">No receipts found.</td>
                  </tr>
                ) : (
                  filteredRows.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{r.reference_code}</td>
                      <td className="px-6 py-4 text-gray-600">{r.contact || r.supplier}</td>
                      <td className={cx('px-6 py-4 text-gray-700', isLate(r) && 'text-red-600 font-semibold')}>
                        {r.schedule_date || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{r.warehouse_name}/{r.location_name}</td>
                      <td className="px-6 py-4">
                        <span className={statusBadge(isLate(r) ? 'late' : r.status)}>{isLate(r) ? 'late' : r.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && view === 'list' ? (
          <div className="md:hidden p-4 space-y-3">
            {filteredRows.length === 0 ? (
              <div className="text-sm text-gray-500 italic">No receipts found.</div>
            ) : (
              filteredRows.map((r) => (
                <div key={r.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{r.reference_code}</div>
                      <div className="text-sm text-gray-600 mt-1">{r.contact || r.supplier}</div>
                    </div>
                    <span className={statusBadge(isLate(r) ? 'late' : r.status)}>{isLate(r) ? 'late' : r.status}</span>
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Scheduled</span>
                      <span className={cx(isLate(r) && 'text-red-600 font-semibold')}>{r.schedule_date || '-'}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-500">Destination</span>
                      <span>{r.warehouse_name}/{r.location_name}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {STATUSES.map((s) => (
              <div key={s} className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-100 font-semibold text-sm text-gray-700 flex justify-between">
                  <span className="capitalize">{s}</span>
                  <span className="text-gray-500">{grouped[s]?.length || 0}</span>
                </div>
                <div className="p-3 space-y-2">
                  {(grouped[s] || []).map((r) => (
                    <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="text-sm font-semibold text-gray-900">{r.reference_code}</div>
                      <div className="text-xs text-gray-600">{r.contact || r.supplier}</div>
                      <div className="text-xs text-gray-500 mt-1">{r.warehouse_name}/{r.location_name}</div>
                    </div>
                  ))}
                  {(grouped[s] || []).length === 0 && (
                    <div className="text-xs text-gray-500 italic">Empty</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Receipts;
