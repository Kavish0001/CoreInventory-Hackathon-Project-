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
  const productRows = filteredProducts.map((product) => {
    const snap = stockByProductId.get(Number(product.id));
    const onHand = Number(snap?.on_hand ?? 0);
    let status = 'in_stock';
    if (onHand <= 0) status = 'out_of_stock';
    else if (onHand < Number(product.reorder_level || 0)) status = 'low_stock';
    return { ...product, onHand, status };
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
    tableBodyContent = productRows.map(product => (
      <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
        <td className="px-6 py-4 font-semibold text-slate-900">{product.name}</td>
        <td className="px-6 py-4 text-slate-600">{product.sku}</td>
        <td className="px-6 py-4 text-slate-600">{product.category}</td>
        <td className="px-6 py-4 text-slate-700 font-medium">{product.onHand}</td>
        <td className="px-6 py-4 text-slate-600">{product.unit}</td>
        <td className="px-6 py-4">
          <span className={stockBadge(product.status)}>
            {product.status === 'in_stock' ? 'In Stock' : product.status === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <button className="ci-button-ghost py-1.5">Edit</button>
        </td>
      </tr>
    ));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="ci-page-title">Product Management</h2>
          <p className="text-sm text-slate-500 mt-1">Track product status, stock levels, and quick edits.</p>
        </div>
        <button className="ci-button-primary gap-2">
          <Plus size={20} /> Add Product
        </button>
      </div>

      <div className="ci-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or SKU..." 
              className="ci-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="ci-button-ghost gap-2">
            <Filter size={18} /> Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="ci-table-head border-b border-slate-100">
                <th className="px-6 py-4 font-semibold">Product Name</th>
                <th className="px-6 py-4 font-semibold">SKU</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">On hand</th>
                <th className="px-6 py-4 font-semibold">UoM</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
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
