import 'dart:io';
import 'package:flutter/cupertino.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/theme/app_spacing.dart';
import '../../shared/widgets/animated_pressable.dart';
import '../../features/library/models/saved_video.dart';

class VideoThumbnailCard extends StatelessWidget {
  final SavedVideo video;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;

  const VideoThumbnailCard({
    super.key,
    required this.video,
    required this.onTap,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedPressable(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Thumbnail
            _buildThumbnail(),
            // Platform Badge
            Positioned(
              top: 6,
              left: 6,
              child: _SmallPlatformBadge(platform: video.platform),
            ),
            // Duration Badge
            if (video.durationSeconds != null)
              Positioned(
                bottom: 6,
                right: 6,
                child: _DurationBadge(seconds: video.durationSeconds!),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildThumbnail() {
    if (video.thumbnailPath != null && File(video.thumbnailPath!).existsSync()) {
      return Image.file(File(video.thumbnailPath!), fit: BoxFit.cover);
    }
    // Fallback or shimmer
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.surface2,
            AppColors.surface3,
          ],
        ),
      ),
      child: const Icon(CupertinoIcons.videocam, color: AppColors.textTertiary),
    );
  }
}

class _SmallPlatformBadge extends StatelessWidget {
  final String platform;
  const _SmallPlatformBadge({required this.platform});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.overlay.withOpacity(0.5),
        shape: BoxShape.circle,
      ),
      child: Icon(
        _getIcon(),
        size: 12,
        color: CupertinoColors.white,
      ),
    );
  }

  IconData _getIcon() {
    switch (platform.toLowerCase()) {
      case 'youtube': return CupertinoIcons.play_circle_fill;
      case 'tiktok': return CupertinoIcons.music_note_2;
      case 'instagram': return CupertinoIcons.camera_fill;
      default: return CupertinoIcons.videocam_fill;
    }
  }
}

class _DurationBadge extends StatelessWidget {
  final int seconds;
  const _DurationBadge({required this.seconds});

  @override
  Widget build(BuildContext context) {
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    final durationText = '$minutes:${remainingSeconds.toString().padLeft(2, '0')}';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.overlay.withOpacity(0.6),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        durationText,
        style: AppTypography.caption2.copyWith(color: CupertinoColors.white, fontSize: 10),
      ),
    );
  }
}
