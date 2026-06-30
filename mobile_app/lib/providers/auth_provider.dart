import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/models.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _loading = true;

  User? get user => _user;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    _init();
  }

  Future<void> _init() async {
    final token = await ApiService.getToken();
    if (token != null) {
      try {
        _user = await ApiService.getMe();
      } catch (_) {
        await ApiService.clearToken();
      }
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final res = await ApiService.login(email, password);
    await ApiService.setToken(res.token);
    _user = res.user;
    notifyListeners();
  }

  Future<void> register(String email, String password) async {
    final res = await ApiService.register(email, password);
    await ApiService.setToken(res.token);
    _user = res.user;
    notifyListeners();
  }

  Future<void> logout() async {
    await ApiService.clearToken();
    _user = null;
    notifyListeners();
  }
}
