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
  List<Map<String, String>> biometricAccounts = [];
  User? currentUser;

  Future<void> initBiometrics() async {
    try {
      final canCheck = await _biometricService.hasBiometrics();
      biometricAccounts = await _authService.getAllAccounts();
      canCheckBiometrics = canCheck && biometricAccounts.isNotEmpty;
      notifyListeners();
    } catch (e) {
      canCheckBiometrics = false;
      biometricAccounts = [];
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

  /// Login with biometrics using specific account credentials
  Future<bool> loginWithBiometricAccount(Map<String, String> account) async {
    try {
      final authenticated = await _biometricService.authenticate();
      if (!authenticated) return false;
      return loginWithPreAuthenticatedAccount(account);
    } catch (e) {
      isLoading = false;
      errorMessage = 'Gagal autentikasi biometrik: $e';
      notifyListeners();
      return false;
    }
  }

  /// Perform biometric authentication without logging in immediately
  Future<bool> authenticateBiometricOnly() async {
    return await _biometricService.authenticate();
  }

  /// Log in with a specific account that has already been biometrically authenticated
  Future<bool> loginWithPreAuthenticatedAccount(Map<String, String> account) async {
    try {
      isLoading = true;
      notifyListeners();

      final email = account['email']!;
      final password = account['password']!;
      bool success;

      // Check if this is a biometric token or actual password
      if (password.startsWith('__biometric_token__:')) {
        final biometricToken = password.replaceFirst('__biometric_token__:', '');
        success = await _authService.biometricLogin(email, biometricToken);
      } else {
        success = await _authService.login(email, password);
      }

      if (!success) {
        isLoading = false;
        errorMessage = 'Kredensial kedaluwarsa. Silakan login manual dan daftarkan ulang biometrik.';
        notifyListeners();
        return false;
      }

      currentUser = await _authService.getMe();
      isLoading = false;
      if (currentUser == null) {
        errorMessage = 'Gagal mengambil data user.';
        notifyListeners();
        return false;
      }

      if (!currentUser!.allowBiometric) {
        await _authService.deleteCredentials(account['email']);
        await logout();
        errorMessage = 'Akses Biometrik dinonaktifkan oleh Admin.';
        notifyListeners();
        return false;
      }

      notifyListeners();
      return true;
    } catch (e) {
      isLoading = false;
      errorMessage = 'Gagal login biometrik: $e';
      notifyListeners();
      return false;
    }
  }

  /// Legacy single-account biometric login (uses first account)
  Future<bool> loginWithBiometrics() async {
    if (biometricAccounts.isEmpty) {
      final accounts = await _authService.getAllAccounts();
      if (accounts.isEmpty) {
        errorMessage = 'Tidak ada akun terdaftar untuk biometrik.';
        notifyListeners();
        return false;
      }
      return loginWithBiometricAccount(accounts.first);
    }
    return loginWithBiometricAccount(biometricAccounts.first);
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

