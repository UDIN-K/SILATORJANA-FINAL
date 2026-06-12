import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import '../constants/api_config.dart';
import '../../features/auth/services/auth_service.dart';

class ApiService {
  final AuthService _authService = AuthService();

  Future<Map<String, String>> _getHeaders() async {
    final token = await _authService.getToken();
    return {
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<http.Response> get(String endpoint) async {
    final headers = await _getHeaders();
    return await http.get(Uri.parse('${ApiConfig.baseUrl}$endpoint'), headers: headers);
  }

  Future<http.Response> post(String endpoint, {Map<String, dynamic>? body}) async {
    final headers = await _getHeaders();
    return await http.post(
      Uri.parse('${ApiConfig.baseUrl}$endpoint'),
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
  }

  Future<http.Response> put(String endpoint, {Map<String, dynamic>? body}) async {
    final headers = await _getHeaders();
    return await http.put(
      Uri.parse('${ApiConfig.baseUrl}$endpoint'),
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
  }

  Future<http.Response> delete(String endpoint) async {
    final headers = await _getHeaders();
    return await http.delete(
      Uri.parse('${ApiConfig.baseUrl}$endpoint'),
      headers: headers,
    );
  }

  Future<http.Response> patch(String endpoint, {Map<String, dynamic>? body}) async {
    final headers = await _getHeaders();
    return await http.patch(
      Uri.parse('${ApiConfig.baseUrl}$endpoint'),
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
  }

  MediaType _getMediaType(String path) {
    final ext = path.split('.').last.toLowerCase();
    switch (ext) {
      case 'pdf':
        return MediaType('application', 'pdf');
      case 'doc':
        return MediaType('application', 'msword');
      case 'docx':
        return MediaType('application', 'vnd.openxmlformats-officedocument.wordprocessingml.document');
      case 'png':
        return MediaType('image', 'png');
      case 'jpg':
      case 'jpeg':
        return MediaType('image', 'jpeg');
      default:
        return MediaType('application', 'octet-stream');
    }
  }

  Future<void> _addFileToMultipartRequest(
    http.MultipartRequest request,
    String key,
    dynamic item,
  ) async {
    if (item is PlatformFile) {
      if (kIsWeb) {
        if (item.bytes != null) {
          final contentType = _getMediaType(item.name);
          final mf = http.MultipartFile.fromBytes(
            key,
            item.bytes!,
            filename: item.name,
            contentType: contentType,
          );
          request.files.add(mf);
        }
      } else {
        if (item.path != null) {
          final file = File(item.path!);
          if (await file.exists()) {
            final contentType = _getMediaType(item.path!);
            final mf = await http.MultipartFile.fromPath(
              key,
              item.path!,
              contentType: contentType,
            );
            request.files.add(mf);
          }
        }
      }
    } else if (item is String) {
      if (!kIsWeb) {
        final file = File(item);
        if (await file.exists()) {
          final contentType = _getMediaType(item);
          final mf = await http.MultipartFile.fromPath(
            key,
            item,
            contentType: contentType,
          );
          request.files.add(mf);
        }
      }
    }
  }

  /// Upload file(s) via multipart/form-data
  /// [fields] — text fields to include
  /// [files] — map of field_name -> File path, PlatformFile, or list of them
  Future<http.Response> postMultipart(
    String endpoint, {
    Map<String, String>? fields,
    Map<String, dynamic>? files,
  }) async {
    final token = await AuthService().getToken();
    final uri = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final request = http.MultipartRequest('POST', uri);

    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
      request.headers['Accept'] = 'application/json';
    }

    if (fields != null) request.fields.addAll(fields);

    if (files != null) {
      for (final entry in files.entries) {
        if (entry.value is List) {
          for (final item in entry.value) {
            await _addFileToMultipartRequest(request, entry.key, item);
          }
        } else {
          await _addFileToMultipartRequest(request, entry.key, entry.value);
        }
      }
    }

    final streamed = await request.send();
    return await http.Response.fromStream(streamed);
  }
}
