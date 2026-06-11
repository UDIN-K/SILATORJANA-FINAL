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

  /// Submit approve/reject action using PUT /kegiatan/{id}.
  /// [newStatus] is the exact target status string (e.g. 'verified', 'revision_requested', 'approved_ppk').
  /// [catatan] is the revision note (required for reject, optional for approve).
  Future<bool> submitAction(int id, String newStatus, String catatan) async {
    isActionLoading = true;
    notifyListeners();

    try {
      final body = <String, dynamic>{
        'status': newStatus,
      };
      // Only include catatan_revisi for rejection/revision statuses
      if (newStatus == 'revision_requested' || newStatus == 'lpj_revision') {
        body['catatan_revisi'] = catatan;
      } else if (catatan.isNotEmpty) {
        body['catatan_revisi'] = catatan;
      }

      final response = await _apiService.put(
        '/kegiatan/$id',
        body: body,
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        isActionLoading = false;
        notifyListeners();
        
        final isApprove = !newStatus.contains('revision') && newStatus != 'rejected';
        final actionText = isApprove ? 'Disetujui' : 'Diminta Revisi';
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

  /// Submit action with custom body (for Kode MAK, etc.)
  Future<bool> submitActionWithBody(int id, Map<String, dynamic> body) async {
    isActionLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.put(
        '/kegiatan/$id',
        body: body,
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        isActionLoading = false;
        notifyListeners();
        
        final isApprove = !(body['status']?.toString().contains('revision') ?? false) && body['status'] != 'rejected';
        final actionText = isApprove ? 'Disetujui' : 'Diminta Revisi';
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

  /// Tambah pencairan dana (Bendahara)
  Future<bool> tambahPencairan(int id, double persentase, String catatan) async {
    isActionLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/kegiatan/$id/pencairan',
        body: {'persentase': persentase, 'catatan': catatan},
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        // Refresh detail
        await fetchKegiatanDetail(id);
        isActionLoading = false;
        notifyListeners();
        return true;
      }
      isActionLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      isActionLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Tandai dana sudah diambil (Bendahara)
  Future<bool> ambilUangMuka(int id) async {
    isActionLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.post('/kegiatan/$id/ambil-uang-muka');
      if (response.statusCode == 200 || response.statusCode == 201) {
        // Refresh detail
        await fetchKegiatanDetail(id);
        isActionLoading = false;
        notifyListeners();
        return true;
      }
      isActionLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      isActionLoading = false;
      notifyListeners();
      return false;
    }
  }
}
