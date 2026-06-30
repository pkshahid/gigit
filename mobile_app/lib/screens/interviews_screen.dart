import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../widgets/interview_tile.dart';
import '../widgets/common.dart';
import 'application_detail_screen.dart';

class InterviewsScreen extends StatefulWidget {
  final String? statusFilter;
  final String title;
  final String? subtitle;
  final IconData emptyIcon;

  const InterviewsScreen({
    super.key,
    this.statusFilter,
    required this.title,
    this.subtitle,
    this.emptyIcon = Icons.video_call_outlined,
  });

  @override
  State<InterviewsScreen> createState() => _InterviewsScreenState();
}

class _InterviewsScreenState extends State<InterviewsScreen>
    with AutomaticKeepAliveClientMixin {
  List<InterviewWithApp> _interviews = [];
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
      var interviews = await ApiService.listAllInterviews();
      if (widget.statusFilter != null) {
        interviews =
            interviews.where((i) => i.status == widget.statusFilter).toList();
      }
      if (mounted) {
        setState(() {
          _interviews = interviews;
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
                child: LoadingIndicator(message: 'Loading interviews...'),
              )
            else if (_error != null)
              SliverFillRemaining(
                child: ErrorDisplay(message: _error!, onRetry: _loadData),
              )
            else if (_interviews.isEmpty)
              SliverFillRemaining(
                child: EmptyState(
                  icon: widget.emptyIcon,
                  title: 'No interviews found',
                  subtitle: 'Interviews will appear here when scheduled',
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                sliver: SliverList.builder(
                  itemCount: _interviews.length,
                  itemBuilder: (context, index) {
                    final iv = _interviews[index];
                    return InterviewTile(
                      interview: iv,
                      index: index,
                      onTap: () async {
                        await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ApplicationDetailScreen(
                                applicationId: iv.applicationId),
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
