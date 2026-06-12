import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show debugPrint, kIsWeb;
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user.dart';
import '../../../core/constants/api_config.dart';

class AuthService {
  // flutter_secure_storage — works on Android, iOS, Windows, macOS
  // On Web & Linux desktop, fallback to in-memory (secure storage not supported)
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token';

  // In-memory fallback for Web & Linux (no secure storage support)
  static String? _memoryToken;

  // Cached user in memory (always)
  static User? _cachedUser;

  // ──────────────────────────────────────────
  // Token helpers
  // ──────────────────────────────────────────

  static bool get _useMemory {
    if (kIsWeb) return true;
    try {
      return Platform.isLinux;
    } catch (_) {
      return false;
    }
  }

  Future<void> _saveToken(String token) async {
    if (_useMemory) {
      _memoryToken = token;
    } else {
      await _storage.write(key: _tokenKey, value: token);
    }
  }

  Future<void> _deleteToken() async {
    if (_useMemory) {
      _memoryToken = null;
    } else {
      await _storage.delete(key: _tokenKey);
    }
  }

  Future<String?> getToken() async {
    if (_useMemory) return _memoryToken;
    try {
      return await _storage.read(key: _tokenKey);
    } catch (e) {
      debugPrint('AUTH: getToken error (fallback to memory): $e');
      return _memoryToken;
    }
  }

  // ──────────────────────────────────────────
  // Auth operations
  // ──────────────────────────────────────────

  Future<bool> login(String email, String password) async {
    try {
      debugPrint('AUTH: Login to ${ApiConfig.baseUrl}/login');
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

      debugPrint('AUTH: Login status=${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['token'];

        if (token != null && token.toString().isNotEmpty) {
          await _saveToken(token.toString());
          debugPrint(
              'AUTH: Token saved (${_useMemory ? "memory" : "secure_storage"})');
        } else {
          await _saveToken('no-token');
          debugPrint('AUTH: No token from server');
        }

        // Cache user from login response
        if (data['user'] != null) {
          _cachedUser = User.fromJson(data['user']);
          debugPrint('AUTH: User cached: ${_cachedUser!.nama}');
        }

        return true;
      }
      debugPrint('AUTH: Login failed ${response.statusCode}: ${response.body}');
      return false;
    } catch (e) {
      debugPrint('AUTH ERROR login: $e');
      return false;
    }
  }

  Future<void> logout() async {
    try {
      final token = await getToken();
      if (token != null && token != 'no-token') {
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
    _cachedUser = null;
  }

  /// Check if user has a valid saved session (token exists and is not 'no-token')
  Future<bool> hasValidSession() async {
    final token = await getToken();
    return token != null && token != 'no-token';
  }

  Future<User?> getMe() async {
    // Return cached user from login if available
    if (_cachedUser != null) {
      debugPrint('AUTH: Returning cached user: ${_cachedUser!.nama}');
      return _cachedUser;
    }

    try {
      final token = await getToken();
      if (token == null || token == 'no-token') return null;

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/me'),
        headers: <String, String>{
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      debugPrint('AUTH: /me status=${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final userData = data['user'] ?? data;
        _cachedUser = User.fromJson(userData);
        return _cachedUser;
      }
    } catch (e) {
      debugPrint('AUTH ERROR getMe: $e');
    }
    return null;
  }
}
