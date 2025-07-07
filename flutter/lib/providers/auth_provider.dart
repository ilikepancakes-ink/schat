import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../models/user.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  bool _isAuthenticated = false;
  String? _token;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  String? get token => _token;

  AuthProvider() {
    _loadStoredAuth();
  }

  Future<void> _loadStoredAuth() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final storedToken = prefs.getString('auth_token');
      
      if (storedToken != null) {
        _token = storedToken;
        // Validate token with server
        final isValid = await ApiService.validateToken(storedToken);
        if (isValid) {
          _isAuthenticated = true;
          // Load user data
          final userData = await ApiService.getCurrentUser(storedToken);
          if (userData != null) {
            _user = User.fromJson(userData);
          }
        } else {
          await _clearAuth();
        }
      }
    } catch (e) {
      debugPrint('Error loading stored auth: $e');
      await _clearAuth();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await ApiService.login(username, password);
      
      if (result['success'] == true) {
        _token = result['token'];
        _user = User.fromJson(result['user']);
        _isAuthenticated = true;
        
        // Store token
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _token!);
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      debugPrint('Login error: $e');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String username, String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await ApiService.register(username, email, password);
      
      if (result['success'] == true) {
        _token = result['token'];
        _user = User.fromJson(result['user']);
        _isAuthenticated = true;
        
        // Store token
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _token!);
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      debugPrint('Register error: $e');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _clearAuth();
    notifyListeners();
  }

  Future<void> _clearAuth() async {
    _user = null;
    _token = null;
    _isAuthenticated = false;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }
}
