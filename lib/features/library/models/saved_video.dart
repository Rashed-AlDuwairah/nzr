import 'package:isar/isar.dart';

part 'saved_video.g.dart';

@collection
class SavedVideo {
  Id id = Isar.autoIncrement;
  late String title;
  late String filePath;
  late String platform;      // 'tiktok', 'twitter', 'instagram', 'youtube', 'other'
  late String quality;       // '1080', '720', etc.
  String? thumbnailPath;     // locally cached thumbnail
  String? originalUrl;       // original link
  String? uploaderName;
  int? durationSeconds;
  late int fileSizeBytes;
  late DateTime downloadedAt;
}
