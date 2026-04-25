import '../models/video_info.dart';
import '../models/quality_option.dart';

abstract class DownloaderState {}

class DownloaderInitial extends DownloaderState {}

class DownloaderFetchingInfo extends DownloaderState {
  final String url;
  DownloaderFetchingInfo(this.url);
}

class DownloaderInfoLoaded extends DownloaderState {
  final VideoInfo videoInfo;
  final String url;
  final List<QualityOption> qualities;
  final String selectedQuality;

  DownloaderInfoLoaded({
    required this.videoInfo,
    required this.url,
    required this.qualities,
    this.selectedQuality = 'max',
  });

  DownloaderInfoLoaded copyWith({
    VideoInfo? videoInfo,
    String? url,
    List<QualityOption>? qualities,
    String? selectedQuality,
  }) {
    return DownloaderInfoLoaded(
      videoInfo: videoInfo ?? this.videoInfo,
      url: url ?? this.url,
      qualities: qualities ?? this.qualities,
      selectedQuality: selectedQuality ?? this.selectedQuality,
    );
  }
}

class DownloaderDownloading extends DownloaderState {
  final VideoInfo videoInfo;
  final double progress;
  final double? speedMBps;
  final int? etaSeconds;
  final String taskId;

  DownloaderDownloading({
    required this.videoInfo,
    required this.progress,
    this.speedMBps,
    this.etaSeconds,
    required this.taskId,
  });
}

class DownloaderCompleted extends DownloaderState {
  final VideoInfo videoInfo;
  DownloaderCompleted(this.videoInfo);
}

class DownloaderError extends DownloaderState {
  final String errorCode;
  final String url;

  DownloaderError({required this.errorCode, required this.url});
}
