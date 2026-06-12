import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../viewmodels/user_management_viewmodel.dart';

/// User form — admin creates/edits a user.
/// Mirrors web's UserFormPage.tsx.
class UserFormView extends StatefulWidget {
  final Map<String, dynamic>? editUser;
  const UserFormView({super.key, this.editUser});

  @override
  State<UserFormView> createState() => _UserFormViewState();
}

class _UserFormViewState extends State<UserFormView> {
  final UserManagementViewModel _viewModel = UserManagementViewModel();
  final _namaCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  String _selectedRole = 'pengusul';
  bool _allowBiometric = true;

  bool get _isEdit => widget.editUser != null;

  static const _roles = ['admin', 'pengusul', 'verifikator', 'ppk', 'wadir1', 'wadir2', 'wadir3', 'wadir4', 'bendahara', 'rektorat'];

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      _namaCtrl.text = widget.editUser!['nama'] ?? '';
      _emailCtrl.text = widget.editUser!['email'] ?? '';
      _selectedRole = widget.editUser!['role'] ?? 'pengusul';
      _allowBiometric = widget.editUser!['allow_biometric'] == 1 || widget.editUser!['allow_biometric'] == true;
    }
  }

  @override
  void dispose() {
    _viewModel.dispose();
    _namaCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_namaCtrl.text.isEmpty || _emailCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Nama dan email wajib diisi'), backgroundColor: Colors.red));
      return;
    }

    if (!_isEdit && _passwordCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password wajib diisi'), backgroundColor: Colors.red));
      return;
    }

    final body = {
      'nama': _namaCtrl.text,
      'email': _emailCtrl.text,
      'role': _selectedRole,
      'allow_biometric': _allowBiometric,
      if (_passwordCtrl.text.isNotEmpty) 'password': _passwordCtrl.text,
    };

    final success = _isEdit
        ? await _viewModel.updateUser(widget.editUser!['id'], body)
        : await _viewModel.createUser(body);

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_isEdit ? 'User berhasil diperbarui' : 'User berhasil dibuat'), backgroundColor: const Color(0xFF047857)),
      );
      Navigator.pop(context, true);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gagal menyimpan user'), backgroundColor: Colors.red));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(_isEdit ? 'Edit User' : 'Tambah User'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 1,
      ),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildField(_namaCtrl, 'Nama Lengkap', LucideIcons.user),
                const SizedBox(height: 16),
                _buildField(_emailCtrl, 'Email', LucideIcons.mail, inputType: TextInputType.emailAddress),
                const SizedBox(height: 16),
                _buildField(_passwordCtrl, _isEdit ? 'Password Baru (opsional)' : 'Password', LucideIcons.lock, isPassword: true),
                const SizedBox(height: 16),
                // Role dropdown
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedRole,
                      isExpanded: true,
                      items: _roles.map((r) => DropdownMenuItem(value: r, child: Text(r.toUpperCase()))).toList(),
                      onChanged: (v) => setState(() => _selectedRole = v!),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: SwitchListTile(
                    title: const Text('Izinkan Login Biometrik', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: const Text('Bisa login pakai Wajah / Sidik Jari', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                    value: _allowBiometric,
                    activeColor: const Color(0xFF047857),
                    onChanged: (val) => setState(() => _allowBiometric = val),
                  ),
                ),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: _viewModel.isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF047857),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _viewModel.isSubmitting
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text(_isEdit ? 'Simpan Perubahan' : 'Buat User', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildField(TextEditingController ctrl, String label, IconData icon, {TextInputType inputType = TextInputType.text, bool isPassword = false}) {
    return TextField(
      controller: ctrl,
      keyboardType: inputType,
      obscureText: isPassword,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, size: 18),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }
}
