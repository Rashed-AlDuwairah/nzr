import 'package:flutter/cupertino.dart';
import '../../core/theme/app_colors.dart';
import '../../features/downloader/models/video_info.dart';

class PlatformBadge extends StatelessWidget {
  final VideoPlatform platform;

  const PlatformBadge({super.key, required this.platform});

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;

    switch (platform) {
      case VideoPlatform.youtube:
        color = const Color(0xFFFF0000);
        label = 'YouTube';
        break;
      case VideoPlatform.tiktok:
        color = const Color(0xFF000000);
        label = 'TikTok';
        break;
      case VideoPlatform.instagram:
        color = const Color(0xFFE1306C);
        label = 'Instagram';
        break;
      case VideoPlatform.twitter:
        color = const Color(0xFF1DA1F2);
        label = 'Twitter/X';
        break;
      case VideoPlatform.reddit:
        color = const Color(0xFFFF4500);
        label = 'Reddit';
        break;
      case VideoPlatform.facebook:
        color = const Color(0xFF1877F2);
        label = 'Facebook';
        break;
      default:
        color = AppColors.systemBlue;
        label = 'Video';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withOpacity(0.5), width: 0.5),
      ),
      child: Text(
        label.toUpperCase(),
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
