class User {
  final int id;
  final String email;
  final String createdAt;

  User({required this.id, required this.email, required this.createdAt});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      email: json['email'] as String,
      createdAt: json['created_at'] as String? ?? '',
    );
  }
}

class AuthResponse {
  final String token;
  final User user;

  AuthResponse({required this.token, required this.user});

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      token: json['token'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}

class Application {
  final int id;
  final int userId;
  final String company;
  final String position;
  final String jobDescription;
  final String jobPostSource;
  final List<String> appliedSources;
  final List<String> skills;
  final String resumeName;
  final String resumeType;
  final bool resumeSent;
  final String status;
  final String appliedDate;
  final String notes;
  final int retryGapDays;
  final String createdAt;
  final String updatedAt;

  Application({
    required this.id,
    required this.userId,
    required this.company,
    required this.position,
    required this.jobDescription,
    required this.jobPostSource,
    required this.appliedSources,
    required this.skills,
    required this.resumeName,
    required this.resumeType,
    required this.resumeSent,
    required this.status,
    required this.appliedDate,
    required this.notes,
    required this.retryGapDays,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Application.fromJson(Map<String, dynamic> json) {
    return Application(
      id: json['id'] as int,
      userId: json['user_id'] as int? ?? 0,
      company: json['company'] as String? ?? '',
      position: json['position'] as String? ?? '',
      jobDescription: json['job_description'] as String? ?? '',
      jobPostSource: json['job_post_source'] as String? ?? '',
      appliedSources: (json['applied_sources'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      skills: (json['skills'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      resumeName: json['resume_name'] as String? ?? '',
      resumeType: json['resume_type'] as String? ?? 'name',
      resumeSent: json['resume_sent'] as bool? ?? false,
      status: json['status'] as String? ?? 'applied',
      appliedDate: json['applied_date'] as String? ?? '',
      notes: json['notes'] as String? ?? '',
      retryGapDays: json['retry_gap_days'] as int? ?? 0,
      createdAt: json['created_at'] as String? ?? '',
      updatedAt: json['updated_at'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'company': company,
      'position': position,
      'job_description': jobDescription,
      'job_post_source': jobPostSource,
      'applied_sources': appliedSources,
      'skills': skills,
      'resume_name': resumeName,
      'resume_type': resumeType,
      'resume_sent': resumeSent,
      'status': status,
      'applied_date': appliedDate,
      'notes': notes,
      'retry_gap_days': retryGapDays,
    };
  }

  Application copyWith({
    int? id,
    int? userId,
    String? company,
    String? position,
    String? jobDescription,
    String? jobPostSource,
    List<String>? appliedSources,
    List<String>? skills,
    String? resumeName,
    String? resumeType,
    bool? resumeSent,
    String? status,
    String? appliedDate,
    String? notes,
    int? retryGapDays,
    String? createdAt,
    String? updatedAt,
  }) {
    return Application(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      company: company ?? this.company,
      position: position ?? this.position,
      jobDescription: jobDescription ?? this.jobDescription,
      jobPostSource: jobPostSource ?? this.jobPostSource,
      appliedSources: appliedSources ?? this.appliedSources,
      skills: skills ?? this.skills,
      resumeName: resumeName ?? this.resumeName,
      resumeType: resumeType ?? this.resumeType,
      resumeSent: resumeSent ?? this.resumeSent,
      status: status ?? this.status,
      appliedDate: appliedDate ?? this.appliedDate,
      notes: notes ?? this.notes,
      retryGapDays: retryGapDays ?? this.retryGapDays,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class Interview {
  final int id;
  final int applicationId;
  final int roundNumber;
  final String roundName;
  final String scheduledDate;
  final String scheduledTime;
  final String status;
  final String notes;
  final String joinLink;
  final String createdAt;

  Interview({
    required this.id,
    required this.applicationId,
    required this.roundNumber,
    required this.roundName,
    required this.scheduledDate,
    required this.scheduledTime,
    required this.status,
    required this.notes,
    required this.joinLink,
    required this.createdAt,
  });

  factory Interview.fromJson(Map<String, dynamic> json) {
    return Interview(
      id: json['id'] as int,
      applicationId: json['application_id'] as int? ?? 0,
      roundNumber: json['round_number'] as int? ?? 1,
      roundName: json['round_name'] as String? ?? '',
      scheduledDate: json['scheduled_date'] as String? ?? '',
      scheduledTime: json['scheduled_time'] as String? ?? '',
      status: json['status'] as String? ?? 'scheduled',
      notes: json['notes'] as String? ?? '',
      joinLink: json['join_link'] as String? ?? '',
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'round_number': roundNumber,
      'round_name': roundName,
      'scheduled_date': scheduledDate,
      'scheduled_time': scheduledTime,
      'status': status,
      'notes': notes,
      'join_link': joinLink,
    };
  }

  Interview copyWith({
    int? id,
    int? applicationId,
    int? roundNumber,
    String? roundName,
    String? scheduledDate,
    String? scheduledTime,
    String? status,
    String? notes,
    String? joinLink,
    String? createdAt,
  }) {
    return Interview(
      id: id ?? this.id,
      applicationId: applicationId ?? this.applicationId,
      roundNumber: roundNumber ?? this.roundNumber,
      roundName: roundName ?? this.roundName,
      scheduledDate: scheduledDate ?? this.scheduledDate,
      scheduledTime: scheduledTime ?? this.scheduledTime,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      joinLink: joinLink ?? this.joinLink,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

class InterviewWithApp extends Interview {
  final String company;
  final String position;

  InterviewWithApp({
    required super.id,
    required super.applicationId,
    required super.roundNumber,
    required super.roundName,
    required super.scheduledDate,
    required super.scheduledTime,
    required super.status,
    required super.notes,
    required super.joinLink,
    required super.createdAt,
    required this.company,
    required this.position,
  });

  factory InterviewWithApp.fromJson(Map<String, dynamic> json) {
    return InterviewWithApp(
      id: json['id'] as int,
      applicationId: json['application_id'] as int? ?? 0,
      roundNumber: json['round_number'] as int? ?? 1,
      roundName: json['round_name'] as String? ?? '',
      scheduledDate: json['scheduled_date'] as String? ?? '',
      scheduledTime: json['scheduled_time'] as String? ?? '',
      status: json['status'] as String? ?? 'scheduled',
      notes: json['notes'] as String? ?? '',
      joinLink: json['join_link'] as String? ?? '',
      createdAt: json['created_at'] as String? ?? '',
      company: json['company'] as String? ?? '',
      position: json['position'] as String? ?? '',
    );
  }
}

class FollowUp {
  final int id;
  final int applicationId;
  final String date;
  final String followType;
  final String notes;
  final String createdAt;

  FollowUp({
    required this.id,
    required this.applicationId,
    required this.date,
    required this.followType,
    required this.notes,
    required this.createdAt,
  });

  factory FollowUp.fromJson(Map<String, dynamic> json) {
    return FollowUp(
      id: json['id'] as int,
      applicationId: json['application_id'] as int? ?? 0,
      date: json['date'] as String? ?? '',
      followType: json['follow_type'] as String? ?? 'email',
      notes: json['notes'] as String? ?? '',
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'date': date,
      'follow_type': followType,
      'notes': notes,
    };
  }

  FollowUp copyWith({
    int? id,
    int? applicationId,
    String? date,
    String? followType,
    String? notes,
    String? createdAt,
  }) {
    return FollowUp(
      id: id ?? this.id,
      applicationId: applicationId ?? this.applicationId,
      date: date ?? this.date,
      followType: followType ?? this.followType,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

class ApplicationDetail extends Application {
  final List<Interview> interviews;
  final List<FollowUp> followUps;

  ApplicationDetail({
    required super.id,
    required super.userId,
    required super.company,
    required super.position,
    required super.jobDescription,
    required super.jobPostSource,
    required super.appliedSources,
    required super.skills,
    required super.resumeName,
    required super.resumeType,
    required super.resumeSent,
    required super.status,
    required super.appliedDate,
    required super.notes,
    required super.retryGapDays,
    required super.createdAt,
    required super.updatedAt,
    required this.interviews,
    required this.followUps,
  });

  factory ApplicationDetail.fromJson(Map<String, dynamic> json) {
    final app = Application.fromJson(json);
    return ApplicationDetail(
      id: app.id,
      userId: app.userId,
      company: app.company,
      position: app.position,
      jobDescription: app.jobDescription,
      jobPostSource: app.jobPostSource,
      appliedSources: app.appliedSources,
      skills: app.skills,
      resumeName: app.resumeName,
      resumeType: app.resumeType,
      resumeSent: app.resumeSent,
      status: app.status,
      appliedDate: app.appliedDate,
      notes: app.notes,
      retryGapDays: app.retryGapDays,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      interviews: (json['interviews'] as List<dynamic>?)
              ?.map((e) => Interview.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      followUps: (json['follow_ups'] as List<dynamic>?)
              ?.map((e) => FollowUp.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class Stats {
  final int total;
  final int applied;
  final int interview;
  final int offer;
  final int rejected;
  final int accepted;
  final int upcomingInterviews;

  Stats({
    required this.total,
    required this.applied,
    required this.interview,
    required this.offer,
    required this.rejected,
    required this.accepted,
    required this.upcomingInterviews,
  });

  factory Stats.fromJson(Map<String, dynamic> json) {
    return Stats(
      total: json['total'] as int? ?? 0,
      applied: json['applied'] as int? ?? 0,
      interview: json['interview'] as int? ?? 0,
      offer: json['offer'] as int? ?? 0,
      rejected: json['rejected'] as int? ?? 0,
      accepted: json['accepted'] as int? ?? 0,
      upcomingInterviews: json['upcoming_interviews'] as int? ?? 0,
    );
  }
}

class AppConstants {
  static const List<String> statusOptions = [
    'applied',
    'interview',
    'offer',
    'rejected',
    'accepted',
  ];

  static const List<String> interviewStatusOptions = [
    'scheduled',
    'attended',
    'passed',
    'failed',
    'cancelled',
  ];

  static const List<String> followUpTypeOptions = [
    'email',
    'call',
    'message',
    'other',
  ];

  static const List<String> jobPostSourceOptions = [
    'LinkedIn',
    'Indeed',
    'Glassdoor',
    'Company Website',
    'AngelList',
    'Hacker News',
    'Referral',
    'Job Fair',
    'Recruiter',
    'Other',
  ];

  static const List<String> appliedSourceOptions = [
    'Company Portal',
    'Email',
    'LinkedIn',
    'Referral',
    'Recruiter',
    'Job Board',
    'Direct',
    'Other',
  ];
}
