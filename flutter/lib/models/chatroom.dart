class Chatroom {
  final String id;
  final String name;
  final String? description;
  final String? createdBy;
  final bool isDefault;
  final bool isStaffOnly;
  final String? inviteCode;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int memberCount;
  final String? lastMessage;
  final DateTime? lastMessageAt;

  Chatroom({
    required this.id,
    required this.name,
    this.description,
    this.createdBy,
    required this.isDefault,
    required this.isStaffOnly,
    this.inviteCode,
    required this.createdAt,
    required this.updatedAt,
    this.memberCount = 0,
    this.lastMessage,
    this.lastMessageAt,
  });

  factory Chatroom.fromJson(Map<String, dynamic> json) {
    return Chatroom(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      createdBy: json['created_by'],
      isDefault: json['is_default'] ?? false,
      isStaffOnly: json['is_staff_only'] ?? false,
      inviteCode: json['invite_code'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      memberCount: json['member_count'] ?? 0,
      lastMessage: json['last_message'],
      lastMessageAt: json['last_message_at'] != null 
          ? DateTime.parse(json['last_message_at']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'created_by': createdBy,
      'is_default': isDefault,
      'is_staff_only': isStaffOnly,
      'invite_code': inviteCode,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'member_count': memberCount,
      'last_message': lastMessage,
      'last_message_at': lastMessageAt?.toIso8601String(),
    };
  }

  Chatroom copyWith({
    String? id,
    String? name,
    String? description,
    String? createdBy,
    bool? isDefault,
    bool? isStaffOnly,
    String? inviteCode,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? memberCount,
    String? lastMessage,
    DateTime? lastMessageAt,
  }) {
    return Chatroom(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      createdBy: createdBy ?? this.createdBy,
      isDefault: isDefault ?? this.isDefault,
      isStaffOnly: isStaffOnly ?? this.isStaffOnly,
      inviteCode: inviteCode ?? this.inviteCode,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      memberCount: memberCount ?? this.memberCount,
      lastMessage: lastMessage ?? this.lastMessage,
      lastMessageAt: lastMessageAt ?? this.lastMessageAt,
    );
  }
}
