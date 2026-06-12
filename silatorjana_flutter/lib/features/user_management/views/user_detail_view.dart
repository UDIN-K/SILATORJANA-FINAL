import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/network/api_service.dart';

/// UserDetailView — mirrors web's UserDetailPage.tsx
/// Shows user profile card with gradient header, details, and activity list.
class UserDetailView extends StatefulWidget {
  final int userId;
  const UserDetailView({super.key, required this.userId});

  @override
  State<UserDetailView> createState() => _UserDetailViewState();
}

class _UserDetailViewState extends State<UserDetailView> {
  final ApiService _api = ApiService();
  bool _isLoading = true;
  Map<String, dynamic>? _user;

  static const _roleLabels = {
    'admin': 'Administrator', 'pengusul': 'Pengusul', 'verifikator': 'Verifikator',
    'ppk': 'PPK', 'wadir1': 'Wakil Direktur I', 'wadir2': 'Wakil Direktur II',
    'wadir3': 'Wakil Direktur III', 'wadir4': 'Wakil Direktur IV',
    'bendahara': 'Bendahara', 'rektorat': 'Rektorat',
  };

  static const _roleColors = {
    'admin': Color(0xFF7C3AED), 'pengusul': Color(0xFF2563EB), 'verifikator': Color(0xFF047857),
    'ppk': Color(0xFFD97706), 'bendahara': Color(0xFFE11D48), 'rektorat': Color(0xFF0891B2),
  };

  @override
  void initState() {
    super.initState();
    _fetchUser();
  }

  Future<void> _fetchUser() async {
    try {
      final res = await _api.get('/users/${widget.userId}');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        _user = data is Map<String, dynamic> ? data : null;
      }
    } catch (e) {
      debugPrint('UserDetail ERROR: $e');
    }
    if (mounted) setState(() => _isLoading = false);
  }

  String _fmtDate(String? iso) {
    if (iso == null || iso.length < 10) return '-';
    final p = iso.substring(0, 10).split('-');
    if (p.length == 3) return '${p[2]}/${p[1]}/${p[0]}';
    return iso;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Detail User'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 1,
      ),
      body: _isLoading
        ? const Center(child: CircularProgressIndicator(color: Color(0xFF047857)))
        : _user == null
          ? const Center(child: Text('User tidak ditemukan.', style: TextStyle(color: Color(0xFF94A3B8))))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Profile card with gradient header
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      children: [
                        // Gradient header
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(colors: [Color(0xFF047857), Color(0xFF059669)]),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 28,
                                backgroundColor: Colors.white24,
                                child: Text(
                                  (_user!['nama']?.toString() ?? '?')[0].toUpperCase(),
                                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(_user!['nama']?.toString() ?? 'Tanpa Nama', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: (_roleColors[_user!['role']] ?? const Color(0xFF64748B)).withValues(alpha: 0.3),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        _roleLabels[_user!['role']] ?? _user!['role']?.toString() ?? '-',
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Detail fields
                        Container(
                          color: Colors.white,
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            children: [
                              _detailField(LucideIcons.user, 'Nama Lengkap', _user!['nama']?.toString() ?? '-'),
                              _detailField(LucideIcons.mail, 'Email', _user!['email']?.toString() ?? '-'),
                              _detailField(LucideIcons.shield, 'Role', _roleLabels[_user!['role']] ?? _user!['role']?.toString() ?? '-'),
                              _detailField(LucideIcons.building2, 'Jurusan', _user!['jurusan']?.toString() ?? '-'),
                              _detailField(LucideIcons.hash, 'NIP', _user!['nip']?.toString() ?? '-'),
                              _detailField(LucideIcons.fingerprint, 'Biometrik', (_user!['allow_biometric'] == 1 || _user!['allow_biometric'] == true) ? 'Diizinkan' : 'Dinonaktifkan'),
                              _detailField(LucideIcons.calendar, 'Dibuat', _fmtDate(_user!['created_at']?.toString())),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _detailField(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, size: 16, color: const Color(0xFF64748B)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF94A3B8), letterSpacing: 0.5)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 14, color: Color(0xFF0F172A))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
