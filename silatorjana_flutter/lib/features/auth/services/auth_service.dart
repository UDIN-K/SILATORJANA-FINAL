import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../models/user.dart';
import '../../../core/constants/api_config.dart';

class AuthService {
  final _storage = const FlutterSecureStorage();
  static const _tokenKey = 'auth_token';

  // On web, flutter_secure_storage might have issues.
  // Use in-memory fallback for web.
  static String? _webToken;

  Future<bool> login(String email, String password) async {
    try {
      debugPrint('AUTH: Attempting login to ${ApiConfig.baseUrl}/login');
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/login'),
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
          'Accept': 'application/json',
        },
        body: jsonEncode(<String, String>{
          'email': email,
          'password': password,
        }),
      );

      debugPrint('AUTH: Login response status=${response.statusCode}');
      debugPrint('AUTH: Login response body=${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['token'];
        
        if (token != null && token.toString().isNotEmpty) {
          await _saveToken(token.toString());
          debugPrint('AUTH: Token saved successfully');
          return true;
        } else {
          // Token is null — Sanctum might not be installed.
          // Still save user data from login response for session.
          debugPrint('AUTH: No token in response, but login succeeded');
          // Store a placeholder token so getMe can try cookie-based auth
          await _saveToken('session-login');
          return true;
        }
      }
      debugPrint('AUTH: Login failed with status ${response.statusCode}');
      return false;
    } catch (e) {
      debugPrint('AUTH ERROR login: $e');
      return false;
    }
  }

  Future<void> logout() async {
    try {
      final token = await getToken();
      if (token != null && token != 'session-login') {
        await http.post(
          Uri.parse('${ApiConfig.baseUrl}/logout'),
          headers: <String, String>{
            'Authorization': 'Bearer $token',
            'Accept': 'application/json',
          },
        );
      }
    } catch (e) {
      debugPrint('AUTH ERROR logout: $e');
    }
    await _deleteToken();
  }

  Future<String?> getToken() async {
    if (kIsWeb) {
      return _webToken;
    }
    return await _storage.read(key: _tokenKey);
  }

  Future<void> _saveToken(String token) async {
    if (kIsWeb) {
      _webToken = token;
    } else {
      await _storage.write(key: _tokenKey, value: token);
    }
  }

  Future<void> _deleteToken() async {
    if (kIsWeb) {
      _webToken = null;
    } else {
      await _storage.delete(key: _tokenKey);
    }
  }

  Future<User?> getMe() async {
    try {
      final token = await getToken();
      debugPrint('AUTH: getMe called, token=$token');

      if (token == null) return null;

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/me'),
        headers: <String, String>{
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      debugPrint('AUTH: /me response status=${response.statusCode}');
      debugPrint('AUTH: /me response body=${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Backend returns { user: {...} } — extract the nested user
        final userData = data['user'] ?? data;
        return User.fromJson(userData);
      }
    } catch (e) {
      debugPrint('AUTH ERROR getMe: $e');
    }
    return null;
  }
}
