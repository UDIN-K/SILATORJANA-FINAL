import 'package:flutter/material.dart';
import '../../../core/network/api_service.dart';
import '../../auth/services/auth_service.dart';
import '../../auth/services/biometric_service.dart';

class ProfileViewModel extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final AuthService _authService = AuthService();
  final BiometricService _biometricService = BiometricService();

  bool isLoading = false;
  String? errorMessage;
  String? successMessage;
  
  bool isBiometricEnabled = false;
  String? _currentEmail;

  /// Call this with the current user's email to check if THIS account has biometric
  Future<void> checkBiometricForUser(String email) async {
    _currentEmail = email;
    final accounts = await _authService.getAllAccounts();
    isBiometricEnabled = accounts.any((a) => a['email'] == email);
    notifyListeners();
  }

  Future<bool> enableBiometric(String email, String password, {String? nama, String? role}) async {
    _currentEmail = email;
    isLoading = true;
    errorMessage = null;
    successMessage = null;
    notifyListeners();

    try {
      debugPrint('BIOMETRIC: Verifying password...');
      // Verify password by hitting login endpoint directly (don't replace active token)
      final verifyResponse = await _apiService.post('/login', body: {
        'email': email,
        'password': password,
      });
      debugPrint('BIOMETRIC: Password verify status=${verifyResponse.statusCode}');
      if (verifyResponse.statusCode != 200) {
        isLoading = false;
        errorMessage = 'Password salah. Gagal mengaktifkan biometrik.';
        notifyListeners();
        return false;
      }

      // Check device support & authenticate
      debugPrint('BIOMETRIC: Checking device biometric support...');
      final hasBiometrics = await _biometricService.hasBiometrics();
      debugPrint('BIOMETRIC: hasBiometrics=$hasBiometrics');
      if (!hasBiometrics) {
        isLoading = false;
        errorMessage = 'Perangkat tidak mendukung atau belum disetting biometrik.';
        notifyListeners();
        return false;
      }

      debugPrint('BIOMETRIC: Requesting fingerprint/face scan...');
      final authResult = await _biometricService.authenticateWithStatus();
      debugPrint('BIOMETRIC: authenticate result=$authResult');
      
      if (authResult == 'success') {
        await _authService.saveCredentials(email, password, nama: nama, role: role);
        isBiometricEnabled = true;
        successMessage = 'Login Biometrik berhasil diaktifkan!';
        isLoading = false;
        notifyListeners();
        return true;
      } else if (authResult == 'no_biometrics_enrolled') {
        isLoading = false;
        errorMessage = 'HP Anda belum mendaftarkan sidik jari/wajah. Silakan daftarkan dulu di Pengaturan HP > Keamanan > Sidik Jari / Face Unlock.';
        notifyListeners();
        return false;
      } else {
        isLoading = false;
        errorMessage = 'Otentikasi biometrik dibatalkan/gagal.';
        notifyListeners();
        return false;
      }
    } catch (e) {
      debugPrint('BIOMETRIC ERROR: $e');
      isLoading = false;
      errorMessage = 'Terjadi kesalahan: $e';
      notifyListeners();
      return false;
    }
  }

  Future<void> disableBiometric() async {
    // Only delete credentials for the current account, not all
    if (_currentEmail != null) {
      await _authService.deleteCredentials(_currentEmail);
    }
    isBiometricEnabled = false;
    successMessage = 'Login Biometrik dinonaktifkan.';
    notifyListeners();
  }

  Future<bool> changePassword(String currentPassword, String newPassword) async {
    isLoading = true;
    errorMessage = null;
    successMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/change-password',
        body: {
          'current_password': currentPassword,
          'new_password': newPassword,
        },
      );

      if (response.statusCode == 200) {
        successMessage = 'Password berhasil diubah.';
        isLoading = false;
        notifyListeners();
        return true;
      } else {
        errorMessage = 'Gagal mengubah password. Pastikan password lama benar.';
        isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      errorMessage = 'Terjadi kesalahan jaringan.';
      isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
