import { useParams, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { fetchKAK, fetchIKU, fetchRAB, formatCurrency, formatDate, formatDateLong } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';

/* ---------- RAB Calculation (PHP-parity) ---------- */
function calcRabTotal(r: any): number {
  const q1 = parseFloat(r.qty1) || 0;
  const q2 = parseFloat(r.qty2) || 1;
  const q3 = parseFloat(r.qty3) || 0;
  const harga = parseFloat(r.harga_satuan) || 0;
  if (q3 > 0) return q1 * q2 * q3 * harga;
  if (q1 > 0) return q1 * q2 * harga;
  return parseFloat(r.total) || 0;
}

function groupRabByKategori(rabList: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  for (const r of rabList) {
    const cat = (r.kategori || 'lainnya').toLowerCase();
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(r);
  }
  return groups;
}

const KATEGORI_LABELS: Record<string, string> = {
  barang: 'Belanja Barang',
  jasa: 'Belanja Jasa',
  perjalanan: 'Belanja Perjalanan',
  honor: 'Belanja Honor',
  transport: 'Belanja Transport',
  konsumsi: 'Belanja Konsumsi',
  lainnya: 'Belanja Lainnya',
};

export function PrintProposalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kegiatan, setKegiatan] = useState<any>(null);
  const [kak, setKak] = useState<any>(null);
  const [ikuList, setIkuList] = useState<any[]>([]);
  const [rabList, setRabList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const doc = await databases.getDocument(APPWRITE_DB_ID, 'kegiatan', id);
        setKegiatan(doc);
        const [k, i, r] = await Promise.all([fetchKAK(id), fetchIKU(id), fetchRAB(id)]);
        setKak(k); setIkuList(i); setRabList(r);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    })();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-emerald-700 size-8" /></div>;
  if (!kegiatan) return <div className="py-12 text-center text-slate-500">Data kegiatan tidak ditemukan.</div>;

  const rabGroups = groupRabByKategori(rabList);
  const grandTotal = rabList.reduce((sum, r) => sum + calcRabTotal(r), 0);

  return (
    <>
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          /* Hide everything except the print area */
          body > *:not(#root) { display: none !important; }
          header, aside, nav, .no-print, [data-no-print] { display: none !important; }
          
          /* Reset layout for print — remove sidebar offset, padding, background */
          main { margin-left: 0 !important; background: white !important; }
          main > header { display: none !important; }
          .print-area { 
            padding: 0 !important; 
            max-width: 100% !important;
            margin: 0 !important;
          }
          
          /* Typography */
          .print-area * { color: #000 !important; }
          .print-area h1 { font-size: 18pt !important; }
          .print-area h2 { font-size: 14pt !important; }
          .print-area h3 { font-size: 12pt !important; }
          .print-area p, .print-area td, .print-area th { font-size: 10pt !important; }
          
          /* Table styling */
          .print-area table { border-collapse: collapse; width: 100%; }
          .print-area th, .print-area td { 
            border: 1px solid #333 !important; 
            padding: 4pt 8pt !important; 
          }
          .print-area thead th { 
            background: #f0f0f0 !important; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Category headers */
          .print-area .rab-category-header td {
            background: #e8e8e8 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-weight: bold !important;
          }
          .print-area .rab-subtotal td {
            background: #f5f5f5 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Page breaks */
          .print-section { page-break-inside: avoid; }
          
          /* Remove shadows & borders */
          .print-area .shadow-sm { box-shadow: none !important; }
          
          @page {
            margin: 2cm 1.5cm;
            size: A4;
          }
        }
      `}</style>

      {/* Toolbar (hidden on print) */}
      <div className="no-print flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">Cetak Proposal</h2>
          <p className="text-sm text-slate-500">Preview dokumen sebelum dicetak. Klik "Cetak / Simpan PDF" untuk menyimpan.</p>
        </div>
        <Button onClick={handlePrint} className="bg-emerald-700 hover:bg-emerald-800">
          <Printer className="size-4 mr-2" /> Cetak / Simpan PDF
        </Button>
      </div>

      {/* Print Area */}
      <div className="print-area max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-10 space-y-8">
        
        {/* Header */}
        <div className="text-center border-b-2 border-slate-800 pb-6 print-section">
          <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">
            Proposal Kegiatan
          </h1>
          <p className="text-sm text-slate-500 mt-1">Si-LATORJANA — Sistem Layanan Terpadu Administrasi Pengajuan</p>
          <p className="text-xs text-slate-400 mt-1">Politeknik Negeri Jakarta</p>
        </div>

        {/* 1. Informasi Kegiatan */}
        <div className="print-section space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
            I. Informasi Kegiatan
          </h2>
          <table className="w-full text-sm">
            <tbody>
              <InfoPrintRow label="Nama Kegiatan" value={kegiatan.nama_kegiatan} />
              <InfoPrintRow label="Jenis Kegiatan" value={kegiatan.jenis_kegiatan || kegiatan.kategori || '-'} />
              <InfoPrintRow label="Tanggal Pelaksanaan" value={formatDateLong(kegiatan.tanggal_kegiatan || kegiatan.tgl_kegiatan)} />
              <InfoPrintRow label="Tempat" value={kegiatan.tempat || '-'} />
              <InfoPrintRow label="Pengusul / Organisasi" value={kegiatan.pengusul_organisasi || kegiatan.pengusul_nama || '-'} />
              <InfoPrintRow label="Jurusan" value={kegiatan.nama_jurusan || '-'} />
              <InfoPrintRow label="Total Anggaran" value={formatCurrency(grandTotal)} highlight />
              {kegiatan.deskripsi && <InfoPrintRow label="Deskripsi" value={kegiatan.deskripsi} />}
            </tbody>
          </table>
        </div>

        {/* 2. KAK */}
        {kak && (
          <div className="print-section space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
              II. Kerangka Acuan Kerja (KAK)
            </h2>
            <div className="space-y-3 text-sm">
              {kak.gambaran_umum && <KakSection title="Gambaran Umum" content={kak.gambaran_umum} />}
              {kak.tujuan && <KakSection title="Tujuan" content={kak.tujuan} />}
              {kak.sasaran && <KakSection title="Sasaran" content={kak.sasaran} />}
              {kak.penerima_manfaat && <KakSection title="Penerima Manfaat" content={kak.penerima_manfaat} />}
              {kak.strategi_pencapaian && <KakSection title="Strategi Pencapaian" content={kak.strategi_pencapaian} />}
              {kak.metode_pelaksanaan && <KakSection title="Metode Pelaksanaan" content={kak.metode_pelaksanaan} />}
              {kak.tahapan_pelaksanaan && <KakSection title="Tahapan Pelaksanaan" content={kak.tahapan_pelaksanaan} />}
              {kak.indikator_kinerja && <KakSection title="Indikator Kinerja" content={kak.indikator_kinerja} />}
              {(kak.kurun_waktu_mulai || kak.kurun_waktu_selesai) && (
                <KakSection title="Kurun Waktu Pelaksanaan" content={`${formatDateLong(kak.kurun_waktu_mulai)} — ${formatDateLong(kak.kurun_waktu_selesai)}`} />
              )}
            </div>
          </div>
        )}

        {/* 3. IKU */}
        {ikuList.length > 0 && (
          <div className="print-section space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
              III. Indikator Kinerja Utama (IKU)
            </h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border border-slate-200">
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-700 w-12 border border-slate-200">No</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-700 border border-slate-200">Indikator</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-700 w-28 border border-slate-200">Target (%)</th>
                </tr>
              </thead>
              <tbody>
                {ikuList.map((iku, idx) => (
                  <tr key={iku.$id || idx} className="border border-slate-200">
                    <td className="px-4 py-2 border border-slate-200 text-center">{idx + 1}</td>
                    <td className="px-4 py-2 border border-slate-200">{iku.nama_iku || iku.indikator || '-'}</td>
                    <td className="px-4 py-2 text-right border border-slate-200">{iku.target_persen != null ? `${iku.target_persen}%` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. RAB grouped by kategori */}
        {rabList.length > 0 && (
          <div className="print-section space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
              IV. Rincian Anggaran Biaya (RAB)
            </h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border border-slate-200">
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-700 w-12 border border-slate-200">No</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-700 border border-slate-200">Uraian</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-slate-700 w-16 border border-slate-200">Qty1</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-slate-700 w-16 border border-slate-200">Qty2</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-slate-700 w-16 border border-slate-200">Qty3</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-700 w-32 border border-slate-200">Harga Satuan</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-700 w-36 border border-slate-200">Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(rabGroups).map(([kategori, items]) => {
                  const subtotal = items.reduce((sum: number, r: any) => sum + calcRabTotal(r), 0);
                  const catLabel = KATEGORI_LABELS[kategori] || kategori.charAt(0).toUpperCase() + kategori.slice(1);
                  return (
                    <React.Fragment key={kategori}>
                      <tr className="rab-category-header bg-slate-100 border border-slate-200">
                        <td colSpan={7} className="px-4 py-2.5 font-bold text-slate-800 border border-slate-200">{catLabel}</td>
                      </tr>
                      {items.map((r: any, idx: number) => (
                        <tr key={r.$id || idx} className="border border-slate-200">
                          <td className="px-4 py-2 text-center border border-slate-200">{idx + 1}</td>
                          <td className="px-4 py-2 border border-slate-200">{r.uraian || '-'}</td>
                          <td className="px-4 py-2 text-center border border-slate-200">{r.qty1 || r.volume || '-'}</td>
                          <td className="px-4 py-2 text-center border border-slate-200">{r.qty2 || '-'}</td>
                          <td className="px-4 py-2 text-center border border-slate-200">{r.qty3 || '-'}</td>
                          <td className="px-4 py-2 text-right border border-slate-200">{formatCurrency(r.harga_satuan)}</td>
                          <td className="px-4 py-2 text-right font-medium border border-slate-200">{formatCurrency(calcRabTotal(r))}</td>
                        </tr>
                      ))}
                      <tr className="rab-subtotal bg-slate-50/80 border border-slate-200">
                        <td colSpan={6} className="px-4 py-2 text-right font-semibold border border-slate-200 text-slate-700">Subtotal {catLabel}</td>
                        <td className="px-4 py-2 text-right font-bold border border-slate-200 text-slate-900">{formatCurrency(subtotal)}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr className="bg-emerald-50 font-bold border border-slate-200">
                  <td colSpan={6} className="px-4 py-3 text-right border border-slate-200 text-slate-900">
                    Grand Total
                  </td>
                  <td className="px-4 py-3 text-right border border-slate-200 text-emerald-700 text-base">
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="print-section pt-8 border-t border-slate-200">
          <div className="flex justify-between text-sm text-slate-600">
            <div>
              <p>Dicetak pada: {formatDateLong(new Date().toISOString())}</p>
            </div>
            <div className="text-right">
              <p className="mb-16">Mengetahui,</p>
              <p className="border-t border-slate-400 pt-1 inline-block px-8">
                ({kegiatan.pengusul_nama || kegiatan.pengusul_organisasi || '.............................'})
              </p>
              <p className="text-xs text-slate-500 mt-1">Pengusul</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- Sub-Components ---------- */

function InfoPrintRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 pr-4 text-slate-500 font-medium w-48 align-top">{label}</td>
      <td className="py-2 px-2 w-4 align-top">:</td>
      <td className={`py-2 ${highlight ? 'font-bold text-emerald-700' : 'text-slate-800'}`}>{value}</td>
    </tr>
  );
}

function KakSection({ title, content }: { title: string; content: string }) {
  return (
    <div className="border-b border-slate-100 pb-3">
      <p className="font-semibold text-slate-700 mb-1">{title}</p>
      <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
}

function RabCategoryGroup({ kategori, items, subtotal }: { kategori: string; items: any[]; subtotal: number }) {
  const label = KATEGORI_LABELS[kategori] || kategori.charAt(0).toUpperCase() + kategori.slice(1);
  return (
    <>
      {/* Category Header */}
      <tr className="rab-category-header bg-slate-100 border border-slate-200">
        <td colSpan={7} className="px-4 py-2.5 font-bold text-slate-800 border border-slate-200">
          {label}
        </td>
      </tr>
      {/* Items */}
      {items.map((r, idx) => {
        const total = calcRabTotal(r);
        return (
          <tr key={r.$id || idx} className="border border-slate-200">
            <td className="px-4 py-2 text-center border border-slate-200">{idx + 1}</td>
            <td className="px-4 py-2 border border-slate-200">{r.uraian || '-'}</td>
            <td className="px-4 py-2 text-center border border-slate-200">{r.qty1 || r.volume || '-'}</td>
            <td className="px-4 py-2 text-center border border-slate-200">{r.qty2 || '-'}</td>
            <td className="px-4 py-2 text-center border border-slate-200">{r.qty3 || '-'}</td>
            <td className="px-4 py-2 text-right border border-slate-200">{formatCurrency(r.harga_satuan)}</td>
            <td className="px-4 py-2 text-right font-medium border border-slate-200">{formatCurrency(total)}</td>
          </tr>
        );
      })}
      {/* Subtotal Row */}
      <tr className="rab-subtotal bg-slate-50/80 border border-slate-200">
        <td colSpan={6} className="px-4 py-2 text-right font-semibold border border-slate-200 text-slate-700">
          Subtotal {label}
        </td>
        <td className="px-4 py-2 text-right font-bold border border-slate-200 text-slate-900">
          {formatCurrency(subtotal)}
        </td>
      </tr>
    </>
  );
}
