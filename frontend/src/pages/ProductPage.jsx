import { useState, useEffect } from 'react';
import { productService } from '../services/api';
import { Plus, Search, Filter } from 'lucide-react';

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getProducts();
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );
  let tableBodyContent;

  if (loading) {
    tableBodyContent = (
      <tr>
        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading products...</td>
      </tr>
    );
  } else if (filteredProducts.length === 0) {
    tableBodyContent = (
      <tr>
        <td colSpan="6" className="px-6 py-12 text-center text-gray-500 italic">No products found.</td>
      </tr>
    );
  } else {
    tableBodyContent = filteredProducts.map(product => (
      <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
        <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
        <td className="px-6 py-4 text-gray-600">{product.sku}</td>
        <td className="px-6 py-4 text-gray-600">{product.category}</td>
        <td className="px-6 py-4 text-gray-600">{product.unit}</td>
        <td className="px-6 py-4 text-gray-600">{product.reorder_level}</td>
        <td className="px-6 py-4 text-right">
          <button className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
        </td>
      </tr>
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
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Unit</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Reorder Level</th>
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
