import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../services/auth_service.dart';
import 'login_view.dart';
import '../../kegiatan/views/dashboard_view.dart';

class SplashView extends StatefulWidget {
  const SplashView({super.key});

  @override
  State<SplashView> createState() => _SplashViewState();
}

class _SplashViewState extends State<SplashView> {
  final AuthService _authService = AuthService();

  @override
  void initState() {
    super.initState();
    _navigateToNext();
  }

  Future<void> _navigateToNext() async {
    // Tampilkan splash minimal 2.5 detik
    await Future.delayed(const Duration(milliseconds: 2500));

    if (!mounted) return;

    // Cek apakah ada session yang tersimpan
    final hasSession = await _authService.hasValidSession();

    if (!mounted) return;

    if (hasSession) {
      // Ada token tersimpan — coba ambil data user
      final user = await _authService.getMe();

      if (!mounted) return;

      if (user != null) {
        // Session valid → langsung ke Dashboard
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            transitionDuration: const Duration(milliseconds: 600),
            pageBuilder: (context, animation, secondaryAnimation) =>
                DashboardView(user: user),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              return FadeTransition(opacity: animation, child: child);
            },
          ),
        );
        return;
      }
    }

    // Tidak ada session / session expired → ke Login
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 800),
        pageBuilder: (context, animation, secondaryAnimation) =>
            const LoginView(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF022C22), // emerald-950
      body: Stack(
        children: [
          // Efek pattern latar belakang
          Positioned.fill(
            child: Opacity(
              opacity: 0.05,
              child: SvgPicture.asset(
                'assets/svg/pattern-bg.svg',
                fit: BoxFit.cover,
              ),
            ),
          ),
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(32),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                  ),
                  child: SvgPicture.asset(
                    'assets/svg/app-logo.svg',
                    height: 96,
                  ),
                ),
                const SizedBox(height: 32),
                const Text(
                  'Si-LATORJANA',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Sistem Layanan Terpadu Administrasi',
                  style: TextStyle(
                    color: Color(0xFF6EE7B7), // emerald-300
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ),
                const Text(
                  'Politeknik Negeri Jakarta',
                  style: TextStyle(
                    color: Color(0xFFA7F3D0), // emerald-200
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 48),
                // Loading indicator selama cek session
                const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    color: Color(0xFF6EE7B7),
                    strokeWidth: 2,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
