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
  static const _emailKey = 'auth_email';
  static const _passwordKey = 'auth_password';

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

  static const _accountsKey = 'auth_biometric_accounts';

  /// Save credentials for an account (add or update)
  Future<void> saveCredentials(String email, String password, {String? nama, String? role}) async {
    if (_useMemory) return;
    final accounts = await getAllAccounts();
    // Remove existing entry for this email
    accounts.removeWhere((a) => a['email'] == email);
    // Add updated entry
    accounts.add({
      'email': email,
      'password': password,
      if (nama != null) 'nama': nama,
      if (role != null) 'role': role,
    });
    await _storage.write(key: _accountsKey, value: jsonEncode(accounts));
  }

  /// Save multiple credentials at once to avoid race conditions
  Future<void> saveCredentialsBulk(List<Map<String, String>> newAccounts) async {
    if (_useMemory) return;
    final accounts = await getAllAccounts();
    for (final newAcc in newAccounts) {
      final email = newAcc['email'];
      if (email != null) {
        accounts.removeWhere((a) => a['email'] == email);
        accounts.add(newAcc);
      }
    }
    await _storage.write(key: _accountsKey, value: jsonEncode(accounts));
  }

  /// Delete credentials for a specific email, or all if email is null
  Future<void> deleteCredentials([String? email]) async {
    if (_useMemory) return;
    if (email == null) {
      await _storage.delete(key: _accountsKey);
      // Also clean up legacy keys
      await _storage.delete(key: _emailKey);
      await _storage.delete(key: _passwordKey);
    } else {
      final accounts = await getAllAccounts();
      accounts.removeWhere((a) => a['email'] == email);
      if (accounts.isEmpty) {
        await _storage.delete(key: _accountsKey);
      } else {
        await _storage.write(key: _accountsKey, value: jsonEncode(accounts));
      }
    }
  }

  /// Delete multiple credentials at once to avoid race conditions
  Future<void> deleteCredentialsBulk(List<String> emails) async {
    if (_useMemory) return;
    final accounts = await getAllAccounts();
    accounts.removeWhere((a) => emails.contains(a['email']));
    if (accounts.isEmpty) {
      await _storage.delete(key: _accountsKey);
    } else {
      await _storage.write(key: _accountsKey, value: jsonEncode(accounts));
    }
  }

  /// Get first stored credential (backward compat)
  Future<Map<String, String>?> getCredentials() async {
    final accounts = await getAllAccounts();
    if (accounts.isEmpty) return null;
    final a = accounts.first;
    return {'email': a['email']!, 'password': a['password']!};
  }

  /// Get ALL stored biometric accounts
  Future<List<Map<String, String>>> getAllAccounts() async {
    if (_useMemory) return [];
    try {
      final raw = await _storage.read(key: _accountsKey);
      if (raw != null) {
        final List<dynamic> list = jsonDecode(raw);
        return list.map((e) => Map<String, String>.from(e as Map)).toList();
      }
      // Migrate legacy single-account keys
      final email = await _storage.read(key: _emailKey);
      final password = await _storage.read(key: _passwordKey);
      if (email != null && password != null) {
        final accounts = [{'email': email, 'password': password}];
        await _storage.write(key: _accountsKey, value: jsonEncode(accounts));
        return accounts;
      }
      return [];
    } catch (e) {
      return [];
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

  /// Login using biometric token (no password needed)
  Future<bool> biometricLogin(String email, String biometricToken) async {
    try {
      debugPrint('AUTH: Biometric login to ${ApiConfig.baseUrl}/biometric-login');
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/biometric-login'),
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: jsonEncode(<String, String>{
          'email': email,
          'biometric_token': biometricToken,
        }),
      );

      debugPrint('AUTH: Biometric login status=${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['token'];

        if (token != null && token.toString().isNotEmpty) {
          await _saveToken(token.toString());
          debugPrint('AUTH: Token saved (biometric)');
        }

        if (data['user'] != null) {
          _cachedUser = User.fromJson(data['user']);
          debugPrint('AUTH: User cached (biometric): ${_cachedUser!.nama}');
        }

        return true;
      }
      debugPrint('AUTH: Biometric login failed ${response.statusCode}: ${response.body}');
      return false;
    } catch (e) {
      debugPrint('AUTH ERROR biometric login: $e');
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
