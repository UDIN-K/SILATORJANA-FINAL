
class User {
  final int id;
  final String nama;
  final String email;
  final String role;

  User({required this.id, required this.nama, required this.email, required this.role});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      nama: json['nama'] ?? json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? '',
    );
  }

  String get wadirTarget {
    final n = nama.toLowerCase();
    final e = email.toLowerCase();
    if (n.contains('wadir i') && !n.contains('ii') && !n.contains('iv')) return 'wadir1';
    if (n.contains('1') || n.contains('satu') || e.contains('1')) return 'wadir1';

    if (n.contains('wadir ii') && !n.contains('iii')) return 'wadir2';
    if (n.contains('2') || n.contains('dua') || e.contains('2')) return 'wadir2';

    if (n.contains('wadir iii')) return 'wadir3';
    if (n.contains('3') || n.contains('tiga') || e.contains('3')) return 'wadir3';

    if (n.contains('wadir iv')) return 'wadir4';
    if (n.contains('4') || n.contains('empat') || e.contains('4')) return 'wadir4';

    return '';
  }
}
