import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class InterviewFormScreen extends StatefulWidget {
  final int applicationId;
  final Interview? interview;

  const InterviewFormScreen({
    super.key,
    required this.applicationId,
    this.interview,
  });

  @override
  State<InterviewFormScreen> createState() => _InterviewFormScreenState();
}

class _InterviewFormScreenState extends State<InterviewFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _roundNameCtrl;
  late TextEditingController _notesCtrl;
  late TextEditingController _joinLinkCtrl;
  late TextEditingController _roundNumberCtrl;

  String _status = 'scheduled';
  DateTime _scheduledDate = DateTime.now();
  TimeOfDay _scheduledTime = TimeOfDay.now();
  bool _hasTime = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final iv = widget.interview;
    _roundNameCtrl = TextEditingController(text: iv?.roundName ?? '');
    _notesCtrl = TextEditingController(text: iv?.notes ?? '');
    _joinLinkCtrl = TextEditingController(text: iv?.joinLink ?? '');
    _roundNumberCtrl = TextEditingController(
        text: iv != null ? iv.roundNumber.toString() : '1');
    _status = iv?.status ?? 'scheduled';
    if (iv != null && iv.scheduledDate.isNotEmpty) {
      try {
        _scheduledDate = DateTime.parse(iv.scheduledDate);
      } catch (_) {}
    }
    if (iv != null && iv.scheduledTime.isNotEmpty) {
      _hasTime = true;
      try {
        final parts = iv.scheduledTime.split(':');
        _scheduledTime = TimeOfDay(
            hour: int.parse(parts[0]), minute: int.parse(parts[1]));
      } catch (_) {}
    }
  }

  @override
  void dispose() {
    _roundNameCtrl.dispose();
    _notesCtrl.dispose();
    _joinLinkCtrl.dispose();
    _roundNumberCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final timeStr = _hasTime
          ? '${_scheduledTime.hour.toString().padLeft(2, '0')}:${_scheduledTime.minute.toString().padLeft(2, '0')}'
          : '';
      final iv = Interview(
        id: widget.interview?.id ?? 0,
        applicationId: widget.applicationId,
        roundNumber: int.tryParse(_roundNumberCtrl.text) ?? 1,
        roundName: _roundNameCtrl.text.trim(),
        scheduledDate:
            '${_scheduledDate.year}-${_scheduledDate.month.toString().padLeft(2, '0')}-${_scheduledDate.day.toString().padLeft(2, '0')}',
        scheduledTime: timeStr,
        status: _status,
        notes: _notesCtrl.text.trim(),
        joinLink: _joinLinkCtrl.text.trim(),
        createdAt: widget.interview?.createdAt ?? '',
      );
      if (widget.interview != null) {
        await ApiService.updateInterview(
            widget.applicationId, widget.interview!.id, iv);
      } else {
        await ApiService.createInterview(widget.applicationId, iv);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: AppTheme.danger,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.interview != null;
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Edit Interview' : 'New Interview'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _roundNumberCtrl,
              decoration: const InputDecoration(labelText: 'Round Number'),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _roundNameCtrl,
              decoration: const InputDecoration(
                  labelText: 'Round Name (e.g. Technical, HR)'),
            ),
            const SizedBox(height: 12),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _scheduledDate,
                  firstDate: DateTime(2020),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                  builder: (context, child) => Theme(
                    data: Theme.of(context).copyWith(
                      colorScheme: const ColorScheme.dark(
                        primary: AppTheme.primary,
                        surface: AppTheme.bgCard,
                      ),
                    ),
                    child: child!,
                  ),
                );
                if (picked != null) setState(() => _scheduledDate = picked);
              },
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'Scheduled Date *'),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${_scheduledDate.month}/${_scheduledDate.day}/${_scheduledDate.year}',
                      style: const TextStyle(color: AppTheme.textPrimary),
                    ),
                    const Icon(Icons.calendar_today_rounded, size: 18),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            SwitchListTile(
              title: const Text('Set Time'),
              value: _hasTime,
              onChanged: (v) => setState(() => _hasTime = v),
              activeColor: AppTheme.primary,
            ),
            if (_hasTime)
              InkWell(
                onTap: () async {
                  final picked = await showTimePicker(
                    context: context,
                    initialTime: _scheduledTime,
                    builder: (context, child) => Theme(
                      data: Theme.of(context).copyWith(
                        colorScheme: const ColorScheme.dark(
                          primary: AppTheme.primary,
                          surface: AppTheme.bgCard,
                        ),
                      ),
                      child: child!,
                    ),
                  );
                  if (picked != null) setState(() => _scheduledTime = picked);
                },
                child: InputDecorator(
                  decoration: const InputDecoration(labelText: 'Time'),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _scheduledTime.format(context),
                        style: const TextStyle(color: AppTheme.textPrimary),
                      ),
                      const Icon(Icons.access_time_rounded, size: 18),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: AppConstants.interviewStatusOptions
                  .map((s) => DropdownMenuItem(
                        value: s,
                        child: Text(s[0].toUpperCase() + s.substring(1)),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _status = v ?? 'scheduled'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _joinLinkCtrl,
              decoration: const InputDecoration(labelText: 'Join Link'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _notesCtrl,
              decoration: const InputDecoration(labelText: 'Notes'),
              maxLines: 4,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : Text(isEdit ? 'Update' : 'Create'),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
