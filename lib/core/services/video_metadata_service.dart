import 'package:dio/dio.dart';
import '../../features/downloader/models/video_info.dart';

class VideoMetadataService {
  final Dio _dio = Dio();

  Future<VideoInfo> getMetadata(String url) async {
    final platform = _detectPlatform(url);
    try {
      switch (platform) {
        case VideoPlatform.youtube:
          return await _fetchYouTubeMetadata(url);
        case VideoPlatform.tiktok:
          return await _fetchTikTokMetadata(url);
        default:
          return await _fetchOpenGraph(url, platform);
      }
    } catch (e) {
      return VideoInfo(
        title: "Video",
        thumbnailUrl: null,
        platform: platform,
      );
    }
  }

  VideoPlatform _detectPlatform(String url) {
    final lowerUrl = url.toLowerCase();
    if (lowerUrl.contains('youtube.com') || lowerUrl.contains('youtu.be')) {
      return VideoPlatform.youtube;
    } else if (lowerUrl.contains('tiktok.com') || lowerUrl.contains('vm.tiktok.com')) {
      return VideoPlatform.tiktok;
    } else if (lowerUrl.contains('instagram.com')) {
      return VideoPlatform.instagram;
    } else if (lowerUrl.contains('twitter.com') || lowerUrl.contains('x.com')) {
      return VideoPlatform.twitter;
    } else if (lowerUrl.contains('reddit.com')) {
      return VideoPlatform.reddit;
    } else if (lowerUrl.contains('facebook.com') || lowerUrl.contains('fb.watch')) {
      return VideoPlatform.facebook;
    } else {
      return VideoPlatform.other;
    }
  }

  Future<VideoInfo> _fetchYouTubeMetadata(String url) async {
    final response = await _dio.get(
      'https://www.youtube.com/oembed',
      queryParameters: {'url': url, 'format': 'json'},
    );
    final data = response.data;
    return VideoInfo(
      title: data['title'] ?? 'YouTube Video',
      thumbnailUrl: data['thumbnail_url'],
      platform: VideoPlatform.youtube,
      uploaderName: data['author_name'],
    );
  }

  Future<VideoInfo> _fetchTikTokMetadata(String url) async {
    final response = await _dio.get(
      'https://www.tiktok.com/oembed',
      queryParameters: {'url': url},
    );
    final data = response.data;
    return VideoInfo(
      title: data['title'] ?? 'TikTok Video',
      thumbnailUrl: data['thumbnail_url'],
      platform: VideoPlatform.tiktok,
      uploaderName: data['author_name'],
    );
  }

  Future<VideoInfo> _fetchOpenGraph(String url, VideoPlatform platform) async {
    try {
      final response = await _dio.get(
        url,
        options: Options(
          receiveTimeout: const Duration(seconds: 5),
          sendTimeout: const Duration(seconds: 5),
        ),
      );
      final html = response.data.toString();

      String? title = _extractMeta(html, 'og:title');
      String? image = _extractMeta(html, 'og:image');
      String? durationStr = _extractMeta(html, 'og:video:duration');

      if (title == null) {
        final uri = Uri.tryParse(url);
        title = uri?.host ?? 'Video';
      }

      int? duration;
      if (durationStr != null) {
        duration = int.tryParse(durationStr);
      }

      return VideoInfo(
        title: title,
        thumbnailUrl: image,
        platform: platform,
        durationSeconds: duration,
      );
    } catch (e) {
      return VideoInfo(
        title: "Video",
        thumbnailUrl: null,
        platform: platform,
      );
    }
  }

  String? _extractMeta(String html, String property) {
    final regExp = RegExp(
      '<meta[^>]*property=["\']$property["\'][^>]*content=["\']([^"\']*)["\']',
      caseSensitive: false,
    );
    final match = regExp.firstMatch(html);
    if (match != null && match.groupCount >= 1) {
      return match.group(1);
    }
    // Try reversed order
    final regExpAlt = RegExp(
      '<meta[^>]*content=["\']([^"\']*)["\'][^>]*property=["\']$property["\']',
      caseSensitive: false,
    );
    final matchAlt = regExpAlt.firstMatch(html);
    return matchAlt?.group(1);
  }
}
