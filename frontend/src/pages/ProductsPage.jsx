import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, createProduct, setProductSearch, selectProducts } from '../features/products/productsSlice';
import { fetchStock, selectStock } from '../features/stock/stockSlice';
import { DataTable, SearchInput, StatusBadge, Modal, FormField } from '../components/ui';
import { Plus } from 'lucide-react';

export default function ProductsPage() {
  const dispatch = useDispatch();
  const { items, loading, searchTerm } = useSelector(selectProducts);
  const { items: stockItems } = useSelector(selectStock);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', category: '', unit: '', per_unit_cost: '', reorder_level: '' });
  const [formError, setFormError] = useState('');


  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchStock());
  }, [dispatch]);

  const stockMap = useMemo(() => {
    const map = new Map();
    for (const s of stockItems) map.set(Number(s.product_id), s);
    return map;
  }, [stockItems]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    if (!q) return items;
    return items.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [items, searchTerm]);

  const getStatus = (product) => {
    const snap = stockMap.get(Number(product.id));
    const onHand = Number(snap?.on_hand ?? 0);
    if (onHand <= 0) return 'out_of_stock';
    if (onHand < Number(product.reorder_level || 0)) return 'low_stock';
    return 'in_stock';
  };

  const columns = [
    { key: 'name', label: 'Product Name', cellClass: 'font-medium text-text-primary' },
    { key: 'sku', label: 'SKU', cellClass: 'text-text-secondary' },
    { key: 'category', label: 'Category', cellClass: 'text-text-secondary' },
    {
      key: 'on_hand',
      label: 'On Hand',
      render: (_, row) => stockMap.get(Number(row.id))?.on_hand ?? 0,
    },
    {
      key: 'per_unit_cost',
      label: 'Price',
      render: (_, row) => {
        const cost = Number(row.per_unit_cost || 0);
        return cost > 0 ? `$${cost.toFixed(2)}` : '-';
      },
    },
    { key: 'unit', label: 'UoM', cellClass: 'text-text-secondary' },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <StatusBadge status={getStatus(row)} />,
    },
  ];

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.sku.trim()) {
      setFormError('Name and SKU are required');
      return;
    }
    try {
      await dispatch(createProduct({
        ...form,
        per_unit_cost: Number(form.per_unit_cost) || 0,
        reorder_level: Number(form.reorder_level) || 0,
      })).unwrap();
      setShowModal(false);
      setForm({ name: '', sku: '', category: '', unit: '', per_unit_cost: '', reorder_level: '' });
      dispatch(fetchProducts());
    } catch (err) {
      setFormError(err || 'Failed to create product');
    }
  };



  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Products</h1>
          <p className="text-sm text-text-secondary mt-0.5">Manage your product catalog</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} /> Create
        </button>
      </div>

      {/* Table card */}
      <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-4 border-b border-border">
          <SearchInput
            value={searchTerm}
            onChange={(val) => dispatch(setProductSearch(val))}
            placeholder="Search products..."
            className="w-full sm:w-80"
          />
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="No products found. Click Create to add one."
        />
      </div>

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Product" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-lg">{formError}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Product Name" required htmlFor="prod-name">
              <input id="prod-name" type="text" required className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </FormField>
            <FormField label="SKU" required htmlFor="prod-sku">
              <input id="prod-sku" type="text" required className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </FormField>
            <FormField label="Category" htmlFor="prod-cat">
              <input id="prod-cat" type="text" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </FormField>
            <FormField label="Unit of Measure" htmlFor="prod-unit">
              <input id="prod-unit" type="text" placeholder="e.g. Units, Kg" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </FormField>
            <FormField label="Per Unit Cost" htmlFor="prod-cost">
              <input id="prod-cost" type="number" step="0.01" min="0" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" value={form.per_unit_cost} onChange={(e) => setForm({ ...form, per_unit_cost: e.target.value })} />
            </FormField>
            <FormField label="Reorder Level" htmlFor="prod-reorder">
              <input id="prod-reorder" type="number" min="0" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-border text-text-secondary hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors font-medium">Create Product</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
