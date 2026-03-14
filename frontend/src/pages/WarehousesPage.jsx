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
    warehouseContent = <div className="p-6 text-slate-500">Loading warehouses...</div>;
  } else if (warehouses.length === 0) {
    warehouseContent = <div className="p-6 text-slate-500">No warehouses available.</div>;
  } else {
    warehouseContent = (
      <div className="divide-y divide-slate-100">
        {warehouses.map((warehouse) => (
          <div key={warehouse.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
            <div className="flex items-center gap-3">
              <Warehouse size={20} className="text-violet-700" />
              <div>
                <p className="font-semibold text-slate-900">{warehouse.name}</p>
                <p className="text-sm text-slate-500">ID: {warehouse.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin size={16} />
              <span>{warehouse.location || 'N/A'}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="ci-page-title">Warehouses & Locations</h2>
        <p className="text-sm text-slate-500 mt-1">Manage storage hubs and physical stock locations.</p>
      </div>
      <div className="ci-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-900">Create Warehouse</h3>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleCreateWarehouse}>
          <input
            type="text"
            placeholder="Warehouse name"
            value={formData.name}
            onChange={(event) => setFormData((previous) => ({ ...previous, name: event.target.value }))}
            className="ci-input"
            required
          />
          <input
            type="text"
            placeholder="Location"
            value={formData.location}
            onChange={(event) => setFormData((previous) => ({ ...previous, location: event.target.value }))}
            className="ci-input"
            required
          />
          <button type="submit" className="ci-button-primary gap-2">
            <Plus size={18} />
            Add Warehouse
          </button>
        </form>
        {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
      </div>

      <div className="ci-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-semibold text-slate-900">Warehouse List</div>
        {warehouseContent}
      </div>
    </div>
  );
};

export default WarehousesPage;
