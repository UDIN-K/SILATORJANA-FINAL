import 'package:flutter/material.dart';
import '../../../core/network/api_service.dart';

class ProfileViewModel extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  bool isLoading = false;
  String? errorMessage;
  String? successMessage;

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
