import 'dart:io';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:isar/isar.dart';
import 'package:get_it/get_it.dart';
import 'package:share_plus/share_plus.dart';
import 'library_state.dart';
import '../models/saved_video.dart';

class LibraryCubit extends Cubit<LibraryState> {
  final Isar _isar = GetIt.I<Isar>();

  LibraryCubit() : super(LibraryLoading());

  Future<void> loadVideos() async {
    emit(LibraryLoading());
    try {
      final videos = await _isar.savedVideos.where().findAll();
      if (videos.isEmpty) {
        emit(LibraryEmpty());
      } else {
        // Default sort by date descending
        videos.sort((a, b) => b.downloadedAt.compareTo(a.downloadedAt));
        emit(LibraryLoaded(videos: videos));
      }
    } catch (e) {
      emit(LibraryError(e.toString()));
    }
  }

  void setSortOption(LibrarySortOption option) {
    if (state is LibraryLoaded) {
      final s = state as LibraryLoaded;
      List<SavedVideo> sortedVideos = List.from(s.videos);
      switch (option) {
        case LibrarySortOption.date:
          sortedVideos.sort((a, b) => b.downloadedAt.compareTo(a.downloadedAt));
          break;
        case LibrarySortOption.size:
          sortedVideos.sort((a, b) => b.fileSizeBytes.compareTo(a.fileSizeBytes));
          break;
        case LibrarySortOption.platform:
          sortedVideos.sort((a, b) => a.platform.compareTo(b.platform));
          break;
      }
      emit(s.copyWith(videos: sortedVideos, sortBy: option));
    }
  }

  Future<void> setFilter(String? platform) async {
    emit(LibraryLoading());
    try {
      List<SavedVideo> videos;
      if (platform == null) {
        videos = await _isar.savedVideos.where().findAll();
      } else {
        videos = await _isar.savedVideos.filter().platformEqualTo(platform).findAll();
      }
      
      if (videos.isEmpty) {
        emit(LibraryEmpty());
      } else {
        // Maintain current sort if possible, or just default to date
        videos.sort((a, b) => b.downloadedAt.compareTo(a.downloadedAt));
        emit(LibraryLoaded(videos: videos, filterPlatform: platform));
      }
    } catch (e) {
      emit(LibraryError(e.toString()));
    }
  }

  Future<void> deleteVideo(SavedVideo video) async {
    try {
      await _isar.writeTxn(() async {
        await _isar.savedVideos.delete(video.id);
      });
      
      final file = File(video.filePath);
      if (await file.exists()) {
        await file.delete();
      }
      
      if (video.thumbnailPath != null) {
        final thumbFile = File(video.thumbnailPath!);
        if (await thumbFile.exists()) {
          await thumbFile.delete();
        }
      }
      
      await loadVideos();
    } catch (e) {
      emit(LibraryError(e.toString()));
    }
  }

  Future<void> shareVideo(SavedVideo video) async {
    final file = XFile(video.filePath);
    await Share.shareXFiles([file], text: video.title);
  }
}
