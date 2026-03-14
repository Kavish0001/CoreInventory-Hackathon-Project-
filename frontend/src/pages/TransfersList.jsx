import { Repeat } from 'lucide-react';

export default function TransfersList() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary-light rounded-lg text-primary">
          <Repeat size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Internal Transfers</h1>
          <p className="text-sm text-text-secondary mt-0.5">Move stock between warehouses or internal locations</p>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] p-12 text-center">
        <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-border">
          <Repeat className="text-text-muted" size={24} />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">Coming Soon</h2>
        <p className="text-text-secondary max-w-md mx-auto">
          The Internal Transfers workflow is currently under development. You'll soon be able to execute multi-location moves seamlessly.
        </p>
      </div>
    </div>
  );
}
