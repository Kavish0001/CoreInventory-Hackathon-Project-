import { useState, useEffect } from 'react';
import { inventoryService, productService, warehouseService } from '../services/api';
import { ArrowDownCircle, ArrowUpCircle, Repeat, Edit3 } from 'lucide-react';

const OperationsPage = () => {
  const [activeTab, setActiveTab] = useState('receipt');
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [destinationLocations, setDestinationLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    supplier: '',
    customer: '',
    product_id: '',
    warehouse_id: '',
    location_id: '',
    quantity: '',
    dest_warehouse_id: '',
    dest_location_id: '',
    counted_quantity: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const [prodRes, warRes] = await Promise.all([
        productService.getProducts(),
        warehouseService.getWarehouses()
      ]);
      setProducts(prodRes.data);
      setWarehouses(warRes.data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      if (formData.warehouse_id) {
        const locRes = await warehouseService.getLocations(formData.warehouse_id);
        setLocations(locRes.data);
      } else {
        setLocations([]);
      }
    };
    fetchLocations();
  }, [formData.warehouse_id]);

  useEffect(() => {
    const fetchDestinationLocations = async () => {
      if (formData.dest_warehouse_id) {
        const locRes = await warehouseService.getLocations(formData.dest_warehouse_id);
        setDestinationLocations(locRes.data);
      } else {
        setDestinationLocations([]);
      }
    };
    fetchDestinationLocations();
  }, [formData.dest_warehouse_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let response;
      if (activeTab === 'receipt') {
        const createRes = await inventoryService.createReceipt({
          supplier: formData.supplier,
          warehouse_id: formData.warehouse_id,
          location_id: formData.location_id,
          products: [{ product_id: formData.product_id, quantity: Number.parseInt(formData.quantity, 10) }]
        });

        await inventoryService.confirmReceipt(createRes.data.receiptId);
        response = await inventoryService.validateReceipt(createRes.data.receiptId);
      } else if (activeTab === 'delivery') {
        const createRes = await inventoryService.createDelivery({
          customer: formData.customer,
          warehouse_id: formData.warehouse_id,
          location_id: formData.location_id,
          products: [{ product_id: formData.product_id, quantity: Number.parseInt(formData.quantity, 10) }]
        });

        const confirmRes = await inventoryService.confirmDelivery(createRes.data.deliveryId);
        if (confirmRes.data.status === 'ready') {
          response = await inventoryService.validateDelivery(createRes.data.deliveryId);
        } else {
          response = confirmRes;
        }
      } else if (activeTab === 'transfer') {
        response = await inventoryService.createTransfer({
          warehouse_id: formData.warehouse_id,
          source_location_id: formData.location_id,
          destination_location_id: formData.dest_location_id,
          products: [{ product_id: formData.product_id, quantity: Number.parseInt(formData.quantity, 10) }],
          quantity: Number.parseInt(formData.quantity, 10)
        });
      } else if (activeTab === 'adjustment') {
        response = await inventoryService.createAdjustment({
          product_id: formData.product_id,
          warehouse_id: formData.warehouse_id,
          location_id: formData.location_id,
          counted_quantity: Number.parseInt(formData.counted_quantity, 10)
        });
      }

      setMessage({ type: 'success', text: response.data.message || 'Operation successful' });
      setFormData({
        supplier: '',
        customer: '',
        product_id: '',
        warehouse_id: '',
        location_id: '',
        quantity: '',
        dest_warehouse_id: '',
        dest_location_id: '',
        counted_quantity: ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Operation failed' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'receipt', name: 'Receipt', icon: <ArrowDownCircle size={18} /> },
    { id: 'delivery', name: 'Delivery', icon: <ArrowUpCircle size={18} /> },
    { id: 'transfer', name: 'Transfer', icon: <Repeat size={18} /> },
    { id: 'adjustment', name: 'Adjustment', icon: <Edit3 size={18} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-8">Inventory Operations</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMessage(null);
              }}
              className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                activeTab === tab.id ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {message && (
            <div className={`p-4 rounded-lg border ${
              message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTab === 'receipt' && (
              <div className="col-span-2">
                <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input
                  id="supplier"
                  type="text"
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.supplier}
                  onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>
            )}

            {activeTab === 'delivery' && (
              <div className="col-span-2">
                <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <input
                  id="customer"
                  type="text"
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.customer}
                  onChange={e => setFormData({ ...formData, customer: e.target.value })}
                />
              </div>
            )}

            <div>
              <label htmlFor="product_id" className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <select
                id="product_id"
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.product_id}
                onChange={e => setFormData({ ...formData, product_id: e.target.value })}
              >
                <option value="">Select Product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="warehouse_id" className="block text-sm font-medium text-gray-700 mb-1">
                {activeTab === 'transfer' ? 'Source Warehouse' : 'Warehouse'}
              </label>
              <select
                id="warehouse_id"
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.warehouse_id}
                onChange={e => setFormData({ ...formData, warehouse_id: e.target.value })}
              >
                <option value="">Select Warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="location_id" className="block text-sm font-medium text-gray-700 mb-1">
                {activeTab === 'transfer' ? 'Source Location' : 'Location'}
              </label>
              <select
                id="location_id"
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.location_id}
                onChange={e => setFormData({ ...formData, location_id: e.target.value })}
                disabled={!formData.warehouse_id}
              >
                <option value="">Select Location</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.location_name}</option>)}
              </select>
            </div>

            {activeTab !== 'adjustment' && (
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  required
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
            )}

            {activeTab === 'adjustment' && (
              <div>
                <label htmlFor="counted_quantity" className="block text-sm font-medium text-gray-700 mb-1">Counted Quantity</label>
                <input
                  id="counted_quantity"
                  type="number"
                  required
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.counted_quantity}
                  onChange={e => setFormData({ ...formData, counted_quantity: e.target.value })}
                />
              </div>
            )}

            {activeTab === 'transfer' && (
              <>
                <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                  <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">Destination Details</h4>
                </div>
                <div>
                  <label htmlFor="dest_warehouse_id" className="block text-sm font-medium text-gray-700 mb-1">Destination Warehouse</label>
                  <select
                    id="dest_warehouse_id"
                    required
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.dest_warehouse_id}
                    onChange={e => setFormData({ ...formData, dest_warehouse_id: e.target.value })}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="dest_location_id" className="block text-sm font-medium text-gray-700 mb-1">Destination Location</label>
                  <select
                    id="dest_location_id"
                    required
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.dest_location_id}
                    onChange={e => setFormData({ ...formData, dest_location_id: e.target.value })}
                    disabled={!formData.dest_warehouse_id}
                  >
                    <option value="">Select Location</option>
                    {destinationLocations.map(l => (
                      <option key={l.id} value={l.id}>{l.location_name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Submit ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OperationsPage;
