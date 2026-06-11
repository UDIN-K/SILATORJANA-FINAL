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
    // 1. Fade in the background to slate-50 smoothly
    await Future.delayed(const Duration(milliseconds: 50));
    if (mounted) setState(() => _bgOpacity = 1.0);

    // 2. Wait for background to finish fading, then show Lock
    await Future.delayed(const Duration(milliseconds: 600));
    if (mounted) setState(() => _isLocked = true);

    // 3. Wait for lock bouncy animation to settle
    await Future.delayed(const Duration(milliseconds: 800));

    // 4. Navigate to LoginView and destroy the whole stack beneath it
    if (mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        PageRouteBuilder(
          transitionDuration: const Duration(milliseconds: 600),
          pageBuilder: (context, _, __) => const LoginView(),
          transitionsBuilder: (context, animation, _, child) {
            return FadeTransition(opacity: animation, child: child);
          },
        ),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AnimatedContainer(
        duration: const Duration(milliseconds: 500),
        color: const Color(0xFFF8FAFC).withValues(alpha: _bgOpacity),
        alignment: Alignment.center,
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 400),
          opacity: _bgOpacity,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 400),
            switchInCurve: Curves.easeOutBack, // Bouncy effect when locking
            switchOutCurve: Curves.easeIn,     // Smooth shrink when unlocking disappears
            transitionBuilder: (Widget child, Animation<double> animation) {
              return ScaleTransition(
                scale: animation,
                child: child,
              );
            },
            child: Container(
              key: ValueKey<bool>(_isLocked),
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                border: Border.all(
                  color: _isLocked ? const Color(0xFF10B981).withValues(alpha: 0.3) : const Color(0xFFE2E8F0),
                  width: _isLocked ? 2 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: _isLocked ? const Color(0xFF10B981).withValues(alpha: 0.2) : Colors.black.withValues(alpha: 0.05),
                    blurRadius: 24,
                    spreadRadius: _isLocked ? 4 : 0,
                    offset: const Offset(0, 10),
                  )
                ]
              ),
              child: Icon(
                _isLocked ? LucideIcons.lock : LucideIcons.unlock,
                size: 56,
                color: _isLocked ? const Color(0xFF059669) : const Color(0xFF64748B),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
