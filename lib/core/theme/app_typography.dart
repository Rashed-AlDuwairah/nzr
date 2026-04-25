import 'package:flutter/cupertino.dart';
import 'app_colors.dart';

class AppTypography {
  static const String _displayFont = '.SF Pro Display';
  static const String _textThemeFont = '.SF Pro Text';

  static const TextStyle largeTitle = TextStyle(
    fontFamily: _displayFont,
    fontSize: 34,
    fontWeight: FontWeight.bold,
    color: AppColors.textPrimary,
    letterSpacing: 0.37,
  );

  static const TextStyle title1 = TextStyle(
    fontFamily: _displayFont,
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: AppColors.textPrimary,
    letterSpacing: 0.36,
  );

  static const TextStyle title2 = TextStyle(
    fontFamily: _displayFont,
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: AppColors.textPrimary,
    letterSpacing: 0.35,
  );

  static const TextStyle title3 = TextStyle(
    fontFamily: _displayFont,
    fontSize: 20,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
    letterSpacing: 0.38,
  );

  static const TextStyle headline = TextStyle(
    fontFamily: _textThemeFont,
    fontSize: 17,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
    letterSpacing: -0.41,
  );

  static const TextStyle body = TextStyle(
    fontFamily: _textThemeFont,
    fontSize: 17,
    fontWeight: FontWeight.normal,
    color: AppColors.textPrimary,
    letterSpacing: -0.41,
  );

  static const TextStyle callout = TextStyle(
    fontFamily: _textThemeFont,
    fontSize: 16,
    fontWeight: FontWeight.normal,
    color: AppColors.textPrimary,
    letterSpacing: -0.32,
  );

  static const TextStyle subheadline = TextStyle(
    fontFamily: _textThemeFont,
    fontSize: 15,
    fontWeight: FontWeight.normal,
    color: AppColors.textPrimary,
    letterSpacing: -0.24,
  );

  static const TextStyle footnote = TextStyle(
    fontFamily: _textThemeFont,
    fontSize: 13,
    fontWeight: FontWeight.normal,
    color: AppColors.textPrimary,
    letterSpacing: -0.08,
  );

  static const TextStyle caption1 = TextStyle(
    fontFamily: _textThemeFont,
    fontSize: 12,
    fontWeight: FontWeight.normal,
    color: AppColors.textPrimary,
    letterSpacing: 0.0,
  );

  static const TextStyle caption2 = TextStyle(
    fontFamily: _textThemeFont,
    fontSize: 11,
    fontWeight: FontWeight.normal,
    color: AppColors.textPrimary,
    letterSpacing: 0.07,
  );
}
