import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDelivery, createDelivery, confirmDelivery, validateDelivery, clearCurrentDelivery, selectDeliveries } from '../features/inventory/deliveriesSlice';
import { fetchProducts, selectProducts } from '../features/products/productsSlice';
import { fetchWarehouses, selectWarehouses } from '../features/warehouses/warehousesSlice';
import { StatusBadge, StatusBar, Breadcrumb, FormField, LoadingSpinner } from '../components/ui';
import ProductLineTable from '../components/features/ProductLineTable';
import { Save, CheckCircle, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function DeliveryDetail() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentDelivery, detailLoading } = useSelector(selectDeliveries);
  const { items: products, loading: productsLoading } = useSelector(selectProducts);
  const { items: warehouses, loading: whLoading } = useSelector(selectWarehouses);

  const [form, setForm] = useState({ customer: '', schedule_date: '', source_warehouse_id: '', notes: '' });
  const [lines, setLines] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const showDemoFill = import.meta.env.DEV && isNew;

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchWarehouses());
    if (isNew) {
      dispatch(clearCurrentDelivery());
      setForm({ customer: '', schedule_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"), source_warehouse_id: '', notes: '' });
      setLines([]);
    } else {
      dispatch(fetchDelivery(id));
    }
  }, [dispatch, id, isNew]);

  const fillDemo = () => {
    const wh = warehouses?.[0];
    const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
    const p1 = products?.[0];
    const p2 = products?.[1] || products?.[0];

    setForm({
      customer: 'Retailer X',
      schedule_date: now,
      source_warehouse_id: wh?.id ? String(wh.id) : '',
      notes: 'Demo delivery for testing UI flows.',
    });

    const demoLines = [p1, p2]
      .filter(Boolean)
      .map((p, idx) => ({
        product_id: String(p.id),
        demand_qty: idx === 0 ? 3 : 2,
        done_qty: 0,
        per_unit_cost: p.per_unit_cost || 0,
      }));

    setLines(demoLines.length ? demoLines : [{ product_id: '', demand_qty: 1, done_qty: 0, per_unit_cost: 0 }]);
  };

  useEffect(() => {
    if (!isNew && currentDelivery?.delivery) {
      const d = currentDelivery.delivery;
      setForm({
        customer: d.customer || '',
        schedule_date: d.schedule_date ? format(new Date(d.schedule_date), "yyyy-MM-dd'T'HH:mm") : '',
        source_warehouse_id: d.source_warehouse_id || '',
        notes: d.notes || '',
      });
      setLines(currentDelivery.items || []);
    }
  }, [currentDelivery, isNew]);

  const loading = detailLoading || productsLoading || whLoading;
  const status = isNew ? 'draft' : currentDelivery?.delivery?.status || 'draft';
  const isReadonly = status === 'done' || status === 'cancelled';
  const refCode = isNew ? 'New' : currentDelivery?.delivery?.reference_code || 'Loading...';

  const handleCreate = async () => {
    if (!form.customer || !form.source_warehouse_id) return setErrorMsg('Customer and Source Warehouse are required.');
    if (lines.length === 0) return setErrorMsg('Add at least one product.');
    if (lines.some(l => !l.product_id || l.demand_qty <= 0)) return setErrorMsg('Please check product lines. Product and Demand > 0 are required.');
    
    setProcessing(true);
    setErrorMsg('');
    try {
      const payload = { ...form, items: lines.map(l => ({ ...l, done_qty: l.done_qty || 0 })) };
      const res = await dispatch(createDelivery(payload)).unwrap();
      navigate(`/deliveries/${res.id}`);
    } catch (err) {
      setErrorMsg(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleAction = async (actionFn) => {
    setProcessing(true);
    setErrorMsg('');
    try {
      await dispatch(actionFn(id)).unwrap();
      dispatch(fetchDelivery(id));
    } catch (err) {
      setErrorMsg(err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !isNew && !currentDelivery) {
    return <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="max-w-[1000px] mx-auto pb-12">
      <div className="mb-4">
        <Breadcrumb items={[
          { label: 'Deliveries', to: '/deliveries' },
          { label: refCode }
        ]} />
      </div>

      <div className="bg-card w-full shadow-lg border border-border rounded-xl mt-4">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-border bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {isNew ? (
              <button
                onClick={handleCreate}
                disabled={processing || loading}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                <Save size={16} /> Save
              </button>
            ) : (
              <>
                {status === 'draft' && (
                  <button
                    onClick={() => handleAction(confirmDelivery)}
                    disabled={processing}
                    className="bg-success text-white hover:bg-green-600 px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={16} /> Mark as Todo
                  </button>
                )}
                {(status === 'ready' || status === 'waiting') && (
                  <button
                    onClick={() => handleAction(validateDelivery)}
                    disabled={processing}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                  >
                    <CheckSquare size={16} /> Validate
                  </button>
                )}
                <button className="bg-white border border-border hover:bg-gray-50 text-text-secondary px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors">
                  Print
                </button>
              </>
            )}
            {showDemoFill && (
              <button
                type="button"
                onClick={fillDemo}
                disabled={loading || processing}
                className="bg-white border border-border hover:bg-gray-50 text-text-secondary px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                Fill demo data
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
             <StatusBar steps={['draft', 'ready', 'done']} current={status === 'waiting' ? 'ready' : status} />
          </div>
        </div>

        {/* Status indicator */}
        <div className="px-6 pt-4 flex justify-between items-start">
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">{refCode}</h1>
          <StatusBadge status={status} size="lg" />
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-danger-light border border-danger/20 text-danger text-sm">
            {errorMsg}
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="space-y-4">
              <FormField label="Delivery Address" required htmlFor="customer">
                <input
                  id="customer"
                  type="text"
                  placeholder="e.g. Customer Name"
                  disabled={isReadonly}
                  className="w-full px-3 py-2 text-sm border-b-2 border-border focus:border-primary outline-none bg-transparent disabled:opacity-75 disabled:border-transparent font-medium text-text-primary"
                  value={form.customer}
                  onChange={e => setForm({ ...form, customer: e.target.value })}
                />
              </FormField>
              <FormField label="Source Location" required htmlFor="source">
                <select
                  id="source"
                  disabled={isReadonly}
                  className="w-full px-3 py-2 text-sm border-b-2 border-border focus:border-primary outline-none bg-transparent disabled:opacity-75 disabled:border-transparent font-medium text-text-primary disabled:appearance-none"
                  value={form.source_warehouse_id}
                  onChange={e => setForm({ ...form, source_warehouse_id: e.target.value })}
                >
                  <option value="">Select Warehouse...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </FormField>
            </div>
            
            <div className="space-y-4">
              <FormField label="Scheduled Date" htmlFor="date">
                <input
                  id="date"
                  type="datetime-local"
                  disabled={isReadonly}
                  className="w-full px-3 py-2 text-sm border-b-2 border-border focus:border-primary outline-none bg-transparent disabled:opacity-75 disabled:border-transparent font-medium text-text-primary text-right"
                  value={form.schedule_date}
                  onChange={e => setForm({ ...form, schedule_date: e.target.value })}
                />
              </FormField>
              <FormField label="Source Document" htmlFor="notes">
                <input
                  id="notes"
                  type="text"
                  placeholder="e.g. SO0042"
                  disabled={isReadonly}
                  className="w-full px-3 py-2 text-sm border-b-2 border-border focus:border-primary outline-none bg-transparent disabled:opacity-75 disabled:border-transparent text-right font-medium text-text-primary"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </FormField>
            </div>
          </div>

          <ProductLineTable
            lines={lines}
            setLines={setLines}
            products={products}
            readonly={isReadonly}
            type="delivery"
          />

        </div>
      </div>
    </div>
  );
}
