
import 'package:flutter/material.dart';
import 'screens/login_screen.dart'; 

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Si-Latorjana',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF005F52),
          primary: const Color(0xFF005F52),
          ), 
        useMaterial3: true,
      ),
      home: const LoginScreen(),
    );
  }
}
