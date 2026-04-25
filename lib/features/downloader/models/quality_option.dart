class QualityOption {
  final String label;   // "1080p", "Best Quality"
  final String value;   // "1080", "max"
  final bool isSelected;

  QualityOption({
    required this.label,
    required this.value,
    this.isSelected = false,
  });

  QualityOption copyWith({bool? isSelected}) {
    return QualityOption(
      label: label,
      value: value,
      isSelected: isSelected ?? this.isSelected,
    );
  }
}
