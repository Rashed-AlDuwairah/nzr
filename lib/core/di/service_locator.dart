import 'package:get_it/get_it.dart';
import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';
import '../services/cobalt_service.dart';
import '../services/download_service.dart';
import '../services/notification_service.dart';
import '../../features/library/models/saved_video.dart';

Future<void> setupServiceLocator() async {
  final getIt = GetIt.instance;

  // Database
  final dir = await getApplicationDocumentsDirectory();
  final isar = await Isar.open(
    [SavedVideoSchema],
    directory: dir.path,
  );
  getIt.registerSingleton<Isar>(isar);

  // Services
  getIt.registerSingleton<NotificationService>(NotificationService());
  
  getIt.registerSingletonAsync<CobaltService>(() async {
    final service = CobaltService();
    await service.init();
    return service;
  });

  getIt.registerSingleton<DownloadService>(DownloadService());

  await getIt.allReady();
}
