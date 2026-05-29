import { riskLabel } from '../utils/risk';

function RiskBadge({ level, showLtv }) {
  if (!level) return null;

  return (
    <span className={`badge risk-${level}`}>
      {riskLabel(level)}{showLtv != null && ` · ${parseFloat(showLtv).toFixed(0)}%`}
    </span>
  );
}

export default RiskBadge;
