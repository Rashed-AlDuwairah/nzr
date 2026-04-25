enum VideoPlatform {
  youtube,
  tiktok,
  instagram,
  twitter,
  reddit,
  facebook,
  other,
}

class VideoInfo {
  final String title;
  final String? thumbnailUrl;
  final VideoPlatform platform;
  final int? durationSeconds;
  final String? uploaderName;

  VideoInfo({
    required this.title,
    this.thumbnailUrl,
    required this.platform,
    this.durationSeconds,
    this.uploaderName,
  });
}
