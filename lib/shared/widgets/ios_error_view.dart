import 'package:flutter/cupertino.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/theme/app_spacing.dart';
import 'ios_button.dart';

class IosErrorView extends StatelessWidget {
  final String errorCode;
  final VoidCallback? onRetry;

  const IosErrorView({
    super.key,
    required this.errorCode,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final errorData = _mapError(errorCode);
    final IconData icon = errorData.$1;
    final String title = errorData.$2;
    final String message = errorData.$3;

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xxl),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 64,
            color: AppColors.systemRed,
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            title,
            style: AppTypography.title3,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            message,
            style: AppTypography.body.copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
          if (onRetry != null) ...[
            const SizedBox(height: AppSpacing.xl),
            IosButton.secondary(
              label: 'Try Again',
              onTap: onRetry,
            ),
          ],
        ],
      ),
    );
  }

  (IconData, String, String) _mapError(String code) {
    switch (code) {
      case 'INVALID_URL':
        return (
          CupertinoIcons.link,
          'Invalid Link',
          'Make sure you copied the full link.'
        );
      case 'UNSUPPORTED_PLATFORM':
        return (
          CupertinoIcons.xmark_circle,
          'Not Supported',
          'This platform isn\'t supported yet.'
        );
      case 'PRIVATE_VIDEO':
        return (
          CupertinoIcons.lock_circle,
          'Private Video',
          'This video is private.'
        );
      case 'GEO_RESTRICTED':
        return (
          CupertinoIcons.globe,
          'Not Available',
          'This video isn\'t available in your region.'
        );
      case 'RATE_EXCEEDED':
        return (
          CupertinoIcons.clock,
          'Slow Down',
          'Too many requests, try in a moment.'
        );
      case 'NETWORK_ERROR':
        return (
          CupertinoIcons.wifi_exclamationmark,
          'No Connection',
          'Check your internet and try again.'
        );
      case 'UNKNOWN':
      default:
        return (
          CupertinoIcons.exclamationmark_circle,
          'Something Went Wrong',
          'Try again or use a different link.'
        );
    }
  }
}
