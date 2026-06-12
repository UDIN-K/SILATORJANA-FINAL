import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../core/network/api_service.dart';

class UserManagementViewModel extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Map<String, dynamic>> users = [];
  bool isLoading = false;
  String? errorMessage;
  bool isSubmitting = false;

  Future<void> fetchUsers() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/users');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        users = List<Map<String, dynamic>>.from(data['data'] ?? data);
      } else {
        errorMessage = 'Gagal memuat data user (${response.statusCode})';
      }
    } catch (e) {
      errorMessage = 'Kesalahan jaringan: $e';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createUser(Map<String, dynamic> body) async {
    isSubmitting = true;
    notifyListeners();

    try {
      final response = await _apiService.post('/users', body: body);
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      return false;
    } finally {
      isSubmitting = false;
      notifyListeners();
    }
  }

  Future<bool> updateUser(int id, Map<String, dynamic> body) async {
    isSubmitting = true;
    notifyListeners();

    try {
      final response = await _apiService.put('/users/$id', body: body);
      return response.statusCode == 200;
    } catch (e) {
      return false;
    } finally {
      isSubmitting = false;
      notifyListeners();
    }
  }

  /// Toggle allow_biometric for a specific user
  Future<bool> toggleBiometric(int userId, bool allow) async {
    try {
      final response = await _apiService.put('/users/$userId', body: {
        'allow_biometric': allow,
      });
      if (response.statusCode == 200) {
        // Update local state
        final idx = users.indexWhere((u) => u['id'] == userId);
        if (idx != -1) {
          users[idx]['allow_biometric'] = allow;
          notifyListeners();
        }
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}
