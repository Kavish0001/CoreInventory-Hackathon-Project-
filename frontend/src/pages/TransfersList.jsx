import { useEffect, useMemo, useState } from 'react';
import { Repeat, Plus, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { productService, warehouseService, inventoryService } from '../services/api';
import FormField from '../components/ui/FormField';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

export default function TransfersList() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [locationsByWarehouse, setLocationsByWarehouse] = useState({});

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    warehouse_id: '',
    source_location_id: '',
    destination_location_id: '',
  });
  const [lines, setLines] = useState([{ product_id: '', quantity: 1 }]);

  const sourceLocations = useMemo(() => locationsByWarehouse[form.warehouse_id] || [], [locationsByWarehouse, form.warehouse_id]);
  const destinationLocations = sourceLocations;

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [whRes, prodRes] = await Promise.all([
          warehouseService.getWarehouses(),
          productService.getProducts(),
        ]);

        if (!alive) return;
        setWarehouses(whRes.data || []);
        setProducts(prodRes.data || []);
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || e.message || 'Failed to load transfer data');
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadLocations() {
      const warehouseId = form.warehouse_id;
      if (!warehouseId || locationsByWarehouse[warehouseId]) return;

      try {
        const res = await warehouseService.getLocations(warehouseId);
        if (!alive) return;
        setLocationsByWarehouse((prev) => ({ ...prev, [warehouseId]: res.data || [] }));
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || e.message || 'Failed to load locations');
      }
    }
    loadLocations();
    return () => { alive = false; };
  }, [form.warehouse_id, locationsByWarehouse]);

  const addLine = () => setLines((prev) => [...prev, { product_id: '', quantity: 1 }]);
  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));
  const updateLine = (idx, field, value) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));

  const canSubmit = () => {
    if (!form.warehouse_id || !form.source_location_id || !form.destination_location_id) return false;
    if (String(form.source_location_id) === String(form.destination_location_id)) return false;
    const normalized = lines
      .map((l) => ({ product_id: String(l.product_id || '').trim(), quantity: Number(l.quantity) }))
      .filter((l) => l.product_id && Number.isFinite(l.quantity) && l.quantity > 0);
    return normalized.length > 0;
  };

  const handleCreate = async () => {
    setSubmitting(true);
    setError('');
    setSuccess(null);
    try {
      const payload = {
        ...form,
        products: lines
          .map((l) => ({ product_id: l.product_id, quantity: Number(l.quantity) }))
          .filter((l) => l.product_id && Number.isFinite(l.quantity) && l.quantity > 0),
      };

      const res = await inventoryService.createTransfer(payload);
      setSuccess(res.data);
      setOpen(false);
      setForm({ warehouse_id: '', source_location_id: '', destination_location_id: '' });
      setLines([{ product_id: '', quantity: 1 }]);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to create transfer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary-light rounded-lg text-primary">
          <Repeat size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Internal Transfers</h1>
          <p className="text-sm text-text-secondary mt-0.5">Move stock between warehouses or internal locations</p>
        </div>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => { setError(''); setSuccess(null); setOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm"
          >
            <Plus size={16} /> New Transfer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] p-10">
          <LoadingSpinner label="Loading transfer setup..." />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)]">
          {error && (
            <div className="p-4 border-b border-border bg-danger-light/50 text-danger text-sm flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {success ? (
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-success/10 text-success">
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-text-primary">Transfer completed</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Reference: <span className="font-semibold text-text-primary">{success.reference_code}</span>
                  </p>
                  <p className="text-xs text-text-muted mt-1">Status: {success.status}</p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Repeat}
              title="Create your first transfer"
              description="Warehouse Staff can move stock between internal locations. Inventory Managers can oversee the workflow and review Move History."
              action={
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  <Plus size={16} /> New Transfer
                </button>
              }
            />
          )}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Internal Transfer" size="lg">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-danger-light border border-danger/20 text-danger text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Warehouse" required>
            <select
              className="w-full px-3 py-2 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              value={form.warehouse_id}
              onChange={(e) => setForm({ warehouse_id: e.target.value, source_location_id: '', destination_location_id: '' })}
            >
              <option value="">Select warehouse...</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </FormField>

          <div className="hidden md:flex items-end justify-center pb-1 text-text-muted">
            <ArrowRight size={20} />
          </div>

          <FormField label="Source Location" required>
            <select
              disabled={!form.warehouse_id}
              className="w-full px-3 py-2 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60"
              value={form.source_location_id}
              onChange={(e) => setForm({ ...form, source_location_id: e.target.value })}
            >
              <option value="">{form.warehouse_id ? 'Select source...' : 'Select warehouse first'}</option>
              {sourceLocations.map((l) => (
                <option key={l.id} value={l.id}>{l.location_name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Destination Location" required>
            <select
              disabled={!form.warehouse_id}
              className="w-full px-3 py-2 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60"
              value={form.destination_location_id}
              onChange={(e) => setForm({ ...form, destination_location_id: e.target.value })}
            >
              <option value="">{form.warehouse_id ? 'Select destination...' : 'Select warehouse first'}</option>
              {destinationLocations.map((l) => (
                <option key={l.id} value={l.id}>{l.location_name}</option>
              ))}
            </select>
            {form.source_location_id && form.destination_location_id && String(form.source_location_id) === String(form.destination_location_id) && (
              <p className="text-xs text-danger mt-1">Source and destination must be different.</p>
            )}
          </FormField>
        </div>

        <div className="mt-6 border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">Products</h3>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-border text-text-secondary text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Plus size={14} /> Add line
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-secondary bg-gray-50/50 border-b border-border">
                  <th className="text-left px-4 py-2 font-semibold">Product</th>
                  <th className="text-right px-4 py-2 font-semibold w-[140px]">Qty</th>
                  <th className="px-4 py-2 w-[60px]" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <tr key={idx} className="border-b border-border-light last:border-0">
                    <td className="px-4 py-2">
                      <select
                        className="w-full px-2 py-1.5 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        value={line.product_id}
                        onChange={(e) => updateLine(idx, 'product_id', e.target.value)}
                      >
                        <option value="">Select product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} [{p.sku}]</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        min="1"
                        className="w-full text-right px-2 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        disabled={lines.length === 1}
                        className="px-2 py-1.5 rounded-lg border border-border text-text-muted hover:text-danger hover:border-danger/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Remove line"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-lg border border-border bg-white text-text-secondary text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit() || submitting}
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Transfer'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
