import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import { FileX } from 'lucide-react';

export default function DataTable({ columns, data, onRowClick, loading, emptyMessage = 'No records found.' }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState icon={FileX} title="No Data" description={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider ${col.className || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-border-light hover:bg-gray-50/80 transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              } ${row._rowClass || ''}`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-sm ${col.cellClass || ''}`}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
