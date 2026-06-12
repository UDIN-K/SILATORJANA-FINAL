import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../core/widgets/app_logo.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../auth/models/user.dart';
import '../../auth/viewmodels/auth_viewmodel.dart';
import '../../auth/views/login_view.dart';
import '../../auth/views/logout_transition_view.dart';

import 'home_tab_view.dart';
import 'kegiatan_list_view.dart';
import 'kegiatan_archive_view.dart';
import 'kegiatan_history_view.dart';
import '../../chat/views/jana_chat_view.dart';
import '../../profile/views/profile_view.dart';
import '../../monitoring/views/monitoring_dashboard_view.dart';
import '../../monitoring/views/rekap_jurusan_view.dart';
import '../../lpj/views/lpj_list_view.dart';
import '../../user_management/views/user_list_view.dart';
import '../../user_management/views/biometric_management_view.dart';
import '../../master_data/views/iku_config_view.dart';
import '../../documents/views/panduan_view.dart';
import '../../documents/views/template_view.dart';
import '../../lpj/views/bendahara_laporan_view.dart';
import '../../lpj/views/bendahara_dashboard_view.dart';
import '../../monitoring/views/rektorat_laporan_view.dart';
import 'needs_work_view.dart';

/// Role-adaptive dashboard that mirrors the web's RoleLayout.tsx pixel-perfectly.
/// Mobile (< 768px): Custom horizontally-scrollable bottom navbar + translucent top bar.
/// Desktop (>= 768px): Collapsible emerald sidebar + translucent top navbar (72px).
class DashboardView extends StatefulWidget {
  final User user;
  const DashboardView({super.key, required this.user});

  @override
  State<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<DashboardView> with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  bool _sidebarCollapsed = false;

  late final List<_NavItem> _allItems;
  late final List<Widget> _allPages;

  // ──────────────────────── Design Tokens (from web CSS) ────────────────────
  static const _sidebarBg = Color(0xFF064E3B);
  static const _sidebarBorder = Color(0x80065F46);
  static const _sidebarActiveBg = Color(0xCC065F46);
  static const _sidebarActiveBorder = Color(0x80047857);
  static const _sidebarHoverBg = Color(0x66065F46);
  static const _emerald400 = Color(0xFF34D399);
  static const _emerald40060 = Color(0x9934D399);
  static const _emerald10070 = Color(0xB3ECFDF5);
  static const _emerald50 = Color(0xFFECFDF5);
  static const _emerald200_70 = Color(0xB3A7F3D0);
  static const _navbarBg = Color(0xCCFFFFFF);
  static const _navbarBorder = Color(0x99E2E8F0);
  static const _slate100_80 = Color(0xCCF1F5F9);
  static const _slate200_50 = Color(0x80E2E8F0);
  static const _slate800 = Color(0xFF1E293B);
  static const _slate500 = Color(0xFF64748B);
  static const _emerald700 = Color(0xFF047857);
  static const _emerald800 = Color(0xFF065F46);
  static const _emerald950_50 = Color(0x80022C22);
  static const _emerald100 = Color(0xFFD1FAE5);
  static const _emerald600 = Color(0xFF059669);

  static const _roleLabels = {
    'admin': 'Super Admin',
    'pengusul': 'Pengusul',
    'verifikator': 'Verifikator',
    'ppk': 'PPK',
    'wadir1': 'Wadir I',
    'wadir2': 'Wadir II',
    'wadir3': 'Wadir III',
    'wadir4': 'Wadir IV',
    'bendahara': 'Bendahara',
    'rektorat': 'Rektorat',
  };

  static String _getRoleLabel(User user) {
    if (user.role == 'verifikator') {
      switch (user.verifikatorUnit) {
        case 'wadir1': return 'Verifikator Wadir I';
        case 'wadir2': return 'Verifikator Wadir II';
        case 'wadir3': return 'Verifikator Wadir III';
        case 'wadir4': return 'Verifikator Wadir IV';
        default: return 'Verifikator';
      }
    }
    return _roleLabels[user.role] ?? user.role.toUpperCase();
  }

