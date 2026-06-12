import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../auth/models/user.dart';
import '../viewmodels/profile_viewmodel.dart';

class ProfileView extends StatefulWidget {
  final User user;
  const ProfileView({super.key, required this.user});

  @override
  State<ProfileView> createState() => _ProfileViewState();
}

class _ProfileViewState extends State<ProfileView> {
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  bool _obscureCurrent = true;
  bool _obscureNew = true;

  @override
  void initState() {
    super.initState();
    // Check biometric status for THIS specific user/email
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProfileViewModel>().checkBiometricForUser(widget.user.email);
    });
  }

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  void _handleChangePassword() async {
    final viewModel = context.read<ProfileViewModel>();
    final currentPass = _currentPasswordController.text;
    final newPass = _newPasswordController.text;

    if (currentPass.isEmpty || newPass.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Form tidak boleh kosong')),
      );
      return;
    }

    final success = await viewModel.changePassword(currentPass, newPass);
    if (success && mounted) {
      _currentPasswordController.clear();
      _newPasswordController.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(viewModel.successMessage ?? 'Sukses'), backgroundColor: Colors.green),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(viewModel.errorMessage ?? 'Gagal'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Consumer<ProfileViewModel>(
        builder: (context, viewModel, child) {
          return ListView(
            padding: const EdgeInsets.all(24.0),
            children: [
              _buildProfileCard(),
              const SizedBox(height: 24),
              const Text(
                'Pengaturan Keamanan',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
              ),
              const SizedBox(height: 16),
              _buildSecuritySettings(viewModel),
              const SizedBox(height: 24),
              const Text(
                'Ubah Password',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
              ),
              const SizedBox(height: 16),
              _buildChangePasswordForm(viewModel),
            ],
          );
        },
      ),
    );
  }

  Widget _buildProfileCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: 40,
            backgroundColor: const Color(0xFFECFDF5),
            child: Text(
              widget.user.nama.substring(0, 1).toUpperCase(),
              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF047857)),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            widget.user.nama,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 8),
          Text(
            widget.user.email,
            style: const TextStyle(fontSize: 14, color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              widget.user.role.toUpperCase(),
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSecuritySettings(ProfileViewModel viewModel) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        children: [
          SwitchListTile(
            title: const Text('Login Biometrik', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
            subtitle: const Text('Gunakan wajah/sidik jari untuk masuk', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
            secondary: const Icon(LucideIcons.fingerprint, color: Color(0xFF047857)),
            activeColor: const Color(0xFF047857),
            value: viewModel.isBiometricEnabled,
            onChanged: viewModel.isLoading
                ? null
                : (val) {
                    if (val) {
                      _showEnableBiometricDialog(viewModel);
                    } else {
                      viewModel.disableBiometric();
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Login Biometrik dinonaktifkan.')));
                    }
                  },
          ),
        ],
      ),
    );
  }

  void _showEnableBiometricDialog(ProfileViewModel viewModel) {
    final passwordCtrl = TextEditingController();
    bool isObscure = true;
    bool isVerifying = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (dialogContext, setDialogState) {
            return AlertDialog(
              title: const Text('Aktifkan Biometrik', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Masukkan password Anda saat ini untuk mengaktifkan fitur login biometrik.', style: TextStyle(fontSize: 14)),
                  const SizedBox(height: 16),
                  TextField(
                    controller: passwordCtrl,
                    obscureText: isObscure,
                    enabled: !isVerifying,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      prefixIcon: const Icon(LucideIcons.lock, size: 20),
                      suffixIcon: IconButton(
                        icon: Icon(isObscure ? LucideIcons.eyeOff : LucideIcons.eye, size: 20),
                        onPressed: () => setDialogState(() => isObscure = !isObscure),
                      ),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                  if (isVerifying) ...[
                    const SizedBox(height: 16),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF047857))),
                        SizedBox(width: 12),
                        Text('Memverifikasi...', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                      ],
                    ),
                  ],
                ],
              ),
              actions: [
                TextButton(
                  onPressed: isVerifying ? null : () => Navigator.pop(dialogContext),
                  child: const Text('Batal', style: TextStyle(color: Colors.grey)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF047857), foregroundColor: Colors.white),
                  onPressed: isVerifying ? null : () async {
                    if (passwordCtrl.text.isEmpty) return;
                    setDialogState(() => isVerifying = true);
                    
                    final success = await viewModel.enableBiometric(widget.user.email, passwordCtrl.text, nama: widget.user.nama, role: widget.user.role);
                    
                    if (dialogContext.mounted) {
                      Navigator.pop(dialogContext);
                    }
                    if (mounted) {
                      if (success) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(viewModel.successMessage ?? 'Biometrik aktif!'),
                            backgroundColor: Colors.green,
                          ),
                        );
                      } else if (viewModel.errorMessage?.contains('belum mendaftarkan') == true) {
                        _showNoBiometricsDialog();
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(viewModel.errorMessage ?? 'Gagal'),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    }
                  },
                  child: const Text('Verifikasi'),
                ),
              ],
            );
          }
        );
      },
    );
  }

  void _showNoBiometricsDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(LucideIcons.fingerprint, color: Color(0xFFD97706), size: 24),
            SizedBox(width: 12),
            Expanded(child: Text('Biometrik Belum Terdaftar', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold))),
          ],
        ),
        content: const Text(
          'HP Anda belum mendaftarkan sidik jari atau wajah.\n\n'
          'Untuk menggunakan fitur ini:\n'
          '1. Buka Pengaturan HP Anda\n'
          '2. Masuk ke menu Keamanan / Biometrik\n'
          '3. Daftarkan Sidik Jari atau Wajah\n'
          '4. Kembali ke aplikasi dan coba lagi\n\n'
          'Tekan "Buka Pengaturan" untuk langsung menuju Pengaturan HP.',
          style: TextStyle(fontSize: 14, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Nanti Saja', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton.icon(
            icon: const Icon(LucideIcons.settings, size: 18),
            label: const Text('Buka Pengaturan'),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF047857), foregroundColor: Colors.white),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                // Open device settings
                await launchUrl(Uri.parse('app-settings:'));
              } catch (_) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Buka Pengaturan HP > Keamanan > Sidik Jari secara manual.')),
                  );
                }
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildChangePasswordForm(ProfileViewModel viewModel) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildPasswordField(
            controller: _currentPasswordController,
            label: 'Password Lama',
            obscure: _obscureCurrent,
            onToggleObscure: () => setState(() => _obscureCurrent = !_obscureCurrent),
          ),
          const SizedBox(height: 16),
          _buildPasswordField(
            controller: _newPasswordController,
            label: 'Password Baru',
            obscure: _obscureNew,
            onToggleObscure: () => setState(() => _obscureNew = !_obscureNew),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: viewModel.isLoading ? null : _handleChangePassword,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF047857),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: viewModel.isLoading
                  ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Simpan Password Baru', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPasswordField({
    required TextEditingController controller,
    required String label,
    required bool obscure,
    required VoidCallback onToggleObscure,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: const Icon(LucideIcons.lock, color: Color(0xFF94A3B8)),
        suffixIcon: IconButton(
          icon: Icon(obscure ? LucideIcons.eyeOff : LucideIcons.eye, color: const Color(0xFF94A3B8)),
          onPressed: onToggleObscure,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF047857)),
        ),
      ),
    );
  }
}
