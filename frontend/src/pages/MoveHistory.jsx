import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMoveHistory, setMoveHistorySearch, selectMoveHistory } from '../features/inventory/moveHistorySlice';
import { DataTable, SearchInput, FilterTabs } from '../components/ui';
import { format } from 'date-fns';
import { ArrowDownRight, ArrowUpRight, ArrowRightLeft, Settings2 } from 'lucide-react';

const TABS = [
  { id: 'all', label: 'All Operations' },
  { id: 'RECEIPT', label: 'Receipts' },
  { id: 'DELIVERY', label: 'Deliveries' },
  { id: 'TRANSFER', label: 'Transfers' },
  { id: 'ADJUSTMENT', label: 'Adjustments' },
];

export default function MoveHistory() {
  const dispatch = useDispatch();
  const { items, loading, searchTerm } = useSelector(selectMoveHistory);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    dispatch(fetchMoveHistory({ q: searchTerm }));
  }, [dispatch, searchTerm]);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return items;
    return items.filter((m) => m.type === activeTab);
  }, [items, activeTab]);

  const counts = useMemo(() => {
    const c = { all: items.length, RECEIPT: 0, DELIVERY: 0, TRANSFER: 0, ADJUSTMENT: 0 };
    items.forEach((m) => {
      if (c[m.type] !== undefined) c[m.type]++;
    });
    return c;
  }, [items]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'RECEIPT': return <ArrowDownRight size={16} className="text-success" />;
      case 'DELIVERY': return <ArrowUpRight size={16} className="text-danger" />;
      case 'TRANSFER': return <ArrowRightLeft size={16} className="text-primary" />;
      case 'ADJUSTMENT': return <Settings2 size={16} className="text-info" />;
      default: return null;
    }
  };

  const columns = [
    {
      key: 'created_at',
      label: 'Date',
      render: (val) => format(new Date(val), 'MMM dd, HH:mm'),
    },
    { key: 'reference_code', label: 'Reference', cellClass: 'font-medium text-primary' },
    { key: 'product_name', label: 'Product', cellClass: 'font-medium text-text-primary' },
    {
      key: 'type',
      label: 'Type',
      render: (val) => (
        <div className="flex items-center gap-1.5">
          {getTypeIcon(val)}
          <span className="text-xs font-semibold capitalize text-text-secondary">{val.toLowerCase()}</span>
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (_, row) => {
        const isOut = row.direction === 'OUT';
        const colorClass = isOut ? 'text-danger bg-danger-light' : 'text-success bg-success-light';
        const sign = isOut ? '-' : '+';
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${colorClass}`}>
            {sign}{Math.abs(row.quantity)}
          </span>
        );
      },
    },
    {
      key: 'location',
      label: 'From → To',
      render: (_, row) => {
        const from = row.source_location || 'Partner Location';
        const to = row.destination_location || 'Partner Location';
        return <span className="text-xs text-text-secondary">{from} &rarr; {to}</span>;
      },
    },
    { key: 'contact', label: 'Contact', cellClass: 'text-text-secondary' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Move History</h1>
        <p className="text-sm text-text-secondary mt-0.5">Complete log of all inventory movements</p>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FilterTabs
            tabs={TABS}
            active={activeTab}
            onChange={setActiveTab}
            counts={counts}
          />
          <SearchInput
            value={searchTerm}
            onChange={(val) => dispatch(setMoveHistorySearch(val))}
            placeholder="Search reference, product, or contact..."
            className="w-full sm:w-64"
          />
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="No movements found."
        />
      </div>
    </div>
  );
}
