import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  // ──────────────────────────────────────────
  // Konfigurasi Server
  // ──────────────────────────────────────────
  //
  // Untuk development pada device fisik (HP):
  //   Ganti _physicalDeviceIp di bawah dengan IP WiFi komputer kamu.
  //   Contoh: '192.168.1.10'
  //   Pastikan HP dan komputer terhubung ke WiFi yang sama.
  //
  // Untuk emulator Android → sudah otomatis pakai 10.0.2.2
  // Untuk Web/Desktop → sudah otomatis pakai localhost
  // ──────────────────────────────────────────
  static const String _customBaseUrl = 'https://luckless-flogging-stimulate.ngrok-free.dev'; // ← Diisi otomatis oleh run_auto_ip.sh jika pakai Ngrok
  static const String _physicalDeviceIp = '192.168.1.19'; // ← Ganti jika pakai HP fisik (di set otomatis ke IP wlan0 saat ini)
  static const int _port = 8000;

  static String get baseUrl {
    // 1. Jika ada Custom URL (misal: Ngrok), prioritaskan ini!
    if (_customBaseUrl.isNotEmpty) {
      return '$_customBaseUrl/api';
    }

    // Web atau Desktop → localhost
    if (kIsWeb) {
      return 'http://localhost:$_port/api';
    }

    try {
      if (Platform.isLinux || Platform.isMacOS || Platform.isWindows) {
        return 'http://localhost:$_port/api';
      }

      if (Platform.isAndroid) {
        // 10.0.2.2 adalah alias emulator ke host machine
        // Untuk device fisik, ubah _physicalDeviceIp di atas
        return 'http://$_physicalDeviceIp:$_port/api';
      }

      if (Platform.isIOS) {
        // iOS simulator → localhost, device fisik → IP WiFi
        return 'http://$_physicalDeviceIp:$_port/api';
      }
    } catch (_) {
      // Fallback jika Platform tidak tersedia
    }

    return 'http://localhost:$_port/api';
  }
}
