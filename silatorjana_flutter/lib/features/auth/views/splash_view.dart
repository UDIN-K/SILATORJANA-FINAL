import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'login_view.dart';
import '../../kegiatan/views/dashboard_view.dart';
import '../../../core/widgets/app_logo.dart';

class SplashView extends StatefulWidget {
  const SplashView({super.key});

  @override
  State<SplashView> createState() => _SplashViewState();
}

class _SplashViewState extends State<SplashView> with TickerProviderStateMixin {
  final AuthService _authService = AuthService();
  
  late final AnimationController _pulseController;
  late final AnimationController _drawController;
  
  late final Animation<double> _dotOpacity;
  late final Animation<double> _sDrawAnimation;
  late final Animation<double> _textOpacity;
  late final Animation<Offset> _textSlide;
  late final Animation<double> _textRevealAnimation;
  late final Animation<double> _logoBgOpacity;

  bool _showWelcome = false;
  double _splashOpacity = 1.0;
  Widget? _nextScreen;

  @override
  void initState() {
    super.initState();
    
    // 1. Controller for the pulsing dots while "loading"
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);

    _dotOpacity = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // 2. Controller for the sequential reveal of 'S' and text
    _drawController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _sDrawAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _drawController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeInOutCubic),
      ),
    );

    _logoBgOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _drawController,
        curve: const Interval(0.4, 0.7, curve: Curves.easeIn),
      ),
    );

    _textOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _drawController,
        curve: const Interval(0.5, 1.0, curve: Curves.easeOut),
      ),
    );

    _textSlide = Tween<Offset>(begin: const Offset(0.2, 0), end: Offset.zero).animate(
      CurvedAnimation(
        parent: _drawController,
        curve: const Interval(0.5, 1.0, curve: Curves.easeOutCubic),
      ),
    );

    // This smooths the row expansion to eliminate layout jumping
    _textRevealAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _drawController,
        curve: const Interval(0.5, 1.0, curve: Curves.easeOutCubic),
      ),
    );

    _startSequence();
  }

  Future<void> _startSequence() async {
    // Pre-load the next screen state in the background immediately
    final hasSession = await _authService.hasValidSession();
    if (hasSession) {
      final user = await _authService.getMe();
      if (user != null) {
        _nextScreen = DashboardView(user: user);
      } else {
        _nextScreen = const LoginView();
      }
    } else {
      _nextScreen = const LoginView();
    }
    
    // Update the state so the next screen is actually rendered under our splash stack!
    if (mounted) setState(() {});

    // Phase 1: Wait 2 seconds showing only the pulsing dots
    await Future.delayed(const Duration(seconds: 2));
    
    if (mounted) {
      _pulseController.stop();
      _pulseController.value = 1.0;
    }

    // Phase 2: Start drawing the S and revealing the text
    if (mounted) {
      await _drawController.forward();
    }
    
    // Hold for a moment
    await Future.delayed(const Duration(milliseconds: 1200));
    
    // Phase 3: Fade out everything and fade in "Welcome"
    if (mounted) {
      setState(() => _showWelcome = true);
    }

    // Hold the "Welcome" text for an elegant effect
    await Future.delayed(const Duration(milliseconds: 1200));

    // Phase 4: FADE OUT the entire splash background to reveal the loaded screen underneath!
    if (mounted) {
      setState(() => _splashOpacity = 0.0);
    }

    // Wait for the fade out transition to complete
    await Future.delayed(const Duration(milliseconds: 1200));

    if (!mounted || _nextScreen == null) return;

    // Finally, officially transition the Navigator without any blink/animation
    // because the screen is already perfectly visible.
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        transitionDuration: Duration.zero,
        pageBuilder: (context, animation, secondaryAnimation) => _nextScreen!,
      ),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _drawController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black, // Fallback base color
      child: Stack(
        children: [
          // 1. The fully loaded next screen underneath everything
          if (_nextScreen != null)
            Positioned.fill(
              child: _nextScreen!,
            ),

          // 2. The Splash UI Overlay
          Positioned.fill(
            child: IgnorePointer(
              ignoring: _splashOpacity == 0.0,
              child: AnimatedOpacity(
                opacity: _splashOpacity,
                duration: const Duration(milliseconds: 1200),
                curve: Curves.easeIn, // slow start, fast end
                child: Container(
                  color: const Color(0xFF000000), // Solid black background
                  child: Center(
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 800),
                      switchInCurve: Curves.easeOutCubic,
                      switchOutCurve: Curves.easeInCubic,
                      child: _showWelcome
                          ? const Text(
                              'Welcome',
                              key: ValueKey('welcome_text'),
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w300,
                                color: Colors.white,
                                letterSpacing: 10.0,
                              ),
                            )
                          : AnimatedBuilder(
                              key: const ValueKey('logo_animation'),
                              animation: Listenable.merge([_pulseController, _drawController]),
                              builder: (context, child) {
                                return Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Stack(
                                      alignment: Alignment.center,
                                      children: [
                                        AppLogo(
                                          size: 64,
                                          drawProgress: _sDrawAnimation.value,
                                          dotsOpacity: _dotOpacity.value,
                                          showBackground: false,
                                        ),
                                        if (_logoBgOpacity.value > 0)
                                          Opacity(
                                            opacity: _logoBgOpacity.value,
                                            child: const AppLogo(
                                              size: 64,
                                              drawProgress: 1.0,
                                              dotsOpacity: 1.0,
                                              showBackground: true,
                                            ),
                                          ),
                                      ],
                                    ),
                                    // Smoothly animate the width to avoid jumping!
                                    ClipRect(
                                      child: Align(
                                        alignment: Alignment.centerLeft,
                                        widthFactor: _textRevealAnimation.value,
                                        child: Padding(
                                          padding: const EdgeInsets.only(left: 16),
                                          child: SlideTransition(
                                            position: _textSlide,
                                            child: Opacity(
                                              opacity: _textOpacity.value,
                                              child: Column(
                                                mainAxisSize: MainAxisSize.min,
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: const [
                                                  Text(
                                                    'Si-LATORJANA',
                                                    style: TextStyle(
                                                      fontSize: 28,
                                                      fontWeight: FontWeight.w900,
                                                      color: Colors.white,
                                                      letterSpacing: 1.0,
                                                    ),
                                                  ),
                                                  Text(
                                                    'Politeknik Negeri Jakarta',
                                                    style: TextStyle(
                                                      color: Color(0xFF10B981),
                                                      fontSize: 14,
                                                      fontWeight: FontWeight.w500,
                                                      letterSpacing: 0.5,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                );
                              },
                            ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
