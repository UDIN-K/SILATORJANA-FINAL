import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/network/api_service.dart';
import '../../auth/services/auth_service.dart';
import '../../auth/services/biometric_service.dart';

/// Admin page — manage biometric access for all users.
/// Admin scans fingerprint once, selects users, and assigns biometric tokens.
class BiometricManagementView extends StatefulWidget {
  const BiometricManagementView({super.key});

  @override
  State<BiometricManagementView> createState() => _BiometricManagementViewState();
}

class _BiometricManagementViewState extends State<BiometricManagementView> {
  final ApiService _api = ApiService();
  final BiometricService _biometric = BiometricService();
  final AuthService _authService = AuthService();

  List<Map<String, dynamic>> _users = [];
  final Set<int> _selectedIds = {};
  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchUsers();
  }

  Future<void> _fetchUsers() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await _api.get('/users?limit=200');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        _users = List<Map<String, dynamic>>.from(data['data'] ?? data);
      } else {
        _error = 'Gagal memuat data user';
      }
    } catch (e) {
      _error = 'Kesalahan jaringan: $e';
    }
    setState(() => _isLoading = false);
  }

  Future<void> _assignBiometric() async {
    if (_selectedIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih minimal 1 user!')),
      );
      return;
    }

    // 1. Scan fingerprint
    final authResult = await _biometric.authenticateWithStatus();
    if (authResult != 'success') {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(authResult == 'no_biometrics_enrolled'
              ? 'HP belum daftarkan sidik jari. Buka Pengaturan HP > Keamanan.'
              : 'Verifikasi sidik jari gagal.')),
        );
      }
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      // 2. Call backend to generate tokens
      final res = await _api.post('/biometric-assign', body: {
        'user_ids': _selectedIds.toList(),
      });

      debugPrint('Biometric Assign Response: status=${res.statusCode}, body=${res.body}');

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final assigned = List<Map<String, dynamic>>.from(data['assigned'] ?? []);

        // 3. Save biometric tokens to local secure storage in bulk
        final List<Map<String, String>> newAccounts = [];
        for (final account in assigned) {
          newAccounts.add({
            'email': (account['email'] ?? '').toString(),
            'password': '__biometric_token__:${account['biometric_token']}',
            'nama': (account['nama'] ?? '').toString(),
            'role': (account['role'] ?? '').toString(),
          });
        }
        await _authService.saveCredentialsBulk(newAccounts);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Biometrik berhasil didaftarkan untuk ${assigned.length} user!'),
              backgroundColor: Colors.green,
            ),
          );
          _selectedIds.clear();
          _fetchUsers();
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Gagal mendaftarkan biometrik (status ${res.statusCode}): ${res.body}'), backgroundColor: Colors.red),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }

    setState(() => _isSubmitting = false);
  }

  Future<void> _revokeBiometric() async {
    if (_selectedIds.isEmpty) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cabut Akses Biometrik?'),
        content: Text('Akses biometrik akan dicabut untuk ${_selectedIds.length} user yang dipilih.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Cabut'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isSubmitting = true);
    try {
      final res = await _api.post('/biometric-revoke', body: {
        'user_ids': _selectedIds.toList(),
      });

      if (res.statusCode == 200) {
        // Remove from local storage in bulk
        final List<String> emailsToDelete = [];
        for (final id in _selectedIds) {
          final userList = _users.where((u) => u['id'] == id);
          if (userList.isNotEmpty) {
            final email = userList.first['email'];
            if (email != null) {
              emailsToDelete.add(email.toString());
            }
          }
        }
        await _authService.deleteCredentialsBulk(emailsToDelete);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Akses biometrik dicabut.'), backgroundColor: Colors.orange),
          );
          _selectedIds.clear();
          _fetchUsers();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
    setState(() => _isSubmitting = false);
  }

  static const _roleColors = <String, Color>{
    'admin': Color(0xFFDC2626),
    'pengusul': Color(0xFF3B82F6),
    'verifikator': Color(0xFF8B5CF6),
    'ppk': Color(0xFFF59E0B),
    'bendahara': Color(0xFF047857),
    'rektorat': Color(0xFF0891B2),
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Kelola Biometrik', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
        actions: [
          if (_selectedIds.isNotEmpty) ...[
            IconButton(
              icon: const Icon(LucideIcons.shieldOff, color: Colors.red, size: 20),
              tooltip: 'Cabut Akses',
              onPressed: _isSubmitting ? null : _revokeBiometric,
            ),
          ],
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _isSubmitting ? null : _assignBiometric,
        backgroundColor: _selectedIds.isEmpty ? Colors.grey : const Color(0xFF047857),
        foregroundColor: Colors.white,
        icon: _isSubmitting
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : const Icon(LucideIcons.fingerprint, size: 20),
        label: Text(
          _selectedIds.isEmpty
              ? 'Pilih User'
              : 'Daftarkan (${_selectedIds.length})',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF047857)))
          : _error != null
              ? Center(child: Text(_error!))
              : Column(
                  children: [
                    // Header info
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.all(16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [Color(0xFF047857), Color(0xFF059669)]),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.fingerprint, color: Colors.white, size: 32),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Pendaftaran Biometrik', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                                const SizedBox(height: 4),
                                Text(
                                  'Pilih user yang ingin didaftarkan, lalu tekan tombol Daftarkan dan scan sidik jari.',
                                  style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Select all
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        children: [
                          Checkbox(
                            value: _selectedIds.length == _users.length && _users.isNotEmpty,
                            tristate: true,
                            activeColor: const Color(0xFF047857),
                            onChanged: (val) {
                              setState(() {
                                if (_selectedIds.length == _users.length) {
                                  _selectedIds.clear();
                                } else {
                                  _selectedIds.addAll(_users.map((u) => u['id'] as int));
                                }
                              });
                            },
                          ),
                          Text('Pilih Semua (${_users.length} user)', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          const Spacer(),
                          if (_selectedIds.isNotEmpty)
                            Text('${_selectedIds.length} dipilih', style: const TextStyle(color: Color(0xFF047857), fontWeight: FontWeight.bold, fontSize: 13)),
                        ],
                      ),
                    ),
                    const Divider(height: 1),
                    // User list
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: _fetchUsers,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          itemCount: _users.length,
                          itemBuilder: (context, index) {
                            final user = _users[index];
                            final userId = user['id'] as int;
                            final role = (user['role'] ?? '').toString();
                            final roleColor = _roleColors[role.startsWith('wadir') ? 'ppk' : role] ?? const Color(0xFF64748B);
                            final hasBiometric = user['allow_biometric'] == true || user['allow_biometric'] == 1;
                            final isSelected = _selectedIds.contains(userId);

                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFFECFDF5) : Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: isSelected ? const Color(0xFF047857) : const Color(0xFFE2E8F0)),
                              ),
                              child: CheckboxListTile(
                                activeColor: const Color(0xFF047857),
                                value: isSelected,
                                onChanged: (val) {
                                  setState(() {
                                    if (val == true) {
                                      _selectedIds.add(userId);
                                    } else {
                                      _selectedIds.remove(userId);
                                    }
                                  });
                                },
                                secondary: CircleAvatar(
                                  backgroundColor: roleColor.withValues(alpha: 0.1),
                                  child: Icon(LucideIcons.user, color: roleColor, size: 20),
                                ),
                                title: Row(
                                  children: [
                                    Expanded(
                                      child: Text(user['nama'] ?? '-', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                    ),
                                    if (hasBiometric)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFECFDF5),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: const Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(LucideIcons.fingerprint, size: 12, color: Color(0xFF047857)),
                                            SizedBox(width: 4),
                                            Text('Aktif', style: TextStyle(fontSize: 10, color: Color(0xFF047857), fontWeight: FontWeight.bold)),
                                          ],
                                        ),
                                      ),
                                  ],
                                ),
                                subtitle: Row(
                                  children: [
                                    Expanded(child: Text(user['email'] ?? '-', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)))),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(color: roleColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                                      child: Text(role.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: roleColor)),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }
}
