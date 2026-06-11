import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../core/network/api_service.dart';

class MasterDataViewModel extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Map<String, dynamic>> ikuList = [];
  bool isLoading = false;
  bool isSubmitting = false;
  String? errorMessage;

  Future<void> fetchIkuMaster() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/iku-master');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is List) {
          ikuList = List<Map<String, dynamic>>.from(
            data.map((item) => Map<String, dynamic>.from(item)),
          );
        } else if (data is Map) {
          final rawList = data['data'] ?? [];
          if (rawList is List) {
            ikuList = List<Map<String, dynamic>>.from(
              rawList.map((item) => Map<String, dynamic>.from(item)),
            );
          } else {
            ikuList = [];
          }
        } else {
          ikuList = [];
        }
      } else {
        errorMessage = 'Gagal memuat data IKU (${response.statusCode})';
      }
    } catch (e) {
      errorMessage = 'Kesalahan jaringan: $e';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createIku(Map<String, dynamic> body) async {
    isSubmitting = true;
    notifyListeners();

    final Map<String, dynamic> payload = {
      'nama_indikator': body['nama_indikator'] ?? body['nama'] ?? '',
      'is_visible': body['is_visible'] ?? true,
    };

    try {
      final response = await _apiService.post('/iku-master', body: payload);
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      return false;
    } finally {
      isSubmitting = false;
      notifyListeners();
    }
  }

  Future<bool> updateIku(int id, Map<String, dynamic> body) async {
    isSubmitting = true;
    notifyListeners();

    final Map<String, dynamic> payload = {};
    if (body.containsKey('nama_indikator') || body.containsKey('nama')) {
      payload['nama_indikator'] = body['nama_indikator'] ?? body['nama'];
    }
    if (body.containsKey('is_visible')) {
      payload['is_visible'] = body['is_visible'];
    }

    try {
      final response = await _apiService.put('/iku-master/$id', body: payload);
      return response.statusCode == 200;
    } catch (e) {
      return false;
    } finally {
      isSubmitting = false;
      notifyListeners();
    }
  }

  Future<bool> deleteIku(int id) async {
    isSubmitting = true;
    notifyListeners();

    try {
      final response = await _apiService.delete('/iku-master/$id');
      return response.statusCode == 200;
    } catch (e) {
      return false;
    } finally {
      isSubmitting = false;
      notifyListeners();
    }
  }
}