  late final AnimationController _entryController;
  late final Animation<Offset> _sidebarSlide;
  late final Animation<Offset> _navbarSlide;
  late final Animation<Offset> _contentSlide;
  late final Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _allItems = _getNavItemsForRole(widget.user.role);
    _allPages = _allItems.map((item) => item.page).toList();

    _entryController = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _fade = CurvedAnimation(parent: _entryController, curve: Curves.easeInCubic);
    
    _sidebarSlide = Tween<Offset>(begin: const Offset(-0.2, 0), end: Offset.zero).animate(
      CurvedAnimation(parent: _entryController, curve: const Interval(0.0, 0.7, curve: Curves.easeOutQuint))
    );
    
    _navbarSlide = Tween<Offset>(begin: const Offset(0, -0.5), end: Offset.zero).animate(
      CurvedAnimation(parent: _entryController, curve: const Interval(0.1, 0.8, curve: Curves.easeOutQuint))
    );
    
    _contentSlide = Tween<Offset>(begin: const Offset(0, 0.05), end: Offset.zero).animate(
      CurvedAnimation(parent: _entryController, curve: const Interval(0.2, 1.0, curve: Curves.easeOutQuint))
    );

    _entryController.forward();
  }

  @override
  void dispose() {
    _entryController.dispose();
    super.dispose();
  }

  /// Mirrors web's ROLE_MENUS exactly
  List<_NavItem> _getNavItemsForRole(String role) {
    final normalizedRole = role.startsWith('wadir') ? 'wadir' : role;

    switch (normalizedRole) {
      case 'pengusul':
        return [
          _NavItem(icon: LucideIcons.home, label: 'Dashboard', page: HomeTabView(user: widget.user)),
          _NavItem(icon: LucideIcons.fileText, label: 'Usulan Saya', page: KegiatanListView(currentUser: widget.user)),
          _NavItem(icon: LucideIcons.activity, label: 'Monitoring', page: const MonitoringDashboardView()),
          _NavItem(icon: LucideIcons.alertTriangle, label: 'Perlu Revisi', page: NeedsWorkView(currentUser: widget.user)),
          _NavItem(icon: LucideIcons.dollarSign, label: 'LPJ & Realisasi', page: LpjListView(currentUser: widget.user)),
          _NavItem(icon: LucideIcons.archive, label: 'Riwayat', page: const KegiatanHistoryView()),
          _NavItem(icon: LucideIcons.settings, label: 'Panduan', page: const PanduanView()),
          _NavItem(icon: LucideIcons.fileText, label: 'Template', page: const TemplateView()),
        ];
      case 'verifikator':
        return [
          _NavItem(icon: LucideIcons.home, label: 'Dashboard', page: HomeTabView(user: widget.user)),
          _NavItem(icon: LucideIcons.clipboardList, label: 'Proposal', page: KegiatanListView(currentUser: widget.user)),
          _NavItem(icon: LucideIcons.archive, label: 'Arsip', page: const KegiatanArchiveView()),
          _NavItem(icon: LucideIcons.activity, label: 'Monitoring', page: const MonitoringDashboardView()),
        ];
      case 'ppk':
        return [
          _NavItem(icon: LucideIcons.home, label: 'Dashboard', page: HomeTabView(user: widget.user)),
          _NavItem(icon: LucideIcons.clipboardList, label: 'Proposal', page: KegiatanListView(currentUser: widget.user)),
          _NavItem(icon: LucideIcons.archive, label: 'Arsip', page: const KegiatanArchiveView()),
          _NavItem(icon: LucideIcons.activity, label: 'Monitoring', page: const MonitoringDashboardView()),
        ];
      case 'wadir':
        return [
          _NavItem(icon: LucideIcons.home, label: 'Dashboard', page: HomeTabView(user: widget.user)),
          _NavItem(icon: LucideIcons.clipboardList, label: 'Proposal', page: KegiatanListView(currentUser: widget.user)),
          _NavItem(icon: LucideIcons.archive, label: 'Arsip', page: const KegiatanArchiveView()),
          _NavItem(icon: LucideIcons.activity, label: 'Monitoring', page: const MonitoringDashboardView()),
        ];
      case 'bendahara':
        return [
          _NavItem(icon: LucideIcons.home, label: 'Dashboard', page: BendaharaDashboardView(user: widget.user)),
          _NavItem(icon: LucideIcons.dollarSign, label: 'Pencairan & LPJ', page: LpjListView(currentUser: widget.user)),
          _NavItem(icon: LucideIcons.checkCircle, label: 'Laporan LPJ', page: const BendaharaLaporanView()),
          _NavItem(icon: LucideIcons.activity, label: 'Monitoring', page: const MonitoringDashboardView()),
        ];
      case 'rektorat':
        return [
          _NavItem(icon: LucideIcons.home, label: 'Dashboard', page: HomeTabView(user: widget.user)),
          _NavItem(icon: LucideIcons.barChart3, label: 'Laporan', page: const RektoratLaporanView()),
          _NavItem(icon: LucideIcons.building2, label: 'Rekap Jurusan', page: const RekapJurusanView()),
          _NavItem(icon: LucideIcons.activity, label: 'Monitoring', page: const MonitoringDashboardView()),
        ];
      case 'admin':
        return [
          _NavItem(icon: LucideIcons.home, label: 'Dashboard', page: HomeTabView(user: widget.user)),
          _NavItem(icon: LucideIcons.users, label: 'Users', page: const UserListView()),
          _NavItem(icon: LucideIcons.fingerprint, label: 'Biometrik', page: const BiometricManagementView()),
          _NavItem(icon: LucideIcons.database, label: 'Config', page: const IkuConfigView()),
          _NavItem(icon: LucideIcons.activity, label: 'Monitoring', page: const MonitoringDashboardView()),
        ];
      default:
        return [
          _NavItem(icon: LucideIcons.home, label: 'Dashboard', page: HomeTabView(user: widget.user)),
          _NavItem(icon: LucideIcons.fileText, label: 'Usulan', page: KegiatanListView(currentUser: widget.user)),
        ];
    }
  }

  void _logout() async {
    await context.read<AuthViewModel>().logout();
    if (mounted) {
      Navigator.of(context).push(
        PageRouteBuilder(
          opaque: false,
          pageBuilder: (context, _, __) => const LogoutTransitionView(),
        ),
      );
    }
  }

  void _showCalendarDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _emerald50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(LucideIcons.calendar, color: _emerald700, size: 20),
              ),
              const SizedBox(width: 12),
              const Text('Kalender Kegiatan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: _slate800)),
            ],
          ),
          content: SizedBox(
            width: 300,
            height: 320,
            child: Theme(
              data: Theme.of(context).copyWith(
                colorScheme: const ColorScheme.light(
                  primary: _emerald700,
                  onPrimary: Colors.white,
                  onSurface: _slate800,
                ),
              ),
              child: CalendarDatePicker(
                initialDate: DateTime.now(),
                firstDate: DateTime(2020),
                lastDate: DateTime(2030),
                onDateChanged: (date) {},
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Tutup', style: TextStyle(fontWeight: FontWeight.bold, color: _emerald700)),
            ),
          ],
        );
      },
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  BUILD
  // ══════════════════════════════════════════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final isDesktop = width >= 768;

    if (isDesktop) {
      final sidebarWidth = _sidebarCollapsed ? 96.0 : 256.0;
      return Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        body: Stack(
          children: [
            AnimatedPadding(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              padding: EdgeInsets.only(left: sidebarWidth),
              child: Column(
                children: [
                  SlideTransition(
                    position: _navbarSlide,
                    child: FadeTransition(
                      opacity: _fade,
                      child: _buildTopNavbar()
                    )
                  ),
                  Expanded(
                    child: SlideTransition(
                      position: _contentSlide,
                      child: FadeTransition(
                        opacity: _fade,
                        child: IndexedStack(
                          index: _currentIndex < _allPages.length ? _currentIndex : 0,
                          children: _allPages,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            AnimatedPositioned(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              left: 0, top: 0, bottom: 0,
              width: sidebarWidth,
              child: SlideTransition(
                position: _sidebarSlide,
                child: FadeTransition(
                  opacity: _fade,
                  child: Drawer(
                    child: _buildSidebar(),
                  ),
                )
              ),
            ),
            AnimatedPositioned(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              left: sidebarWidth - 12,
              top: MediaQuery.of(context).size.height / 2 - 12,
              child: _buildCollapseButton(),
            ),
          ],
        ),
      );
    }

    // ─────────────── Mobile Layout ───────────────
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Column(
        children: [
          SlideTransition(
            position: _navbarSlide,
            child: FadeTransition(
              opacity: _fade,
              child: _buildMobileTopNavbar()
            )
          ),
          Expanded(
            child: SlideTransition(
              position: _contentSlide,
              child: FadeTransition(
                opacity: _fade,
                child: IndexedStack(
                  index: _currentIndex < _allPages.length ? _currentIndex : 0,
                  children: _allPages,
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildMobileBottomNavbar(),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SIDEBAR (Desktop) — web: aside.hidden.md:flex, bg-[#064e3b]
  // ══════════════════════════════════════════════════════════════════════════

  Widget _buildSidebar() {
    final activeRoleLabel = _getRoleLabel(widget.user);

    return Container(
      decoration: const BoxDecoration(
        color: _sidebarBg,
        border: Border(right: BorderSide(color: _sidebarBg)),
        boxShadow: [
          BoxShadow(color: Color(0x40000000), blurRadius: 24, offset: Offset(4, 0)),
        ],
      ),
      child: Column(
        children: [
          // ── Brand Header (centered, vertical — matches web SidebarContent) ──
          Container(
            padding: EdgeInsets.only(
              top: 32, bottom: 24,
              left: _sidebarCollapsed ? 8 : 24,
              right: _sidebarCollapsed ? 8 : 24,
            ),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: _sidebarBorder)),
            ),
            child: Column(
              children: [
                AppLogo(size: _sidebarCollapsed ? 32 : 32),
                if (!_sidebarCollapsed) ...[
                  const SizedBox(height: 12),
                  const Text(
                    'Si-LATORJANA',
                    style: TextStyle(color: Color(0xFFF0FDF4), fontWeight: FontWeight.bold, fontSize: 15, letterSpacing: 0.5),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    activeRoleLabel.toUpperCase(),
                    style: const TextStyle(color: _emerald400, fontWeight: FontWeight.bold, fontSize: 9, letterSpacing: 2.0),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 8),

          // ── Menu Items (rounded-xl, active bar LEFT) ──
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.symmetric(horizontal: _sidebarCollapsed ? 12 : 16),
              itemCount: _allItems.length,
              itemBuilder: (context, index) {
                final item = _allItems[index];
                final isActive = _currentIndex == index;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => setState(() => _currentIndex = index),
                      borderRadius: BorderRadius.circular(12),
                      hoverColor: _sidebarHoverBg,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: EdgeInsets.symmetric(horizontal: _sidebarCollapsed ? 0 : 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: isActive ? _sidebarActiveBg : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                          border: isActive ? Border.all(color: _sidebarActiveBorder) : null,
                          boxShadow: isActive ? const [BoxShadow(color: Color(0x33064E3B), blurRadius: 8, offset: Offset(0, 2))] : null,
                        ),
                        child: Stack(
                          children: [
                            if (isActive)
                              Positioned(
                                left: 0, top: 0, bottom: 0,
                                child: Container(
                                  width: 3,
                                  decoration: const BoxDecoration(
                                    color: _emerald400,
                                    borderRadius: BorderRadius.only(
                                      topRight: Radius.circular(99),
                                      bottomRight: Radius.circular(99),
                                    ),
                                  ),
                                ),
                              ),
                            Row(
                              mainAxisAlignment: _sidebarCollapsed ? MainAxisAlignment.center : MainAxisAlignment.start,
                              children: [
                                if (!_sidebarCollapsed) const SizedBox(width: 8),
                                Icon(item.icon, color: isActive ? _emerald400 : _emerald40060, size: 20),
                                if (!_sidebarCollapsed) ...[
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      item.label,
                                      style: TextStyle(
                                        color: isActive ? Colors.white : _emerald10070,
                                        fontSize: 14, fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                                        letterSpacing: -0.2,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // ── Logout ──
          Container(
            padding: EdgeInsets.symmetric(vertical: 24, horizontal: _sidebarCollapsed ? 12 : 16),
            decoration: const BoxDecoration(
              color: _emerald950_50,
              border: Border(top: BorderSide(color: _sidebarBorder)),
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: _logout,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: EdgeInsets.symmetric(horizontal: _sidebarCollapsed ? 0 : 16, vertical: 12),
                  child: Row(
                    mainAxisAlignment: _sidebarCollapsed ? MainAxisAlignment.center : MainAxisAlignment.start,
                    children: [
                      const Icon(LucideIcons.logOut, color: _emerald200_70, size: 20),
                      if (!_sidebarCollapsed) ...[
                        const SizedBox(width: 12),
                        const Text('Keluar Sistem', style: TextStyle(color: _emerald200_70, fontSize: 14, fontWeight: FontWeight.w500)),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCollapseButton() {
    return GestureDetector(
      onTap: () => setState(() => _sidebarCollapsed = !_sidebarCollapsed),
      child: Container(
        width: 24, height: 24,
        decoration: BoxDecoration(
          color: Colors.white, shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: const [BoxShadow(color: Color(0x1A000000), blurRadius: 4, offset: Offset(0, 1))],
        ),
        child: Center(
          child: Icon(_sidebarCollapsed ? LucideIcons.chevronRight : LucideIcons.chevronLeft, size: 14, color: _slate500),
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  TOP NAVBAR (Desktop) — web: h-[72px], bg-white/80, backdrop-blur-md
  // ══════════════════════════════════════════════════════════════════════════

  Widget _buildTopNavbar() {
    final activeRoleLabel = _getRoleLabel(widget.user);
    final janaIndex = _allItems.indexWhere((item) => item.page is JanaChatView);
    final panduanIndex = _allItems.indexWhere((item) => item.page is PanduanView);
    final profileIndex = _allItems.indexWhere((item) => item.page is ProfileView);

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          height: 72,
          decoration: const BoxDecoration(
            color: _navbarBg,
            border: Border(bottom: BorderSide(color: _navbarBorder)),
            boxShadow: [BoxShadow(color: Color(0x0D000000), blurRadius: 4, offset: Offset(0, 1))],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: _slate100_80, borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: _slate200_50),
                ),
                child: Text('Panel $activeRoleLabel',
                    style: const TextStyle(color: _slate800, fontWeight: FontWeight.bold, fontSize: 15, letterSpacing: -0.2)),
              ),
              const Spacer(),
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => _showCalendarDialog(context),
                  borderRadius: BorderRadius.circular(8),
                  child: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    child: Row(
                      children: [
                        Icon(LucideIcons.calendar, size: 16, color: _slate500),
                        SizedBox(width: 6),
                        Text('Tahun Ajaran 2025/2026', style: TextStyle(fontSize: 12, color: _slate500, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              _buildNavbarIconBtn(LucideIcons.bot, 'Jana AI', _emerald700, () {
                if (janaIndex >= 0) setState(() => _currentIndex = janaIndex);
                else Navigator.push(context, MaterialPageRoute(builder: (_) => const JanaChatView()));
              }),
              const SizedBox(width: 4),
              _buildNavbarIconBtn(LucideIcons.helpCircle, 'Panduan', _slate500, () {
                if (panduanIndex >= 0) setState(() => _currentIndex = panduanIndex);
                else Navigator.push(context, MaterialPageRoute(builder: (_) => const PanduanView()));
              }),
              const SizedBox(width: 4),
              _buildNotifBtn(),
              const SizedBox(width: 12),
              Container(width: 1, height: 24, color: const Color(0xFFE2E8F0)),
              const SizedBox(width: 12),
              _buildProfileBtn(activeRoleLabel, profileIndex),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavbarIconBtn(IconData icon, String tip, Color color, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap, borderRadius: BorderRadius.circular(12),
        child: Tooltip(
          message: tip,
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white, borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0x99E2E8F0)),
              boxShadow: const [BoxShadow(color: Color(0x0D000000), blurRadius: 2)],
            ),
            child: Icon(icon, size: 18, color: color),
          ),
        ),
      ),
    );
  }

  Widget _buildNotifBtn() {
    return PopupMenuButton<String>(
      tooltip: 'Notifikasi', offset: const Offset(0, 50),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0x99E2E8F0)),
          boxShadow: const [BoxShadow(color: Color(0x0D000000), blurRadius: 2)],
        ),
        child: const Icon(LucideIcons.bell, size: 18, color: _slate500),
      ),
      itemBuilder: (_) => [
        const PopupMenuItem(enabled: false, child: Text('Notifikasi Terbaru', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13))),
        const PopupMenuDivider(),
        const PopupMenuItem(child: Row(children: [Icon(LucideIcons.checkCircle, color: _emerald700, size: 16), SizedBox(width: 8), Expanded(child: Text('LPJ kegiatan #10 telah disetujui', style: TextStyle(fontSize: 12)))])),
        const PopupMenuItem(child: Row(children: [Icon(LucideIcons.alertTriangle, color: Colors.orange, size: 16), SizedBox(width: 8), Expanded(child: Text('Ada 1 usulan perlu revisi', style: TextStyle(fontSize: 12)))])),
      ],
    );
  }

  Widget _buildProfileBtn(String roleLabel, int profileIndex) {
    return PopupMenuButton<String>(
      onSelected: (val) {
        if (val == 'profile' && profileIndex >= 0) setState(() => _currentIndex = profileIndex);
        else if (val == 'profile') Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileView(user: widget.user)));
        else if (val == 'logout') _logout();
      },
      offset: const Offset(0, 50),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(12),
          boxShadow: const [BoxShadow(color: Color(0x0D000000), blurRadius: 2)],
        ),
        child: Row(children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: _emerald50, borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0x80D1FAE5)),
            ),
            child: const Center(child: Icon(LucideIcons.user, color: _emerald700, size: 16)),
          ),
          const SizedBox(width: 10),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.user.nama, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: _slate800, height: 1.2)),
              const SizedBox(height: 2),
              Text(roleLabel.toUpperCase(), style: const TextStyle(fontSize: 11, color: _slate500, fontWeight: FontWeight.w600, letterSpacing: 0.8)),
            ],
          ),
          const SizedBox(width: 8),
          const Icon(LucideIcons.chevronDown, size: 14, color: _slate500),
        ]),
      ),
      itemBuilder: (_) => [
        PopupMenuItem(enabled: false, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('AKUN SAYA', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8), letterSpacing: 1.5)),
          const SizedBox(height: 4),
          Text(widget.user.nama, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _slate800)),
        ])),
        const PopupMenuDivider(),
        const PopupMenuItem(value: 'profile', child: Text('Profil Lengkap', style: TextStyle(fontSize: 13))),
        const PopupMenuDivider(),
        const PopupMenuItem(value: 'logout', child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(LucideIcons.logOut, size: 16, color: Colors.red), SizedBox(width: 8),
          Text('Keluar Sesi', style: TextStyle(fontSize: 13, color: Colors.red, fontWeight: FontWeight.bold)),
        ])),
      ],
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MOBILE TOP NAVBAR — web: white bg, green S logo, action icons
  // ══════════════════════════════════════════════════════════════════════════

  Widget _buildMobileTopNavbar() {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
          decoration: const BoxDecoration(
            color: _navbarBg,
            border: Border(bottom: BorderSide(color: _navbarBorder)),
            boxShadow: [BoxShadow(color: Color(0x0D000000), blurRadius: 4, offset: Offset(0, 1))],
          ),
          child: SizedBox(
            height: 56,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                children: [
                  // Logo (web: AppLogo + "LATORJANA")
                  GestureDetector(
                    onTap: () => setState(() => _currentIndex = 0),
                    child: Row(
                      children: [
                        const AppLogo(size: 28),
                        const SizedBox(width: 8),
                        const Text(
                          'LATORJANA',
                          style: TextStyle(color: _emerald800, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5),
                        ),
                      ],
                    ),
                  ),

                  const Spacer(),

                  // Right icons (web: calendar, bot, help, bell, user)
                  _buildMobileIconBtn(LucideIcons.calendar, 'Kalender', () => _showCalendarDialog(context)),
                  const SizedBox(width: 2),
                  _buildMobileIconBtn(LucideIcons.bot, 'Jana AI', () {
                    final idx = _allItems.indexWhere((i) => i.page is JanaChatView);
                    if (idx >= 0) setState(() => _currentIndex = idx);
                    else Navigator.push(context, MaterialPageRoute(builder: (_) => const JanaChatView()));
                  }, color: _emerald600),
                  const SizedBox(width: 2),
                  _buildMobileIconBtn(LucideIcons.helpCircle, 'Panduan', () {
                    final idx = _allItems.indexWhere((i) => i.page is PanduanView);
                    if (idx >= 0) setState(() => _currentIndex = idx);
                    else Navigator.push(context, MaterialPageRoute(builder: (_) => const PanduanView()));
                  }, color: _emerald600),
                  const SizedBox(width: 2),
                  // Notification
                  PopupMenuButton<String>(
                    tooltip: 'Notifikasi',
                    offset: const Offset(0, 45),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white, borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0x99E2E8F0)),
                        boxShadow: const [BoxShadow(color: Color(0x0D000000), blurRadius: 2)],
                      ),
                      child: const Icon(LucideIcons.bell, size: 18, color: _slate500),
                    ),
                    itemBuilder: (_) => [
                      const PopupMenuItem(enabled: false, child: Text('Notifikasi Terbaru', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13))),
                      const PopupMenuDivider(),
                      const PopupMenuItem(child: Text('Belum ada notifikasi', style: TextStyle(fontSize: 12, color: _slate500))),
                    ],
                  ),
                  const SizedBox(width: 2),
                  // Profile avatar with dropdown (matching web's tour-profile)
                  PopupMenuButton<String>(
                    tooltip: 'Profil',
                    offset: const Offset(0, 45),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    onSelected: (val) {
                      if (val == 'profile') {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileView(user: widget.user)));
                      } else if (val == 'logout') {
                        _logout();
                      }
                    },
                    child: Container(
                      width: 36, height: 36,
                      decoration: BoxDecoration(
                        color: _emerald50, borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0x80D1FAE5)),
                        boxShadow: const [BoxShadow(color: Color(0x0D000000), blurRadius: 2)],
                      ),
                      child: const Center(child: Icon(LucideIcons.user, color: _emerald700, size: 16)),
                    ),
                    itemBuilder: (_) => [
                      PopupMenuItem(
                        enabled: false,
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          decoration: const BoxDecoration(
                            color: Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.all(Radius.circular(8)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('AKUN SAYA', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8), letterSpacing: 1.5)),
                              const SizedBox(height: 4),
                              Text(widget.user.nama, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _slate800)),
                            ],
                          ),
                        ),
                      ),
                      const PopupMenuDivider(),
                      const PopupMenuItem(
                        value: 'profile',
                        child: Row(children: [
                          Icon(LucideIcons.user, size: 16, color: _slate500),
                          SizedBox(width: 8),
                          Text('Profil Lengkap', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                        ]),
                      ),
                      const PopupMenuDivider(),
                      const PopupMenuItem(
                        value: 'logout',
                        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Icon(LucideIcons.logOut, size: 16, color: Colors.red),
                          SizedBox(width: 8),
                          Text('Keluar Sesi', style: TextStyle(fontSize: 13, color: Colors.red, fontWeight: FontWeight.bold)),
                        ]),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMobileIconBtn(IconData icon, String tooltip, VoidCallback onTap, {Color color = _slate500}) {
    return Tooltip(
      message: tooltip,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white, borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0x99E2E8F0)),
            boxShadow: const [BoxShadow(color: Color(0x0D000000), blurRadius: 2)],
          ),
          child: Icon(icon, size: 18, color: color),
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MOBILE BOTTOM NAVBAR — Max 4 items, swipe up or tap "More" for remainder
  // ══════════════════════════════════════════════════════════════════════════

  Widget _buildMobileBottomNavbar() {
    const int maxVisible = 4;
    final bool hasMore = _allItems.length > maxVisible;
    final int visibleCount = hasMore ? maxVisible - 1 : _allItems.length;

    final visibleItems = _allItems.sublist(0, visibleCount);
    final hiddenItems = hasMore ? _allItems.sublist(visibleCount) : <_NavItem>[];

    // If current index is in the hidden items, the "More" tab is active.
    final int activeNavIndex = _currentIndex < visibleCount ? _currentIndex : visibleCount;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onVerticalDragEnd: (details) {
        // Swipe up
        if (details.primaryVelocity != null && details.primaryVelocity! < -200 && hasMore) {
          _showMoreMenu(hiddenItems, visibleCount);
        }
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: const Border(top: BorderSide(color: _navbarBorder)),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF047857).withValues(alpha: 0.04),
              blurRadius: 24,
              offset: const Offset(0, -8),
              spreadRadius: 0,
            )
          ],
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                ...visibleItems.asMap().entries.map((entry) {
                  return _buildBottomNavItem(
                    icon: entry.value.icon,
                    label: entry.value.label,
                    isActive: activeNavIndex == entry.key,
                    onTap: () => setState(() => _currentIndex = entry.key),
                  );
                }),
                if (hasMore)
                  _buildBottomNavItem(
                    icon: LucideIcons.layoutGrid,
                    label: 'Menu',
                    isActive: activeNavIndex == visibleCount,
                    onTap: () => _showMoreMenu(hiddenItems, visibleCount),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomNavItem({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
          constraints: const BoxConstraints(minWidth: 64),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Material 3 Animated Pill for Icon
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                curve: Curves.fastOutSlowIn,
                width: isActive ? 64 : 40,
                height: 32,
                decoration: BoxDecoration(
                  color: isActive ? const Color(0xFFD1FAE5) : Colors.transparent, // emerald-100
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  icon,
                  size: isActive ? 22 : 20,
                  color: isActive ? const Color(0xFF047857) : const Color(0xFF64748B), // emerald-700 : slate-500
                ),
              ),
              const SizedBox(height: 6),
              // Label with subtle animated bolding/color
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 200),
                style: TextStyle(
                  fontSize: 11,
                  fontFamily: 'Inter',
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                  color: isActive ? const Color(0xFF065F46) : const Color(0xFF64748B), // emerald-800 : slate-500
                  letterSpacing: 0.2,
                ),
                child: Text(
                  label,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showMoreMenu(List<_NavItem> hiddenItems, int offset) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.only(top: 12, left: 24, right: 24, bottom: 32),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag handle
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1), // slate-300
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Text(
                'Menu Lainnya',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A), // slate-900
                ),
              ),
              const SizedBox(height: 24),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 24,
                  crossAxisSpacing: 16,
                  childAspectRatio: 0.85,
                ),
                itemCount: hiddenItems.length,
                itemBuilder: (context, idx) {
                  final item = hiddenItems[idx];
                  final globalIndex = offset + idx;
                  final isActive = _currentIndex == globalIndex;

                  return GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => _currentIndex = globalIndex);
                    },
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: isActive ? const Color(0xFFD1FAE5) : const Color(0xFFF8FAFC),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isActive ? const Color(0xFF34D399) : const Color(0xFFE2E8F0),
                              width: 1,
                            ),
                          ),
                          child: Icon(
                            item.icon,
                            size: 24,
                            color: isActive ? const Color(0xFF047857) : const Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          item.label,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                            color: isActive ? const Color(0xFF065F46) : const Color(0xFF475569),
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  );
                },
              ),
              SafeArea(child: const SizedBox(height: 16)),
            ],
          ),
        );
      },
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  final Widget page;
  _NavItem({required this.icon, required this.label, required this.page});
}
