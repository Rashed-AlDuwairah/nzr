import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'downloader_state.dart';
import '../../../core/services/cobalt_service.dart';
import '../../../core/services/download_service.dart';
import '../models/quality_option.dart';

class DownloaderCubit extends Cubit<DownloaderState> {
  final CobaltService _cobaltService = GetIt.I<CobaltService>();
  final DownloadService _downloadService = GetIt.I<DownloadService>();
  final FlutterLocalNotificationsPlugin _notifications = FlutterLocalNotificationsPlugin();

  StreamSubscription? _progressSubscription;

  DownloaderCubit() : super(DownloaderInitial());

  Future<void> fetchVideoInfo(String url) async {
    if (!url.startsWith('http')) {
      emit(DownloaderError(errorCode: 'INVALID_URL', url: url));
      return;
    }

    emit(DownloaderFetchingInfo(url));

    try {
      final videoInfo = await _cobaltService.getVideoInfo(url);
      final qualities = CobaltService.qualityOptions.map((q) => QualityOption(
        label: q['label']!,
        value: q['value']!,
        isSelected: q['value'] == 'max',
      )).toList();

      emit(DownloaderInfoLoaded(
        videoInfo: videoInfo,
        url: url,
        qualities: qualities,
      ));
    } catch (e) {
      String code = 'UNKNOWN';
      if (e is CobaltError) code = e.code;
      emit(DownloaderError(errorCode: code, url: url));
    }
  }

  void selectQuality(String quality) {
    if (state is DownloaderInfoLoaded) {
      final s = state as DownloaderInfoLoaded;
      final newQualities = s.qualities.map((q) => q.copyWith(isSelected: q.value == quality)).toList();
      emit(s.copyWith(qualities: newQualities, selectedQuality: quality));
    }
  }

  Future<void> startDownload() async {
    if (state is DownloaderInfoLoaded) {
      final s = state as DownloaderInfoLoaded;
      try {
        final result = await _cobaltService.getDownloadLink(s.url, s.selectedQuality);
        
        final taskInfo = DownloadTaskInfo(
          taskId: '', // will be set by startDownload
          url: result.downloadUrl,
          filename: '${s.videoInfo.title.replaceAll(RegExp(r'[^\w\s]'), '')}.mp4',
          platform: s.videoInfo.platform.name,
          thumbnailUrl: s.videoInfo.thumbnailUrl,
          videoTitle: s.videoInfo.title,
        );

        final taskId = await _downloadService.startDownload(taskInfo);
        
        emit(DownloaderDownloading(
          videoInfo: s.videoInfo,
          progress: 0.0,
          taskId: taskId,
        ));

        _progressSubscription?.cancel();
        _progressSubscription = _downloadService.progressStream.listen((progress) async {
          if (progress.taskId == taskId) {
            if (progress.status == DownloadStatus.completed) {
              _progressSubscription?.cancel();
              _showNotification(s.videoInfo.title);
              emit(DownloaderCompleted(s.videoInfo));
            } else if (progress.status == DownloadStatus.failed) {
              _progressSubscription?.cancel();
              emit(DownloaderError(errorCode: 'DOWNLOAD_FAILED', url: s.url));
            } else {
              emit(DownloaderDownloading(
                videoInfo: s.videoInfo,
                progress: progress.progress,
                speedMBps: progress.speedMBps,
                etaSeconds: progress.etaSeconds,
                taskId: taskId,
              ));
            }
          }
        });
      } catch (e) {
        String code = 'UNKNOWN';
        if (e is CobaltError) code = e.code;
        emit(DownloaderError(errorCode: code, url: s.url));
      }
    }
  }

  Future<void> _showNotification(String title) async {
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    const details = NotificationDetails(iOS: iosDetails);
    await _notifications.show(
      0,
      '✅ Downloaded',
      title,
      details,
    );
  }

  void reset() {
    _progressSubscription?.cancel();
    emit(DownloaderInitial());
  }

  @override
  Future<void> close() {
    _progressSubscription?.cancel();
    return super.close();
  }
}
