class User {
  final String id;
  final String username;
  final String email;
  final String? displayName;
  final String? profilePictureUrl;
  final bool isAdmin;
  final bool isBanned;
  final bool isSiteOwner;
  final DateTime createdAt;
  final DateTime? lastSeen;

  User({
    required this.id,
    required this.username,
    required this.email,
    this.displayName,
    this.profilePictureUrl,
    required this.isAdmin,
    required this.isBanned,
    required this.isSiteOwner,
    required this.createdAt,
    this.lastSeen,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      displayName: json['display_name'],
      profilePictureUrl: json['profile_picture_url'],
      isAdmin: json['is_admin'] ?? false,
      isBanned: json['is_banned'] ?? false,
      isSiteOwner: json['is_site_owner'] ?? false,
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      lastSeen: json['last_seen'] != null ? DateTime.parse(json['last_seen']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'display_name': displayName,
      'profile_picture_url': profilePictureUrl,
      'is_admin': isAdmin,
      'is_banned': isBanned,
      'is_site_owner': isSiteOwner,
      'created_at': createdAt.toIso8601String(),
      'last_seen': lastSeen?.toIso8601String(),
    };
  }

  User copyWith({
    String? id,
    String? username,
    String? email,
    String? displayName,
    String? profilePictureUrl,
    bool? isAdmin,
    bool? isBanned,
    bool? isSiteOwner,
    DateTime? createdAt,
    DateTime? lastSeen,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      profilePictureUrl: profilePictureUrl ?? this.profilePictureUrl,
      isAdmin: isAdmin ?? this.isAdmin,
      isBanned: isBanned ?? this.isBanned,
      isSiteOwner: isSiteOwner ?? this.isSiteOwner,
      createdAt: createdAt ?? this.createdAt,
      lastSeen: lastSeen ?? this.lastSeen,
    );
  }

  String get displayNameOrUsername => displayName ?? username;
}
