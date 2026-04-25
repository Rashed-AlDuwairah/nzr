import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/theme/app_spacing.dart';
import 'animated_pressable.dart';

enum IosButtonVariant { primary, secondary, destructive }

class IosButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final IosButtonVariant variant;
  final bool isLoading;
  final bool isDisabled;

  const IosButton({
    super.key,
    required this.label,
    this.onTap,
    this.variant = IosButtonVariant.primary,
    this.isLoading = false,
    this.isDisabled = false,
  });

  const IosButton.primary({
    super.key,
    required this.label,
    this.onTap,
    this.isLoading = false,
    this.isDisabled = false,
  }) : variant = IosButtonVariant.primary;

  const IosButton.secondary({
    super.key,
    required this.label,
    this.onTap,
    this.isLoading = false,
    this.isDisabled = false,
  }) : variant = IosButtonVariant.secondary;

  const IosButton.destructive({
    super.key,
    required this.label,
    this.onTap,
    this.isLoading = false,
    this.isDisabled = false,
  }) : variant = IosButtonVariant.destructive;

  @override
  Widget build(BuildContext context) {
    final bool effectiveDisabled = isDisabled || isLoading || onTap == null;

    Color backgroundColor;
    Color textColor;
    Border? border;

    switch (variant) {
      case IosButtonVariant.primary:
        backgroundColor = AppColors.systemBlue;
        textColor = CupertinoColors.white;
        break;
      case IosButtonVariant.secondary:
        backgroundColor = AppColors.surface2;
        textColor = AppColors.textPrimary;
        border = Border.all(color: AppColors.separator, width: 0.5);
        break;
      case IosButtonVariant.destructive:
        backgroundColor = AppColors.systemRed.withOpacity(0.15);
        textColor = AppColors.systemRed;
        break;
    }

    return AnimatedPressable(
      onTap: effectiveDisabled ? null : () {
        if (variant == IosButtonVariant.primary) {
          HapticFeedback.mediumImpact();
        }
        onTap?.call();
      },
      child: Opacity(
        opacity: effectiveDisabled ? 0.4 : 1.0,
        child: Container(
          height: 52,
          width: double.infinity,
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: border,
          ),
          child: Center(
            child: isLoading
                ? CupertinoActivityIndicator(color: textColor)
                : Text(
                    label,
                    style: AppTypography.headline.copyWith(color: textColor),
                  ),
          ),
        ),
      ),
    );
  }
}
