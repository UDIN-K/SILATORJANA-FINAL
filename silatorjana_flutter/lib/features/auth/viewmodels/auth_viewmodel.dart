import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/biometric_service.dart';

class AuthViewModel extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final BiometricService _biometricService = BiometricService();

  bool isLoading = false;
  String? errorMessage;
  bool canCheckBiometrics = false;
  User? currentUser;

  Future<void> initBiometrics() async {
    try {
      final canCheck = await _biometricService.hasBiometrics();
      final token = await _authService.getToken();
      canCheckBiometrics = canCheck && token != null;
      notifyListeners();
    } catch (e) {
      // Biometrics not available, silently ignore
      canCheckBiometrics = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final success = await _authService.login(email, password);

      if (success) {
        currentUser = await _authService.getMe();
        isLoading = false;
        if (currentUser == null) {
          errorMessage = 'Gagal mengambil data user.';
          notifyListeners();
          return false;
        }
        notifyListeners();
        return true;
      } else {
        isLoading = false;
        errorMessage = 'Login gagal. Silakan cek kembali kredensial Anda.';
        notifyListeners();
        return false;
      }
    } catch (e) {
      isLoading = false;
      errorMessage = 'Kesalahan koneksi: $e';
      debugPrint('LOGIN ERROR: $e');
      notifyListeners();
      return false;
    }
  }

  Future<bool> loginWithBiometrics() async {
    try {
      final authenticated = await _biometricService.authenticate();
      if (authenticated) {
        isLoading = true;
        notifyListeners();
        
        currentUser = await _authService.getMe();
        
        isLoading = false;
        if (currentUser == null) {
          errorMessage = 'Sesi habis, silakan login manual.';
          notifyListeners();
          return false;
        }
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      isLoading = false;
      errorMessage = 'Gagal autentikasi biometrik: $e';
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _authService.logout();
    } catch (e) {
      debugPrint('LOGOUT ERROR: $e');
    }
    currentUser = null;
    notifyListeners();
  }
}
