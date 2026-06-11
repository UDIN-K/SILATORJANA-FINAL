import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  // Automatically detect the correct base URL:
  // - Web (Chrome): use localhost
  // - Linux desktop: use localhost
  // - Android Emulator: use 10.0.2.2 (alias for host machine's localhost)
  // - Physical device: change to your WiFi IP (e.g. 192.168.1.5)
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:8000/api';
    }
    if (Platform.isLinux || Platform.isMacOS || Platform.isWindows) {
      return 'http://localhost:8000/api';
    }
    // Android Emulator
    return 'http://10.0.2.2:8000/api';
  }
}
