/**
 * ====================================================================
 *  SPK SCORE CARD — Komponen Kartu Skor Kualitas LPJ
 * ====================================================================
 *
 *  Menampilkan skor kualitas LPJ dengan visual gauge/donut,
 *  warna grade, dan breakdown per kriteria.
 *
 *  Digunakan di LpjVerificationPage.tsx
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getGradeColor,
  getGradeLabel,
  formatSkorToPercentage,
  KRITERIA_NAMES,
  type MooraResult,
} from '@/lib/mooraCalculator';
import { Award, BarChart3, Clock, DollarSign, Target, Timer, Loader2, Info } from 'lucide-react';

interface SpkScoreCardProps {
  result: MooraResult | null;
  isLoading: boolean;
  onShowDetail: () => void;
}

const KRITERIA_ICONS: Record<string, any> = {
  c1: Clock,
  c2: DollarSign,
  c3: Target,
  c4: Timer,
};

export function SpkScoreCard({ result, isLoading, onShowDetail }: SpkScoreCardProps) {
  if (isLoading) {
    return (
      <Card className="shadow-lg border-slate-200 overflow-hidden">
        <CardContent className="p-8 text-center">
          <Loader2 className="animate-spin mx-auto size-8 text-emerald-600 mb-3" />
          <p className="text-sm text-slate-500 font-medium">Menghitung skor SPK MOORA...</p>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  const { grade, skor_akhir, skor_rubrik } = result;
  const gradeColors = getGradeColor(grade);
  const gradeLabel = getGradeLabel(grade);
  const percentage = skor_akhir * 100;

  // SVG donut gauge
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (percentage / 100) * circumference;

  const skorKeys = ['c1', 'c2', 'c3', 'c4'] as const;

  return (
    <Card className={`shadow-lg overflow-hidden border-2 ${gradeColors.border}`}>
      {/* Top gradient accent */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${
        grade === 'A' ? 'from-emerald-400 to-emerald-600' :
        grade === 'B' ? 'from-blue-400 to-blue-600' :
        grade === 'C' ? 'from-amber-400 to-amber-600' :
        'from-red-400 to-red-600'
      }`} />

      <CardHeader className="pb-2 pt-5">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className={`p-1.5 rounded-lg ${gradeColors.bg}`}>
            <Award className={`size-5 ${gradeColors.text}`} />
          </div>
          <span className="text-slate-800">Skor Kualitas LPJ (SPK MOORA)</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5 pb-5">
        {/* Donut Gauge + Grade */}
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
              {/* Background ring */}
              <circle cx="64" cy="64" r="54" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              {/* Progress ring */}
              <circle
                cx="64" cy="64" r="54" fill="none"
                stroke={grade === 'A' ? '#10b981' : grade === 'B' ? '#3b82f6' : grade === 'C' ? '#f59e0b' : '#ef4444'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-black ${gradeColors.text}`}>{grade}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{gradeLabel}</span>
            </div>
          </div>

          <div className="flex-1 space-y-1.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Skor Akhir (Yi)</span>
              <span className={`text-2xl font-black ${gradeColors.text}`}>
                {formatSkorToPercentage(skor_akhir)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Dihitung secara real-time menggunakan metode MOORA dengan 4 kriteria berbobot sama (25%).
            </p>
          </div>
        </div>

        {/* Breakdown per kriteria */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Breakdown Kriteria</span>
          {skorKeys.map((key) => {
            const skor = skor_rubrik[key];
            const Icon = KRITERIA_ICONS[key];
            const detail = result.detail_rubrik?.[key];

            return (
              <div key={key} className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg shrink-0 ${skor >= 75 ? 'bg-emerald-50 text-emerald-600' : skor >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                  <Icon className="size-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-700 truncate">{KRITERIA_NAMES[key]}</span>
                    <span className={`text-xs font-black ${skor >= 75 ? 'text-emerald-600' : skor >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {skor}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${skor >= 75 ? 'bg-emerald-500' : skor >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${skor}%` }}
                    />
                  </div>
                  {detail?.keterangan && (
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{detail.keterangan}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail button */}
        <Button
          type="button"
          variant="outline"
          className="w-full text-xs font-semibold h-9 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
          onClick={onShowDetail}
        >
          <BarChart3 className="size-3.5 mr-1.5" />
          Lihat Detail Perhitungan MOORA
        </Button>

        {/* Info for developer */}
        <div className="flex gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg">
          <Info className="size-3.5 shrink-0 mt-0.5 text-slate-400" />
          <p className="text-[10px] text-slate-400 leading-relaxed">
            <strong>Metode:</strong> MOORA (Ratio System) • <strong>Alternatif:</strong> LPJ Kegiatan #{result.kegiatan_id} •
            <strong> Kriteria:</strong> 4 (C1-C4 Benefit) • <strong>Bobot:</strong> Masing-masing 25%
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
