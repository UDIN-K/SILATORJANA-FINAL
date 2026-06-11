import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'features/auth/views/splash_view.dart';
import 'features/auth/viewmodels/auth_viewmodel.dart';
import 'features/kegiatan/viewmodels/kegiatan_viewmodel.dart';
import 'features/chat/viewmodels/chat_viewmodel.dart';
import 'features/profile/viewmodels/profile_viewmodel.dart';
import 'features/master_data/viewmodels/master_data_viewmodel.dart';
import 'core/utils/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NotificationService().init();
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthViewModel()),
        ChangeNotifierProvider(create: (_) => KegiatanViewModel()),
        ChangeNotifierProvider(create: (_) => ChatViewModel()),
        ChangeNotifierProvider(create: (_) => ProfileViewModel()),
        ChangeNotifierProvider(create: (_) => MasterDataViewModel()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Si-LATORJANA',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF047857)), // emerald-700
        useMaterial3: true,
        fontFamily: 'Inter',
      ),
      home: const SplashView(),
    );
  }
}
