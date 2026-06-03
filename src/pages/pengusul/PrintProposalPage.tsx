import { useParams, useNavigate } from 'react-router-dom';
import { apiGetKegiatan } from '@/lib/api';
import React, { useEffect, useState } from 'react';
import { fetchKAK, fetchIKU, fetchRAB, formatCurrency } from '@/lib/helpers';
import './print.css'; // The exact CSS from the old PHP system

/* ---------- Utility Functions ---------- */
function terbilang(nilai: number): string {
    nilai = Math.abs(nilai);
    const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    let temp = "";
    if (nilai < 12) { temp = " " + huruf[nilai]; }
    else if (nilai < 20) { temp = terbilang(nilai - 10) + " Belas"; }
    else if (nilai < 100) { temp = terbilang(Math.floor(nilai / 10)) + " Puluh" + terbilang(nilai % 10); }
    else if (nilai < 200) { temp = " Seratus" + terbilang(nilai - 100); }
    else if (nilai < 1000) { temp = terbilang(Math.floor(nilai / 100)) + " Ratus" + terbilang(nilai % 100); }
    else if (nilai < 1000000) { temp = terbilang(Math.floor(nilai / 1000)) + " Ribu" + terbilang(nilai % 1000); }
    else if (nilai < 1000000000) { temp = terbilang(Math.floor(nilai / 1000000)) + " Juta" + terbilang(nilai % 1000000); }
    else if (nilai < 1000000000000) { temp = terbilang(Math.floor(nilai / 1000000000)) + " Miliar" + terbilang(nilai % 1000000000); }
    return temp.trim();
}

