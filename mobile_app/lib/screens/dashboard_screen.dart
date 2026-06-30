import 'package:flutter/material.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../widgets/bento_card.dart';
import '../widgets/application_tile.dart';
import '../widgets/common.dart';
import 'application_detail_screen.dart';
import 'application_form_screen.dart';

class DashboardScreen extends StatefulWidget {
  final VoidCallback? onNavigateToTab;

  const DashboardScreen({super.key, this.onNavigateToTab});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with AutomaticKeepAliveClientMixin {
  Stats? _stats;
  List<Application> _recentApps = [];
  bool _loading = true;
  String? _error;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final stats = await ApiService.getStats();
      final apps = await ApiService.listApplications();
      if (mounted) {
        setState(() {
          _stats = stats;
          _recentApps = apps.take(5).toList();
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

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _loading
            ? const LoadingIndicator(message: 'Loading dashboard...')
            : _error != null
                ? ErrorDisplay(message: _error!, onRetry: _loadData)
                : CustomScrollView(
                    slivers: [
                      SliverAppBar(
                        floating: true,
                        backgroundColor: AppTheme.bgDark,
                        title: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Dashboard',
                              style: TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            Text(
                              'Your job search at a glance',
                              style: TextStyle(
                                fontSize: 13,
                                color: AppTheme.textSecondary,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                      ),
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                        sliver: SliverList(
                          delegate: SliverChildListDelegate([
                            _buildStatsGrid(),
                            const SizedBox(height: 24),
                            _buildRecentSection(),
                          ]),
                        ),
                      ),
                    ],
                  ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.push<bool>(
            context,
            MaterialPageRoute(
              builder: (_) => const ApplicationFormScreen(),
            ),
          );
          if (result == true) _loadData();
        },
        child: const Icon(Icons.add_rounded),
      ),
    );
  }

  Widget _buildStatsGrid() {
    final s = _stats!;
    return StaggeredGrid.count(
      crossAxisCount: 4,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      children: [
        StaggeredGridTile.count(
          crossAxisCellCount: 2,
          mainAxisCellCount: 2,
          child: StatBentoCard(
            label: 'Total Applications',
            value: s.total,
            icon: Icons.folder_rounded,
            color: AppTheme.primary,
          ),
        ),
        StaggeredGridTile.count(
          crossAxisCellCount: 2,
          mainAxisCellCount: 1,
          child: StatBentoCard(
            label: 'Applied',
            value: s.applied,
            icon: Icons.send_rounded,
            color: AppTheme.info,
          ),
        ),
        StaggeredGridTile.count(
          crossAxisCellCount: 2,
          mainAxisCellCount: 1,
          child: StatBentoCard(
            label: 'Interviews',
            value: s.interview,
            icon: Icons.video_call_rounded,
            color: AppTheme.accent,
          ),
        ),
        StaggeredGridTile.count(
          crossAxisCellCount: 1,
          mainAxisCellCount: 1,
          child: StatBentoCard(
            label: 'Offers',
            value: s.offer,
            icon: Icons.celebration_rounded,
            color: AppTheme.success,
          ),
        ),
        StaggeredGridTile.count(
          crossAxisCellCount: 1,
          mainAxisCellCount: 1,
          child: StatBentoCard(
            label: 'Accepted',
            value: s.accepted,
            icon: Icons.check_circle_rounded,
            color: const Color(0xFF10B981),
          ),
        ),
        StaggeredGridTile.count(
          crossAxisCellCount: 2,
          mainAxisCellCount: 1,
          child: StatBentoCard(
            label: 'Upcoming Interviews',
            value: s.upcomingInterviews,
            icon: Icons.event_rounded,
            color: AppTheme.warning,
          ),
        ),
        StaggeredGridTile.count(
          crossAxisCellCount: 2,
          mainAxisCellCount: 1,
          child: StatBentoCard(
            label: 'Rejected',
            value: s.rejected,
            icon: Icons.close_rounded,
            color: AppTheme.danger,
          ),
        ),
      ],
    );
  }

  Widget _buildRecentSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Recent Applications',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            if (widget.onNavigateToTab != null)
              TextButton(
                onPressed: widget.onNavigateToTab,
                child: const Text('See All'),
              ),
          ],
        )
            .animate()
            .fadeIn(delay: 300.ms, duration: 400.ms),
        const SizedBox(height: 12),
        if (_recentApps.isEmpty)
          const EmptyState(
            icon: Icons.inbox_rounded,
            title: 'No applications yet',
            subtitle: 'Tap the + button to add your first application',
          )
        else
          ..._recentApps.asMap().entries.map((entry) {
            final app = entry.value;
            return ApplicationTile(
              app: app,
              index: entry.key,
              onTap: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) =>
                        ApplicationDetailScreen(applicationId: app.id),
                  ),
                );
                _loadData();
              },
            );
          }),
      ],
    );
  }
}
