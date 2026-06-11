import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'login_view.dart';

class LogoutTransitionView extends StatefulWidget {
  const LogoutTransitionView({super.key});

  @override
  State<LogoutTransitionView> createState() => _LogoutTransitionViewState();
}

class _LogoutTransitionViewState extends State<LogoutTransitionView> {
  bool _isLocked = false;
  double _bgOpacity = 0.0;

  @override
  void initState() {
    super.initState();
    _playAnimation();
  }

  Future<void> _playAnimation() async {
    // 1. Fade in the background to slate-50
    await Future.delayed(const Duration(milliseconds: 50));
    if (mounted) setState(() => _bgOpacity = 1.0);

    // 2. Wait for background to fade in, then show Lock
    await Future.delayed(const Duration(milliseconds: 400));
    if (mounted) setState(() => _isLocked = true);

    // 3. Wait for lock animation to settle
    await Future.delayed(const Duration(milliseconds: 600));

    // 4. Navigate to LoginView
    if (mounted) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          transitionDuration: const Duration(milliseconds: 500),
          pageBuilder: (context, _, __) => const LoginView(),
          transitionsBuilder: (context, animation, _, child) {
            return FadeTransition(opacity: animation, child: child);
          },
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AnimatedContainer(
        duration: const Duration(milliseconds: 400),
        color: const Color(0xFFF8FAFC).withValues(alpha: _bgOpacity),
        alignment: Alignment.center,
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 300),
          opacity: _bgOpacity,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            transitionBuilder: (Widget child, Animation<double> animation) {
              return ScaleTransition(
                scale: animation,
                child: child,
              );
            },
            child: Container(
              key: ValueKey<bool>(_isLocked),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  )
                ]
              ),
              child: Icon(
                _isLocked ? LucideIcons.lock : LucideIcons.unlock,
                size: 48,
                color: _isLocked ? const Color(0xFF059669) : const Color(0xFF64748B),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
