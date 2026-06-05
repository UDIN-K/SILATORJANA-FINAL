import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { LandingPage } from './pages/LandingPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { UserFormPage } from './pages/admin/UserFormPage';
import { UserDetailPage } from './pages/admin/UserDetailPage';
import { IkuConfigPage } from './pages/admin/IkuConfigPage';
import { AdminMonitoringPage } from './pages/admin/AdminMonitoringPage';
import { RoleLayout } from './layouts/RoleLayout';
import { DashboardIndex } from './pages/dashboard/DashboardIndex';
import { GenericDashboard } from './pages/dashboard/GenericDashboard';
import { PengusulDashboard } from './pages/pengusul/PengusulDashboard';
import { UsulanPage } from './pages/pengusul/UsulanPage';
import { CreateUsulanPage } from './pages/pengusul/CreateUsulanPage';
import { DetailUsulanPage } from './pages/pengusul/DetailUsulanPage';
import { LpjPage } from './pages/pengusul/LpjPage';
import { PengusulMonitoringPage } from './pages/pengusul/PengusulMonitoringPage';
import { HistoryPage } from './pages/pengusul/HistoryPage';
import { HistoryDetailPage } from './pages/pengusul/HistoryDetailPage';
import { NeedsWorkPage } from './pages/pengusul/NeedsWorkPage';
import { PrintProposalPage } from './pages/pengusul/PrintProposalPage';
import { EditRevisiPage } from './pages/pengusul/EditRevisiPage';
import { PanduanPage } from './pages/pengusul/PanduanPage';
import { TemplatePage } from './pages/pengusul/TemplatePage';
import { VerifikatorDashboard } from './pages/verifikator/VerifikatorDashboard';
import { VerifikasiDetailPage } from './pages/verifikator/VerifikasiDetailPage';
import { VerifikatorProposalList } from './pages/verifikator/VerifikatorProposalList';
import { VerifikatorMonitoringPage } from './pages/verifikator/VerifikatorMonitoringPage';
import { RevisiFormPage } from './pages/verifikator/RevisiFormPage';
import { VerifikatorArchivePage, PpkArchivePage, WadirArchivePage } from './pages/shared/ArchivePage';
import { PpkDashboard } from './pages/ppk/PpkDashboard';
import { PpkProposalList } from './pages/ppk/PpkProposalList';
import { PpkMonitoringPage } from './pages/ppk/PpkMonitoringPage';
import { WadirDashboard } from './pages/wadir/WadirDashboard';
import { WadirProposalList } from './pages/wadir/WadirProposalList';
import { WadirMonitoringPage } from './pages/wadir/WadirMonitoringPage';
import { ReviewApprovalPage } from './pages/shared/ReviewApprovalPage';
import { BendaharaDashboard } from './pages/bendahara/BendaharaDashboard';
import { BendaharaProposalList } from './pages/bendahara/BendaharaProposalList';
import { BendaharaDetailPage } from './pages/bendahara/BendaharaDetailPage';
import { BendaharaMonitoringPage } from './pages/bendahara/BendaharaMonitoringPage';
import { PencairanPage } from './pages/bendahara/PencairanPage';
import { LpjVerificationPage } from './pages/bendahara/LpjVerificationPage';
import { RektoratDashboard } from './pages/rektorat/RektoratDashboard';
import { RektoratLaporanPage } from './pages/rektorat/RektoratLaporanPage';
import { RektoratMonitoringPage } from './pages/rektorat/RektoratMonitoringPage';
import { RektoratDetailPage } from './pages/rektorat/RektoratDetailPage';
import { RekapJurusanPage } from './pages/rektorat/RekapJurusanPage';
import { RektoratTimelinePage } from './pages/rektorat/RektoratTimelinePage';
import { ProfilePage } from './pages/shared/ProfilePage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<RoleLayout />}>
          <Route index element={<DashboardIndex />} />

          {/* ====== ADMIN ====== */}
          <Route path="admin">
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="users/tambah" element={<UserFormPage />} />
            <Route path="users/edit/:id" element={<UserFormPage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="master" element={<IkuConfigPage />} />
            <Route path="monitoring" element={<AdminMonitoringPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* ====== PENGUSUL ====== */}
          <Route path="pengusul">
            <Route index element={<PengusulDashboard />} />
            <Route path="usulan" element={<UsulanPage />} />
            <Route path="usulan/baru" element={<CreateUsulanPage />} />
            <Route path="usulan/edit/:id" element={<CreateUsulanPage />} />
            <Route path="usulan/:id" element={<DetailUsulanPage />} />
            <Route path="lpj/:id" element={<LpjPage />} />
            <Route path="needs-work" element={<NeedsWorkPage />} />
            <Route path="revisi/:id" element={<EditRevisiPage />} />
            <Route path="print/:id" element={<PrintProposalPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="history/:id" element={<HistoryDetailPage />} />
            <Route path="monitoring" element={<PengusulMonitoringPage />} />
            <Route path="panduan" element={<PanduanPage />} />
            <Route path="template" element={<TemplatePage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* ====== VERIFIKATOR ====== */}
          <Route path="verifikator">
            <Route index element={<VerifikatorDashboard />} />
            <Route path="proposals" element={<VerifikatorProposalList />} />
            <Route path="usulan/:id" element={<VerifikasiDetailPage />} />
            <Route path="revisi/:id" element={<RevisiFormPage />} />
            <Route path="monitoring" element={<VerifikatorMonitoringPage />} />
            <Route path="archive" element={<VerifikatorArchivePage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* ====== PPK ====== */}
          <Route path="ppk">
            <Route index element={<PpkDashboard />} />
            <Route path="proposals" element={<PpkProposalList />} />
            <Route path="review/:id" element={<ReviewApprovalPage role="ppk" approveStatus="approved_ppk" backPath="/dashboard/ppk" />} />
            <Route path="monitoring" element={<PpkMonitoringPage />} />
            <Route path="archive" element={<PpkArchivePage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* ====== WADIR ====== */}
          <Route path="wadir2">
            <Route index element={<WadirDashboard />} />
            <Route path="proposals" element={<WadirProposalList />} />
            <Route path="review/:id" element={<ReviewApprovalPage role="wadir2" approveStatus="approved_wadir" backPath="/dashboard/wadir2" />} />
            <Route path="monitoring" element={<WadirMonitoringPage />} />
            <Route path="archive" element={<WadirArchivePage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* ====== BENDAHARA ====== */}
          <Route path="bendahara">
            <Route index element={<BendaharaDashboard />} />
            <Route path="proposals" element={<BendaharaProposalList />} />
            <Route path="detail/:id" element={<BendaharaDetailPage />} />
            <Route path="pencairan/:id" element={<PencairanPage />} />
            <Route path="lpj/:id" element={<LpjVerificationPage />} />
            <Route path="monitoring" element={<BendaharaMonitoringPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* ====== REKTORAT ====== */}
          <Route path="rektorat">
            <Route index element={<RektoratDashboard />} />
            <Route path="laporan" element={<RektoratLaporanPage />} />
            <Route path="rekap-jurusan" element={<RekapJurusanPage />} />
            <Route path="detail/:id" element={<RektoratDetailPage />} />
            <Route path="timeline/:id" element={<RektoratTimelinePage />} />
            <Route path="monitoring" element={<RektoratMonitoringPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

        </Route>
      </Routes>
    </Router>
  );
}
