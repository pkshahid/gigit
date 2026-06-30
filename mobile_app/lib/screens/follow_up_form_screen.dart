import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class FollowUpFormScreen extends StatefulWidget {
  final int applicationId;
  final FollowUp? followUp;

  const FollowUpFormScreen({
    super.key,
    required this.applicationId,
    this.followUp,
  });

  @override
  State<FollowUpFormScreen> createState() => _FollowUpFormScreenState();
}

class _FollowUpFormScreenState extends State<FollowUpFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _notesCtrl;
  String _followType = 'email';
  DateTime _date = DateTime.now();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final f = widget.followUp;
    _notesCtrl = TextEditingController(text: f?.notes ?? '');
    _followType = f?.followType ?? 'email';
    if (f != null && f.date.isNotEmpty) {
      try {
        _date = DateTime.parse(f.date);
      } catch (_) {}
    }
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final f = FollowUp(
        id: widget.followUp?.id ?? 0,
        applicationId: widget.applicationId,
        date:
            '${_date.year}-${_date.month.toString().padLeft(2, '0')}-${_date.day.toString().padLeft(2, '0')}',
        followType: _followType,
        notes: _notesCtrl.text.trim(),
        createdAt: widget.followUp?.createdAt ?? '',
      );
      if (widget.followUp != null) {
        await ApiService.updateFollowUp(
            widget.applicationId, widget.followUp!.id, f);
      } else {
        await ApiService.createFollowUp(widget.applicationId, f);
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
    final isEdit = widget.followUp != null;
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Edit Follow-up' : 'New Follow-up'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _date,
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
                if (picked != null) setState(() => _date = picked);
              },
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'Date *'),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${_date.month}/${_date.day}/${_date.year}',
                      style: const TextStyle(color: AppTheme.textPrimary),
                    ),
                    const Icon(Icons.calendar_today_rounded, size: 18),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _followType,
              decoration: const InputDecoration(labelText: 'Follow-up Type'),
              items: AppConstants.followUpTypeOptions
                  .map((s) => DropdownMenuItem(
                        value: s,
                        child: Text(s[0].toUpperCase() + s.substring(1)),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _followType = v ?? 'email'),
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
