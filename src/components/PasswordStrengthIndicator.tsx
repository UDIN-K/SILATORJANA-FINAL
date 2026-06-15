import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password?: string;
}

export function PasswordStrengthIndicator({ password = '' }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const requirements = [
    { label: 'Minimal 8 karakter', test: (p: string) => p.length >= 8 },
    { label: 'Huruf besar (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Huruf kecil (a-z)', test: (p: string) => /[a-z]/.test(p) },
    { label: 'Angka (0-9)', test: (p: string) => /[0-9]/.test(p) },
    { label: 'Karakter khusus (@$!%*?& atau sejenisnya)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];

  const metCount = requirements.filter(req => req.test(password)).length;

  let strengthText = 'Sangat Lemah';
  let strengthColor = 'bg-rose-500';
  let textColor = 'text-rose-500';

  if (metCount === 5) {
    strengthText = 'Kuat (Sangat Aman)';
    strengthColor = 'bg-emerald-500';
    textColor = 'text-emerald-600';
  } else if (metCount >= 3) {
    strengthText = 'Sedang';
    strengthColor = 'bg-amber-500';
    textColor = 'text-amber-600';
  } else if (metCount > 0) {
    strengthText = 'Lemah';
    strengthColor = 'bg-rose-400';
    textColor = 'text-rose-400';
  }

  return (
    <div className="mt-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-slate-700">Kekuatan Kata Sandi:</span>
        <span className={`font-bold ${textColor}`}>{strengthText}</span>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${metCount >= 1 ? strengthColor : 'bg-transparent'}`} />
        <div className={`h-full rounded-full transition-all duration-300 ${metCount >= 3 ? strengthColor : 'bg-transparent'}`} />
        <div className={`h-full rounded-full transition-all duration-300 ${metCount >= 4 ? strengthColor : 'bg-transparent'}`} />
        <div className={`h-full rounded-full transition-all duration-300 ${metCount === 5 ? strengthColor : 'bg-transparent'}`} />
      </div>

      {/* Requirements List */}
      <div className="space-y-1.5 pt-1">
        {requirements.map((req, idx) => {
          const isMet = req.test(password);
          return (
            <div key={idx} className="flex items-center gap-2 text-slate-600 transition-colors duration-200">
              {isMet ? (
                <span className="flex items-center justify-center size-4 rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                  <Check className="size-3 stroke-[3]" />
                </span>
              ) : (
                <span className="flex items-center justify-center size-4 rounded-full bg-slate-100 text-slate-400 shrink-0">
                  <X className="size-3 stroke-[3]" />
                </span>
              )}
              <span className={isMet ? 'text-emerald-700 font-medium' : ''}>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
