import 'dart:async';
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:receive_sharing_intent/receive_sharing_intent.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_animations.dart';
import '../../../shared/widgets/ios_text_field.dart';
import '../../../shared/widgets/ios_button.dart';
import '../../../shared/widgets/ios_progress_indicator.dart';
import '../../../shared/widgets/ios_error_view.dart';
import '../cubit/downloader_cubit.dart';
import '../cubit/downloader_state.dart';
import 'quality_picker_sheet.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _urlController = TextEditingController();
  late AnimationController _successBannerController;
  late StreamSubscription _intentDataStreamSubscription;

  @override
  void initState() {
    super.initState();
    _successBannerController = AnimationController(
      vsync: this,
      duration: AppAnimations.normal,
    );
    _checkClipboard();
    _listenToSharingIntent();
    _urlController.addListener(() {
      setState(() {}); // Update fetch button enabled state
    });
  }

  void _listenToSharingIntent() {
    _intentDataStreamSubscription = ReceiveSharingIntent.instance.getMediaStream().listen((value) {
      if (value.isNotEmpty && mounted) {
        final url = value.first.path;
        _urlController.text = url;
        HapticFeedback.mediumImpact();
      }
    });

    ReceiveSharingIntent.instance.getInitialMedia().then((value) {
      if (value.isNotEmpty && mounted) {
        _urlController.text = value.first.path;
        HapticFeedback.mediumImpact();
      }
    });
  }

  @override
  void dispose() {
    _urlController.dispose();
    _successBannerController.dispose();
    _intentDataStreamSubscription.cancel();
    super.dispose();
  }

  Future<void> _checkClipboard() async {
    final data = await Clipboard.getData('text/plain');
    if (data?.text != null && data!.text!.startsWith('http')) {
      _urlController.text = data.text!;
      HapticFeedback.lightImpact();
    }
  }

  void _showSuccessBanner() {
    _successBannerController.forward();
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) _successBannerController.reverse();
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => DownloaderCubit(),
      child: BlocListener<DownloaderCubit, DownloaderState>(
        listener: (context, state) {
          if (state is DownloaderInfoLoaded) {
            QualityPickerSheet.show(context, state, context.read<DownloaderCubit>());
          } else if (state is DownloaderCompleted) {
            _showSuccessBanner();
            context.read<DownloaderCubit>().reset();
            _urlController.clear();
          }
        },
        child: CupertinoPageScaffold(
          backgroundColor: AppColors.background,
          child: Stack(
            children: [
              CustomScrollView(
                slivers: [
                  const CupertinoSliverNavigationBar(
                    backgroundColor: AppColors.background,
                    border: null,
                    largeTitle: Text('nzr', style: TextStyle(color: CupertinoColors.white)),
                  ),
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Padding(
                      padding: const EdgeInsets.all(AppSpacing.base),
                      child: Column(
                        children: [
                          const Spacer(),
                          // Hero Section
                          Column(
                            children: [
                              const Text(
                                'Download anything.',
                                style: AppTypography.title2,
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: AppSpacing.sm),
                              Text(
                                'Paste a link from TikTok, Twitter, Instagram, YouTube and more.',
                                style: AppTypography.body.copyWith(color: AppColors.textSecondary),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.xxl),
                          // Input Field
                          BlocBuilder<DownloaderCubit, DownloaderState>(
                            builder: (context, state) {
                              return IosTextField(
                                controller: _urlController,
                                placeholder: 'Paste a link...',
                              );
                            },
                          ),
                          const SizedBox(height: AppSpacing.md),
                          // Fetch Button
                          BlocBuilder<DownloaderCubit, DownloaderState>(
                            builder: (context, state) {
                              return IosButton.primary(
                                label: 'Fetch Video',
                                isLoading: state is DownloaderFetchingInfo,
                                isDisabled: _urlController.text.isEmpty,
                                onTap: () {
                                  context.read<DownloaderCubit>().fetchVideoInfo(_urlController.text);
                                },
                              );
                            },
                          ),
                          const SizedBox(height: AppSpacing.xl),
                          // Active Downloads / Error
                          BlocBuilder<DownloaderCubit, DownloaderState>(
                            builder: (context, state) {
                              if (state is DownloaderDownloading) {
                                return IosProgressIndicator(
                                  title: state.videoInfo.title,
                                  thumbnailUrl: state.videoInfo.thumbnailUrl ?? '',
                                  platform: state.videoInfo.platform.name,
                                  progress: state.progress,
                                  speed: state.speedMBps != null ? '${state.speedMBps!.toStringAsFixed(1)} MB/s' : '0.0 MB/s',
                                  eta: state.etaSeconds != null ? '${state.etaSeconds}s' : '--',
                                  onCancel: () => context.read<DownloaderCubit>().reset(),
                                );
                              } else if (state is DownloaderError) {
                                return IosErrorView(
                                  errorCode: state.errorCode,
                                  onRetry: () => context.read<DownloaderCubit>().fetchVideoInfo(state.url),
                                );
                              }
                              return const SizedBox.shrink();
                            },
                          ),
                          const Spacer(),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              // Success Banner
              SafeArea(
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0, -1.5),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(
                    parent: _successBannerController,
                    curve: AppAnimations.standard,
                  )),
                  child: GestureDetector(
                    onTap: () => _successBannerController.reverse(),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(AppSpacing.base),
                      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.base, vertical: AppSpacing.sm),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                        border: Border.all(color: AppColors.systemGreen.withOpacity(0.5)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(CupertinoIcons.checkmark_circle_fill, color: AppColors.systemGreen),
                          SizedBox(width: AppSpacing.sm),
                          Text('Saved to Photos', style: AppTypography.headline),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
