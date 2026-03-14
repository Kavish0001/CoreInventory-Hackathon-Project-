import { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import { format } from 'date-fns';
import { Search, Filter, Download } from 'lucide-react';

const StockLedger = () => {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const response = await reportService.getStockLedger();
        setLedger(response.data);
      } catch (error) {
        console.error('Error fetching stock ledger:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, []);

  const filteredLedger = ledger.filter(item => 
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.reference_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.contact || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type) => {
    switch (type) {
      case 'RECEIPT': return 'bg-green-100 text-green-800';
      case 'DELIVERY': return 'bg-orange-100 text-orange-800';
      case 'TRANSFER': return 'bg-purple-100 text-purple-800';
      case 'ADJUSTMENT': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  let tableBodyContent;

  if (loading) {
    tableBodyContent = (
      <tr>
        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">Loading ledger...</td>
      </tr>
    );
  } else if (filteredLedger.length === 0) {
    tableBodyContent = (
      <tr>
        <td colSpan="8" className="px-6 py-12 text-center text-gray-500 italic">No movement records found.</td>
      </tr>
    );
  } else {
    tableBodyContent = filteredLedger.map(item => (
      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4 text-sm text-gray-600">
          {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">{item.reference_code || '-'}</td>
        <td className="px-6 py-4 text-sm text-gray-600">{item.contact || '-'}</td>
        <td className="px-6 py-4">
          <div className="font-medium text-gray-900">{item.product_name}</div>
          <div className="text-xs text-gray-500">{item.sku}</div>
        </td>
        <td className="px-6 py-4">
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getTypeColor(item.type)}`}>
            {item.type}
          </span>
        </td>
        <td className={`px-6 py-4 font-bold ${item.type === 'DELIVERY' ? 'text-red-600' : 'text-green-600'}`}>
          {item.type === 'DELIVERY' ? '-' : '+'}{item.quantity}
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">{item.source_location || '-'}</td>
        <td className="px-6 py-4 text-sm text-gray-600">{item.destination_location || '-'}</td>
      </tr>
    ));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Stock Ledger</h2>
        <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search movement history..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
            <Filter size={18} /> Filter by Type
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date & Time</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Reference</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Contact</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Product</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Type</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Quantity</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Source</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Destination</th>
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

export default StockLedger;
