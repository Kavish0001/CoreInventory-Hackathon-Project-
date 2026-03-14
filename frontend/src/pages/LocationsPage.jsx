import { useEffect, useMemo, useState } from 'react';
import { MapPin, Plus, Building2, AlertTriangle } from 'lucide-react';
import { warehouseService } from '../services/api';
import Modal from '../components/ui/Modal';
import FormField from '../components/ui/FormField';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

export default function LocationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ location_name: '', short_code: '' });

  const selectedWarehouse = useMemo(
    () => warehouses.find((w) => String(w.id) === String(selectedWarehouseId)),
    [warehouses, selectedWarehouseId]
  );

  useEffect(() => {
    let alive = true;
    async function loadWarehouses() {
      setLoading(true);
      setError('');
      try {
        const res = await warehouseService.getWarehouses();
        if (!alive) return;
        const list = res.data || [];
        setWarehouses(list);
        setSelectedWarehouseId(list[0]?.id ? String(list[0].id) : '');
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || e.message || 'Failed to load warehouses');
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadWarehouses();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadLocations() {
      if (!selectedWarehouseId) {
        setLocations([]);
        return;
      }
      setError('');
      try {
        const res = await warehouseService.getLocations(selectedWarehouseId);
        if (!alive) return;
        setLocations(res.data || []);
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || e.message || 'Failed to load locations');
      }
    }

    loadLocations();
    return () => { alive = false; };
  }, [selectedWarehouseId]);

  const handleCreate = async () => {
    if (!selectedWarehouseId) return;
    setCreating(true);
    setError('');

    try {
      const payload = {
        warehouse_id: Number(selectedWarehouseId),
        location_name: createForm.location_name.trim(),
        short_code: createForm.short_code.trim() || null,
      };
      const res = await warehouseService.createLocation(payload);
      setLocations((prev) => [res.data, ...prev]);
      setOpen(false);
      setCreateForm({ location_name: '', short_code: '' });
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to create location');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary-light rounded-lg text-primary">
          <MapPin size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Locations</h1>
          <p className="text-sm text-text-secondary mt-0.5">Manage inventory locations and zones within warehouses</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm"
          >
            <Plus size={16} /> New Location
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] p-10">
          <LoadingSpinner label="Loading warehouses..." />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)]">
          {error && (
            <div className="p-4 border-b border-border bg-danger-light/50 text-danger text-sm flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <div className="p-5 flex flex-col md:flex-row md:items-center gap-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 text-text-muted">
                <Building2 size={18} />
              </div>
              <div>
                <p className="text-xs text-text-muted">Warehouse</p>
                <p className="text-sm font-semibold text-text-primary">{selectedWarehouse?.name || '—'}</p>
              </div>
            </div>
            <div className="md:ml-auto w-full md:w-[320px]">
              <select
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          {locations.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No locations yet"
              description="Create at least one location per warehouse (e.g. Stock, Output, Receiving)."
              action={
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  <Plus size={16} /> New Location
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-secondary bg-gray-50/50 border-b border-border">
                    <th className="text-left px-5 py-3 font-semibold">Location</th>
                    <th className="text-left px-5 py-3 font-semibold w-[180px]">Short Code</th>
                    <th className="text-left px-5 py-3 font-semibold w-[180px]">Warehouse</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((l) => (
                    <tr key={l.id} className="border-b border-border-light last:border-0 hover:bg-gray-50/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-text-primary">{l.location_name}</td>
                      <td className="px-5 py-3 text-text-secondary">{l.short_code || '—'}</td>
                      <td className="px-5 py-3 text-text-secondary">{selectedWarehouse?.short_code || selectedWarehouse?.name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create Location" size="md">
        <div className="space-y-4">
          <FormField label="Warehouse" required>
            <div className="px-3 py-2 rounded-lg border border-border bg-gray-50 text-sm text-text-secondary">
              {selectedWarehouse?.name || 'Select a warehouse first'}
            </div>
          </FormField>

          <FormField label="Location Name" required>
            <input
              className="w-full px-3 py-2 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              value={createForm.location_name}
              onChange={(e) => setCreateForm((p) => ({ ...p, location_name: e.target.value }))}
              placeholder="e.g. Stock / Output / Receiving"
            />
          </FormField>

          <FormField label="Short Code">
            <input
              className="w-full px-3 py-2 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              value={createForm.short_code}
              onChange={(e) => setCreateForm((p) => ({ ...p, short_code: e.target.value }))}
              placeholder="e.g. STOCK"
            />
          </FormField>

          {error && (
            <div className="p-3 rounded-lg bg-danger-light border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg border border-border bg-white text-text-secondary text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedWarehouseId || !createForm.location_name.trim() || creating}
              onClick={handleCreate}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
