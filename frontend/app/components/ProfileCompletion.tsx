import { CheckCircle, Circle, Trophy } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import type { User, ProfileCompletionTask } from '~/lib/api/types';

interface ProfileCompletionProps {
  user: Partial<User>;
  tasks: ProfileCompletionTask[];
  onNavigateToProfile?: () => void;
  showTasks?: boolean;
}

export function ProfileCompletion({ 
  user, 
  tasks, 
  onNavigateToProfile,
  showTasks = true 
}: ProfileCompletionProps) {
  const completedTasks = tasks.filter(t => t.completed);
  const totalPoints = tasks.reduce((sum, t) => sum + t.weight, 0);
  const earnedPoints = completedTasks.reduce((sum, t) => sum + t.weight, 0);
  const percentage = user.profileCompletionPercentage || 0;
  
  const getMotivationalMessage = () => {
    if (percentage >= 90) return "🎉 Almost perfect! You're a star!";
    if (percentage >= 70) return "🌟 Great progress! Keep going!";
    if (percentage >= 50) return "💪 You're halfway there!";
    if (percentage >= 30) return "🚀 Good start! Add more info to stand out.";
    return "👋 Welcome! Complete your profile to get started.";
  };

  const getColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-600';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Profile Completion</h3>
          </div>
          <p className="text-sm text-gray-500">{getMotivationalMessage()}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">
            {percentage}%
          </div>
          <div className="text-xs text-gray-500">
            {earnedPoints}/{totalPoints} pts
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      
      {/* Tasks list */}
      {showTasks && tasks.length > 0 && (
        <div className="space-y-2 mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            {completedTasks.length === tasks.length ? (
              'All tasks completed! 🎉'
            ) : (
              `Complete ${tasks.length - completedTasks.length} more task${tasks.length - completedTasks.length !== 1 ? 's' : ''}`
            )}
          </h4>
          {tasks.slice(0, 8).map(task => (
            <div 
              key={task.field} 
              className={`flex items-center gap-2 text-sm py-2 px-3 rounded-lg transition-colors ${
                task.completed ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {task.completed ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
              )}
              <span className={task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}>
                {task.label}
              </span>
              <span className="ml-auto text-xs font-medium text-gray-500">
                +{task.weight} pts
              </span>
            </div>
          ))}
        </div>
      )}
      
      {onNavigateToProfile && percentage < 100 && (
        <Button 
          onClick={onNavigateToProfile} 
          variant="outline" 
          className="w-full"
        >
          {percentage === 0 ? 'Start Profile' : 'Complete Profile'}
        </Button>
      )}

      {percentage === 100 && (
        <div className="flex items-center justify-center gap-2 py-3 bg-green-50 rounded-lg text-green-700">
          <Trophy className="w-5 h-5" />
          <span className="font-medium">Profile Complete!</span>
        </div>
      )}
    </Card>
  );
}
