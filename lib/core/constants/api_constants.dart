class ApiConstants {
  // Cobalt instance list URL
  static const String cobaltInstancesUrl =
      'https://instances.cobalt.best/instances.json';

  // Hardcoded fallback instances (used if instance fetch fails)
  static const List<String> fallbackInstances = [
    'https://cobalt.api.lostdusty.com.br',
    'https://cobalt.ggtyler.dev',
  ];

  // oEmbed endpoints for metadata
  static const String youtubeOembed =
      'https://www.youtube.com/oembed';
  static const String tiktokOembed =
      'https://www.tiktok.com/oembed';
}
