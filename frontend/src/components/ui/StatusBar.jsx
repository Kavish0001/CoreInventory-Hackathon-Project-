import { Check } from 'lucide-react';

export default function StatusBar({ steps, current }) {
  const currentIdx = steps.indexOf(current);

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isLast = idx === steps.length - 1;

        return (
          <div key={step} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  isDone
                    ? 'bg-primary border-primary text-white'
                    : isCurrent
                      ? 'bg-white border-primary text-primary'
                      : 'bg-white border-border text-text-muted'
                }`}
              >
                {isDone ? <Check size={14} /> : idx + 1}
              </div>
              <span className={`text-[10px] mt-1 font-medium capitalize ${isCurrent ? 'text-primary' : isDone ? 'text-text-secondary' : 'text-text-muted'}`}>
                {step}
              </span>
            </div>
            {/* Connector */}
            {!isLast && (
              <div className={`w-12 h-0.5 mx-1 ${isDone ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
