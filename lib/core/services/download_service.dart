import 'dart:async';
import 'dart:io';
import 'package:background_downloader/background_downloader.dart';
import 'package:photo_manager/photo_manager.dart';

class DownloadTaskInfo {
  final String taskId;
  final String url;
  final String filename;
  final String platform;
  final String? thumbnailUrl;
  final String? videoTitle;

  DownloadTaskInfo({
    required this.taskId,
    required this.url,
    required this.filename,
    required this.platform,
    this.thumbnailUrl,
    this.videoTitle,
  });
}

enum DownloadStatus { queued, downloading, completed, failed, cancelled }

class DownloadProgress {
  final String taskId;
  final double progress;
  final double? speedMBps;
  final int? etaSeconds;
  final DownloadStatus status;

  DownloadProgress({
    required this.taskId,
    required this.progress,
    this.speedMBps,
    this.etaSeconds,
    required this.status,
  });
}

class DownloadService {
  final _progressController = StreamController<DownloadProgress>.broadcast();
  Stream<DownloadProgress> get progressStream => _progressController.stream;

  final Map<String, DownloadTaskInfo> _tasks = {};

  DownloadService() {
    FileDownloader().updates.listen((update) {
      if (update is TaskProgressUpdate) {
        _progressController.add(DownloadProgress(
          taskId: update.task.taskId,
          progress: update.progress,
          status: DownloadStatus.downloading,
          speedMBps: update.networkSpeed,
          etaSeconds: -1, // Not directly available on update
        ));
      } else if (update is TaskStatusUpdate) {
        _progressController.add(DownloadProgress(
          taskId: update.task.taskId,
          progress: update.status == TaskStatus.complete ? 1.0 : 0.0,
          status: _mapStatus(update.status),
        ));
      }
    });
  }

  DownloadStatus _mapStatus(TaskStatus status) {
    switch (status) {
      case TaskStatus.enqueued:
        return DownloadStatus.queued;
      case TaskStatus.running:
        return DownloadStatus.downloading;
      case TaskStatus.complete:
        return DownloadStatus.completed;
      case TaskStatus.failed:
        return DownloadStatus.failed;
      case TaskStatus.canceled:
        return DownloadStatus.cancelled;
      default:
        return DownloadStatus.failed;
    }
  }

  Future<String> startDownload(DownloadTaskInfo taskInfo) async {
    final task = DownloadTask(
      url: taskInfo.url,
      filename: taskInfo.filename,
      directory: 'nzr_downloads',
      baseDirectory: BaseDirectory.temporary,
      updates: Updates.statusAndProgress,
    );

    _tasks[task.taskId] = taskInfo;
    await FileDownloader().enqueue(task);
    return task.taskId;
  }

  Future<bool> saveToPhotos(String filePath) async {
    final PermissionState ps = await PhotoManager.requestPermissionExtend();
    if (ps.isAuth) {
      final File file = File(filePath);
      if (!await file.exists()) return false;
      
      final AssetEntity? asset = await PhotoManager.editor.saveVideo(
        file,
        title: filePath.split(Platform.pathSeparator).last,
      );
      return asset != null;
    }
    return false;
  }

  Future<void> cancelDownload(String taskId) async {
    await FileDownloader().cancelTaskWithId(taskId);
  }

  Future<List<DownloadTaskInfo>> getActiveDownloads() async {
    final records = await FileDownloader().database.allRecords();
    return records
        .where((r) => _tasks.containsKey(r.taskId))
        .map((r) => _tasks[r.taskId]!)
        .toList();
  }
}
