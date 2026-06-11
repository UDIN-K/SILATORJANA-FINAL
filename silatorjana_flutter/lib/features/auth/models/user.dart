
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
}
