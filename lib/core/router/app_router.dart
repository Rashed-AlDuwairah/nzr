import 'package:flutter/cupertino.dart';
import 'package:go_router/go_router.dart';
import '../../features/downloader/screens/home_screen.dart';
import '../../features/library/screens/library_screen.dart';
import '../../features/library/screens/video_player_screen.dart';
import '../../features/library/models/saved_video.dart';
import '../../shared/widgets/app_shell.dart';

class AppRouter {
  static final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();

  static final GoRouter router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/',
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/library',
                builder: (context, state) => const LibraryScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/player',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final video = state.extra as SavedVideo;
          return VideoPlayerScreen(video: video);
        },
      ),
    ],
  );
}
