import 'package:flutter/cupertino.dart';
import 'package:get_it/get_it.dart';
import 'core/di/service_locator.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_colors.dart';
import 'core/services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize service locator (includes Isar)
  await setupServiceLocator();

  // Initialize notifications
  await GetIt.I<NotificationService>().init();

  runApp(const NzrApp());
}

class NzrApp extends StatelessWidget {
  const NzrApp({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoApp.router(
      title: 'nzr',
      routerConfig: AppRouter.router,
      debugShowCheckedModeBanner: false,
      theme: const CupertinoThemeData(
        brightness: Brightness.dark,
        primaryColor: AppColors.systemBlue,
        scaffoldBackgroundColor: AppColors.background,
        barBackgroundColor: AppColors.surface,
        textTheme: CupertinoTextThemeData(
          primaryColor: AppColors.textPrimary,
        ),
      ),
    );
  }
}
