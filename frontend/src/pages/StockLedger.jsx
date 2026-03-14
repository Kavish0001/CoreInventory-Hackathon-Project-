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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="ci-page-title">Stock Ledger</h2>
          <p className="text-sm text-slate-500 mt-1">Trace every stock movement across all operations.</p>
        </div>
        <button className="ci-button-ghost gap-2">
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="ci-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search movement history..." 
              className="ci-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="ci-button-ghost gap-2">
            <Filter size={18} /> Filter by Type
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="ci-table-head border-b border-slate-100">
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Reference</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Quantity</th>
                <th className="px-6 py-4 font-semibold">Source</th>
                <th className="px-6 py-4 font-semibold">Destination</th>
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
