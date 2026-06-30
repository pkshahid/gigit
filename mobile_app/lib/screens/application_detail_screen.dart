import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../widgets/common.dart';
import '../widgets/status_badge.dart';
import 'application_form_screen.dart';
import 'interview_form_screen.dart';
import 'follow_up_form_screen.dart';

class ApplicationDetailScreen extends StatefulWidget {
  final int applicationId;

  const ApplicationDetailScreen({super.key, required this.applicationId});

  @override
  State<ApplicationDetailScreen> createState() =>
      _ApplicationDetailScreenState();
}

class _ApplicationDetailScreenState extends State<ApplicationDetailScreen>
    with SingleTickerProviderStateMixin {
  ApplicationDetail? _detail;
  bool _loading = true;
  String? _error;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final detail = await ApiService.getApplication(widget.applicationId);
      if (mounted) {
        setState(() {
          _detail = detail;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _loading = false;
        });
      }
    }
  }

  Future<void> _deleteApplication() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text('Delete Application?'),
        content: const Text('This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.danger),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ApiService.deleteApplication(widget.applicationId);
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _loading
          ? const LoadingIndicator(message: 'Loading application...')
          : _error != null
              ? ErrorDisplay(message: _error!, onRetry: _loadData)
              : _detail != null
                  ? NestedScrollView(
                      headerSliverBuilder: (context, innerBoxIsScrolled) => [
                        SliverAppBar(
                          expandedHeight: 200,
                          pinned: true,
                          backgroundColor: AppTheme.bgDark,
                          actions: [
                            IconButton(
                              icon: const Icon(Icons.edit_rounded),
                              onPressed: () async {
                                final result = await Navigator.push<bool>(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => ApplicationFormScreen(
                                        application: _detail),
                                  ),
                                );
                                if (result == true) _loadData();
                              },
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline_rounded,
                                  color: AppTheme.danger),
                              onPressed: _deleteApplication,
                            ),
                          ],
                          flexibleSpace: FlexibleSpaceBar(
                            background: _buildHeader(),
                          ),
                          bottom: TabBar(
                            controller: _tabController,
                            labelColor: AppTheme.primary,
                            unselectedLabelColor: AppTheme.textSecondary,
                            indicatorColor: AppTheme.primary,
                            tabs: const [
                              Tab(text: 'Overview'),
                              Tab(text: 'Interviews'),
                              Tab(text: 'Follow-ups'),
                            ],
                          ),
                        ),
                      ],
                      body: TabBarView(
                        controller: _tabController,
                        children: [
                          _buildOverviewTab(),
                          _buildInterviewsTab(),
                          _buildFollowUpsTab(),
                        ],
                      ),
                    )
                  : const EmptyState(
                      icon: Icons.error_outline,
                      title: 'Application not found',
                    ),
    );
  }

  Widget _buildHeader() {
    final app = _detail!;
    final color = AppTheme.statusColor(app.status);
    return Container(
      padding: const EdgeInsets.only(top: 60, left: 20, right: 20, bottom: 50),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [color.withOpacity(0.15), AppTheme.bgDark],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(AppTheme.statusIcon(app.status),
                    color: color, size: 26),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      app.company,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      app.position,
                      style: const TextStyle(
                        fontSize: 15,
                        color: AppTheme.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          StatusBadge(status: app.status),
        ],
      ),
    )
        .animate()
        .fadeIn(duration: 400.ms);
  }

  Widget _buildOverviewTab() {
    final app = _detail!;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _infoCard('Applied Date', _formatDate(app.appliedDate),
            Icons.calendar_today_rounded),
        const SizedBox(height: 10),
        _infoCard('Job Post Source',
            app.jobPostSource.isNotEmpty ? app.jobPostSource : 'Not specified',
            Icons.link_rounded),
        const SizedBox(height: 10),
        _infoCard('Resume', app.resumeName.isNotEmpty
            ? '${app.resumeName} (${app.resumeSent ? "Sent" : "Not sent"})'
            : 'Not specified', Icons.description_rounded),
        const SizedBox(height: 10),
        if (app.skills.isNotEmpty) ...[
          _label('Skills'),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: app.skills
                .map((s) => Chip(
                      label: Text(s),
                      avatar: const Icon(Icons.star_rounded, size: 16),
                    ))
                .toList(),
          ),
          const SizedBox(height: 10),
        ],
        if (app.appliedSources.isNotEmpty) ...[
          _label('Applied Via'),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: app.appliedSources
                .map((s) => Chip(label: Text(s)))
                .toList(),
          ),
          const SizedBox(height: 10),
        ],
        if (app.notes.isNotEmpty) ...[
          _infoCard('Notes', app.notes, Icons.note_rounded, maxLines: 10),
          const SizedBox(height: 10),
        ],
        if (app.jobDescription.isNotEmpty) ...[
          _infoCard('Job Description', app.jobDescription,
              Icons.article_rounded, maxLines: 15),
          const SizedBox(height: 10),
        ],
        if (app.retryGapDays > 0)
          _infoCard('Retry Gap', '${app.retryGapDays} days',
              Icons.refresh_rounded),
      ],
    );
  }

  Widget _buildInterviewsTab() {
    final interviews = _detail!.interviews;
    return Stack(
      children: [
        interviews.isEmpty
            ? const EmptyState(
                icon: Icons.video_call_outlined,
                title: 'No interviews yet',
                subtitle: 'Add an interview round to track progress',
              )
            : ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                itemCount: interviews.length,
                itemBuilder: (context, index) {
                  final iv = interviews[index];
                  return _buildInterviewCard(iv, index);
                },
              ),
        Positioned(
          right: 16,
          bottom: 16,
          child: FloatingActionButton(
            heroTag: 'interview_fab',
            mini: true,
            onPressed: () async {
              final result = await Navigator.push<bool>(
                context,
                MaterialPageRoute(
                  builder: (_) => InterviewFormScreen(
                    applicationId: widget.applicationId,
                  ),
                ),
              );
              if (result == true) _loadData();
            },
            child: const Icon(Icons.add_rounded),
          ),
        ),
      ],
    );
  }

  Widget _buildFollowUpsTab() {
    final followUps = _detail!.followUps;
    return Stack(
      children: [
        followUps.isEmpty
            ? const EmptyState(
                icon: Icons.follow_the_signs_rounded,
                title: 'No follow-ups yet',
                subtitle: 'Track your follow-up communications here',
              )
            : ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                itemCount: followUps.length,
                itemBuilder: (context, index) {
                  final f = followUps[index];
                  return _buildFollowUpCard(f, index);
                },
              ),
        Positioned(
          right: 16,
          bottom: 16,
          child: FloatingActionButton(
            heroTag: 'followup_fab',
            mini: true,
            onPressed: () async {
              final result = await Navigator.push<bool>(
                context,
                MaterialPageRoute(
                  builder: (_) => FollowUpFormScreen(
                    applicationId: widget.applicationId,
                  ),
                ),
              );
              if (result == true) _loadData();
            },
            child: const Icon(Icons.add_rounded),
          ),
        ),
      ],
    );
  }

  Widget _buildInterviewCard(Interview iv, int index) {
    final color = AppTheme.interviewStatusColor(iv.status);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.video_call_rounded, color: color, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Round ${iv.roundNumber}${iv.roundName.isNotEmpty ? ': ${iv.roundName}' : ''}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${_formatDate(iv.scheduledDate)}${iv.scheduledTime.isNotEmpty ? ' at ${iv.scheduledTime}' : ''}',
                      style: const TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              StatusBadge(status: iv.status, isInterview: true),
            ],
          ),
          if (iv.notes.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              iv.notes,
              style: const TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 13,
              ),
            ),
          ],
          if (iv.joinLink.isNotEmpty) ...[
            const SizedBox(height: 8),
            InkWell(
              onTap: () {
                // URL launching would go here
              },
              child: Row(
                children: [
                  Icon(Icons.link_rounded, size: 14, color: AppTheme.primary),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      iv.joinLink,
                      style: TextStyle(
                        color: AppTheme.primary,
                        fontSize: 13,
                        decoration: TextDecoration.underline,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: () async {
                  final result = await Navigator.push<bool>(
                    context,
                    MaterialPageRoute(
                      builder: (_) => InterviewFormScreen(
                        applicationId: widget.applicationId,
                        interview: iv,
                      ),
                    ),
                  );
                  if (result == true) _loadData();
                },
                child: const Text('Edit'),
              ),
              TextButton(
                onPressed: () async {
                  try {
                    await ApiService.deleteInterview(
                        widget.applicationId, iv.id);
                    _loadData();
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(e.toString())),
                      );
                    }
                  }
                },
                style: TextButton.styleFrom(foregroundColor: AppTheme.danger),
                child: const Text('Delete'),
              ),
            ],
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: (index * 50).ms, duration: 300.ms)
        .slideY(begin: 0.1, end: 0);
  }

  Widget _buildFollowUpCard(FollowUp f, int index) {
    final color = AppTheme.primary;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(AppTheme.followUpIcon(f.followType),
                    color: color, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      f.followType[0].toUpperCase() + f.followType.substring(1),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatDate(f.date),
                      style: const TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (f.notes.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              f.notes,
              style: const TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 13,
              ),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: () async {
                  final result = await Navigator.push<bool>(
                    context,
                    MaterialPageRoute(
                      builder: (_) => FollowUpFormScreen(
                        applicationId: widget.applicationId,
                        followUp: f,
                      ),
                    ),
                  );
                  if (result == true) _loadData();
                },
                child: const Text('Edit'),
              ),
              TextButton(
                onPressed: () async {
                  try {
                    await ApiService.deleteFollowUp(
                        widget.applicationId, f.id);
                    _loadData();
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(e.toString())),
                      );
                    }
                  }
                },
                style: TextButton.styleFrom(foregroundColor: AppTheme.danger),
                child: const Text('Delete'),
              ),
            ],
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: (index * 50).ms, duration: 300.ms)
        .slideY(begin: 0.1, end: 0);
  }

  Widget _infoCard(String label, String value, IconData icon, {int maxLines = 3}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: AppTheme.textSecondary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 14,
                  ),
                  maxLines: maxLines,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _label(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: AppTheme.textSecondary,
        fontSize: 12,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  String _formatDate(String dateStr) {
    if (dateStr.isEmpty) return 'Not specified';
    try {
      final dt = DateTime.parse(dateStr);
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }
}
