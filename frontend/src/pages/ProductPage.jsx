import { useState, useEffect, useMemo } from 'react';
import { productService, reportService } from '../services/api';
import { Plus, Search, Filter } from 'lucide-react';

const cx = (...parts) => parts.filter(Boolean).join(' ');

const stockBadge = (status) => {
  const base = 'px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center';
  switch (status) {
    case 'in_stock':
      return cx(base, 'bg-green-100 text-green-800');
    case 'low_stock':
      return cx(base, 'bg-amber-100 text-amber-800');
    case 'out_of_stock':
      return cx(base, 'bg-red-100 text-red-800');
    default:
      return cx(base, 'bg-gray-100 text-gray-700');
  }
};

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [prodRes, stockRes] = await Promise.all([
          productService.getProducts(),
          reportService.getStockSnapshot(),
        ]);
        setProducts(prodRes.data);
        setStock(stockRes.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const stockByProductId = useMemo(() => {
    const map = new Map();
    for (const row of stock) map.set(Number(row.product_id), row);
    return map;
  }, [stock]);

  const filteredProducts = products.filter((product) => {
    const q = searchTerm.toLowerCase();
    return product.name.toLowerCase().includes(q) || product.sku.toLowerCase().includes(q);
  });
  let tableBodyContent;

  if (loading) {
    tableBodyContent = (
      <tr>
        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">Loading products...</td>
      </tr>
    );
  } else if (filteredProducts.length === 0) {
    tableBodyContent = (
      <tr>
        <td colSpan="7" className="px-6 py-12 text-center text-gray-500 italic">No products found.</td>
      </tr>
    );
  } else {
    tableBodyContent = filteredProducts.map(product => (
      (() => {
        const snap = stockByProductId.get(Number(product.id));
        const onHand = Number(snap?.on_hand ?? 0);
        let status = 'in_stock';
        if (onHand <= 0) status = 'out_of_stock';
        else if (onHand < Number(product.reorder_level || 0)) status = 'low_stock';

        return (
      <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
        <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
        <td className="px-6 py-4 text-gray-600">{product.sku}</td>
        <td className="px-6 py-4 text-gray-600">{product.category}</td>
        <td className="px-6 py-4 text-gray-600">{onHand}</td>
        <td className="px-6 py-4 text-gray-600">{product.unit}</td>
        <td className="px-6 py-4">
          <span className={stockBadge(status)}>
            {status === 'in_stock' ? 'In Stock' : status === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <button className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
        </td>
      </tr>
        );
      })()
    ));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Products</h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={20} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or SKU..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
            <Filter size={18} /> Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Product Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">SKU</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Category</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">On hand</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">UoM</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableBodyContent}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
