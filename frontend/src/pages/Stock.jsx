import { useEffect, useMemo, useState } from 'react';
import { reportService } from '../services/api';
import { Search } from 'lucide-react';

const Stock = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const response = await reportService.getStockSnapshot();
        setRows(response.data);
      } catch (error) {
        console.error('Error fetching stock snapshot:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.product_name || '').toLowerCase().includes(q) || (r.sku || '').toLowerCase().includes(q));
  }, [rows, searchTerm]);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Stock</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search product or SKU..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Product</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">SKU</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Per unit cost</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">On hand</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Free to use</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Value</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading stock...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 italic">No stock records found.</td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.product_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{r.product_name}</td>
                    <td className="px-6 py-4 text-gray-600">{r.sku}</td>
                    <td className="px-6 py-4 text-gray-900">{Number(r.per_unit_cost || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-900">{r.on_hand}</td>
                    <td className="px-6 py-4 text-gray-900">{r.free_to_use}</td>
                    <td className="px-6 py-4 text-gray-900">{Number(r.inventory_value || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Stock;
