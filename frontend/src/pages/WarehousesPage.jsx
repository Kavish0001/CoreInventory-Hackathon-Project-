import { useEffect, useState } from 'react';
import { warehouseService } from '../services/api';
import { Plus, Warehouse, MapPin } from 'lucide-react';

const WarehousesPage = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', location: '' });

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const response = await warehouseService.getWarehouses();
      setWarehouses(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const handleCreateWarehouse = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await warehouseService.createWarehouse(formData);
      setFormData({ name: '', location: '' });
      await loadWarehouses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create warehouse');
    }
  };
  let warehouseContent;

  if (loading) {
    warehouseContent = <div className="p-6 text-gray-500">Loading warehouses...</div>;
  } else if (warehouses.length === 0) {
    warehouseContent = <div className="p-6 text-gray-500">No warehouses available.</div>;
  } else {
    warehouseContent = (
      <div className="divide-y divide-gray-100">
        {warehouses.map((warehouse) => (
          <div key={warehouse.id} className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Warehouse size={20} className="text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">{warehouse.name}</p>
                <p className="text-sm text-gray-500">ID: {warehouse.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin size={16} />
              <span>{warehouse.location || 'N/A'}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Warehouses & Locations</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">Create Warehouse</h3>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleCreateWarehouse}>
          <input
            type="text"
            placeholder="Warehouse name"
            value={formData.name}
            onChange={(event) => setFormData((previous) => ({ ...previous, name: event.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Location"
            value={formData.location}
            onChange={(event) => setFormData((previous) => ({ ...previous, location: event.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2">
            <Plus size={18} />
            Add Warehouse
          </button>
        </form>
        {error && <p className="text-red-600 mt-3">{error}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 font-semibold">Warehouse List</div>
        {warehouseContent}
      </div>
    </div>
  );
};

export default WarehousesPage;
