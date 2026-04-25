import 'package:flutter/cupertino.dart';

class AppAnimations {
  static const Duration fast     = Duration(milliseconds: 150);
  static const Duration normal   = Duration(milliseconds: 300);
  static const Duration slow     = Duration(milliseconds: 500);

  static const Curve standard    = Curves.easeInOut;
  static const Curve enter       = Curves.easeOut;
  static const Curve exit        = Curves.easeIn;
  static const Curve spring      = Curves.elasticOut;

  static const double pressScale = 0.97;
}
