import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class ApplicationFormScreen extends StatefulWidget {
  final Application? application;

  const ApplicationFormScreen({super.key, this.application});

  @override
  State<ApplicationFormScreen> createState() => _ApplicationFormScreenState();
}

class _ApplicationFormScreenState extends State<ApplicationFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _companyCtrl;
  late TextEditingController _positionCtrl;
  late TextEditingController _jobDescCtrl;
  late TextEditingController _resumeNameCtrl;
  late TextEditingController _notesCtrl;
  late TextEditingController _retryGapCtrl;

  String _status = 'applied';
  String _jobPostSource = '';
  bool _resumeSent = false;
  List<String> _appliedSources = [];
  List<String> _skills = [];
  DateTime _appliedDate = DateTime.now();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final a = widget.application;
    _companyCtrl = TextEditingController(text: a?.company ?? '');
    _positionCtrl = TextEditingController(text: a?.position ?? '');
    _jobDescCtrl = TextEditingController(text: a?.jobDescription ?? '');
    _resumeNameCtrl = TextEditingController(text: a?.resumeName ?? '');
    _notesCtrl = TextEditingController(text: a?.notes ?? '');
    _retryGapCtrl =
        TextEditingController(text: a != null ? a.retryGapDays.toString() : '0');
    _status = a?.status ?? 'applied';
    _jobPostSource = a?.jobPostSource ?? '';
    _resumeSent = a?.resumeSent ?? false;
    _appliedSources = a?.appliedSources.toList() ?? [];
    _skills = a?.skills.toList() ?? [];
    if (a != null && a.appliedDate.isNotEmpty) {
      try {
        _appliedDate = DateTime.parse(a.appliedDate);
      } catch (_) {}
    }
  }

  @override
  void dispose() {
    _companyCtrl.dispose();
    _positionCtrl.dispose();
    _jobDescCtrl.dispose();
    _resumeNameCtrl.dispose();
    _notesCtrl.dispose();
    _retryGapCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final app = Application(
        id: widget.application?.id ?? 0,
        userId: widget.application?.userId ?? 0,
        company: _companyCtrl.text.trim(),
        position: _positionCtrl.text.trim(),
        jobDescription: _jobDescCtrl.text.trim(),
        jobPostSource: _jobPostSource,
        appliedSources: _appliedSources,
        skills: _skills,
        resumeName: _resumeNameCtrl.text.trim(),
        resumeType: 'name',
        resumeSent: _resumeSent,
        status: _status,
        appliedDate: _appliedDate.toIso8601String(),
        notes: _notesCtrl.text.trim(),
        retryGapDays: int.tryParse(_retryGapCtrl.text) ?? 0,
        createdAt: widget.application?.createdAt ?? '',
        updatedAt: widget.application?.updatedAt ?? '',
      );
      if (widget.application != null) {
        await ApiService.updateApplication(widget.application!.id, app);
      } else {
        await ApiService.createApplication(app);
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

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _appliedDate,
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
    if (picked != null) setState(() => _appliedDate = picked);
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.application != null;
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Edit Application' : 'New Application'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _sectionLabel('Basic Info'),
            const SizedBox(height: 8),
            TextFormField(
              controller: _companyCtrl,
              decoration: const InputDecoration(labelText: 'Company *'),
              validator: (v) =>
                  v == null || v.isEmpty ? 'Company is required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _positionCtrl,
              decoration: const InputDecoration(labelText: 'Position *'),
              validator: (v) =>
                  v == null || v.isEmpty ? 'Position is required' : null,
            ),
            const SizedBox(height: 12),
            InkWell(
              onTap: _pickDate,
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'Applied Date *'),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${_appliedDate.month}/${_appliedDate.day}/${_appliedDate.year}',
                      style: const TextStyle(color: AppTheme.textPrimary),
                    ),
                    const Icon(Icons.calendar_today_rounded, size: 18),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: AppConstants.statusOptions
                  .map((s) => DropdownMenuItem(
                        value: s,
                        child: Text(s[0].toUpperCase() + s.substring(1)),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _status = v ?? 'applied'),
            ),
            const SizedBox(height: 24),
            _sectionLabel('Job Details'),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _jobPostSource.isEmpty ? null : _jobPostSource,
              decoration: const InputDecoration(labelText: 'Job Post Source'),
              items: AppConstants.jobPostSourceOptions
                  .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                  .toList(),
              onChanged: (v) => setState(() => _jobPostSource = v ?? ''),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _jobDescCtrl,
              decoration: const InputDecoration(labelText: 'Job Description'),
              maxLines: 3,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _resumeNameCtrl,
              decoration: const InputDecoration(labelText: 'Resume Name'),
            ),
            const SizedBox(height: 12),
            SwitchListTile(
              title: const Text('Resume Sent'),
              value: _resumeSent,
              onChanged: (v) => setState(() => _resumeSent = v),
              activeColor: AppTheme.primary,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _retryGapCtrl,
              decoration: const InputDecoration(
                  labelText: 'Retry Gap (days)'),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 24),
            _sectionLabel('Skills'),
            const SizedBox(height: 8),
            _buildChipInput(
              values: _skills,
              hint: 'Add a skill and press enter',
              onChanged: (list) => setState(() => _skills = list),
            ),
            const SizedBox(height: 24),
            _sectionLabel('Applied Sources'),
            const SizedBox(height: 8),
            _buildChipSelector(
              options: AppConstants.appliedSourceOptions,
              selected: _appliedSources,
              onToggle: (item) => setState(() {
                if (_appliedSources.contains(item)) {
                  _appliedSources.remove(item);
                } else {
                  _appliedSources.add(item);
                }
              }),
            ),
            const SizedBox(height: 24),
            _sectionLabel('Notes'),
            const SizedBox(height: 8),
            TextFormField(
              controller: _notesCtrl,
              decoration: const InputDecoration(labelText: 'Notes'),
              maxLines: 4,
            ),
            const SizedBox(height: 28),
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

  Widget _sectionLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: AppTheme.textPrimary,
        fontSize: 16,
        fontWeight: FontWeight.w700,
      ),
    );
  }

  Widget _buildChipInput({
    required List<String> values,
    required String hint,
    required ValueChanged<List<String>> onChanged,
  }) {
    final ctrl = TextEditingController();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (values.isNotEmpty)
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: values
                .map((s) => Chip(
                      label: Text(s),
                      onDeleted: () {
                        values.remove(s);
                        onChanged(values);
                      },
                    ))
                .toList(),
          ),
        if (values.isNotEmpty) const SizedBox(height: 8),
        TextFormField(
          controller: ctrl,
          decoration: InputDecoration(
            hintText: hint,
            suffixIcon: IconButton(
              icon: const Icon(Icons.add_rounded),
              onPressed: () {
                final text = ctrl.text.trim();
                if (text.isNotEmpty && !values.contains(text)) {
                  values.add(text);
                  onChanged(values);
                  ctrl.clear();
                }
              },
            ),
          ),
          onFieldSubmitted: (text) {
            if (text.trim().isNotEmpty && !values.contains(text.trim())) {
              values.add(text.trim());
              onChanged(values);
              ctrl.clear();
            }
          },
        ),
      ],
    );
  }

  Widget _buildChipSelector({
    required List<String> options,
    required List<String> selected,
    required ValueChanged<String> onToggle,
  }) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: options.map((opt) {
        final isSelected = selected.contains(opt);
        return FilterChip(
          label: Text(opt),
          selected: isSelected,
          onSelected: (_) => onToggle(opt),
          selectedColor: AppTheme.primary,
          checkmarkColor: Colors.white,
        );
      }).toList(),
    );
  }
}
