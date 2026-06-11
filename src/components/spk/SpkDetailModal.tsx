/**
 * ====================================================================
 *  SPK DETAIL MODAL — Detail Langkah Perhitungan MOORA
 * ====================================================================
 *
 *  Dialog/modal yang menampilkan detail lengkap perhitungan MOORA:
 *  1. Matriks Keputusan (X)
 *  2. Normalisasi Matriks (X*)
 *  3. Perhitungan Bobot
 *  4. Skor Akhir & Grade
 *  5. Info developer (case, alternatif, kriteria, metode)
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getGradeColor,
  getGradeLabel,
  KRITERIA_NAMES,
  type MooraResult,
  type KriteriaDef,
} from '@/lib/mooraCalculator';
import { X, Calculator, Table2, BarChart3, Award, Info, Code2 } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';

interface SpkDetailModalProps {
  result: MooraResult;
  kriteria: KriteriaDef[];
  isOpen: boolean;
  onClose: () => void;
}

export function SpkDetailModal({ result, kriteria, isOpen, onClose }: SpkDetailModalProps) {
  if (!isOpen) return null;

  const gradeColors = getGradeColor(result.grade);
  const skorKeys = ['c1', 'c2', 'c3', 'c4'] as const;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="size-6" />
            <h2 className="text-xl font-bold">Detail Perhitungan SPK MOORA</h2>
          </div>
          <p className="text-sm text-slate-300">
            Kegiatan #{result.kegiatan_id} — Langkah-langkah algoritma MOORA
          </p>
        </div>

        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">

          {/* ── STEP 1: Rubrik Penilaian ── */}
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center size-7 rounded-lg bg-blue-100 text-blue-700 text-sm font-black">1</div>
              <h3 className="font-bold text-slate-800 text-base">Pra-Pemrosesan: Rubrik Penalti (Skor 0-100)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-2.5 px-3 font-bold text-slate-600 text-xs">Kode</th>
                    <th className="text-left py-2.5 px-3 font-bold text-slate-600 text-xs">Kriteria</th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-600 text-xs">Skor</th>
                    <th className="text-left py-2.5 px-3 font-bold text-slate-600 text-xs">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {skorKeys.map((key, i) => {
                    const detail = result.detail_rubrik?.[key];
                    const skor = result.skor_rubrik[key];
                    return (
                      <tr key={key} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-slate-800">{`C${i + 1}`}</td>
                        <td className="py-2.5 px-3 text-slate-700">{KRITERIA_NAMES[key]}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-lg font-black text-xs ${
                            skor >= 75 ? 'bg-emerald-50 text-emerald-700' :
                            skor >= 50 ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          }`}>{skor}</span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-500 max-w-[200px]">{detail?.keterangan || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Detail data C2 */}
            {result.detail_rubrik?.c2 && (
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100">
                  <span className="text-blue-500 font-bold block text-[10px] uppercase tracking-wider mb-0.5">Total RAB</span>
                  <span className="font-bold text-slate-800">{formatCurrency(result.detail_rubrik.c2.total_rab || 0)}</span>
                </div>
                <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100">
                  <span className="text-blue-500 font-bold block text-[10px] uppercase tracking-wider mb-0.5">Total Realisasi</span>
                  <span className="font-bold text-slate-800">{formatCurrency(result.detail_rubrik.c2.total_realisasi || 0)}</span>
                </div>
              </div>
            )}
          </section>

          {/* ── STEP 2: Matriks Keputusan ── */}
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center size-7 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-black">2</div>
              <h3 className="font-bold text-slate-800 text-base">Matriks Keputusan (X)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-indigo-50 border-b border-indigo-200">
                    <th className="text-left py-2.5 px-3 font-bold text-indigo-600 text-xs">Alternatif</th>
                    {skorKeys.map((_, i) => (
                      <th key={i} className="text-center py-2.5 px-3 font-bold text-indigo-600 text-xs">{`C${i + 1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.matriks_keputusan.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2.5 px-3 font-bold text-slate-800">LPJ {i + 1}</td>
                      {row.map((val, j) => (
                        <td key={j} className="py-2.5 px-3 text-center font-mono text-sm font-semibold text-slate-700">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── STEP 3: Normalisasi ── */}
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center size-7 rounded-lg bg-purple-100 text-purple-700 text-sm font-black">3</div>
              <h3 className="font-bold text-slate-800 text-base">Normalisasi Matriks (X*)</h3>
            </div>

            {/* Pembagi */}
            <div className="mb-3 p-3 bg-purple-50/50 rounded-lg border border-purple-100">
              <span className="text-purple-600 font-bold text-[10px] uppercase tracking-wider block mb-2">
                Pembagi per kolom: √(Σ xij²)
              </span>
              <div className="flex gap-4">
                {result.pembagi.map((val, i) => (
                  <div key={i} className="text-center">
                    <span className="text-[10px] text-purple-500 font-bold block">{`C${i + 1}`}</span>
                    <span className="font-mono font-bold text-sm text-slate-800">{val.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rumus */}
            <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <code className="text-xs text-slate-600 font-mono">
                x*ij = xij / √(Σ xij²)
              </code>
            </div>

            {/* Matriks normalisasi */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-purple-50 border-b border-purple-200">
                    <th className="text-left py-2.5 px-3 font-bold text-purple-600 text-xs">Alternatif</th>
                    {skorKeys.map((_, i) => (
                      <th key={i} className="text-center py-2.5 px-3 font-bold text-purple-600 text-xs">{`C${i + 1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.matriks_normalisasi.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2.5 px-3 font-bold text-slate-800">LPJ {i + 1}</td>
                      {row.map((val, j) => (
                        <td key={j} className="py-2.5 px-3 text-center font-mono text-sm font-semibold text-slate-700">{val.toFixed(6)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── STEP 4: Skor Akhir ── */}
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center size-7 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-black">4</div>
              <h3 className="font-bold text-slate-800 text-base">Nilai Preferensi Akhir (Yi)</h3>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center mb-3">
              <code className="text-xs text-slate-600 font-mono">
                Yi = Σ (wj × x*ij) &nbsp;&nbsp;|&nbsp;&nbsp; Semua Benefit (wj = 0.25)
              </code>
            </div>

            {/* Perhitungan detail */}
            <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 space-y-2">
              {result.matriks_normalisasi.map((row, i) => {
                const bobot = result.bobot;
                const parts = row.map((val, j) => `(${bobot[j]} × ${val.toFixed(4)})`);

                return (
                  <div key={i} className="text-xs font-mono text-slate-600">
                    <span className="font-bold text-slate-800">Y{i + 1}</span> = {parts.join(' + ')} = <span className="font-black text-emerald-700">{result.skor_akhir.toFixed(6)}</span>
                  </div>
                );
              })}
            </div>

            {/* Grade result */}
            <div className={`mt-4 p-5 rounded-xl border-2 ${gradeColors.border} ${gradeColors.bg} text-center`}>
              <Award className={`size-10 mx-auto mb-2 ${gradeColors.text}`} />
              <div className={`text-4xl font-black ${gradeColors.text} mb-1`}>{result.grade}</div>
              <div className={`text-sm font-bold ${gradeColors.text}`}>{getGradeLabel(result.grade)}</div>
              <div className="text-xs text-slate-500 mt-1">
                Skor Akhir: <strong>{(result.skor_akhir * 100).toFixed(2)}%</strong>
              </div>
            </div>
          </section>

          {/* ── INFO DEVELOPER ── */}
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <Code2 className="size-5 text-slate-400" />
              <h3 className="font-bold text-slate-500 text-sm">Informasi Teknis (Developer)</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 col-span-2 sm:col-span-1">
                <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Case Yang Diambil</span>
                <span className="text-slate-700 font-medium">Sistem Pendukung Keputusan (SPK)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 col-span-2 sm:col-span-1">
                <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Case Yang Diselesaikan</span>
                <span className="text-slate-700 font-medium">Penilaian Kualitas & Approval LPJ</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Perhitungan Metode</span>
                <span className="text-slate-700 font-medium">MOORA (Ratio System)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Alternatif Yang Diambil</span>
                <span className="text-slate-700 font-medium">{result.matriks_keputusan.length} Dokumen LPJ</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 col-span-2">
                <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Kriteria Yang Diambil (Bobot 25%)</span>
                <span className="text-slate-700 font-medium">C1: Waktu Pelaksanaan, C2: Ketepatan Dana, C3: Kesesuaian IKU, C4: Waktu Approval</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <Button onClick={onClose} className="bg-slate-800 hover:bg-slate-900 text-white h-10 rounded-lg px-6 font-semibold">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
