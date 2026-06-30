import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../widgets/application_tile.dart';
import '../widgets/common.dart';
import 'application_detail_screen.dart';

class ApplicationListScreen extends StatefulWidget {
  final String title;
  final String? subtitle;
  final String? statusFilter;
  final bool isFollowUpNeeded;
  final bool isReApplyable;
  final IconData emptyIcon;

  const ApplicationListScreen({
    super.key,
    required this.title,
    this.subtitle,
    this.statusFilter,
    this.isFollowUpNeeded = false,
    this.isReApplyable = false,
    this.emptyIcon = Icons.inbox_rounded,
  });

  @override
  State<ApplicationListScreen> createState() => _ApplicationListScreenState();
}

class _ApplicationListScreenState extends State<ApplicationListScreen>
    with AutomaticKeepAliveClientMixin {
  List<Application> _apps = [];
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
      List<Application> apps;
      if (widget.isFollowUpNeeded) {
        apps = await ApiService.getFollowUpNeeded();
      } else {
        apps = await ApiService.listApplications();
        if (widget.statusFilter != null) {
          apps = apps.where((a) => a.status == widget.statusFilter).toList();
        }
        if (widget.isReApplyable) {
          apps = apps.where((a) =>
              a.status == 'rejected' && a.retryGapDays > 0).toList();
        }
      }
      if (mounted) {
        setState(() {
          _apps = apps;
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
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: AppTheme.bgDark,
              title: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.title,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  if (widget.subtitle != null)
                    Text(
                      widget.subtitle!,
                      style: TextStyle(
                        fontSize: 13,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                ],
              ),
            ),
            if (_loading)
              const SliverFillRemaining(
                child: LoadingIndicator(message: 'Loading...'),
              )
            else if (_error != null)
              SliverFillRemaining(
                child: ErrorDisplay(message: _error!, onRetry: _loadData),
              )
            else if (_apps.isEmpty)
              SliverFillRemaining(
                child: EmptyState(
                  icon: widget.emptyIcon,
                  title: 'Nothing here yet',
                  subtitle: 'Applications will appear here when available',
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                sliver: SliverList.builder(
                  itemCount: _apps.length,
                  itemBuilder: (context, index) {
                    final app = _apps[index];
                    return ApplicationTile(
                      app: app,
                      index: index,
                      onTap: () async {
                        await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ApplicationDetailScreen(
                                applicationId: app.id),
                          ),
                        );
                        _loadData();
                      },
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}
