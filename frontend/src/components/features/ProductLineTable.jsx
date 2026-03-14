import { Plus, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Reusable Product Line Table for Receipts and Deliveries
 * Allows adding, editing, and deleting product rows.
 */
export default function ProductLineTable({ lines, setLines, products, readonly, type = 'receipt' }) {
  const addLine = () => {
    setLines([...lines, { product_id: '', demand_qty: 0, done_qty: 0, per_unit_cost: 0 }]);
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // Auto-fill cost if product is selected
    if (field === 'product_id') {
      const p = products.find((x) => String(x.id) === String(value));
      if (p) {
        newLines[index].per_unit_cost = p.per_unit_cost || 0;
      }
    }
    
    setLines(newLines);
  };

  return (
    <div className="border border-border rounded-xl shadow-sm bg-white overflow-hidden mt-6">
      <div className="bg-surface px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-text-primary text-sm">Operations</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary bg-gray-50/50">
              <th className="px-4 py-3 font-semibold w-[40%]">Product</th>
              <th className="px-4 py-3 font-semibold w-[20%] text-right">Demand</th>
              <th className="px-4 py-3 font-semibold w-[20%] text-right">Done</th>
              <th className="px-4 py-3 font-semibold w-[15%] text-right">Unit Cost</th>
              {!readonly && <th className="px-4 py-3 w-[5%]"></th>}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted italic">
                  No products added yet.
                </td>
              </tr>
            ) : (
              lines.map((line, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <tr key={idx} className="border-b border-border-light last:border-0 hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 py-2">
                    {readonly ? (
                      <span className="font-medium text-text-primary">
                        {products.find(p => String(p.id) === String(line.product_id))?.name || `Product #${line.product_id}`}
                      </span>
                    ) : (
                      <select
                        className="w-full px-2 py-1.5 border border-border rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm bg-white"
                        value={line.product_id}
                        onChange={(e) => updateLine(idx, 'product_id', e.target.value)}
                      >
                        <option value="">Select Product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} [{p.sku}]</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {readonly ? (
                      line.demand_qty
                    ) : (
                      <input
                        type="number"
                        min="0"
                        className="w-full min-w-[60px] text-right px-2 py-1.5 border border-border rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm"
                        value={line.demand_qty}
                        onChange={(e) => updateLine(idx, 'demand_qty', Number(e.target.value))}
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {readonly ? (
                      <span className={`font-medium ${line.done_qty < line.demand_qty && line.demand_qty > 0 && type === 'delivery' ? 'text-danger' : 'text-success'}`}>
                        {line.done_qty}
                      </span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        className="w-full min-w-[60px] text-right px-2 py-1.5 border border-border rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm font-semibold text-primary"
                        value={line.done_qty}
                        onChange={(e) => updateLine(idx, 'done_qty', Number(e.target.value))}
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-text-secondary">
                    ${Number(line.per_unit_cost || 0).toFixed(2)}
                  </td>
                  {!readonly && (
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-light rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {!readonly && (
        <div className="p-3 bg-gray-50/50 border-t border-border">
          <button
            type="button"
            onClick={addLine}
            className="text-sm font-medium text-primary hover:text-primary-dark flex items-center gap-1.5 transition-colors"
          >
            <Plus size={16} /> Add a line
          </button>
        </div>
      )}
    </div>
  );
}

ProductLineTable.propTypes = {
  lines: PropTypes.array.isRequired,
  setLines: PropTypes.func.isRequired,
  products: PropTypes.array.isRequired,
  readonly: PropTypes.bool,
  type: PropTypes.string,
};
