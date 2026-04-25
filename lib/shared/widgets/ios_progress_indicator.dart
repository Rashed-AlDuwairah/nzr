import 'package:flutter/cupertino.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/theme/app_spacing.dart';
import 'ios_card.dart';

class IosProgressIndicator extends StatelessWidget {
  final String title;
  final String thumbnailUrl;
  final String platform;
  final double progress; // 0.0 to 1.0
  final String speed;
  final String eta;
  final VoidCallback? onCancel;

  const IosProgressIndicator({
    super.key,
    required this.title,
    required this.thumbnailUrl,
    required this.platform,
    required this.progress,
    required this.speed,
    required this.eta,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return IosCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        children: [
          // Thumbnail
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: CachedNetworkImage(
              imageUrl: thumbnailUrl,
              width: 56,
              height: 56,
              fit: BoxFit.cover,
              placeholder: (context, url) => Container(
                color: AppColors.surface2,
                child: const CupertinoActivityIndicator(),
              ),
              errorWidget: (context, url, error) => Container(
                color: AppColors.surface2,
                child: const Icon(CupertinoIcons.video_camera, color: AppColors.textTertiary),
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: AppTypography.subheadline.copyWith(fontWeight: FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    _PlatformBadge(platform: platform),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                // Progress Bar
                Stack(
                  children: [
                    Container(
                      height: 4,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: AppColors.surface3,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          height: 4,
                          width: constraints.maxWidth * progress,
                          decoration: BoxDecoration(
                            color: AppColors.systemBlue,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        );
                      }
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${(progress * 100).toInt()}%',
                      style: AppTypography.caption2.copyWith(color: AppColors.textSecondary),
                    ),
                    Text(
                      '$speed • $eta',
                      style: AppTypography.caption2.copyWith(color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          // Cancel Button
          GestureDetector(
            onTap: onCancel,
            behavior: HitTestBehavior.opaque,
            child: const Padding(
              padding: EdgeInsets.all(8.0),
              child: Icon(
                CupertinoIcons.xmark,
                color: AppColors.textSecondary,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PlatformBadge extends StatelessWidget {
  final String platform;

  const _PlatformBadge({required this.platform});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (platform.toLowerCase()) {
      case 'youtube':
        color = const Color(0xFFFF0000);
        break;
      case 'tiktok':
        color = const Color(0xFF000000);
        break;
      case 'instagram':
        color = const Color(0xFFE1306C);
        break;
      default:
        color = AppColors.systemBlue;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withOpacity(0.5), width: 0.5),
      ),
      child: Text(
        platform.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 9,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
