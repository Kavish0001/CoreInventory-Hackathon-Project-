import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchReceipts, setReceiptFilters, selectReceipts } from '../features/inventory/receiptsSlice';
import { DataTable, SearchInput, FilterTabs, StatusBadge, ViewToggle } from '../components/ui';
import { Plus } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';

const TABS = [
  { id: 'all', label: 'All Receipts' },
  { id: 'draft', label: 'Draft' },
  { id: 'ready', label: 'Ready' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'done', label: 'Done' },
  { id: 'late', label: 'Late' },
];

export default function ReceiptsList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading, filters } = useSelector(selectReceipts);
  const [view, setView] = useState('list');

  useEffect(() => {
    dispatch(fetchReceipts({ q: filters.q, status: filters.tab === 'all' || filters.tab === 'late' ? '' : filters.tab }));
  }, [dispatch, filters.q, filters.tab]);

  const isLate = (row) => {
    if (row.status === 'done' || row.status === 'cancelled') return false;
    if (!row.schedule_date) return false;
    return isBefore(new Date(row.schedule_date), startOfDay(new Date()));
  };

  const filtered = useMemo(() => {
    if (filters.tab === 'late') return items.filter(isLate);
    return items;
  }, [items, filters.tab]);

  const counts = useMemo(() => {
    const c = { all: items.length, draft: 0, ready: 0, waiting: 0, done: 0, late: 0 };
    items.forEach((r) => {
      if (c[r.status] !== undefined) c[r.status]++;
      if (isLate(r)) c.late++;
    });
    return c;
  }, [items]);

  const columns = [
    { key: 'reference_code', label: 'Reference', cellClass: 'font-medium text-primary' },
    { key: 'supplier', label: 'From (Vendor)' },
    {
      key: 'schedule_date',
      label: 'Scheduled Date',
      render: (val, row) => {
        if (!val) return '-';
        const d = format(new Date(val), 'yyyy-MM-dd HH:mm');
        const late = isLate(row);
        return <span className={late ? 'text-danger font-medium' : ''}>{d}</span>;
      },
    },
    { key: 'warehouse_name', label: 'Destination' },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => {
        if (isLate(row)) return <StatusBadge status="late" />;
        return <StatusBadge status={val} />;
      },
    },
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Receipts</h1>
          <p className="text-sm text-text-secondary mt-0.5">Incoming inventory orders</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/receipts/new')}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} /> Create
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FilterTabs
            tabs={TABS}
            active={filters.tab}
            onChange={(tab) => dispatch(setReceiptFilters({ tab }))}
            counts={counts}
          />
          <div className="flex items-center gap-3">
            <SearchInput
              value={filters.q}
              onChange={(q) => dispatch(setReceiptFilters({ q }))}
              placeholder="Search..."
              className="w-full sm:w-56"
            />
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>

        {/* List View */}
        {view === 'list' && (
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            onRowClick={(row) => navigate(`/receipts/${row.id}`)}
            emptyMessage="No receipts found."
          />
        )}

        {/* Kanban View */}
        {view === 'kanban' && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((r) => (
              <div
                key={r.id}
                onClick={() => navigate(`/receipts/${r.id}`)}
                className="p-4 border border-border rounded-xl bg-white hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary">{r.reference_code}</span>
                  <StatusBadge status={isLate(r) ? 'late' : r.status} size="sm" />
                </div>
                <p className="text-sm text-text-primary">{r.supplier}</p>
                <p className="text-xs text-text-muted mt-1">
                  {r.schedule_date ? format(new Date(r.schedule_date), 'MMM dd, yyyy') : 'No date'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
