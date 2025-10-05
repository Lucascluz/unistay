import { Shield, TrendingUp, Star } from 'lucide-react';
import { Badge } from './ui/badge';

interface TrustScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
}

export function TrustScoreBadge({ 
  score, 
  size = 'md', 
  showLabel = true,
  showIcon = true 
}: TrustScoreBadgeProps) {
  const getColor = () => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };
  
  const getLabel = () => {
    if (score >= 80) return 'Trusted';
    if (score >= 60) return 'Established';
    if (score >= 40) return 'Growing';
    return 'New';
  };

  const getIcon = () => {
    if (score >= 80) return Star;
    if (score >= 60) return Shield;
    return TrendingUp;
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const Icon = getIcon();
  
  return (
    <Badge className={`${getColor()} ${sizeClasses[size]} border flex items-center gap-1.5 font-medium`}>
      {showIcon && <Icon className={iconSizes[size]} />}
      {showLabel && <span>{getLabel()}</span>}
      <span className="font-bold">{score}</span>
    </Badge>
  );
}

// Detailed trust score display with breakdown
interface TrustScoreDetailProps {
  score: number;
  breakdown?: Record<string, number>;
  level?: string;
}

export function TrustScoreDetail({ score, breakdown, level }: TrustScoreDetailProps) {
  const getColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Trust Score</h3>
          {level && <p className="text-sm text-gray-500">{level} User</p>}
        </div>
        <div className={`text-4xl font-bold ${getColor()}`}>
          {score}
          <span className="text-lg text-gray-400">/100</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all ${
            score >= 80 ? 'bg-green-500' :
            score >= 60 ? 'bg-blue-500' :
            score >= 40 ? 'bg-yellow-500' : 'bg-gray-400'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Breakdown */}
      {breakdown && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Score Breakdown</h4>
          {Object.entries(breakdown).map(([factor, points]) => (
            <div key={factor} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{factor}</span>
              <span className="font-medium text-gray-900">+{points}</span>
            </div>
          ))}
        </div>
      )}

      <div className="pt-3 border-t text-xs text-gray-500">
        Trust scores are calculated based on profile completion, engagement, and community feedback.
      </div>
    </div>
  );
}
