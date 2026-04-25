import 'package:flutter/cupertino.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/theme/app_spacing.dart';

class IosBottomSheet extends StatelessWidget {
  final String? title;
  final Widget child;

  const IosBottomSheet({
    super.key,
    this.title,
    required this.child,
  });

  static Future<T?> show<T>(
    BuildContext context, {
    String? title,
    required Widget child,
  }) {
    return showCupertinoModalPopup<T>(
      context: context,
      builder: (context) => IosBottomSheet(
        title: title,
        child: child,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.xl,
      ),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppSpacing.radiusXl),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: AppSpacing.sm),
          // Drag Handle
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.surface3,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: AppSpacing.base),
          if (title != null) ...[
            Text(
              title!,
              style: AppTypography.headline,
            ),
            const SizedBox(height: AppSpacing.base),
          ],
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.base),
              child: child,
            ),
          ),
        ],
      ),
    );
  }
}
