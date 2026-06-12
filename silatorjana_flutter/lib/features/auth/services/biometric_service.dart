import 'package:flutter/foundation.dart';
import 'package:local_auth/local_auth.dart';
import 'package:flutter/services.dart';

class BiometricService {
  final LocalAuthentication _auth = LocalAuthentication();

  Future<bool> hasBiometrics() async {
    if (kIsWeb) return false;

    try {
      final bool canAuthenticateWithBiometrics = await _auth.canCheckBiometrics;
      final bool canAuthenticate = canAuthenticateWithBiometrics || await _auth.isDeviceSupported();
      return canAuthenticate;
    } on PlatformException catch (e) {
      debugPrint('Error checking biometrics: $e');
      return false;
    }
  }

  Future<bool> authenticate() async {
    if (kIsWeb) return false;
    
    final bool isAvailable = await hasBiometrics();
    if (!isAvailable) return false;

    try {
      return await _auth.authenticate(
        localizedReason: 'Gunakan sidik jari atau wajah Anda untuk login ke Si-LATORJANA',
        biometricOnly: true,
      );
    } on PlatformException catch (e) {
      debugPrint('Biometric PlatformException: $e');
      return false;
    } catch (e) {
      debugPrint('Biometric error: $e');
      return false;
    }
  }
}
