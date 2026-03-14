import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStock, setStockSearch, selectStock } from '../features/stock/stockSlice';
import { DataTable, SearchInput, StatusBadge } from '../components/ui';

export default function StockPage() {
  const dispatch = useDispatch();
  const { items, loading, searchTerm } = useSelector(selectStock);

  useEffect(() => {
    dispatch(fetchStock());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    if (!q) return items;
    return items.filter((s) => s.product_name?.toLowerCase().includes(q) || s.sku?.toLowerCase().includes(q));
  }, [items, searchTerm]);

  const getStatus = (row) => {
    const qty = Number(row.on_hand);
    if (qty <= 0) return 'out_of_stock';
    if (qty < 10) return 'low_stock';
    return 'in_stock';
  };

  const columns = [
    { key: 'product_name', label: 'Product', cellClass: 'font-medium text-text-primary' },
    { key: 'sku', label: 'SKU', cellClass: 'text-text-secondary' },
    { key: 'on_hand', label: 'On Hand', render: (val) => <span className="font-semibold">{val}</span> },
    { key: 'free_to_use', label: 'Forecasted' },
    {
      key: 'per_unit_cost',
      label: 'Unit Cost',
      render: (val) => val > 0 ? `$${Number(val).toFixed(2)}` : '-',
    },
    {
      key: 'inventory_value',
      label: 'Value',
      render: (val) => val > 0 ? `$${Number(val).toFixed(2)}` : '-',
      cellClass: 'font-medium',
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <StatusBadge status={getStatus(row)} />,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Stock</h1>
        <p className="text-sm text-text-secondary mt-0.5">Current inventory levels across warehouses</p>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-4 border-b border-border">
          <SearchInput
            value={searchTerm}
            onChange={(val) => dispatch(setStockSearch(val))}
            placeholder="Search by product or SKU..."
            className="w-full sm:w-80"
          />
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="No stock data available."
        />
      </div>
    </div>
  );
}
