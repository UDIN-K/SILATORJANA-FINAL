/**
 * ====================================================================
 *  MOORA CALCULATOR — Frontend Utility
 *  Metode: MOORA (Multi-Objective Optimization on the basis of Ratio Analysis)
 * ====================================================================
 *
 *  File terpisah agar mudah ditunjukkan saat presentasi.
 *  Berisi tipe data, kalkulasi normalisasi, dan helper.
 */

// ── Tipe Data ──

export interface KriteriaDef {
  kode: string;       // C1, C2, C3, C4
  nama: string;
  tipe: 'benefit' | 'cost';
  bobot: number;      // 0.25
  deskripsi: string;
}

export interface SkorRubrik {
  c1: number;  // 0-100
  c2: number;
  c3: number;
  c4: number;
  detail: {
    c1: RubrikDetail;
    c2: RubrikDetail;
    c3: RubrikDetail;
    c4: RubrikDetail;
  };
}

export interface RubrikDetail {
  skor: number;
  keterangan: string;
  deviasi_hari?: number | null;
  total_rab?: number;
  total_realisasi?: number;
  deviasi_persen?: number | null;
  rata_capaian?: number | null;
  durasi_hari?: number | null;
}

export interface MooraResult {
  kegiatan_id: number;
  skor_rubrik: SkorRubrik;
  bobot: number[];
  matriks_keputusan: number[][];
  pembagi: number[];
  matriks_normalisasi: number[][];
  skor_akhir: number;
  grade: string;
  detail_rubrik: Record<string, RubrikDetail>;
  kegiatan?: {
    id: number;
    nama_kegiatan: string;
    pengusul_nama: string;
    status: string;
    nama_jurusan?: string;
  };
}

export interface SpkPenilaian {
  id: number;
  kegiatan_id: number;
  skor_c1: number;
  skor_c2: number;
  skor_c3: number;
  skor_c4: number;
  norm_c1: number;
  norm_c2: number;
  norm_c3: number;
  norm_c4: number;
  skor_akhir: number;
  grade: string;
  dinilai_oleh: string;
  dinilai_pada: string;
  kegiatan?: any;
}

// ── Kalkulasi ──

/**
 * Normalisasi MOORA: x*ij = xij / sqrt(Σ xij²)
 */
export function normalisasiMoora(matriksKeputusan: number[][]): {
  pembagi: number[];
  normalisasi: number[][];
} {
  if (matriksKeputusan.length === 0) return { pembagi: [], normalisasi: [] };

  const m = matriksKeputusan.length;
  const n = matriksKeputusan[0].length;

  // Hitung pembagi per kolom
  const pembagi: number[] = [];
  for (let j = 0; j < n; j++) {
    let sumSq = 0;
    for (let i = 0; i < m; i++) {
      sumSq += matriksKeputusan[i][j] ** 2;
    }
    pembagi.push(Math.sqrt(sumSq));
  }

  // Normalisasi
  const normalisasi: number[][] = [];
  for (let i = 0; i < m; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      row.push(pembagi[j] > 0 ? matriksKeputusan[i][j] / pembagi[j] : 0);
    }
    normalisasi.push(row);
  }

  return { pembagi, normalisasi };
}

/**
 * Hitung Yi = Σ (wj × x*ij) — semua Benefit
 */
export function hitungPreferensi(matriksNormalisasi: number[][], bobot: number[]): number[] {
  return matriksNormalisasi.map(row =>
    row.reduce((sum, val, j) => sum + (bobot[j] ?? 0.25) * val, 0)
  );
}

/**
 * Tentukan Grade berdasarkan skor akhir
 */
export function tentukanGrade(skorAkhir: number): string {
  if (skorAkhir >= 0.80) return 'A';
  if (skorAkhir >= 0.60) return 'B';
  if (skorAkhir >= 0.40) return 'C';
  return 'D';
}

// ── Helper ──

/**
 * Konversi skor akhir (0-1) ke persentase
 */
export function formatSkorToPercentage(skor: number): string {
  return (skor * 100).toFixed(1) + '%';
}

/**
 * Warna berdasarkan grade
 */
export function getGradeColor(grade: string): { bg: string; text: string; border: string; ring: string } {
  switch (grade) {
    case 'A': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-500' };
    case 'B': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', ring: 'ring-blue-500' };
    case 'C': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', ring: 'ring-amber-500' };
    default:  return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', ring: 'ring-red-500' };
  }
}

/**
 * Label deskriptif untuk grade
 */
export function getGradeLabel(grade: string): string {
  switch (grade) {
    case 'A': return 'Sangat Baik';
    case 'B': return 'Baik';
    case 'C': return 'Cukup';
    default:  return 'Kurang';
  }
}

/**
 * Nama kriteria
 */
export const KRITERIA_NAMES: Record<string, string> = {
  c1: 'Ketepatan Waktu Pelaksanaan',
  c2: 'Ketepatan Anggaran',
  c3: 'Kesesuaian Output IKU',
  c4: 'Waktu Approval LPJ',
};
