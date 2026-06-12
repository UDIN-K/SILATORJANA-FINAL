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

  /// Returns: 'success', 'no_biometrics_enrolled', 'cancelled', or 'error:...'
  Future<String> authenticateWithStatus() async {
    if (kIsWeb) return 'error:Web not supported';

    final bool isAvailable = await hasBiometrics();
    if (!isAvailable) return 'error:Device not supported';

    try {
      final result = await _auth.authenticate(
        localizedReason: 'Gunakan sidik jari atau wajah Anda untuk login ke Si-LATORJANA',
        biometricOnly: true,
      );
      return result ? 'success' : 'cancelled';
    } on PlatformException catch (e) {
      debugPrint('Biometric PlatformException: ${e.code} ${e.message}');
      if (e.code == 'NotEnrolled' || e.code == 'notEnrolled' || e.code == 'noBiometricsEnrolled' || (e.message?.toLowerCase().contains('enroll') ?? false)) {
        return 'no_biometrics_enrolled';
      }
      return 'error:${e.message}';
    } catch (e) {
      debugPrint('Biometric error: $e');
      final errStr = e.toString().toLowerCase();
      if (errStr.contains('nobiometricsenrolled') || errStr.contains('notenrolled') || errStr.contains('enroll')) {
        return 'no_biometrics_enrolled';
      }
      return 'error:$e';
    }
  }

  /// Legacy method for login page
  Future<bool> authenticate() async {
    final result = await authenticateWithStatus();
    return result == 'success';
  }
}
