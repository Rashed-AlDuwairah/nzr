import 'package:flutter/cupertino.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/ios_bottom_sheet.dart';
import '../../../shared/widgets/ios_button.dart';
import '../../../shared/widgets/ios_card.dart';
import '../../../shared/widgets/animated_pressable.dart';
import '../../../shared/widgets/platform_badge.dart';
import '../cubit/downloader_cubit.dart';
import '../cubit/downloader_state.dart';

class QualityPickerSheet extends StatelessWidget {
  final DownloaderInfoLoaded state;
  final DownloaderCubit cubit;

  const QualityPickerSheet({
    super.key,
    required this.state,
    required this.cubit,
  });

  static void show(BuildContext context, DownloaderInfoLoaded state, DownloaderCubit cubit) {
    IosBottomSheet.show(
      context,
      child: QualityPickerSheet(state: state, cubit: cubit),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Video Preview Card
        IosCard(
          padding: EdgeInsets.zero,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusMd)),
                    child: CachedNetworkImage(
                      imageUrl: state.videoInfo.thumbnailUrl ?? '',
                      width: double.infinity,
                      height: 200,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        height: 200,
                        color: AppColors.surface2,
                        child: const Center(child: CupertinoActivityIndicator()),
                      ),
                      errorWidget: (context, url, error) => Container(
                        height: 200,
                        color: AppColors.surface2,
                        child: const Icon(CupertinoIcons.video_camera, size: 48, color: AppColors.textTertiary),
                      ),
                    ),
                  ),
                  Positioned(
                    top: AppSpacing.sm,
                    left: AppSpacing.sm,
                    child: PlatformBadge(platform: state.videoInfo.platform),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      state.videoInfo.title,
                      style: AppTypography.headline,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (state.videoInfo.uploaderName != null) ...[
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        state.videoInfo.uploaderName!,
                        style: AppTypography.subheadline.copyWith(color: AppColors.textSecondary),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        Align(
          alignment: Alignment.centerLeft,
          child: Text(
            'Select Quality',
            style: AppTypography.subheadline.copyWith(color: AppColors.textTertiary),
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        // Quality List
        ...state.qualities.map((quality) {
          final isSelected = quality.value == state.selectedQuality;
          return Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: AnimatedPressable(
              onTap: () => cubit.selectQuality(quality.value),
              child: IosCard(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.base, vertical: AppSpacing.md),
                showBorder: isSelected,
                child: Row(
                  children: [
                    Text(
                      quality.label,
                      style: AppTypography.headline,
                    ),
                    const Spacer(),
                    if (isSelected)
                      const Icon(
                        CupertinoIcons.checkmark_alt,
                        color: AppColors.systemBlue,
                        size: 20,
                      ),
                  ],
                ),
              ),
            ),
          );
        }),
        const SizedBox(height: AppSpacing.xl),
        IosButton.primary(
          label: 'Download',
          onTap: () {
            Navigator.pop(context);
            cubit.startDownload();
          },
        ),
        const SizedBox(height: AppSpacing.xxl),
      ],
    );
  }
}
