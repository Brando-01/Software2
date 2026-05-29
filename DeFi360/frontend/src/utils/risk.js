const RISK_LABELS = {
  low: 'Bajo',
  medium: 'Moderado',
  high: 'Alto',
  critical: 'Crítico'
};

// Umbrales alineados con LTVCalculatorService del backend.
export function riskFromLtv(ltv) {
  const value = parseFloat(ltv);
  if (Number.isNaN(value)) return null;
  if (value >= 95) return 'critical';
  if (value >= 90) return 'high';
  if (value >= 75) return 'medium';
  return 'low';
}

export function riskLabel(level) {
  return RISK_LABELS[level] || '—';
}
