import 'package:flutter/cupertino.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_animations.dart';
import 'ios_button.dart';

class IosEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String? buttonLabel;
  final VoidCallback? onButtonTap;

  const IosEmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.buttonLabel,
    this.onButtonTap,
  });

  factory IosEmptyState.library({VoidCallback? onButtonTap}) {
    return IosEmptyState(
      icon: CupertinoIcons.tray_full,
      title: 'No Downloads Yet',
      subtitle: 'Your downloaded videos will appear here for offline viewing.',
      buttonLabel: 'Start Downloading',
      onButtonTap: onButtonTap,
    );
  }

  factory IosEmptyState.search({VoidCallback? onButtonTap}) {
    return IosEmptyState(
      icon: CupertinoIcons.link,
      title: 'Paste a Link',
      subtitle: 'Enter a video URL from YouTube, TikTok, or Instagram to get started.',
      buttonLabel: 'Paste from Clipboard',
      onButtonTap: onButtonTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: AppAnimations.normal,
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: child,
        );
      },
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 64,
              color: AppColors.textTertiary,
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              title,
              style: AppTypography.title3,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              subtitle,
              style: AppTypography.body.copyWith(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            if (buttonLabel != null) ...[
              const SizedBox(height: AppSpacing.xl),
              IosButton.primary(
                label: buttonLabel!,
                onTap: onButtonTap,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
