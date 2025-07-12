import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Star, Trophy, Zap } from 'lucide-react';

interface XPProgressProps {
  currentXP: number;
  currentLevel: number;
  streak: number;
  className?: string;
}

export function XPProgress({ currentXP, currentLevel, streak, className }: XPProgressProps) {
  // Calculate XP needed for next level (exponential growth)
  const xpForNextLevel = Math.pow(currentLevel + 1, 2) * 100;
  const xpForCurrentLevel = Math.pow(currentLevel, 2) * 100;
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = (xpInCurrentLevel / xpNeededForLevel) * 100;

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold text-gray-900">Level {currentLevel}</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">{currentXP} XP</span>
          </div>
          {streak > 0 && (
            <Badge variant="secondary" className="flex items-center space-x-1 bg-orange-100 text-orange-800">
              <Star className="h-3 w-3" />
              <span>{streak} day streak</span>
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress to Level {currentLevel + 1}</span>
          <span>{xpInCurrentLevel}/{xpNeededForLevel} XP</span>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-2 bg-gray-200" 
        />
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Next level in {xpNeededForLevel - xpInCurrentLevel} XP
      </div>
    </div>
  );
}