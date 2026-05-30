import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

/* ─── Style injection ─────────────────────────────────────────── */
const LANDING_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/icon?family=Material+Icons');

  .lp-body { font-family: "Plus Jakarta Sans", sans-serif; background: #FAFAFA; overflow-x: hidden; }

  /* ── Nav ── */
  .lp-nav {
    position: fixed; top: 0; width: 100%;
    background: rgba(255,255,255,0.98);
    backdrop-filter: blur(20px);
    padding: 20px 0; z-index: 1000;
    box-shadow: 0 2px 30px rgba(0,0,0,0.08);
    transition: all 0.3s ease;
  }
  .lp-nav.scrolled { padding: 15px 0; box-shadow: 0 4px 40px rgba(0,0,0,0.12); }
  .lp-nav-container {
    max-width: 1200px; margin: 0 auto; padding: 0 40px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .lp-logo {
    display: flex; align-items: center; gap: 12px;
    font-size: 22px; font-weight: 800;
    background: linear-gradient(135deg, #1A4D2E 0%, #36C06C 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; text-decoration: none;
  }
  .lp-logo img { -webkit-text-fill-color: initial; }
  .lp-nav-links {
    display: flex; gap: 36px; align-items: center;
  }
  .lp-nav-links a {
    color: #424242; text-decoration: none; font-weight: 600; font-size: 14px;
    transition: all 0.3s ease; position: relative; display: flex; align-items: center; gap: 6px;
  }
  .lp-nav-links a::after {
    content: ''; position: absolute; bottom: -5px; left: 0; width: 0; height: 3px;
    background: linear-gradient(90deg, #1A4D2E 0%, #36C06C 100%);
    transition: width 0.3s ease; border-radius: 2px;
  }
  .lp-nav-links a:hover::after { width: 100%; }
  .lp-nav-links a:hover { color: #1A4D2E; }
  .lp-cta-btn {
    background: linear-gradient(135deg, #1A4D2E 0%, #228B22 100%);
    color: #fff !important; padding: 12px 28px; border-radius: 25px;
    text-decoration: none; font-weight: 700; font-size: 14px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(26,77,46,0.4);
    position: relative; overflow: hidden; border: none;
    -webkit-text-fill-color: #fff !important;
  }
  .lp-cta-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(26,77,46,0.5); }
  .lp-mobile-btn {
    display: none; background: none; border: none; color: #1A4D2E; cursor: pointer; padding: 5px;
  }
  .lp-mobile-btn .material-icons { font-size: 32px; }

  /* ── Floating Particles ── */
  .lp-particles { position: absolute; width: 100%; height: 100%; top: 0; left: 0; overflow: hidden; pointer-events: none; }
  .lp-particle {
    position: absolute; width: 10px; height: 10px;
    background: rgba(54,192,108,0.3); border-radius: 50%;
    animation: lpFloatUp 15s infinite ease-in-out;
  }
  .lp-particle:nth-child(1) { left: 10%; animation-duration: 12s; animation-delay: 0s; }
  .lp-particle:nth-child(2) { left: 20%; animation-duration: 15s; animation-delay: 2s; width: 15px; height: 15px; }
  .lp-particle:nth-child(3) { left: 30%; animation-duration: 18s; animation-delay: 4s; width: 8px; height: 8px; }
  .lp-particle:nth-child(4) { left: 50%; animation-duration: 14s; animation-delay: 1s; }
  .lp-particle:nth-child(5) { left: 70%; animation-duration: 16s; animation-delay: 3s; width: 12px; height: 12px; }
  .lp-particle:nth-child(6) { left: 85%; animation-duration: 13s; animation-delay: 5s; }
  @keyframes lpFloatUp {
    0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
    10% { opacity: 0.5; }
    90% { opacity: 0.5; }
    100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
  }

  /* ── Hero ── */
  .lp-hero {
    min-height: 100vh; display: flex; align-items: center;
    padding: 140px 40px 80px; position: relative; overflow: hidden;
    background: linear-gradient(135deg,#1A4D2E 0%,#2D6A4F 25%,#36C06C 50%,#2D6A4F 75%,#1A4D2E 100%);
    background-size: 200% 200%;
    animation: lpGradShift 15s ease infinite;
  }
  @keyframes lpGradShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .lp-hero::before {
    content: ''; position: absolute; top: -50%; right: -10%;
    width: 800px; height: 800px;
    background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
    border-radius: 50%; animation: lpFloat 20s ease-in-out infinite;
  }
  .lp-hero::after {
    content: ''; position: absolute; bottom: -30%; left: -5%;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    border-radius: 50%; animation: lpFloat 15s ease-in-out infinite reverse;
  }
  @keyframes lpFloat {
    0%,100% { transform: translate(0,0) rotate(0deg); }
    50% { transform: translate(50px,50px) rotate(180deg); }
  }
  .lp-hero-container {
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 60px; align-items: center; position: relative; z-index: 1;
    width: 100%;
  }
  .lp-hero-content h1 {
    font-size: 54px; font-weight: 800; color: white;
    line-height: 1.2; margin-bottom: 24px;
    animation: lpSlideLeft 1s ease-out;
  }
  @keyframes lpSlideLeft {
    0% { opacity: 0; transform: translateX(-80px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  .lp-highlight {
    background: linear-gradient(135deg,#FFD700 0%,#FFA500 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; display: inline-block;
    animation: lpGlow 2s ease-in-out infinite;
  }
  @keyframes lpGlow {
    0%,100% { filter: drop-shadow(0 0 5px rgba(255,215,0,0.5)); }
    50% { filter: drop-shadow(0 0 20px rgba(255,215,0,0.8)); }
  }
  .lp-hero-content p {
    font-size: 17px; color: rgba(255,255,255,0.9);
    line-height: 1.8; margin-bottom: 40px;
    animation: lpSlideLeft 1s ease-out 0.2s backwards;
  }
  .lp-hero-btns {
    display: flex; gap: 20px; flex-wrap: wrap;
    animation: lpSlideLeft 1s ease-out 0.4s backwards;
  }
  .lp-btn-primary {
    background: white; color: #1A4D2E !important; -webkit-text-fill-color: #1A4D2E !important;
    padding: 16px 36px; border-radius: 30px; text-decoration: none;
    font-weight: 700; font-size: 16px;
    display: inline-flex; align-items: center; gap: 10px;
    transition: all 0.3s ease; box-shadow: 0 8px 30px rgba(0,0,0,0.15);
  }
  .lp-btn-primary:hover {
    transform: translateY(-5px); box-shadow: 0 15px 45px rgba(26,77,46,0.4);
    background: linear-gradient(135deg,#1A4D2E 0%,#36C06C 100%);
    color: white !important; -webkit-text-fill-color: white !important;
  }
  .lp-btn-secondary {
    background: rgba(255,255,255,0.2); backdrop-filter: blur(10px);
    color: white !important; -webkit-text-fill-color: white !important;
    padding: 16px 36px; border-radius: 30px; text-decoration: none;
    font-weight: 700; font-size: 16px;
    display: inline-flex; align-items: center; gap: 10px;
    transition: all 0.3s ease; border: 2px solid rgba(255,255,255,0.3);
  }
  .lp-btn-secondary:hover {
    background: rgba(255,255,255,0.3); transform: translateY(-5px);
    box-shadow: 0 12px 35px rgba(255,255,255,0.3);
    border-color: rgba(255,255,255,0.6);
  }
  .lp-hero-img-wrap {
    display: flex; align-items: center; justify-content: flex-end; position: relative;
  }
  .lp-hero-img {
    width: 100%; max-width: 640px; height: auto;
    object-fit: contain; filter: drop-shadow(0 20px 60px rgba(0,0,0,0.3));
    animation: lpFloatSlow 6s ease-in-out infinite;
  }
  @keyframes lpFloatSlow {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }

  /* ── Section shared ── */
  .lp-section-header { text-align: center; max-width: 700px; margin: 0 auto 80px; }
  .lp-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg,#1A4D2E 0%,#36C06C 100%);
    color: white; padding: 8px 20px; border-radius: 20px;
    font-size: 13px; font-weight: 700; margin-bottom: 20px;
    box-shadow: 0 4px 15px rgba(26,77,46,0.3);
  }
  .lp-section-header h2 {
    font-size: 40px; font-weight: 800;
    background: linear-gradient(135deg,#1A4D2E 0%,#36C06C 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; margin-bottom: 16px; line-height: 1.3;
  }
  .lp-section-header p { font-size: 17px; color: #666; line-height: 1.8; }

  /* ── Features ── */
  .lp-features { padding: 120px 40px; background: white; }
  .lp-features-grid {
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(3,1fr); gap: 40px;
  }
  .lp-card {
    background: white; padding: 40px; border-radius: 25px;
    border: 2px solid #F0F0F0; transition: all 0.4s ease;
    position: relative; overflow: hidden;
  }
  .lp-card::before {
    content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px;
    background: linear-gradient(90deg,#1A4D2E 0%,#36C06C 100%);
    transform: scaleX(0); transform-origin: left; transition: transform 0.4s ease;
  }
  .lp-card:hover::before { transform: scaleX(1); }
  .lp-card:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 25px 60px rgba(26,77,46,0.2); border-color: #36C06C;
  }
  .lp-icon {
    width: 70px; height: 70px; border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 24px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); transition: all 0.4s ease;
  }
  .lp-card:hover .lp-icon { transform: scale(1.1) rotate(5deg); }
  .lp-icon .material-icons { color: white; font-size: 36px; }
  .lp-card h3 { font-size: 20px; font-weight: 700; color: #1A4D2E; margin-bottom: 12px; }
  .lp-card p { font-size: 14px; color: #666; line-height: 1.8; }

  /* ── Process ── */
  .lp-process {
    padding: 120px 40px;
    background: linear-gradient(135deg,#E8F5E9 0%,#F1F8F4 50%,#E8F5E9 100%);
  }
  .lp-process-container { max-width: 1200px; margin: 0 auto; }
  .lp-process-img {
    width: 100%; max-width: 1000px; height: auto; object-fit: contain;
    display: block; margin: -120px auto;
  }
  .lp-steps { display: grid; gap: 30px; margin-top: 60px; }
  .lp-step { display: grid; grid-template-columns: 80px 1fr; gap: 30px; align-items: start; }
  .lp-step-num {
    width: 80px; height: 80px; border-radius: 50%; display: flex;
    align-items: center; justify-content: center;
    color: white; font-size: 32px; font-weight: 800;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15); position: relative;
  }
  .lp-step-num::after {
    content: ''; position: absolute; top: 100%; left: 50%;
    transform: translateX(-50%); width: 3px; height: 50px;
    background: linear-gradient(180deg,currentColor 0%,transparent 100%); opacity: 0.3;
  }
  .lp-step:last-child .lp-step-num::after { display: none; }
  .lp-step-content {
    background: white; padding: 30px; border-radius: 20px;
    box-shadow: 0 6px 25px rgba(0,0,0,0.08); border-left: 4px solid;
    transition: all 0.3s ease;
  }
  .lp-step-content:hover { transform: translateX(10px); box-shadow: 0 10px 40px rgba(26,77,46,0.15); }
  .lp-step-content h3 { font-size: 20px; font-weight: 700; color: #1A4D2E; margin-bottom: 8px; }
  .lp-step-content p { font-size: 14px; color: #666; line-height: 1.8; }

  /* ── Stats ── */
  .lp-stats {
    padding: 100px 40px;
    background: linear-gradient(135deg,#1A4D2E 0%,#2D6A4F 50%,#36C06C 100%);
    position: relative; overflow: hidden;
  }
  .lp-stats::before {
    content: ''; position: absolute; top: -50%; right: -10%;
    width: 600px; height: 600px; background: rgba(255,255,255,0.1); border-radius: 50%;
  }
  .lp-stats-grid {
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(4,1fr); gap: 40px; position: relative; z-index: 1;
  }
  .lp-stat {
    text-align: center; padding: 30px;
    background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
    border-radius: 20px; border: 2px solid rgba(255,255,255,0.2);
    transition: all 0.3s ease;
  }
  .lp-stat:hover { background: rgba(255,255,255,0.15); transform: translateY(-10px) scale(1.05); }
  .lp-stat-num { font-size: 52px; font-weight: 800; color: white; margin-bottom: 8px; display: block; }
  .lp-stat-label { font-size: 14px; color: rgba(255,255,255,0.95); font-weight: 600; }

  /* ── Benefits ── */
  .lp-benefits { padding: 120px 40px; background: white; }
  .lp-benefits-img { width: 100%; max-width: 900px; height: auto; object-fit: contain; display: block; margin: 0 auto 60px; }

  /* ── CTA ── */
  .lp-cta-section { padding: 120px 40px; background: linear-gradient(135deg,#E8F5E9 0%,#F1F8F4 100%); }
  .lp-cta-box {
    max-width: 1100px; margin: 0 auto;
    background: linear-gradient(135deg,#1A4D2E 0%,#2D6A4F 50%,#36C06C 100%);
    padding: 80px 60px; border-radius: 40px;
    display: grid; grid-template-columns: 1.5fr 1fr;
    gap: 60px; align-items: center; position: relative; overflow: hidden;
    box-shadow: 0 30px 80px rgba(26,77,46,0.4);
  }
  .lp-cta-box::before {
    content: ''; position: absolute; top: -50%; right: -20%;
    width: 500px; height: 500px; background: rgba(255,255,255,0.1); border-radius: 50%;
  }
  .lp-cta-content { position: relative; z-index: 1; }
  .lp-cta-content h2 { font-size: 40px; font-weight: 800; color: white; margin-bottom: 20px; line-height: 1.3; }
  .lp-cta-content p { font-size: 17px; color: rgba(255,255,255,0.9); margin-bottom: 40px; line-height: 1.7; }
  .lp-cta-img-wrap { display: flex; align-items: center; justify-content: center; position: relative; z-index: 1; }
  .lp-cta-img { width: 100%; max-width: 380px; height: auto; object-fit: contain; animation: lpFloatSlow 6s ease-in-out infinite; }

  /* ── Footer ── */
  .lp-footer {
    background: linear-gradient(135deg,#0F2818 0%,#1A4D2E 100%);
    color: white; padding: 60px 40px 30px;
  }
  .lp-footer-grid {
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 60px; margin-bottom: 40px;
  }
  .lp-footer-brand h3 {
    font-size: 22px; font-weight: 800; margin-bottom: 16px;
    background: linear-gradient(135deg,#36C06C 0%,#52DE97 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .lp-footer-brand p { font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.8; }
  .lp-footer-col h4 { font-size: 15px; font-weight: 700; margin-bottom: 20px; color: rgba(255,255,255,0.95); }
  .lp-footer-col ul { list-style: none; padding: 0; margin: 0; }
  .lp-footer-col li { margin-bottom: 12px; }
  .lp-footer-col a {
    color: rgba(255,255,255,0.7); text-decoration: none; font-size: 14px;
    transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 6px;
  }
  .lp-footer-col a:hover { color: #36C06C; transform: translateX(5px); }
  .lp-footer-bottom {
    text-align: center; padding-top: 30px;
    border-top: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.6); font-size: 14px;
    max-width: 1200px; margin: 0 auto;
  }

  /* ── Responsive ── */
  @media (max-width: 968px) {
    .lp-nav-links {
      position: fixed; top: 70px; right: -100%; width: 300px;
      height: calc(100vh - 70px); background: white; flex-direction: column;
      padding: 40px; box-shadow: -5px 0 30px rgba(0,0,0,0.1);
      transition: right 0.3s ease; align-items: flex-start; z-index: 999;
    }
    .lp-nav-links.open { right: 0; }
    .lp-mobile-btn { display: block; }
    .lp-hero-container { grid-template-columns: 1fr; }
    .lp-hero-content h1 { font-size: 36px; }
    .lp-hero-img-wrap { display: none; }
    .lp-features-grid { grid-template-columns: 1fr; }
    .lp-step { grid-template-columns: 60px 1fr; }
    .lp-step-num { width: 60px; height: 60px; font-size: 24px; }
    .lp-stats-grid { grid-template-columns: repeat(2,1fr); }
    .lp-cta-box { grid-template-columns: 1fr; padding: 60px 40px; }
    .lp-footer-grid { grid-template-columns: 1fr; gap: 40px; }
    .lp-nav-container { padding: 0 20px; }
    .lp-hero { padding: 120px 20px 60px; }
    .lp-features, .lp-process, .lp-benefits, .lp-cta-section { padding: 80px 20px; }
  }
  @media (max-width: 640px) {
    .lp-hero-content h1 { font-size: 28px; }
    .lp-hero-btns { flex-direction: column; }
    .lp-btn-primary, .lp-btn-secondary { justify-content: center; }
    .lp-section-header h2 { font-size: 28px; }
    .lp-cta-content h2 { font-size: 28px; }
    .lp-stats-grid { grid-template-columns: repeat(2,1fr); gap: 20px; }
    .lp-stat-num { font-size: 38px; }
    .lp-footer { padding: 40px 20px 20px; }
    .lp-cta-section { padding: 60px 20px; }
    .lp-cta-box { padding: 40px 24px; }
  }
`;

/* ─── Features data ────────────────────────────────────────────── */
const features = [
  { icon: 'edit_document', title: 'Pengajuan Digital TOR & RAB', desc: 'Submit proposal lengkap dengan TOR, KAK, dan RAB secara online. Generate file PDF untuk dicetak sebagai hard copy.', gradient: 'linear-gradient(135deg,#1A4D2E 0%,#2D6A4F 100%)' },
  { icon: 'verified', title: 'Tracking Verifikasi', desc: 'Pantau status verifikasi dari Verifikator, Wadir II, hingga PPK secara real-time melalui dashboard.', gradient: 'linear-gradient(135deg,#36C06C 0%,#52DE97 100%)' },
  { icon: 'print', title: 'Generate Hard Copy', desc: 'Download dokumen yang sudah disetujui dalam format PDF siap cetak untuk diserahkan ke pihak terkait.', gradient: 'linear-gradient(135deg,#4FACFE 0%,#00F2FE 100%)' },
  { icon: 'receipt_long', title: 'Upload LPJ Digital', desc: 'Upload bukti pengeluaran dan dokumentasi kegiatan. Sistem akan track deadline 14 hari kerja otomatis.', gradient: 'linear-gradient(135deg,#43E97B 0%,#38F9D7 100%)' },
  { icon: 'notifications_active', title: 'Notifikasi Real-time', desc: 'Terima notifikasi instant untuk setiap perubahan status, revisi, atau persetujuan melalui sistem.', gradient: 'linear-gradient(135deg,#FFB75E 0%,#ED8F03 100%)' },
  { icon: 'folder_shared', title: 'Manajemen Dokumen', desc: 'Semua dokumen proposal dan LPJ tersimpan aman dalam sistem untuk referensi dan audit.', gradient: 'linear-gradient(135deg,#0F766E 0%,#14B8A6 100%)' },
];

/* ─── Steps data ───────────────────────────────────────────────── */
const steps = [
  { gradient: 'linear-gradient(135deg,#1A4D2E 0%,#2D6A4F 100%)', borderColor: '#1A4D2E', title: 'Pengusul → Verifikator', desc: 'Admin himpunan atau jurusan mengajukan proposal kegiatan lengkap dengan TOR, KAK, dan RAB untuk diverifikasi.' },
  { gradient: 'linear-gradient(135deg,#2D6A4F 0%,#36C06C 100%)', borderColor: '#2D6A4F', title: 'Verifikator → PPK', desc: 'Tim verifikator memeriksa kelengkapan dokumen dan kesesuaian anggaran. Setelah disetujui, diteruskan ke PPK.' },
  { gradient: 'linear-gradient(135deg,#36C06C 0%,#52DE97 100%)', borderColor: '#36C06C', title: 'PPK → Wadir II', desc: 'PPK memverifikasi kesesuaian anggaran dan meneruskan ke Wadir II untuk persetujuan kebijakan.' },
  { gradient: 'linear-gradient(135deg,#43E97B 0%,#38F9D7 100%)', borderColor: '#43E97B', title: 'Wadir II → Bendahara', desc: 'Wadir II memverifikasi kesesuaian anggaran dan meneruskan ke bendahara untuk proses pencairan dana kegiatan.' },
  { gradient: 'linear-gradient(135deg,#0F766E 0%,#14B8A6 100%)', borderColor: '#0F766E', title: 'Pencairan & Pelaksanaan', desc: 'Dana dicairkan ke pengusul. Kegiatan dilaksanakan sesuai proposal dengan dokumentasi lengkap.' },
  { gradient: 'linear-gradient(135deg,#14B8A6 0%,#2DD4BF 100%)', borderColor: '#14B8A6', title: 'Pertanggungjawaban LPJ', desc: 'Upload LPJ keuangan maksimal 14 hari kerja pasca kegiatan. Bendahara verifikasi dan proses selesai.' },
];

/* ─── Benefits data (same structure as features) ─────────────── */
const benefits = [
  { icon: 'speed', title: 'Proses Lebih Efisien', desc: 'Pengajuan hingga approval 40% lebih cepat dengan routing otomatis dan tracking status real-time.', gradient: 'linear-gradient(135deg,#1A4D2E 0%,#2D6A4F 100%)' },
  { icon: 'visibility', title: 'Transparansi Penuh', desc: 'Lacak posisi dokumen dari pengajuan hingga penyerahan hard copy ke bendahara dengan jelas.', gradient: 'linear-gradient(135deg,#36C06C 0%,#52DE97 100%)' },
  { icon: 'description', title: 'Digital + Hard Copy', desc: 'Kelola dokumen digital dalam sistem, download PDF untuk cetak hard copy sesuai kebutuhan.', gradient: 'linear-gradient(135deg,#4FACFE 0%,#00F2FE 100%)' },
  { icon: 'security', title: 'Akses Terkelola', desc: 'Hanya Admin Jurusan dan Himpunan yang dapat mengakses sistem untuk menjaga keamanan data.', gradient: 'linear-gradient(135deg,#43E97B 0%,#38F9D7 100%)' },
  { icon: 'fact_check', title: 'Audit Trail Lengkap', desc: 'Riwayat lengkap setiap perubahan status tercatat otomatis untuk keperluan audit dan transparansi.', gradient: 'linear-gradient(135deg,#FFB75E 0%,#ED8F03 100%)' },
  { icon: 'cloud_done', title: 'Akses Kapan Saja', desc: 'Sistem tersedia 24/7 dapat diakses dari mana saja menggunakan browser tanpa instalasi apapun.', gradient: 'linear-gradient(135deg,#0F766E 0%,#14B8A6 100%)' },
];

/* ─── Component ────────────────────────────────────────────────── */
export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const styleInjected = useRef(false);

  /* inject CSS once */
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement('style');
    el.setAttribute('data-lp', 'true');
    el.textContent = LANDING_CSS;
    document.head.appendChild(el);
    return () => { el.remove(); styleInjected.current = false; };
  }, []);

  /* scroll detection */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const smoothScroll = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="lp-body">
      {/* ── Navbar ───────────────────────────────────────────── */}
      <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="lp-nav-container">
          <a href="#home" className="lp-logo" onClick={e => { e.preventDefault(); smoothScroll('home'); }}>
            <img src="/assets/images/logo-pnj.png" alt="Logo PNJ" style={{ height: '50px', width: 'auto' }} />
            Si-Latorjana
          </a>

          <div className={`lp-nav-links${menuOpen ? ' open' : ''}`}>
            {[
              { label: 'Home', icon: 'home', id: 'home' },
              { label: 'Fitur', icon: 'stars', id: 'fitur' },
              { label: 'Alur Kerja', icon: 'timeline', id: 'proses' },
              { label: 'Manfaat', icon: 'trending_up', id: 'manfaat' },
            ].map(item => (
              <a key={item.id} href={`#${item.id}`} onClick={e => { e.preventDefault(); smoothScroll(item.id); }}>
                <span className="material-icons" style={{ fontSize: 18 }}>{item.icon}</span>
                {item.label}
              </a>
            ))}
            <Link to="/login" className="lp-cta-btn" onClick={() => setMenuOpen(false)}>Login</Link>
          </div>

          <button className="lp-mobile-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span className="material-icons">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="lp-hero" id="home">
        <div className="lp-particles">
          {[...Array(6)].map((_, i) => <div key={i} className="lp-particle" />)}
        </div>

        <div className="lp-hero-container">
          <div className="lp-hero-content">
            <h1>
              Sistem Pengelolaan Kegiatan{' '}
              <span className="lp-highlight">Digital &amp; Terintegrasi</span>
            </h1>
            <p>
              Platform khusus untuk Admin Jurusan dan Himpunan dalam mengajukan, memverifikasi,
              dan mempertanggungjawabkan kegiatan kampus. Dari pengajuan proposal hingga
              penyerahan hard copy ke bendahara, semua terkelola dalam satu sistem.
            </p>
            <div className="lp-hero-btns">
              <Link to="/login" className="lp-btn-primary">
                <span className="material-icons" style={{ fontSize: 20 }}>rocket_launch</span>
                Mulai Pengajuan
              </Link>
              <a href="#proses" className="lp-btn-secondary" onClick={e => { e.preventDefault(); smoothScroll('proses'); }}>
                <span className="material-icons" style={{ fontSize: 20 }}>menu_book</span>
                Lihat Panduan
              </a>
            </div>
          </div>

          <div className="lp-hero-img-wrap">
            <img
              src="/assets/images/landing1.png"
              alt="Ilustrasi Hero Si-Latorjana"
              className="lp-hero-img"
            />
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="lp-features" id="fitur">
        <div className="lp-section-header">
          <div className="lp-badge">
            <span className="material-icons" style={{ fontSize: 16 }}>star</span>
            Fitur Unggulan
          </div>
          <h2>Semua Yang Anda Butuhkan Dalam Satu Platform</h2>
          <p>Solusi lengkap untuk mengelola seluruh siklus kegiatan kampus dengan mudah dan transparan</p>
        </div>

        <div className="lp-features-grid">
          {features.map((f, i) => (
            <div key={i} className="lp-card">
              <div className="lp-icon" style={{ background: f.gradient }}>
                <span className="material-icons">{f.icon}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Process ──────────────────────────────────────────── */}
      <section className="lp-process" id="proses">
        <div className="lp-process-container">
          <div className="lp-section-header">
            <div className="lp-badge">
              <span className="material-icons" style={{ fontSize: 16 }}>timeline</span>
              Alur Kerja
            </div>
            <h2>Proses Pengajuan Yang Sistematis</h2>
            <p>Dari proposal hingga pertanggungjawaban, semua terstruktur dan terlacak</p>
          </div>

          <img
            src="/assets/images/landing3.png"
            alt="Ilustrasi Alur Workflow Si-Latorjana"
            className="lp-process-img"
          />

          <div className="lp-steps">
            {steps.map((s, i) => (
              <div key={i} className="lp-step">
                <div className="lp-step-num" style={{ background: s.gradient }}>
                  {i + 1}
                </div>
                <div className="lp-step-content" style={{ borderLeftColor: s.borderColor }}>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="lp-stats">
        <div className="lp-stats-grid">
          {[
            { num: '500+', label: 'Kegiatan Terkelola' },
            { num: '50+', label: 'Himpunan & Jurusan' },
            { num: '98%', label: 'Tingkat Kepuasan' },
            { num: '24/7', label: 'Akses Sistem' },
          ].map((s, i) => (
            <div key={i} className="lp-stat">
              <span className="lp-stat-num">{s.num}</span>
              <span className="lp-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Benefits ─────────────────────────────────────────── */}
      <section className="lp-benefits" id="manfaat">
        <div className="lp-section-header">
          <div className="lp-badge">
            <span className="material-icons" style={{ fontSize: 16 }}>trending_up</span>
            Manfaat
          </div>
          <h2>Mengapa Memilih Si-Latorjana?</h2>
          <p>Efisiensi dan transparansi dalam setiap tahapan proses</p>
        </div>

        <img
          src="/assets/images/landing4.png"
          alt="Ilustrasi Manfaat Si-Latorjana"
          className="lp-benefits-img"
        />

        <div className="lp-features-grid">
          {benefits.map((b, i) => (
            <div key={i} className="lp-card">
              <div className="lp-icon" style={{ background: b.gradient }}>
                <span className="material-icons">{b.icon}</span>
              </div>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="lp-cta-section">
        <div className="lp-cta-box">
          <div className="lp-cta-content">
            <h2>Siap Mulai Pengelolaan Kegiatan Digital?</h2>
            <p>
              Login menggunakan akun institusi Anda untuk mengakses panel Si-Latorjana
              dan mulai mengajukan kegiatan secara terstruktur dan transparan.
            </p>
            <Link to="/login" className="lp-btn-primary">
              <span className="material-icons" style={{ fontSize: 20 }}>login</span>
              Akses Dashboard
            </Link>
          </div>

          <div className="lp-cta-img-wrap">
            <img
              src="/assets/images/landing2.png"
              alt="Ilustrasi CTA Si-Latorjana"
              className="lp-cta-img"
            />
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <h3>Si-Latorjana</h3>
            <p>
              Sistem Layanan Terpadu Administrasi Pengajuan Kegiatan Jurusan & Himpunan
              Politeknik Negeri Jakarta.
            </p>
          </div>

          <div className="lp-footer-col">
            <h4>Navigasi</h4>
            <ul>
              {[
                { label: 'Home', id: 'home' },
                { label: 'Fitur', id: 'fitur' },
                { label: 'Alur Kerja', id: 'proses' },
                { label: 'Manfaat', id: 'manfaat' },
              ].map(item => (
                <li key={item.id}>
                  <a href={`#${item.id}`} onClick={e => { e.preventDefault(); smoothScroll(item.id); }}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lp-footer-col">
            <h4>Sistem</h4>
            <ul>
              <li><Link to="/login" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14, transition: 'color 0.3s' }}>Login</Link></li>
              <li><Link to="/forgot-password" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14, transition: 'color 0.3s' }}>Lupa Password</Link></li>
            </ul>
          </div>

          <div className="lp-footer-col">
            <h4>Institusi</h4>
            <ul>
              <li><a href="https://www.pnj.ac.id" target="_blank" rel="noopener noreferrer">PNJ Official</a></li>
              <li><a href="#">Kebijakan Privasi</a></li>
              <li><a href="#">Panduan Pengguna</a></li>
            </ul>
          </div>
        </div>

        <div className="lp-footer-bottom">
          © {new Date().getFullYear()} Politeknik Negeri Jakarta — Si-Latorjana. Hak Cipta Dilindungi.
        </div>
      </footer>
    </div>
  );
}
