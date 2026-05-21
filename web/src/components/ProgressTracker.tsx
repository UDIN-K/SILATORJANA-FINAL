import { getProgressSteps, type ProgressStep } from '@/lib/helpers';
import { Check, Clock, AlertTriangle, X, RotateCcw } from 'lucide-react';

function StepIcon({ status }: { status: ProgressStep['status'] }) {
  if (status === 'success') return <div className="size-8 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check className="size-4" /></div>;
  if (status === 'pending') return <div className="size-8 rounded-full bg-amber-400 text-white flex items-center justify-center animate-pulse"><Clock className="size-4" /></div>;
  if (status === 'revisi') return <div className="size-8 rounded-full bg-rose-500 text-white flex items-center justify-center"><RotateCcw className="size-4" /></div>;
  if (status === 'stuck') return <div className="size-8 rounded-full bg-red-500 text-white flex items-center justify-center"><X className="size-4" /></div>;
  return <div className="size-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center"><span className="text-xs font-bold">?</span></div>;
}

export function ProgressTracker({ status }: { status: string }) {
  const steps = getProgressSteps(status);
  return (
    <div className="flex items-start gap-0 w-full">
      {steps.map((step, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center text-center relative">
          {idx > 0 && (
            <div className={`absolute top-4 -left-1/2 w-full h-0.5 ${
              step.status === 'success' || step.status === 'pending' ? 'bg-emerald-300' : 'bg-slate-200'
            }`} style={{ zIndex: 0 }} />
          )}
          <div className="relative z-10">
            <StepIcon status={step.status} />
          </div>
          <p className="text-xs font-semibold mt-2 text-slate-700">{step.label}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 max-w-[100px] leading-tight">{step.description}</p>
        </div>
      ))}
    </div>
  );
}
