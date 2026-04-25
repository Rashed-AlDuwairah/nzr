import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../../features/downloader/models/video_info.dart';
import 'video_metadata_service.dart';

enum CobaltResponseStatus { redirect, tunnel, picker, error }

class CobaltInstance {
  final String url;
  final double score;
  final bool online;
  final bool authRequired;
  final bool corsAllowed;

  CobaltInstance({
    required this.url,
    required this.score,
    required this.online,
    required this.authRequired,
    required this.corsAllowed,
  });

  factory CobaltInstance.fromJson(Map<String, dynamic> json) {
    return CobaltInstance(
      url: json['url'] ?? '',
      score: (json['score'] ?? 0).toDouble(),
      online: json['online'] == true,
      authRequired: json['auth'] == true,
      corsAllowed: json['cors'] == true,
    );
  }
}

class DownloadResult {
  final String downloadUrl;
  final String? filename;
  final bool isTunnel;

  DownloadResult({
    required this.downloadUrl,
    this.filename,
    this.isTunnel = false,
  });
}

class CobaltError implements Exception {
  final String code;
  final String message;

  CobaltError({required this.code, required this.message});

  @override
  String toString() => 'CobaltError($code): $message';
}

class CobaltService {
  final Dio _dio = Dio();
  final VideoMetadataService _metadataService = VideoMetadataService();
  
  List<String> _instances = [];
  int _currentInstanceIndex = 0;

  static const List<Map<String, String>> qualityOptions = [
    {'label': 'Best Quality', 'value': 'max'},
    {'label': '1080p',        'value': '1080'},
    {'label': '720p',         'value': '720'},
    {'label': '480p',         'value': '480'},
    {'label': '360p',         'value': '360'},
  ];

  Future<void> init() async {
    try {
      final response = await _dio.get(
        ApiConstants.cobaltInstancesUrl,
        options: Options(
          receiveTimeout: const Duration(seconds: 8),
          sendTimeout: const Duration(seconds: 8),
        ),
      );
      
      final List<dynamic> data = response.data;
      final instances = data
          .map((json) => CobaltInstance.fromJson(json))
          .where((i) => i.online && !i.authRequired && i.corsAllowed)
          .toList();
          
      instances.sort((a, b) => b.score.compareTo(a.score));
      
      _instances = instances.take(5).map((i) => i.url).toList();
      
      if (_instances.isEmpty) {
        _instances = List.from(ApiConstants.fallbackInstances);
      }
    } catch (e) {
      _instances = List.from(ApiConstants.fallbackInstances);
    }
    _currentInstanceIndex = 0;
  }

  Future<VideoInfo> getVideoInfo(String url) async {
    return await _metadataService.getMetadata(url);
  }

  Future<DownloadResult> getDownloadLink(String url, String quality) async {
    int retries = 0;
    while (retries < 2) {
      if (_instances.isEmpty) {
        throw CobaltError(code: 'NO_INSTANCES', message: 'No instances available');
      }
      final currentInstance = _instances[_currentInstanceIndex];
      try {
        final response = await _dio.post(
          currentInstance,
          data: {
            "url": url,
            "videoQuality": quality,
            "filenameStyle": "pretty",
            "downloadMode": "auto"
          },
          options: Options(
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            receiveTimeout: const Duration(seconds: 15),
            sendTimeout: const Duration(seconds: 15),
          ),
        );

        final data = response.data;
        final status = data['status'];

        if (status == 'redirect') {
          return DownloadResult(downloadUrl: data['url']);
        } else if (status == 'tunnel') {
          return DownloadResult(downloadUrl: data['url'], isTunnel: true);
        } else if (status == 'picker') {
          return DownloadResult(downloadUrl: data['picker'][0]['url']);
        } else if (status == 'error') {
          throw _mapErrorCode(data['error']['code']);
        } else {
          throw CobaltError(code: 'UNKNOWN', message: 'Unknown status: $status');
        }
      } on DioException catch (e) {
        if (e.response?.statusCode == 429) {
          throw CobaltError(code: 'RATE_EXCEEDED', message: 'Too many requests');
        }
        
        if (e.type == DioExceptionType.receiveTimeout || 
            e.type == DioExceptionType.sendTimeout ||
            (e.response?.statusCode != null && e.response!.statusCode! >= 500)) {
          try {
            await _tryNextInstance();
          } catch (err) {
            throw CobaltError(code: 'NO_INSTANCES', message: 'All instances failed');
          }
          retries++;
          continue;
        }
        
        throw CobaltError(code: 'NETWORK_ERROR', message: e.message ?? 'Network error');
      } catch (e) {
        if (e is CobaltError) rethrow;
        throw CobaltError(code: 'UNKNOWN', message: e.toString());
      }
    }
    throw CobaltError(code: 'NO_INSTANCES', message: 'All instances failed');
  }

  Future<void> _tryNextInstance() async {
    _currentInstanceIndex++;
    if (_currentInstanceIndex >= _instances.length) {
      throw CobaltError(code: 'NO_INSTANCES', message: 'No more instances available');
    }
  }

  CobaltError _mapErrorCode(String code) {
    switch (code) {
      case 'error.api.rate_exceeded':
        return CobaltError(code: 'RATE_EXCEEDED', message: 'Too many requests');
      case 'error.content.unavailable':
        return CobaltError(code: 'CONTENT_UNAVAILABLE', message: 'Content unavailable');
      case 'error.link.unsupported':
        return CobaltError(code: 'UNSUPPORTED_PLATFORM', message: 'Unsupported platform');
      case 'error.link.invalid':
        return CobaltError(code: 'INVALID_URL', message: 'Invalid link');
      case 'error.content.private':
        return CobaltError(code: 'PRIVATE_VIDEO', message: 'Private video');
      case 'error.content.age':
        return CobaltError(code: 'AGE_RESTRICTED', message: 'Age restricted content');
      case 'error.content.geoblocked':
        return CobaltError(code: 'GEO_RESTRICTED', message: 'Geoblocked content');
      default:
        return CobaltError(code: 'UNKNOWN', message: code);
    }
  }
}
