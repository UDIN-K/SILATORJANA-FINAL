import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'dart:math' as math;
import '../services/auth_service.dart';
import 'login_view.dart';
import '../../kegiatan/views/dashboard_view.dart';

class SplashView extends StatefulWidget {
  const SplashView({super.key});

  @override
  State<SplashView> createState() => _SplashViewState();
}

class _SplashViewState extends State<SplashView> with TickerProviderStateMixin {
  final AuthService _authService = AuthService();
  
  late final AnimationController _revealController;
  late final AnimationController _dotsController;
  
  late final Animation<double> _logoScale;
  late final Animation<double> _logoOpacity;
  late final Animation<Offset> _textSlide;
  late final Animation<double> _textOpacity;
  late final Animation<double> _bgGlow;

  @override
  void initState() {
    super.initState();
    
    // Controller for the main reveal (Google Material style fastOutSlowIn)
    _revealController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );

    // Controller for continuous bouncing dots
    _dotsController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    // Google Material 3 easing
    const revealCurve = Curves.fastOutSlowIn;

    _logoScale = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(
        parent: _revealController,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOutBack),
      ),
    );

    _logoOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _revealController,
        curve: const Interval(0.0, 0.4, curve: Curves.easeOut),
      ),
    );

    _textSlide = Tween<Offset>(begin: const Offset(0, 0.5), end: Offset.zero).animate(
      CurvedAnimation(
        parent: _revealController,
        curve: const Interval(0.3, 0.8, curve: revealCurve),
      ),
    );

    _textOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _revealController,
        curve: const Interval(0.4, 0.8, curve: Curves.easeOut),
      ),
    );

    _bgGlow = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.0).chain(CurveTween(curve: Curves.easeInOut)), weight: 50),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.8).chain(CurveTween(curve: Curves.easeInOut)), weight: 50),
    ]).animate(
      CurvedAnimation(
        parent: _revealController,
        curve: const Interval(0.2, 1.0),
      ),
    );

    _revealController.forward();
    _navigateToNext();
  }

  @override
  void dispose() {
    _revealController.dispose();
    _dotsController.dispose();
    super.dispose();
  }

  Future<void> _navigateToNext() async {
    // Hold splash for at least 2.5 seconds to show the cool animation
    await Future.delayed(const Duration(milliseconds: 2800));

    if (!mounted) return;
    final hasSession = await _authService.hasValidSession();
    if (!mounted) return;

    if (hasSession) {
      final user = await _authService.getMe();
      if (!mounted) return;

      if (user != null) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            transitionDuration: const Duration(milliseconds: 800),
            pageBuilder: (context, animation, secondaryAnimation) => DashboardView(user: user),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              // Smooth fade & slightly scale up for exit transition
              final fade = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
              return FadeTransition(opacity: fade, child: child);
            },
          ),
        );
        return;
      }
    }

    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 800),
        pageBuilder: (context, animation, secondaryAnimation) => const LoginView(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          final fade = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
          return FadeTransition(opacity: fade, child: child);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF022C22), // emerald-950
      body: Stack(
        alignment: Alignment.center,
        children: [
          // Background Pattern with subtle pulse
          Positioned.fill(
            child: AnimatedBuilder(
              animation: _bgGlow,
              builder: (context, child) {
                return Opacity(
                  opacity: 0.03 + (_bgGlow.value * 0.04),
                  child: Transform.scale(
                    scale: 1.0 + (_bgGlow.value * 0.05),
                    child: SvgPicture.asset(
                      'assets/svg/pattern-bg.svg',
                      fit: BoxFit.cover,
                    ),
                  ),
                );
              },
            ),
          ),
          
          // Google-like Glowing Center Orb
          AnimatedBuilder(
            animation: _bgGlow,
            builder: (context, child) {
              return Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF10B981).withValues(alpha: 0.15 * _bgGlow.value), // emerald-500
                      const Color(0xFF022C22).withValues(alpha: 0.0),
                    ],
                  ),
                ),
              );
            },
          ),

          // Main Content
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo Reveal
              AnimatedBuilder(
                animation: _revealController,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _logoScale.value,
                    child: Opacity(
                      opacity: _logoOpacity.value,
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF059669).withValues(alpha: 0.3),
                              blurRadius: 40,
                              spreadRadius: 8 * _bgGlow.value,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: SvgPicture.asset(
                          'assets/svg/app-logo.svg',
                          height: 80,
                          width: 80,
                        ),
                      ),
                    ),
                  );
                },
              ),
              
              const SizedBox(height: 40),
              
              // Text Reveal
              AnimatedBuilder(
                animation: _revealController,
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(0, _textSlide.value.dy * 100),
                    child: Opacity(
                      opacity: _textOpacity.value,
                      child: Column(
                        children: [
                          const Text(
                            'Si-LATORJANA',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 34,
                              fontFamily: 'Inter',
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.5,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFF064E3B).withValues(alpha: 0.5),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: const Color(0xFF34D399).withValues(alpha: 0.2)),
                            ),
                            child: const Text(
                              'Politeknik Negeri Jakarta',
                              style: TextStyle(
                                color: Color(0xFF6EE7B7), // emerald-300
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              
              const SizedBox(height: 60),
              
              // Google-style Bouncing Dots Indicator
              AnimatedBuilder(
                animation: _textOpacity,
                builder: (context, child) {
                  return Opacity(
                    opacity: _textOpacity.value,
                    child: SizedBox(
                      height: 24,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(3, (index) {
                          return AnimatedBuilder(
                            animation: _dotsController,
                            builder: (context, child) {
                              // Calculate sine wave offset for each dot
                              final delay = index * 0.2;
                              double value = (_dotsController.value - delay) % 1.0;
                              if (value < 0) value += 1.0;
                              
                              final offset = math.sin(value * math.pi * 2) * -6.0;
                              final scale = 1.0 + (math.sin(value * math.pi) * 0.3);
                              final colorOpacity = 0.5 + (math.sin(value * math.pi) * 0.5);
                              
                              return Transform.translate(
                                offset: Offset(0, offset),
                                child: Transform.scale(
                                  scale: scale.clamp(0.0, 1.5),
                                  child: Container(
                                    margin: const EdgeInsets.symmetric(horizontal: 6),
                                    width: 10,
                                    height: 10,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF34D399).withValues(alpha: colorOpacity.clamp(0.0, 1.0)),
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFF34D399).withValues(alpha: colorOpacity * 0.5),
                                          blurRadius: 8,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          );
                        }),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}
