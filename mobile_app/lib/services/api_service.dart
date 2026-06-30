import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

class ApiService {
  static const String baseUrl = 'http://10.0.2.2:4000/api';
  static const String _tokenKey = 'auth_token';

  static String? _cachedToken;

  static Future<String?> getToken() async {
    if (_cachedToken != null) return _cachedToken;
    final prefs = await SharedPreferences.getInstance();
    _cachedToken = prefs.getString(_tokenKey);
    return _cachedToken;
  }

  static Future<void> setToken(String token) async {
    _cachedToken = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  static Future<void> clearToken() async {
    _cachedToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_cachedToken != null) 'Authorization': 'Bearer $_cachedToken',
      };

  static Future<T> _request<T>(
    String endpoint,
    T Function(Map<String, dynamic>) fromJson, {
    String method = 'GET',
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    late http.Response res;

    if (method == 'GET') {
      res = await http.get(uri, headers: _headers);
    } else if (method == 'DELETE') {
      res = await http.delete(uri, headers: _headers);
    } else {
      res = await http.post(
        uri,
        headers: _headers,
        body: body != null ? jsonEncode(body) : null,
      );
      if (method == 'PUT') {
        res = await http.put(
          uri,
          headers: _headers,
          body: body != null ? jsonEncode(body) : null,
        );
      }
    }

    if (res.statusCode == 401) {
      await clearToken();
      throw Exception('Session expired');
    }
    if (res.statusCode == 204) {
      return fromJson({});
    }
    if (res.statusCode >= 400) {
      final err = jsonDecode(res.body) as Map<String, dynamic>;
      throw Exception(err['error'] as String? ?? 'Request failed');
    }
    return fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  static Future<List<T>> _requestList<T>(
    String endpoint,
    T Function(Map<String, dynamic>) fromJson, {
    String method = 'GET',
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    late http.Response res;

    if (method == 'GET') {
      res = await http.get(uri, headers: _headers);
    } else {
      res = await http.post(
        uri,
        headers: _headers,
        body: body != null ? jsonEncode(body) : null,
      );
    }

    if (res.statusCode == 401) {
      await clearToken();
      throw Exception('Session expired');
    }
    if (res.statusCode >= 400) {
      final err = jsonDecode(res.body) as Map<String, dynamic>;
      throw Exception(err['error'] as String? ?? 'Request failed');
    }
    final list = jsonDecode(res.body) as List<dynamic>;
    return list.map((e) => fromJson(e as Map<String, dynamic>)).toList();
  }

  // Auth
  static Future<AuthResponse> register(String email, String password) async {
    return _request<AuthResponse>(
      '/auth/register',
      (json) => AuthResponse.fromJson(json),
      method: 'POST',
      body: {'email': email, 'password': password},
    );
  }

  static Future<AuthResponse> login(String email, String password) async {
    final res = await _request<AuthResponse>(
      '/auth/login',
      (json) => AuthResponse.fromJson(json),
      method: 'POST',
      body: {'email': email, 'password': password},
    );
    _cachedToken = res.token;
    return res;
  }

  static Future<User> getMe() async {
    return _request<User>('/auth/me', (json) => User.fromJson(json));
  }

  // Applications
  static Future<List<Application>> listApplications() async {
    return _requestList<Application>(
        '/applications', (json) => Application.fromJson(json));
  }

  static Future<ApplicationDetail> getApplication(int id) async {
    return _request<ApplicationDetail>(
        '/applications/$id', (json) => ApplicationDetail.fromJson(json));
  }

  static Future<Application> createApplication(Application app) async {
    return _request<Application>(
      '/applications',
      (json) => Application.fromJson(json),
      method: 'POST',
      body: app.toJson(),
    );
  }

  static Future<Application> updateApplication(int id, Application app) async {
    final uri = Uri.parse('$baseUrl/applications/$id');
    final res = await http.put(
      uri,
      headers: _headers,
      body: jsonEncode(app.toJson()),
    );
    if (res.statusCode >= 400) {
      final err = jsonDecode(res.body) as Map<String, dynamic>;
      throw Exception(err['error'] as String? ?? 'Update failed');
    }
    return Application.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  static Future<void> deleteApplication(int id) async {
    final uri = Uri.parse('$baseUrl/applications/$id');
    final res = await http.delete(uri, headers: _headers);
    if (res.statusCode >= 400 && res.statusCode != 204) {
      throw Exception('Delete failed');
    }
  }

  static Future<Stats> getStats() async {
    return _request<Stats>(
        '/applications/stats', (json) => Stats.fromJson(json));
  }

  static Future<List<Application>> getFollowUpNeeded() async {
    return _requestList<Application>(
        '/applications/follow-up-needed', (json) => Application.fromJson(json));
  }

  // Interviews
  static Future<List<InterviewWithApp>> listAllInterviews() async {
    return _requestList<InterviewWithApp>(
        '/interviews', (json) => InterviewWithApp.fromJson(json));
  }

  static Future<Interview> createInterview(
      int appId, Interview interview) async {
    return _request<Interview>(
      '/applications/$appId/interviews',
      (json) => Interview.fromJson(json),
      method: 'POST',
      body: interview.toJson(),
    );
  }

  static Future<Interview> updateInterview(
      int appId, int id, Interview interview) async {
    final uri = Uri.parse('$baseUrl/applications/$appId/interviews/$id');
    final res = await http.put(
      uri,
      headers: _headers,
      body: jsonEncode(interview.toJson()),
    );
    if (res.statusCode >= 400) {
      final err = jsonDecode(res.body) as Map<String, dynamic>;
      throw Exception(err['error'] as String? ?? 'Update failed');
    }
    return Interview.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  static Future<void> deleteInterview(int appId, int id) async {
    final uri = Uri.parse('$baseUrl/applications/$appId/interviews/$id');
    final res = await http.delete(uri, headers: _headers);
    if (res.statusCode >= 400 && res.statusCode != 204) {
      throw Exception('Delete failed');
    }
  }

  // Follow-ups
  static Future<FollowUp> createFollowUp(int appId, FollowUp followUp) async {
    return _request<FollowUp>(
      '/applications/$appId/follow-ups',
      (json) => FollowUp.fromJson(json),
      method: 'POST',
      body: followUp.toJson(),
    );
  }

  static Future<FollowUp> updateFollowUp(
      int appId, int id, FollowUp followUp) async {
    final uri = Uri.parse('$baseUrl/applications/$appId/follow-ups/$id');
    final res = await http.put(
      uri,
      headers: _headers,
      body: jsonEncode(followUp.toJson()),
    );
    if (res.statusCode >= 400) {
      final err = jsonDecode(res.body) as Map<String, dynamic>;
      throw Exception(err['error'] as String? ?? 'Update failed');
    }
    return FollowUp.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  static Future<void> deleteFollowUp(int appId, int id) async {
    final uri = Uri.parse('$baseUrl/applications/$appId/follow-ups/$id');
    final res = await http.delete(uri, headers: _headers);
    if (res.statusCode >= 400 && res.statusCode != 204) {
      throw Exception('Delete failed');
    }
  }
}
