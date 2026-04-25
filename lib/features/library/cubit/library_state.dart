import '../models/saved_video.dart';

enum LibrarySortOption { date, size, platform }

abstract class LibraryState {}

class LibraryLoading extends LibraryState {}

class LibraryLoaded extends LibraryState {
  final List<SavedVideo> videos;
  final LibrarySortOption sortBy;
  final String? filterPlatform;

  LibraryLoaded({
    required this.videos,
    this.sortBy = LibrarySortOption.date,
    this.filterPlatform,
  });

  LibraryLoaded copyWith({
    List<SavedVideo>? videos,
    LibrarySortOption? sortBy,
    String? filterPlatform,
  }) {
    return LibraryLoaded(
      videos: videos ?? this.videos,
      sortBy: sortBy ?? this.sortBy,
      filterPlatform: filterPlatform, // Allow setting to null
    );
  }
}

class LibraryEmpty extends LibraryState {}

class LibraryError extends LibraryState {
  final String message;
  LibraryError(this.message);
}
