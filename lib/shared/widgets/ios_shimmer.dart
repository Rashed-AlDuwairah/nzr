import 'package:flutter/cupertino.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';

class IosShimmer extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const IosShimmer({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = AppSpacing.radiusSm,
  });

  factory IosShimmer.card() {
    return const IosShimmer(
      width: double.infinity,
      height: 120,
      borderRadius: AppSpacing.radiusMd,
    );
  }

  factory IosShimmer.thumbnail() {
    return const IosShimmer(
      width: 100,
      height: 100,
      borderRadius: AppSpacing.radiusSm,
    );
  }

  factory IosShimmer.text({double width = 120}) {
    return IosShimmer(
      width: width,
      height: 16,
      borderRadius: 4,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.surface2,
      highlightColor: AppColors.surface3,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.surface2,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}
