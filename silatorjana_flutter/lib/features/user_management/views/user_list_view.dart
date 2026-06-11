import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../viewmodels/user_management_viewmodel.dart';
import 'user_form_view.dart';
import 'user_detail_view.dart';

/// User list — admin only. Mirrors web's UserManagementPage.tsx.
class UserListView extends StatefulWidget {
  const UserListView({super.key});

  @override
  State<UserListView> createState() => _UserListViewState();
}

class _UserListViewState extends State<UserListView> {
  final UserManagementViewModel _viewModel = UserManagementViewModel();
  String _search = '';

  @override
  void initState() {
    super.initState();
    _viewModel.fetchUsers();
  }

  @override
  void dispose() {
    _viewModel.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> get _filtered {
    if (_search.isEmpty) return _viewModel.users;
    return _viewModel.users.where((u) {
      final nama = (u['nama'] ?? '').toString().toLowerCase();
      final email = (u['email'] ?? '').toString().toLowerCase();
      return nama.contains(_search.toLowerCase()) || email.contains(_search.toLowerCase());
    }).toList();
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
      appBar: MediaQuery.of(context).size.width >= 768
          ? null
          : AppBar(
              title: const Text('Management Users'),
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF0F172A),
              elevation: 1,
              actions: [
                IconButton(icon: const Icon(LucideIcons.refreshCw, size: 20), onPressed: () => _viewModel.fetchUsers()),
              ],
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const UserFormView())).then((result) {
            if (result == true) _viewModel.fetchUsers();
          });
        },
        backgroundColor: const Color(0xFF047857),
        foregroundColor: Colors.white,
        icon: const Icon(LucideIcons.userPlus, size: 20),
        label: const Text('Tambah User', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) {
          if (_viewModel.isLoading) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF047857)));
          }

          if (_viewModel.errorMessage != null) {
            return Center(child: Text(_viewModel.errorMessage!));
          }

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: TextField(
                  onChanged: (v) => setState(() => _search = v),
                  decoration: InputDecoration(
                    hintText: 'Cari nama atau email...',
                    prefixIcon: const Icon(LucideIcons.search, size: 18),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  ),
                ),
              ),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () => _viewModel.fetchUsers(),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _filtered.length,
                    itemBuilder: (context, index) {
                      final user = _filtered[index];
                      final role = (user['role'] ?? '').toString();
                      final roleColor = _roleColors[role.startsWith('wadir') ? 'ppk' : role] ?? const Color(0xFF64748B);

                      return InkWell(
                        onTap: () {
                          final userId = user['id'];
                          if (userId != null) {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => UserDetailView(userId: userId is int ? userId : int.parse(userId.toString())),
                              ),
                            );
                          }
                        },
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: roleColor.withValues(alpha: 0.1),
                                child: Icon(LucideIcons.user, color: roleColor, size: 20),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(user['nama'] ?? '-', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                    Text(user['email'] ?? '-', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(color: roleColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                                child: Text(role.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: roleColor)),
                              ),
                              const SizedBox(width: 8),
                              IconButton(
                                icon: const Icon(LucideIcons.edit, size: 16, color: Color(0xFF64748B)),
                                onPressed: () {
                                  Navigator.push(context, MaterialPageRoute(builder: (_) => UserFormView(editUser: user))).then((result) {
                                    if (result == true) _viewModel.fetchUsers();
                                  });
                                },
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
          );
        },
      ),
    );
  }
}
