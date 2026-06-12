import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../viewmodels/auth_viewmodel.dart';
import '../services/auth_service.dart';
import 'forgot_password_view.dart';
import '../../kegiatan/views/dashboard_view.dart';
import '../../../core/widgets/app_logo.dart';

class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> with SingleTickerProviderStateMixin {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final AuthViewModel _authViewModel = AuthViewModel();

  final FocusNode _emailFocus = FocusNode();
  final FocusNode _passwordFocus = FocusNode();

  bool _showPass = false;
  bool _isSuccessTransitioning = false;

  late final AnimationController _slideUpController;
  late final Animation<Offset> _slideUpAnimation;

  @override
  void initState() {
    super.initState();
    _authViewModel.initBiometrics();
    _emailFocus.addListener(_onFocusChange);
    _passwordFocus.addListener(_onFocusChange);

    _slideUpController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _slideUpAnimation = Tween<Offset>(begin: Offset.zero, end: const Offset(0, -1.0)).animate(
      CurvedAnimation(parent: _slideUpController, curve: Curves.easeInOutCubic),
    );
  }

  void _onFocusChange() {
    setState(() {});
  }

  @override
  void dispose() {
    _emailFocus.removeListener(_onFocusChange);
    _passwordFocus.removeListener(_onFocusChange);
    _emailFocus.dispose();
    _passwordFocus.dispose();
    _authViewModel.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _slideUpController.dispose();
    super.dispose();
  }

