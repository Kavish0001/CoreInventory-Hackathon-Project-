import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWarehouses, createWarehouse, selectWarehouses } from '../features/warehouses/warehousesSlice';
import { DataTable, Modal, FormField, SearchInput } from '../components/ui';
import { Plus, Warehouse } from 'lucide-react';
import { format } from 'date-fns';

export default function WarehousesPage() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector(selectWarehouses);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', short_code: '', address: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  const filtered = items.filter((w) =>
    w.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.short_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'name', label: 'Warehouse Name', cellClass: 'font-medium text-text-primary' },
    { key: 'short_code', label: 'Short Code', cellClass: 'font-semibold text-primary uppercase' },
    { key: 'address', label: 'Address', cellClass: 'text-text-secondary truncate max-w-[250px]' },
    { key: 'location_count', label: 'Locations', render: (val) => val || 0 },
    { key: 'created_at', label: 'Created', render: (val) => val ? format(new Date(val), 'MMM dd, yyyy') : '-' },
  ];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.short_code) return;
    try {
      await dispatch(createWarehouse(form)).unwrap();
      setShowModal(false);
      setForm({ name: '', short_code: '', address: '' });
      dispatch(fetchWarehouses());
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Warehouses</h1>
          <p className="text-sm text-text-secondary mt-0.5">Manage facilities and short codes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} /> Add Warehouse
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-4 border-b border-border">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search warehouses..."
            className="w-full sm:w-80"
          />
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="No warehouses configured."
          icon={Warehouse}
        />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Warehouse">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Warehouse Name" required htmlFor="wh-name">
            <input id="wh-name" type="text" required className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Short Code" required htmlFor="wh-code">
            <input id="wh-code" type="text" required maxLength={5} placeholder="e.g. WH, NY, MAIN" className="w-full px-3 py-2 text-sm uppercase border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" value={form.short_code} onChange={(e) => setForm({ ...form, short_code: e.target.value.toUpperCase() })} />
          </FormField>
          <FormField label="Address" htmlFor="wh-addr">
            <textarea id="wh-addr" rows={3} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-border text-text-secondary hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors font-medium">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
