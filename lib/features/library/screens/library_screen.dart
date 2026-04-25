import 'package:flutter/cupertino.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/ios_empty_state.dart';
import '../../../shared/widgets/ios_shimmer.dart';
import '../../../shared/widgets/video_thumbnail_card.dart';
import '../cubit/library_cubit.dart';
import '../cubit/library_state.dart';
import 'video_player_screen.dart';

class LibraryScreen extends StatelessWidget {
  const LibraryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => LibraryCubit()..loadVideos(),
      child: CupertinoPageScaffold(
        backgroundColor: AppColors.background,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
          slivers: [
            const CupertinoSliverNavigationBar(
              backgroundColor: AppColors.background,
              border: null,
              largeTitle: Text('Library', style: TextStyle(color: CupertinoColors.white)),
            ),
            BlocBuilder<LibraryCubit, LibraryState>(
              builder: (context, state) {
                if (state is LibraryLoading) {
                  return SliverPadding(
                    padding: const EdgeInsets.all(AppSpacing.base),
                    sliver: SliverGrid(
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        mainAxisSpacing: AppSpacing.sm,
                        crossAxisSpacing: AppSpacing.sm,
                        childAspectRatio: 9 / 16,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) => const IosShimmer(width: 100, height: 180),
                        childCount: 12,
                      ),
                    ),
                  );
                } else if (state is LibraryLoaded) {
                  return SliverPadding(
                    padding: const EdgeInsets.all(AppSpacing.base),
                    sliver: SliverGrid(
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        mainAxisSpacing: AppSpacing.sm,
                        crossAxisSpacing: AppSpacing.sm,
                        childAspectRatio: 9 / 16,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final video = state.videos[index];
                          return CupertinoContextMenu(
                            actions: [
                              CupertinoContextMenuAction(
                                onPressed: () {
                                  Navigator.pop(context);
                                  context.read<LibraryCubit>().shareVideo(video);
                                },
                                isDefaultAction: true,
                                trailingIcon: CupertinoIcons.share,
                                child: const Text('Share'),
                              ),
                              CupertinoContextMenuAction(
                                onPressed: () {
                                  Navigator.pop(context);
                                  context.read<LibraryCubit>().deleteVideo(video);
                                },
                                isDestructiveAction: true,
                                trailingIcon: CupertinoIcons.delete,
                                child: const Text('Delete'),
                              ),
                            ],
                            child: VideoThumbnailCard(
                              video: video,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  CupertinoPageRoute(
                                    builder: (context) => VideoPlayerScreen(video: video),
                                  ),
                                );
                              },
                            ),
                          );
                        },
                        childCount: state.videos.length,
                      ),
                    ),
                  );
                } else if (state is LibraryEmpty) {
                  return SliverFillRemaining(
                    hasScrollBody: false,
                    child: IosEmptyState.library(
                      onButtonTap: () {
                        context.read<LibraryCubit>().loadVideos();
                      },
                    ),
                  );
                } else if (state is LibraryError) {
                  return SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Text(state.message, style: const TextStyle(color: AppColors.systemRed)),
                    ),
                  );
                }
                return const SliverToBoxAdapter(child: SizedBox.shrink());
              },
            ),
          ],
        ),
      ),
    );
  }
}