function formatDateIndo(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function parseIndikatorKinerja(rawValue: string | undefined | null): any[] {
    if (!rawValue) return [];
    try {
        const parsed = JSON.parse(rawValue);
        if (Array.isArray(parsed)) {
            return parsed.map((item: any) => ({
                bulan: item.bulan || '',
                indikator: item.indikator || '',
                target: item.target !== undefined && item.target !== null ? Number(item.target) : null,
            }));
        }
    } catch {
        if (rawValue && rawValue.trim()) {
            return [{ bulan: '', indikator: rawValue, target: null }];
        }
    }
    return [];
}

export function PrintProposalPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [kegiatan, setKegiatan] = useState<any>(null);
    const [kak, setKak] = useState<any>(null);
    const [ikuList, setIkuList] = useState<any[]>([]);
    const [rabList, setRabList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filename, setFilename] = useState('');

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const doc = await apiGetKegiatan(id);
                setKegiatan(doc);
                
                const initialName = `KAK_${doc.nama_kegiatan?.replace(/ /g, '_') || 'Kegiatan'}_${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;
                setFilename(initialName);
                document.title = initialName;

                const [k, i, r] = await Promise.all([fetchKAK(id), fetchIKU(id), fetchRAB(id)]);
                setKak(k); 
                setIkuList(i); 
                setRabList(r);
            } catch (e) { 
                console.error(e); 
            } finally { 
                setIsLoading(false); 
            }
        })();
    }, [id]);

    useEffect(() => {
        if (filename) document.title = filename;
    }, [filename]);

    const handlePrint = () => {
        document.title = filename;
        requestAnimationFrame(() => {
            setTimeout(() => {
                window.print();
            }, 300);
        });
    };

    if (isLoading) return <div className="p-8 text-center">Loading PDF Data...</div>;
    if (!kegiatan) return <div className="p-8 text-center text-red-500">Data tidak ditemukan.</div>;

    const documentNumber = `KGT-${String(kegiatan.id).slice(-4).padStart(4, '0')}/${new Date().getFullYear()}`;
    const userName = kegiatan.pengusul_nama || 'Pengusul';
    const userJurusan = kegiatan.nama_jurusan || kegiatan.pengusul_organisasi || '-';

    // RAB Grouping Logic
    const rabByCategory: Record<string, any[]> = {};
    let grandTotal = 0;
    
    for (const rab of rabList) {
        const cat = (rab.kategori || 'lainnya').toLowerCase();
        if (!rabByCategory[cat]) rabByCategory[cat] = [];
        rabByCategory[cat].push(rab);
    }

    return (
        <div className="print-page-wrapper">
            {/* BUTTONS (Screen Only) */}
            <div className="print-actions">
                <div className="panel-header">
                    <div className="panel-icon">
                        <span className="icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 6 2 18 2 18 9" />
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                <rect x="6" y="14" width="12" height="8" />
                                <circle cx="18" cy="12" r="1" />
                            </svg>
                        </span>
                    </div>
                    <div className="panel-copy">
                        <h4>Panel Pratinjau</h4>
                        <p>Atur nama file, lalu tekan cetak untuk simpan PDF.</p>
                    </div>
                </div>
                <div className="panel-divider"></div>
                <div className="filename-wrapper">
                    <label htmlFor="doc-filename">Nama Dokumen:</label>
                    <input 
                        type="text" 
                        id="doc-filename" 
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        placeholder="Masukkan nama dokumen..." 
                    />
                </div>
                <div className="preview-hint">
                    Perubahan nama otomatis menjadi judul file saat Anda memilih <strong>Simpan sebagai PDF</strong>. Panel ini tidak akan ikut tercetak.
                </div>
                <div className="btn-row">
                    <button className="btn btn-back" onClick={() => navigate(-1)}>
                        <span className="icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </span>
                        Kembali
                    </button>
                    <button className="btn btn-print" onClick={handlePrint}>
                        <span className="icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </span>
                        Cetak / Simpan PDF
                    </button>
                </div>
            </div>

            <div className="print-container">
                {/* Cover page */}
                <div className="cover-page-wrapper page-break">
                    <div className="cover-page">
                        <div className="cover-meta">
                            <span className="meta-badge">Dokumen KAK</span>
                            <span className="meta-year">TA {new Date().getFullYear()}</span>
                        </div>

                        <div className="cover-logo-block">
                            <img className="cover-logo" src="/assets/images/logo-pnj.png" alt="Logo PNJ" />
                            <p>POLITEKNIK NEGERI JAKARTA</p>
                        </div>

                        <div className="cover-divider"></div>

                        <div className="cover-title-block">
                            <div className="cover-title">Kerangka Acuan Kerja</div>
                            <div className="cover-subtitle">Tahun Anggaran {new Date().getFullYear()}</div>
                        </div>

                        <div className="cover-info-grid">
                            <div className="info-card">
                                <p className="info-label">Nomor Dokumen</p>
                                <p className="info-value">{documentNumber}</p>
                            </div>
                            <div className="info-card">
                                <p className="info-label">Kegiatan</p>
                                <p className="info-value">{kegiatan.nama_kegiatan || '-'}</p>
                            </div>
                            <div className="info-card">
                                <p className="info-label">Unit Kerja</p>
                                <p className="info-value">{userJurusan}</p>
                            </div>
                            <div className="info-card">
                                <p className="info-label">Pengusul</p>
                                <p className="info-value">{userName}</p>
                            </div>
                        </div>

                        <div className="cover-footer">
                            Kementerian Pendidikan Tinggi, Riset, dan Teknologi
                            <strong>Politeknik Negeri Jakarta · {new Date().getFullYear()}</strong>
                        </div>
                    </div>
                </div>

                {/* Content Page */}
                <div className="content-wrapper">
                    <div className="header-container">
                        <div className="logo-box">
                            <img src="/assets/images/logo-pnj.png" alt="Logo PNJ" />
                        </div>
                        <div className="kop-text">
                            <h1>POLITEKNIK NEGERI JAKARTA</h1>
                            <h2>SISTEM INFORMASI SILATORJANA</h2>
                            <p>Jl. Prof. DR. G.A. Siwabessy, Kampus Universitas Indonesia, Depok 16425</p>
                            <p>Telepon: 021-7270036 | Email: humas@pnj.ac.id</p>
                        </div>
                    </div>
                    <div className="kop-divider"></div>

                    <div className="document-title">
                        <h3>PROPOSAL KEGIATAN</h3>
                        <p>Nomor: {documentNumber}</p>
                    </div>

                    <div className="section">
                        <div className="section-title">I. INFORMASI KEGIATAN</div>
                        <div className="section-content">
                            <table className="info-table">
                                <tbody>
                                    <tr>
                                        <td>Nama Kegiatan</td>
                                        <td>:</td>
                                        <td>{kegiatan.nama_kegiatan || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td>Jenis Kegiatan</td>
                                        <td>:</td>
                                        <td>{kegiatan.jenis_kegiatan ? kegiatan.jenis_kegiatan.toUpperCase() : '-'}</td>
                                    </tr>
                                    <tr>
                                        <td>Tanggal Pelaksanaan</td>
                                        <td>:</td>
                                        <td>{formatDateIndo(kegiatan.tanggal_kegiatan)}</td>
                                    </tr>
                                    <tr>
                                        <td>Tempat Pelaksanaan</td>
                                        <td>:</td>
                                        <td>{kegiatan.tempat || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td>Pengusul</td>
                                        <td>:</td>
                                        <td>{userName}</td>
                                    </tr>
                                    <tr>
                                        <td>Jurusan</td>
                                        <td>:</td>
                                        <td>{userJurusan}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {kak && (
                        <div className="section">
                            <div className="section-title">II. KERANGKA ACUAN KERJA (KAK)</div>
                            <div className="section-content">
                                {kak.gambaran_umum && (
                                    <>
                                        <div className="sub-title">A. Gambaran Umum</div>
                                        <div className="text-content">
                                            <p>{kak.gambaran_umum}</p>
                                        </div>
                                    </>
                                )}
                                {kak.penerima_manfaat && (
                                    <>
                                        <div className="sub-title">B. Penerima Manfaat</div>
                                        <div className="text-content">
                                            <p>{kak.penerima_manfaat}</p>
                                        </div>
                                    </>
                                )}
                                {kak.strategi_pencapaian && (
                                    <>
                                        <div className="sub-title">C. Strategi Pencapaian</div>
                                        <div className="text-content">
                                            <p>{kak.strategi_pencapaian}</p>
                                        </div>
                                    </>
                                )}
                                {kak.metode_pelaksanaan && (
                                    <>
                                        <div className="sub-title">D. Metode Pelaksanaan</div>
                                        <div className="text-content">
                                            <p>{kak.metode_pelaksanaan}</p>
                                        </div>
                                    </>
                                )}
                                {kak.tahapan_pelaksanaan && (
                                    <>
                                        <div className="sub-title">E. Tahapan Pelaksanaan</div>
                                        <div className="text-content">
                                            <p>{kak.tahapan_pelaksanaan}</p>
                                        </div>
                                    </>
                                )}
                                {kak.indikator_kinerja && (
                                    <>
                                        <div className="sub-title">F. Indikator Kinerja</div>
                                        <div className="text-content">
                                            {(() => {
                                                const indicators = parseIndikatorKinerja(kak.indikator_kinerja);
                                                if (indicators.length === 0) return <p>-</p>;
                                                const isTabular = indicators.some(i => i.bulan || i.target);
                                                if (!isTabular) {
                                                    return <p style={{ whiteSpace: 'pre-wrap' }}>{indicators[0]?.indikator || '-'}</p>;
                                                }
                                                return (
                                                    <table className="data-table" style={{ width: '100%', marginTop: '8px', marginBottom: '8px', tableLayout: 'auto' }}>
                                                        <thead>
                                                            <tr>
                                                                <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                                                                <th style={{ width: '120px' }}>Bulan</th>
                                                                <th>Indikator Keberhasilan</th>
                                                                <th style={{ width: '100px', textAlign: 'center' }}>Target Kumulatif</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {indicators.map((item: any, idx: number) => (
                                                                <tr key={idx}>
                                                                    <td className="text-center">{idx + 1}</td>
                                                                    <td>{item.bulan || '-'}</td>
                                                                    <td>{item.indikator || '-'}</td>
                                                                    <td className="text-center" style={{ fontWeight: 'bold' }}>{item.target ? `${item.target}%` : '-'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                );
                                            })()}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {ikuList.length > 0 && (
                        <div className="section">
                            <div className="section-title">III. INDIKATOR KINERJA UTAMA (IKU)</div>
                            <div className="section-content">
                                <table className="data-table" style={{ tableLayout: 'auto' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px' }}>No</th>
                                            <th>Nama IKU</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ikuList.map((iku, idx) => (
                                            <tr key={iku.id || idx}>
                                                <td className="text-center">{idx + 1}</td>
                                                <td className="text-left">{iku.nama_iku || iku.indikator || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {rabList.length > 0 && (
                        <div className="section">
                            <div className="section-title">IV. RENCANA ANGGARAN BIAYA (RAB)</div>
                            <div className="section-content">
                                <table className="data-table rab-table">
                                    <thead>
                                        <tr>
                                            <th>No</th>
                                            <th>Uraian</th>
                                            <th>Vol 1</th>
                                            <th>Sat 1</th>
                                            <th>Vol 2</th>
                                            <th>Sat 2</th>
                                            <th>Vol 3</th>
                                            <th>Sat 3</th>
                                            <th>Harga Satuan<br />(Rp)</th>
                                            <th>Jumlah<br />(Rp)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(rabByCategory).map(([kategori, items], catIdx) => {
                                            let subtotal = 0;
                                            return (
                                                <React.Fragment key={kategori}>
                                                    <tr className="category-row">
                                                        <td colSpan={10}>{kategori.toUpperCase()}</td>
                                                    </tr>
                                                    {items.map((rab, idx) => {
                                                        const qty1 = Number(rab.qty1 || rab.volume || 0);
                                                        const sat1 = rab.satuan1 || rab.satuan || '';
                                                        const qty2 = Number(rab.qty2 || 0);
                                                        const sat2 = rab.satuan2 || '';
                                                        const qty3 = Number(rab.qty3 || 0);
                                                        const sat3 = rab.satuan3 || '';
                                                        
                                                        let volMultiplier = qty1;
                                                        if (qty2 > 0) volMultiplier *= qty2;
                                                        if (qty3 > 0) volMultiplier *= qty3;
                                                        volMultiplier = Math.max(1, volMultiplier);
                                                        
                                                        const hargaSatuan = Number(rab.harga_satuan || 0);
                                                        const jumlah = volMultiplier * hargaSatuan;
                                                        
                                                        subtotal += jumlah;
                                                        
                                                        return (
                                                            <tr key={rab.id || idx}>
                                                                <td>{idx + 1}</td>
                                                                <td className="col-uraian">{rab.uraian || '-'}</td>
                                                                <td>{qty1 || '-'}</td>
                                                                <td>{sat1 || '-'}</td>
                                                                <td>{qty2 || '-'}</td>
                                                                <td>{qty2 ? sat2 : '-'}</td>
                                                                <td>{qty3 || '-'}</td>
                                                                <td>{qty3 ? sat3 : '-'}</td>
                                                                <td className="col-harga">{formatCurrency(hargaSatuan).replace('Rp ', '')}</td>
                                                                <td className="col-jumlah">{formatCurrency(jumlah).replace('Rp ', '')}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                    <tr className="subtotal-row">
                                                        <td colSpan={9}><em>Subtotal {kategori.charAt(0).toUpperCase() + kategori.slice(1)}</em></td>
                                                        <td className="col-jumlah"><strong>Rp {formatCurrency(subtotal).replace('Rp ', '')}</strong></td>
                                                    </tr>
                                                    <tr style={{ display: 'none' }}>
                                                        <td>{(() => { grandTotal += subtotal; return ''; })()}</td>
                                                    </tr>
                                                </React.Fragment>
                                            );
                                        })}
                                        <tr className="total-row">
                                            <td colSpan={9}><strong>TOTAL ANGGARAN DIUSULKAN</strong></td>
                                            <td className="col-jumlah"><strong>{formatCurrency(grandTotal)}</strong></td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px' }}>
                                    <strong>Terbilang:</strong> <em>{terbilang(grandTotal)} Rupiah</em>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="section">
                        <div className="section-title">V. LAMPIRAN</div>
                        <div className="section-content">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '180px', padding: '5px 0' }}>Surat Pengantar</td>
                                        <td style={{ width: '20px', padding: '5px 0' }}>:</td>
                                        <td style={{ padding: '5px 0' }}>{kegiatan.surat_pengantar ? <span style={{color: '#0d6efd', textDecoration: 'underline'}}>Ada Dokumen</span> : <em style={{ color: '#666' }}>Tidak ada</em>}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '5px 0' }}>Dokumen KAK</td>
                                        <td style={{ padding: '5px 0' }}>:</td>
                                        <td style={{ padding: '5px 0' }}>{kak?.file_kak ? <span style={{color: '#0d6efd', textDecoration: 'underline'}}>Ada Dokumen</span> : <em style={{ color: '#666' }}>Tidak ada</em>}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="signature-section">
                        <div className="signature-box">
                            <p>Mengetahui,</p>
                            <p><strong>Ketua Jurusan</strong></p>
                            <div className="signature-space"></div>
                            <div className="signature-line"></div>
                            <p className="signature-nip">NIP. ................................</p>
                        </div>
                        <div className="signature-box">
                            <p>Depok, {formatDateIndo(new Date().toISOString())}</p>
                            <p><strong>Pengusul,</strong></p>
                            <div className="signature-space"></div>
                            <div className="signature-line"></div>
                            <p className="signature-nip">NIM/NIP. ................................</p>
                        </div>
                    </div>

                    {/* Footer Dokumen */}
                    <div className="document-footer">
                        <p>Dokumen ini digenerate oleh <strong>Sistem Informasi SILATORJANA</strong></p>
                        <p>pada {formatDateIndo(new Date().toISOString())} pukul {new Date().toLocaleTimeString('id-ID')} WIB</p>
                        <p style={{ marginTop: '5px' }}><em>Dokumen ini sah dan dapat dipertanggungjawabkan</em></p>
                    </div>

                </div> {/* end content-wrapper */}
            </div>
        </div>
    );
}