  Future<void> _handleLoginSuccess() async {
    if (!mounted) return;
    
    // 1. Keep showing the loading spinner on the button
    setState(() {
      _isSuccessTransitioning = true;
    });

    await Future.delayed(const Duration(milliseconds: 300));

    // 2. Swipe the login page UP out of the screen, revealing the slate-50 background
    if (mounted) {
      await _slideUpController.forward();
    }

    // 3. Mount the DashboardView, which will now elegantly trigger its entry animations
    if (mounted) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          transitionDuration: const Duration(milliseconds: 400),
          pageBuilder: (context, _, __) => DashboardView(user: _authViewModel.currentUser!),
          transitionsBuilder: (context, animation, _, child) {
            return FadeTransition(opacity: animation, child: child);
          },
        ),
      );
    }
  }

  Future<void> _login() async {
    if (_isSuccessTransitioning) return;
    FocusScope.of(context).unfocus();
    
    final success = await _authViewModel.login(
      _emailController.text,
      _passwordController.text,
    );

    if (success) {
      await _handleLoginSuccess();
    }
  }

  Future<void> _loginWithBiometrics() async {
    if (_isSuccessTransitioning) return;
    
    // Fetch latest directly to avoid stale state if user just logged out
    final authService = AuthService();
    final accounts = await authService.getAllAccounts();
    
    if (accounts.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tidak ada akun terdaftar untuk biometrik.')),
        );
      }
      return;
    }

    // 1. Scan fingerprint first
    final authenticated = await _authViewModel.authenticateBiometricOnly();
    if (!authenticated) return;

    // 2. Decide based on accounts count
    if (accounts.length == 1) {
      // Only 1 account, use pre-authenticated login
      final success = await _authViewModel.loginWithPreAuthenticatedAccount(accounts.first);
      if (success) {
        await _handleLoginSuccess();
      }
    } else {
      // Multiple accounts, show picker bottom sheet
      _showBiometricAccountPicker(accounts);
    }
  }

  void _showBiometricAccountPicker(List<Map<String, String>> accounts) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Pilih Akun',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 8),
              const Text(
                'Pilih akun untuk masuk',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 16),
              Flexible(
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: accounts.map((account) {
                      final initial = account['nama']?.isNotEmpty == true ? account['nama']![0].toUpperCase() : 'U';
                      final role = account['role']?.toUpperCase() ?? 'USER';
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: const Color(0xFFECFDF5),
                          child: Text(initial, style: const TextStyle(color: Color(0xFF047857), fontWeight: FontWeight.bold)),
                        ),
                        title: Text(account['nama'] ?? account['email']!, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(role, style: const TextStyle(fontSize: 12)),
                        onTap: () async {
                          Navigator.pop(ctx);
                          if (_isSuccessTransitioning) return;
                          // Already scanned fingerprint, login immediately
                          final success = await _authViewModel.loginWithPreAuthenticatedAccount(account);
                          if (success) {
                            await _handleLoginSuccess();
                          }
                        },
                      );
                    }).toList(),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFFF8FAFC),
      child: Stack(
        children: [
          // 2. The Login UI that will slide UP out of the screen
          SlideTransition(
            position: _slideUpAnimation,
            child: Scaffold(
              backgroundColor: const Color(0xFFF8FAFC), // slate-50
              body: Stack(
                children: [
                  // Elegant top background (Emerald Gradient)
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    height: MediaQuery.of(context).size.height * 0.45,
                    child: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Color(0xFF047857), // emerald-700
                            Color(0xFF065F46), // emerald-800
                          ],
                        ),
                      ),
                      // Subtle abstract pattern/glow for premium feel
                      child: Stack(
                        children: [
                          Positioned(
                            top: -50,
                            right: -50,
                            child: Container(
                              width: 200,
                              height: 200,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white.withValues(alpha: 0.05),
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: -100,
                            left: -50,
                            child: Container(
                              width: 300,
                              height: 300,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white.withValues(alpha: 0.03),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  SafeArea(
                    child: Center(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
                        child: ListenableBuilder(
                          listenable: _authViewModel,
                          builder: (context, _) {
                            return Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                _buildHeader(),
                                const SizedBox(height: 32),
                                // Premium Login Card (Zero Shadows, Clean Borders)
                                Container(
                                  padding: const EdgeInsets.all(32),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(24),
                                    border: Border.all(
                                      color: const Color(0xFFE2E8F0), // slate-200 delicate border
                                      width: 1,
                                    ),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      const Text(
                                        'Masuk ke Akun',
                                        style: TextStyle(
                                          fontSize: 24,
                                          fontWeight: FontWeight.w800,
                                          color: Color(0xFF0F172A), // slate-900
                                          letterSpacing: -0.5,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      const Text(
                                        'Silakan masukkan kredensial Anda',
                                        style: TextStyle(
                                          color: Color(0xFF64748B), // slate-500
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      const SizedBox(height: 32),
                                      if (_authViewModel.errorMessage != null && !_isSuccessTransitioning) ...[
                                        _buildErrorMessage(_authViewModel.errorMessage!),
                                        const SizedBox(height: 24),
                                      ],
                                      _buildLoginForm(),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 32),
                                const Text(
                                  '© 2026 Politeknik Negeri Jakarta',
                                  style: TextStyle(
                                    color: Color(0xFF94A3B8), // slate-400
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
          ),
          child: const AppLogo(size: 40, showBackground: false),
        ),
        const SizedBox(width: 16),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              'Si-LATORJANA',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: Colors.white,
                letterSpacing: 0.5,
              ),
            ),
            Text(
              'Politeknik Negeri Jakarta',
              style: TextStyle(
                color: Color(0xFF6EE7B7), // emerald-300
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildLoginForm() {
    return IgnorePointer(
      ignoring: _isSuccessTransitioning,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Email',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: Color(0xFF334155),
            ),
          ),
          const SizedBox(height: 8),
          _buildEmailField(),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Password',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF334155),
                ),
              ),
              _buildForgotPassword(),
            ],
          ),
          const SizedBox(height: 8),
          _buildPasswordField(),
          const SizedBox(height: 32),
          _buildLoginButton(),
          if (_authViewModel.canCheckBiometrics) ...[
            const SizedBox(height: 16),
            _buildBiometricButton(),
          ],
        ],
      ),
    );
  }

  Widget _buildEmailField() {
    return TextFormField(
      controller: _emailController,
      focusNode: _emailFocus,
      style: const TextStyle(
        fontWeight: FontWeight.w600,
        color: Color(0xFF0F172A),
      ),
      cursorColor: const Color(0xFF059669),
      decoration: InputDecoration(
        hintText: 'nama@domain.com',
        hintStyle: const TextStyle(
          color: Color(0xFF94A3B8),
          fontWeight: FontWeight.w500,
        ),
        prefixIcon: Icon(
          LucideIcons.mail,
          color: _emailFocus.hasFocus ? const Color(0xFF059669) : const Color(0xFF94A3B8),
          size: 20,
        ),
        border: _inputBorder(),
        enabledBorder: _inputBorder(),
        focusedBorder: _inputBorder(color: const Color(0xFF059669)),
        filled: true,
        fillColor: const Color(0xFFF8FAFC), // slate-50
        contentPadding: const EdgeInsets.symmetric(vertical: 16),
      ),
      keyboardType: TextInputType.emailAddress,
    );
  }

  Widget _buildPasswordField() {
    return TextFormField(
      controller: _passwordController,
      focusNode: _passwordFocus,
      obscureText: !_showPass,
      style: const TextStyle(
        fontWeight: FontWeight.w600,
        color: Color(0xFF0F172A),
      ),
      cursorColor: const Color(0xFF059669),
      decoration: InputDecoration(
        hintText: '••••••••',
        hintStyle: const TextStyle(
          color: Color(0xFF94A3B8),
          fontWeight: FontWeight.w500,
        ),
        prefixIcon: Icon(
          LucideIcons.lock,
          color: _passwordFocus.hasFocus ? const Color(0xFF059669) : const Color(0xFF94A3B8),
          size: 20,
        ),
        suffixIcon: IconButton(
          icon: Icon(_showPass ? LucideIcons.eyeOff : LucideIcons.eye),
          onPressed: () => setState(() => _showPass = !_showPass),
          color: const Color(0xFF94A3B8),
          iconSize: 20,
        ),
        border: _inputBorder(),
        enabledBorder: _inputBorder(),
        focusedBorder: _inputBorder(color: const Color(0xFF059669)),
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        contentPadding: const EdgeInsets.symmetric(vertical: 16),
      ),
    );
  }

  OutlineInputBorder _inputBorder({Color? color}) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(
        color: color ?? const Color(0xFFE2E8F0), // slate-200 border for input
        width: 1.5,
      ),
    );
  }

  Widget _buildForgotPassword() {
    return TextButton(
      onPressed: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const ForgotPasswordView()),
        );
      },
      style: TextButton.styleFrom(
        padding: EdgeInsets.zero,
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      child: const Text(
        'Lupa Password?',
        style: TextStyle(
          color: Color(0xFF059669),
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildLoginButton() {
    final bool showLoading = _authViewModel.isLoading || _isSuccessTransitioning;
    
    return SizedBox(
      height: 52,
      width: double.infinity,
      child: ElevatedButton(
        onPressed: showLoading ? null : _login,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF059669), // emerald-600
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          disabledBackgroundColor: const Color(0x80059669),
        ),
        child: showLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
              )
            : const Text(
                'Masuk',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, letterSpacing: 0.5),
              ),
      ),
    );
  }

  Widget _buildBiometricButton() {
    return SizedBox(
      height: 52,
      width: double.infinity,
      child: OutlinedButton(
        onPressed: _loginWithBiometrics,
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: Color(0xFFD1FAE5), width: 1.5), // emerald-100
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(LucideIcons.fingerprint, color: Color(0xFF059669), size: 20),
            SizedBox(width: 6),
            Icon(LucideIcons.scanFace, color: Color(0xFF059669), size: 20),
            SizedBox(width: 8),
            Text(
              'Biometrik / Face ID',
              style: TextStyle(
                color: Color(0xFF059669),
                fontSize: 15,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorMessage(String message) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2), // red-50
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFCA5A5)), // red-300
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.alertCircle, color: Color(0xFFDC2626), size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: Color(0xFF991B1B), // red-800
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
