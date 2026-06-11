import 'dart:convert';
import 'package:flutter/material.dart';
import '../../kegiatan/models/kegiatan.dart';
import '../../../core/network/api_service.dart';

class LpjViewModel extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Kegiatan> lpjList = [];
  bool isLoading = false;
  String? errorMessage;
  bool isSubmitting = false;

  Map<String, dynamic>? lpjDetail;
  bool isDetailLoading = false;

  // Pencairan data
  Map<String, dynamic>? pencairanData;
  bool isPencairanLoading = false;

  /// Fetch kegiatan that are in LPJ-related statuses
  Future<void> fetchLpjList() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/kegiatan');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        List dynamicList = data['data'] ?? data;
        final all = dynamicList.map((json) => Kegiatan.fromJson(json)).toList();
        // Filter LPJ-related statuses
        lpjList = all.where((k) {
          final s = k.status.toLowerCase();
          return ['approved_wadir', 'accepted_funds', 'funds_disbursed',
                  'lpj_submitted', 'lpj_revision', 'lpj_approved', 'lpj_verified', 'lpj_done'].contains(s);
        }).toList();
      } else {
        errorMessage = 'Gagal memuat data LPJ (${response.statusCode})';
      }
    } catch (e) {
      errorMessage = 'Kesalahan jaringan: $e';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  /// Fetch LPJ detail for a specific kegiatan
  Future<void> fetchLpjDetail(int kegiatanId) async {
    isDetailLoading = true;
    lpjDetail = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/lpj/detail/$kegiatanId');
      if (response.statusCode == 200) {
        lpjDetail = jsonDecode(response.body);
      }
    } catch (e) {
      // Handle silently
    } finally {
      isDetailLoading = false;
      notifyListeners();
    }
  }

  /// Fetch pencairan data (progress, nominal, is_taken)
  Future<void> fetchPencairanData(int kegiatanId) async {
    isPencairanLoading = true;
    pencairanData = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/kegiatan/$kegiatanId/pencairan');
      if (response.statusCode == 200) {
        pencairanData = jsonDecode(response.body);
      }
    } catch (e) {
      // handle silently
    } finally {
      isPencairanLoading = false;
      notifyListeners();
    }
  }

  /// Mark dana as taken by pengusul or bendahara (with isTaken boolean toggle)
  Future<bool> tandaiDanaDiambil(int kegiatanId, bool isTaken) async {
    isSubmitting = true;
    notifyListeners();

    try {
      final response = await _apiService.post('/kegiatan/$kegiatanId/ambil-uang-muka', body: {
        'is_taken': isTaken,
      });
      if (response.statusCode == 200 || response.statusCode == 201) {
        await fetchPencairanData(kegiatanId);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    } finally {
      isSubmitting = false;
      notifyListeners();
    }
  }

  /// Submit LPJ (basic - tanpa file)
  Future<bool> submitLpj(int kegiatanId, String catatan) async {
    isSubmitting = true;
    notifyListeners();

    try {
      final response = await _apiService.post('/lpj/submit', body: {
        'kegiatan_id': kegiatanId,
        'catatan_pengusul': catatan,
      });
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      return false;
    } finally {
      isSubmitting = false;
      notifyListeners();
    }
  }

  /// Submit LPJ dengan data realisasi dan IKU capaian
  Future<Map<String, dynamic>> submitLpjRealisasi({
    required int kegiatanId,
    required String catatan,
    required Map<String, Map<String, dynamic>> realisasi, // rabId -> {qty, harga_satuan}
    required Map<String, double> ikuCapaian, // ikuId -> capaian
  }) async {
    isSubmitting = true;
    notifyListeners();

    try {
      final body = {
        'kegiatan_id': kegiatanId,
        'catatan_pengusul': catatan,
        'realisasi': realisasi.map((k, v) => MapEntry(k, v)),
        'iku_capaian': ikuCapaian.map((k, v) => MapEntry(k, v)),
      };
      final response = await _apiService.post('/lpj/submit', body: body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'message': 'LPJ berhasil disubmit!'};
      } else {
        final data = jsonDecode(response.body);
        return {'success': false, 'message': data['message'] ?? 'Gagal submit LPJ'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Kesalahan jaringan: $e'};
    } finally {
      isSubmitting = false;
      notifyListeners();
    }
  }

  /// Submit LPJ dengan data realisasi, IKU capaian, dan upload file bukti kuitansi
  Future<Map<String, dynamic>> submitLpjMultipart({
    required int kegiatanId,
    required String catatan,
    required Map<String, Map<String, dynamic>> realisasi, // rabId -> {qty, harga_satuan}
    required Map<String, double> ikuCapaian, // ikuId -> capaian
    required Map<String, List<String>> files, // rabId -> [filePaths]
  }) async {
    isSubmitting = true;
    notifyListeners();

    try {
      final fields = {
        'kegiatan_id': kegiatanId.toString(),
        'catatan_pengusul': catatan,
        'realisasi': jsonEncode(realisasi),
        'iku_capaian': jsonEncode(ikuCapaian),
      };

      final filesMap = <String, dynamic>{};
      files.forEach((rabId, filePaths) {
        filesMap['item_files[$rabId][]'] = filePaths;
      });

      final response = await _apiService.postMultipart(
        '/lpj/submit',
        fields: fields,
        files: filesMap,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'message': 'LPJ berhasil disubmit!'};
      } else {
        final data = jsonDecode(response.body);
        return {'success': false, 'message': data['message'] ?? 'Gagal submit LPJ'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Kesalahan jaringan: $e'};
    } finally {
      isSubmitting = false;
      notifyListeners();
    }
  }

  /// Approve or request revision for LPJ (bendahara action)
  Future<bool> approveLpj(int kegiatanId, String action, String catatan) async {
    isSubmitting = true;
    notifyListeners();

    try {
      final String targetStatus = action == 'approve' ? 'lpj_approved' : 'lpj_revision';
      final response = await _apiService.put('/kegiatan/$kegiatanId', body: {
        'status': targetStatus,
        'catatan_revisi': catatan,
      });
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      return false;
    } finally {
      isSubmitting = false;
      notifyListeners();
    }
  }

  /// Perform pencairan (disbursement)
  Future<Map<String, dynamic>> pencairan(int kegiatanId, double persentase, String catatan) async {
    isSubmitting = true;
    notifyListeners();

    try {
      final response = await _apiService.post('/kegiatan/$kegiatanId/pencairan', body: {
        'persentase': persentase,
        'catatan': catatan,
      });
      if (response.statusCode == 200 || response.statusCode == 201) {
        await fetchPencairanData(kegiatanId);
        return {'success': true};
      } else {
        final data = jsonDecode(response.body);
        return {'success': false, 'message': data['message'] ?? 'Gagal mencairkan dana'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Kesalahan jaringan: $e'};
    } finally {
      isSubmitting = false;
      notifyListeners();
    }
  }
}
