import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/theme/app_spacing.dart';

class IosTextField extends StatefulWidget {
  final TextEditingController controller;
  final String placeholder;

  const IosTextField({
    super.key,
    required this.controller,
    this.placeholder = 'Paste a link...',
  });

  @override
  State<IosTextField> createState() => _IosTextFieldState();
}

class _IosTextFieldState extends State<IosTextField> {
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_updateHasText);
    _hasText = widget.controller.text.isNotEmpty;
  }

  @override
  void dispose() {
    widget.controller.removeListener(_updateHasText);
    super.dispose();
  }

  void _updateHasText() {
    if (mounted) {
      setState(() => _hasText = widget.controller.text.isNotEmpty);
    }
  }

  Future<void> _handlePaste() async {
    final data = await Clipboard.getData('text/plain');
    if (data?.text != null) {
      widget.controller.text = data!.text!;
      HapticFeedback.lightImpact();
    }
  }

  IconData _getPlatformIcon() {
    final url = widget.controller.text.toLowerCase();
    if (url.contains('youtube.com') || url.contains('youtu.be')) {
      return CupertinoIcons.play_circle_fill;
    } else if (url.contains('tiktok.com')) {
      return CupertinoIcons.music_note_2;
    } else if (url.contains('instagram.com')) {
      return CupertinoIcons.camera_fill;
    } else if (url.contains('twitter.com') || url.contains('x.com')) {
      return CupertinoIcons.chat_bubble_fill;
    }
    return CupertinoIcons.link;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      decoration: BoxDecoration(
        color: AppColors.surface2,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: Row(
        children: [
          Icon(
            _getPlatformIcon(),
            color: _hasText ? AppColors.systemBlue : AppColors.textTertiary,
            size: 20,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: CupertinoTextField(
              controller: widget.controller,
              placeholder: widget.placeholder,
              placeholderStyle: AppTypography.body.copyWith(color: AppColors.textTertiary),
              style: AppTypography.body,
              decoration: null,
              cursorColor: AppColors.systemBlue,
              padding: EdgeInsets.zero,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          if (!_hasText)
            GestureDetector(
              onTap: _handlePaste,
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                child: Text(
                  'Paste',
                  style: AppTypography.headline.copyWith(
                    color: AppColors.systemBlue,
                    fontSize: 15,
                  ),
                ),
              ),
            )
          else
            GestureDetector(
              onTap: () {
                widget.controller.clear();
                HapticFeedback.lightImpact();
              },
              behavior: HitTestBehavior.opaque,
              child: const Padding(
                padding: EdgeInsets.all(8.0),
                child: Icon(
                  CupertinoIcons.xmark_circle_fill,
                  color: AppColors.textTertiary,
                  size: 20,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
