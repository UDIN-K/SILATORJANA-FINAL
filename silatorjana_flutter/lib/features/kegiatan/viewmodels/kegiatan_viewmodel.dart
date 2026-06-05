import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/kegiatan.dart';
import '../../../core/network/api_service.dart';
import '../../../core/utils/notification_service.dart';

class KegiatanViewModel extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final NotificationService _notificationService = NotificationService();

  List<Kegiatan> kegiatanList = [];
  bool isListLoading = false;
  String? listErrorMessage;

  Map<String, dynamic>? detailData;
  bool isDetailLoading = false;
  String? detailErrorMessage;

  bool isActionLoading = false;

  Future<void> fetchKegiatanList() async {
    isListLoading = true;
    listErrorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/kegiatan');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        List dynamicList = data['data'] ?? data;
        kegiatanList = dynamicList.map((json) => Kegiatan.fromJson(json)).toList();
      } else {
        listErrorMessage = 'Gagal memuat data (Status: ${response.statusCode})';
      }
    } catch (e) {
      listErrorMessage = 'Terjadi kesalahan jaringan: $e';
    } finally {
      isListLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchKegiatanDetail(int id) async {
    isDetailLoading = true;
    detailErrorMessage = null;
    detailData = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/kegiatan/$id');
      if (response.statusCode == 200) {
        detailData = jsonDecode(response.body);
      } else {
        detailErrorMessage = 'Gagal memuat detail.';
      }
    } catch (e) {
      detailErrorMessage = 'Terjadi kesalahan jaringan: $e';
    } finally {
      isDetailLoading = false;
      notifyListeners();
    }
  }

  Future<bool> submitAction(int id, String action, String catatan) async {
    isActionLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/kegiatan/$id/status',
        body: {'action': action, 'catatan': catatan},
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        isActionLoading = false;
        notifyListeners();
        
        final actionText = action == 'approve' ? 'Disetujui' : 'Direvisi';
        _notificationService.showNotification(
          id: id,
          title: 'Status Proposal Diperbarui',
          body: 'Proposal (ID: $id) telah berhasil $actionText.',
        );

        return true;
      } else {
        isActionLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      isActionLoading = false;
      notifyListeners();
      return false;
    }
  }
}
