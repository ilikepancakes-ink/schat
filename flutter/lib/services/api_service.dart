import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';

class ApiService {
  static const String baseUrl = 'https://chat.ilikepancakes.ink';
  
  static Map<String, String> _getHeaders({String? token}) {
    final headers = {
      'Content-Type': 'application/json',
    };
    
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
      headers['Cookie'] = 'auth-token=$token';
    }
    
    return headers;
  }

  // Authentication
  static Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/login'),
        headers: _getHeaders(),
        body: jsonEncode({
          'username': username,
          'password': password,
        }),
      );

      return jsonDecode(response.body);
    } catch (e) {
      debugPrint('Login API error: $e');
      return {'success': false, 'error': 'Network error'};
    }
  }

  static Future<Map<String, dynamic>> register(String username, String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/register'),
        headers: _getHeaders(),
        body: jsonEncode({
          'username': username,
          'email': email,
          'password': password,
        }),
      );

      return jsonDecode(response.body);
    } catch (e) {
      debugPrint('Register API error: $e');
      return {'success': false, 'error': 'Network error'};
    }
  }

  static Future<bool> validateToken(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/auth/validate'),
        headers: _getHeaders(token: token),
      );

      final data = jsonDecode(response.body);
      return data['success'] == true;
    } catch (e) {
      debugPrint('Token validation error: $e');
      return false;
    }
  }

  static Future<Map<String, dynamic>?> getCurrentUser(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/auth/me'),
        headers: _getHeaders(token: token),
      );

      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return data['user'];
      }
      return null;
    } catch (e) {
      debugPrint('Get current user error: $e');
      return null;
    }
  }

  // Chatrooms
  static Future<Map<String, dynamic>> getChatrooms(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/chatrooms'),
        headers: _getHeaders(token: token),
      );

      return jsonDecode(response.body);
    } catch (e) {
      debugPrint('Get chatrooms error: $e');
      return {'success': false, 'error': 'Network error'};
    }
  }

  static Future<Map<String, dynamic>> getChatroomMessages(String chatroomId, String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/chatrooms/$chatroomId/messages'),
        headers: _getHeaders(token: token),
      );

      return jsonDecode(response.body);
    } catch (e) {
      debugPrint('Get messages error: $e');
      return {'success': false, 'error': 'Network error'};
    }
  }

  static Future<Map<String, dynamic>> sendMessage(String chatroomId, String content, String token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/chatrooms/$chatroomId/messages'),
        headers: _getHeaders(token: token),
        body: jsonEncode({
          'content': content,
        }),
      );

      return jsonDecode(response.body);
    } catch (e) {
      debugPrint('Send message error: $e');
      return {'success': false, 'error': 'Network error'};
    }
  }

  static Future<Map<String, dynamic>> joinChatroom(String inviteCode, String token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/chatrooms/join'),
        headers: _getHeaders(token: token),
        body: jsonEncode({
          'inviteCode': inviteCode,
        }),
      );

      return jsonDecode(response.body);
    } catch (e) {
      debugPrint('Join chatroom error: $e');
      return {'success': false, 'error': 'Network error'};
    }
  }

  // User Profile
  static Future<Map<String, dynamic>> getUserProfile(String userId, String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/users/$userId'),
        headers: _getHeaders(token: token),
      );

      return jsonDecode(response.body);
    } catch (e) {
      debugPrint('Get user profile error: $e');
      return {'success': false, 'error': 'Network error'};
    }
  }

  static Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> profileData, String token) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/api/users/profile'),
        headers: _getHeaders(token: token),
        body: jsonEncode(profileData),
      );

      return jsonDecode(response.body);
    } catch (e) {
      debugPrint('Update profile error: $e');
      return {'success': false, 'error': 'Network error'};
    }
  }

  // Friends
  static Future<Map<String, dynamic>> getFriends(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/friends'),
        headers: _getHeaders(token: token),
      );

      return jsonDecode(response.body);
    } catch (e) {
      debugPrint('Get friends error: $e');
      return {'success': false, 'error': 'Network error'};
    }
  }

  static Future<Map<String, dynamic>> sendFriendRequest(String username, String token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/friends/request'),
        headers: _getHeaders(token: token),
        body: jsonEncode({
          'username': username,
        }),
      );

      return jsonDecode(response.body);
    } catch (e) {
      debugPrint('Send friend request error: $e');
      return {'success': false, 'error': 'Network error'};
    }
  }
}
