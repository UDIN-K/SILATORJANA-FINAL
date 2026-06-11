import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../constants/api_config.dart';
import '../../features/auth/services/auth_service.dart';

class ApiService {
  final AuthService _authService = AuthService();

  Future<Map<String, String>> _getHeaders() async {
    final token = await _authService.getToken();
    return {
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json',
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

  /// Upload file(s) via multipart/form-data
  /// [fields] — text fields to include
  /// [files] — map of field_name -> File path
  Future<http.Response> postMultipart(
    String endpoint, {
    Map<String, String>? fields,
    Map<String, dynamic>? files, // fieldName -> filePath or List<filePath>
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
          for (final path in entry.value) {
            final file = File(path.toString());
            if (await file.exists()) {
              final mf = await http.MultipartFile.fromPath(entry.key, path.toString());
              request.files.add(mf);
            }
          }
        } else {
          final file = File(entry.value.toString());
          if (await file.exists()) {
            final mf = await http.MultipartFile.fromPath(entry.key, entry.value.toString());
            request.files.add(mf);
          }
        }
      }
    }

    final streamed = await request.send();
    return await http.Response.fromStream(streamed);
  }

  Future<http.Response> delete(String endpoint) async {
    final headers = await _getHeaders();
    return await http.delete(
      Uri.parse('${ApiConfig.baseUrl}$endpoint'),
      headers: headers,
    );
  }
}
