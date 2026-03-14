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

export default function ReceiptDetail() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentReceipt, detailLoading } = useSelector(selectReceipts);
  const { items: products, loading: productsLoading } = useSelector(selectProducts);
  const { items: warehouses, loading: whLoading } = useSelector(selectWarehouses);

  const [form, setForm] = useState({ supplier: '', schedule_date: '', target_warehouse_id: '', notes: '' });
  const [lines, setLines] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchWarehouses());
    if (isNew) {
      dispatch(clearCurrentReceipt());
      setForm({ supplier: '', schedule_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"), target_warehouse_id: '', notes: '' });
      setLines([]);
    } else {
      dispatch(fetchReceipt(id));
    }
  }, [dispatch, id, isNew]);

  useEffect(() => {
    if (!isNew && currentReceipt?.receipt) {
      const r = currentReceipt.receipt;
      setForm({
        supplier: r.supplier || '',
        schedule_date: r.schedule_date ? format(new Date(r.schedule_date), "yyyy-MM-dd'T'HH:mm") : '',
        target_warehouse_id: r.target_warehouse_id || '',
        notes: r.notes || '',
      });
      setLines(currentReceipt.items || []);
    }
  }, [currentReceipt, isNew]);

  const loading = detailLoading || productsLoading || whLoading;
  const status = isNew ? 'draft' : currentReceipt?.receipt?.status || 'draft';
  const isReadonly = status === 'done' || status === 'cancelled';
  const refCode = isNew ? 'New' : currentReceipt?.receipt?.reference_code || 'Loading...';

  const handleCreate = async () => {
    if (!form.supplier || !form.target_warehouse_id) return setErrorMsg('Supplier and Warehouse are required.');
    if (lines.length === 0) return setErrorMsg('Add at least one product.');
    if (lines.some(l => !l.product_id || l.demand_qty <= 0)) return setErrorMsg('Please check product lines. Product and Demand > 0 are required.');
    
    setProcessing(true);
    setErrorMsg('');
    try {
      const payload = { ...form, items: lines.map(l => ({ ...l, done_qty: l.done_qty || 0 })) };
      const res = await dispatch(createReceipt(payload)).unwrap();
      navigate(`/receipts/${res.id}`);
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
              <FormField label="Destination Location" required htmlFor="dest">
                <select
                  id="dest"
                  disabled={isReadonly}
                  className="w-full px-3 py-2 text-sm border-b-2 border-border focus:border-primary outline-none bg-transparent disabled:opacity-75 disabled:border-transparent font-medium text-text-primary disabled:appearance-none"
                  value={form.target_warehouse_id}
                  onChange={e => setForm({ ...form, target_warehouse_id: e.target.value })}
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
              <FormField label="Source Document" htmlFor="source">
                <input
                  id="source"
                  type="text"
                  placeholder="e.g. PO0042"
                  disabled={isReadonly}
                  className="w-full px-3 py-2 text-sm border-b-2 border-border focus:border-primary outline-none bg-transparent disabled:opacity-75 disabled:border-transparent text-right font-medium text-text-primary"
                  value={form.notes} // using notes as source doc placeholder for now, or you can add source_document to schema
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
            type="receipt"
          />

        </div>
      </div>
    </div>
  );
}
