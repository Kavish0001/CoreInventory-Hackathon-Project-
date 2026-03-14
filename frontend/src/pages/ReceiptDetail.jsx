import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReceipt, createReceipt, confirmReceipt, validateReceipt, clearCurrentReceipt, selectReceipts } from '../features/inventory/receiptsSlice';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchProducts, selectProducts } from '../features/products/productsSlice';
import { fetchWarehouses, selectWarehouses } from '../features/warehouses/warehousesSlice';
import { StatusBadge, StatusBar, Breadcrumb, FormField, LoadingSpinner } from '../components/ui';
import ProductLineTable from '../components/features/ProductLineTable';
import { Save, CheckCircle, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { warehouseService } from '../services/api';

export default function ReceiptDetail() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentReceipt, detailLoading } = useSelector(selectReceipts);
  const { items: products, loading: productsLoading } = useSelector(selectProducts);
  const { items: warehouses, loading: whLoading } = useSelector(selectWarehouses);

  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [form, setForm] = useState({
    supplier: '',
    contact: '',
    schedule_date: '',
    warehouse_id: '',
    location_id: '',
    source_document: '',
  });
  const [lines, setLines] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const showDemoFill = import.meta.env.DEV && isNew;

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchWarehouses());
    if (isNew) {
      dispatch(clearCurrentReceipt());
      setForm({
        supplier: '',
        contact: '',
        schedule_date: format(new Date(), 'yyyy-MM-dd'),
        warehouse_id: '',
        location_id: '',
        source_document: '',
      });
      setLines([]);
    } else {
      dispatch(fetchReceipt(id));
    }
  }, [dispatch, id, isNew]);

  useEffect(() => {
    let alive = true;
    async function loadLocations() {
      const warehouseId = form.warehouse_id;
      if (!warehouseId) {
        setLocations([]);
        return;
      }

      setLocationsLoading(true);
      try {
        const res = await warehouseService.getLocations(warehouseId);
        if (!alive) return;
        const locs = res.data || [];
        setLocations(locs);

        // auto-pick STOCK if present, else first location
        if (!form.location_id) {
          const stock = locs.find((l) => String(l.short_code || '').toUpperCase() === 'STOCK');
          const pick = stock || locs[0];
          if (pick?.id) setForm((p) => ({ ...p, location_id: String(pick.id) }));
        }
      } catch {
        if (!alive) return;
        setLocations([]);
      } finally {
        if (alive) setLocationsLoading(false);
      }
    }

    loadLocations();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.warehouse_id]);

  const fillDemo = () => {
    const wh = warehouses?.[0];
    const now = format(new Date(), 'yyyy-MM-dd');
    const p1 = products?.[0];
    const p2 = products?.[1] || products?.[0];

    setForm({
      supplier: 'ACME Supplies',
      contact: 'Vendor',
      schedule_date: now,
      warehouse_id: wh?.id ? String(wh.id) : '',
      location_id: '',
      source_document: 'PO0042',
    });

    const demoLines = [p1, p2]
      .filter(Boolean)
      .map((p, idx) => ({
        product_id: String(p.id),
        demand_qty: idx === 0 ? 12 : 6,
        done_qty: 0,
        per_unit_cost: p.per_unit_cost || 0,
      }));

    setLines(demoLines.length ? demoLines : [{ product_id: '', demand_qty: 1, done_qty: 0, per_unit_cost: 0 }]);
  };

  useEffect(() => {
    if (!isNew && currentReceipt?.receipt) {
      const r = currentReceipt.receipt;
      setForm({
        supplier: r.supplier || '',
        contact: r.contact || '',
        schedule_date: r.schedule_date ? format(new Date(r.schedule_date), 'yyyy-MM-dd') : '',
        warehouse_id: r.warehouse_id ? String(r.warehouse_id) : '',
        location_id: r.location_id ? String(r.location_id) : '',
        source_document: r.source_document || '',
      });
      setLines(currentReceipt.items || []);
    }
  }, [currentReceipt, isNew]);

  const loading = detailLoading || productsLoading || whLoading || locationsLoading;
  const status = isNew ? 'draft' : currentReceipt?.receipt?.status || 'draft';
  const isReadonly = status === 'done' || status === 'cancelled';
  const refCode = isNew ? 'New' : currentReceipt?.receipt?.reference_code || 'Loading...';

  const handleCreate = async () => {
    if (!form.supplier || !form.warehouse_id || !form.location_id) return setErrorMsg('Vendor, Warehouse, and Location are required.');
    if (lines.length === 0) return setErrorMsg('Add at least one product.');
    if (lines.some(l => !l.product_id || l.demand_qty <= 0)) return setErrorMsg('Please check product lines. Product and Demand > 0 are required.');
    
    setProcessing(true);
    setErrorMsg('');
    try {
      const payload = {
        supplier: form.supplier,
        contact: form.contact || null,
        warehouse_id: Number(form.warehouse_id),
        location_id: Number(form.location_id),
        schedule_date: form.schedule_date || null,
        source_document: form.source_document || null,
        products: lines.map((l) => ({ product_id: l.product_id, quantity: Number(l.demand_qty) })),
      };
      const res = await dispatch(createReceipt(payload)).unwrap();
      navigate(`/receipts/${res.receiptId}`);
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
      dispatch(fetchReceipt(id));
    } catch (err) {
      setErrorMsg(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!currentReceipt?.receipt) return;
    const { receipt: r, items } = currentReceipt;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(115, 87, 155); // Odoo Purple
    doc.text('CORE INVENTORY RECEIPT', 14, 22);
    
    // Meta Info
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Reference: ${r.reference_code}`, 14, 32);
    doc.text(`Supplier: ${r.supplier}`, 14, 38);
    doc.text(`Status: ${r.status.toUpperCase()}`, 14, 44);
    doc.text(`Date: ${r.schedule_date ? format(new Date(r.schedule_date), 'PPP HH:mm') : 'N/A'}`, 14, 50);
    
    // Table
    const tableColumn = ["#", "Product", "SKU", "Demand", "Done"];
    const tableRows = items.map((item, index) => [
      index + 1,
      item.product_name || '—',
      item.sku || '—',
      item.demand_qty,
      item.done_qty
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      theme: 'grid',
      headStyles: { fillStyle: 'fill', fillColor: [115, 87, 155] },
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Notes: ${r.notes || '—'}`, 14, finalY);
    doc.text(`Generated on: ${format(new Date(), 'PPP HH:mm:ss')}`, 14, finalY + 10);

    doc.save(`${r.reference_code}_Receipt.pdf`);
  };

  if (loading && !isNew && !currentReceipt) {
    return <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="max-w-[1000px] mx-auto pb-12">
      <div className="mb-4">
        <Breadcrumb items={[
          { label: 'Receipts', to: '/receipts' },
          { label: refCode }
        ]} />
      </div>

      <div className="bg-card w-full shadow-lg border border-border rounded-xl mt-4">
        {/* Top Header - Odoo Style Context Bar */}
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
                    onClick={() => handleAction(confirmReceipt)}
                    disabled={processing}
                    className="bg-success text-white hover:bg-green-600 px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={16} /> Mark as Todo
                  </button>
                )}
                {(status === 'ready' || status === 'waiting') && (
                  <button
                    onClick={() => handleAction(validateReceipt)}
                    disabled={processing}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                  >
                    <CheckSquare size={16} /> Validate
                  </button>
                )}
                <button 
                  onClick={handleDownload}
                  className="bg-white border border-border hover:bg-gray-50 text-text-secondary px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors"
                >
                  Download
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

        {/* Status indicator on top right */}
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
              <FormField label="Receive From" required htmlFor="supplier">
                <input
                  id="supplier"
                  type="text"
                  placeholder="e.g. Vendor Name"
                  disabled={isReadonly}
                  className="w-full px-3 py-2 text-sm border-b-2 border-border focus:border-primary outline-none bg-transparent disabled:opacity-75 disabled:border-transparent font-medium text-text-primary"
                  value={form.supplier}
                  onChange={e => setForm({ ...form, supplier: e.target.value })}
                />
              </FormField>
              <FormField label="Contact" htmlFor="contact">
                <input
                  id="contact"
                  type="text"
                  placeholder="e.g. Person / Phone"
                  disabled={isReadonly}
                  className="w-full px-3 py-2 text-sm border-b-2 border-border focus:border-primary outline-none bg-transparent disabled:opacity-75 disabled:border-transparent font-medium text-text-primary"
                  value={form.contact}
                  onChange={e => setForm({ ...form, contact: e.target.value })}
                />
              </FormField>
              <FormField label="Destination Warehouse" required htmlFor="dest-wh">
                <select
                  id="dest-wh"
                  disabled={isReadonly}
                  className="w-full px-3 py-2 text-sm border-b-2 border-border focus:border-primary outline-none bg-transparent disabled:opacity-75 disabled:border-transparent font-medium text-text-primary disabled:appearance-none"
                  value={form.warehouse_id}
                  onChange={e => setForm({ ...form, warehouse_id: e.target.value, location_id: '' })}
                >
                  <option value="">Select Warehouse...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Destination Location" required htmlFor="dest-loc">
                <select
                  id="dest-loc"
                  disabled={isReadonly || !form.warehouse_id}
                  className="w-full px-3 py-2 text-sm border-b-2 border-border focus:border-primary outline-none bg-transparent disabled:opacity-60 disabled:border-transparent font-medium text-text-primary disabled:appearance-none"
                  value={form.location_id}
                  onChange={e => setForm({ ...form, location_id: e.target.value })}
                >
                  <option value="">{form.warehouse_id ? 'Select Location...' : 'Select Warehouse first'}</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.location_name}</option>
                  ))}
                </select>
              </FormField>
            </div>
            
            <div className="space-y-4">
              <FormField label="Scheduled Date" htmlFor="date">
                <input
                  id="date"
                  type="date"
                  disabled={isReadonly}
                  className="w-full px-3 py-2 text-sm border-b-2 border-border focus:border-primary outline-none bg-transparent disabled:opacity-75 disabled:border-transparent font-medium text-text-primary text-right"
                  value={form.schedule_date}
                  onChange={e => setForm({ ...form, schedule_date: e.target.value })}
                />
              </FormField>
              <FormField label="Source Document" htmlFor="source">
                <input
                  id="source"
                  type="text"
                  placeholder="e.g. PO0042"
                  disabled={isReadonly}
                  className="w-full px-3 py-2 text-sm border-b-2 border-border focus:border-primary outline-none bg-transparent disabled:opacity-75 disabled:border-transparent text-right font-medium text-text-primary"
                  value={form.source_document}
                  onChange={e => setForm({ ...form, source_document: e.target.value })}
                />
              </FormField>
            </div>
          </div>

          <ProductLineTable
            lines={lines}
            setLines={setLines}
            products={products}
            readonly={isReadonly}
            type="receipt"
          />

        </div>
      </div>
    </div>
  );
}
