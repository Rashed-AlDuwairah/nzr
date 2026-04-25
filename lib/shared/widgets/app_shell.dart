import 'package:flutter/cupertino.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';

class AppShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const AppShell({
    super.key,
    required this.navigationShell,
  });

  @override
  Widget build(BuildContext context) {
    return CupertinoTabScaffold(
      tabBar: CupertinoTabBar(
        backgroundColor: AppColors.surface.withOpacity(0.9),
        activeColor: AppColors.systemBlue,
        inactiveColor: AppColors.textTertiary,
        border: const Border(
          top: BorderSide(color: AppColors.separator, width: 0.5),
        ),
        currentIndex: navigationShell.currentIndex,
        onTap: (index) {
          navigationShell.goBranch(
            index,
            initialLocation: index == navigationShell.currentIndex,
          );
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.arrow_down_circle),
            activeIcon: Icon(CupertinoIcons.arrow_down_circle_fill),
            label: 'Download',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.tray),
            activeIcon: Icon(CupertinoIcons.tray_fill),
            label: 'Library',
          ),
        ],
      ),
      tabBuilder: (context, index) {
        return navigationShell;
      },
    );
  }
}
