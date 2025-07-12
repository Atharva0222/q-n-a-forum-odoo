import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Play, Trophy } from 'lucide-react';

interface PathwayStep {
  id: number;
  stepNumber: number;
  title: string;
  description: string;
  target: string;
  targetValue: number;
  xpReward: number;
}

interface Pathway {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  totalSteps: number;
  xpReward: number;
  steps: PathwayStep[];
}

interface UserPathway {
  id: number;
  pathwayId: number;
  currentStep: number;
  completedSteps: number;
  isCompleted: boolean;
  startedAt: string;
  completedAt?: string;
}

interface PathwayCardProps {
  pathway: Pathway;
  userPathway?: UserPathway;
  onStart?: (pathwayId: number) => void;
  onContinue?: (pathwayId: number) => void;
  className?: string;
}

export function PathwayCard({ pathway, userPathway, onStart, onContinue, className }: PathwayCardProps) {
  const progressPercentage = userPathway ? (userPathway.completedSteps / pathway.totalSteps) * 100 : 0;
  const isStarted = !!userPathway;
  const isCompleted = userPathway?.isCompleted || false;

  const getPathwayIcon = (icon: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'play': <Play className="h-5 w-5" />,
      'trophy': <Trophy className="h-5 w-5" />,
      'circle': <Circle className="h-5 w-5" />,
    };
    return iconMap[icon] || <Play className="h-5 w-5" />;
  };

  const getStatusColor = () => {
    if (isCompleted) return 'bg-green-100 text-green-800 border-green-300';
    if (isStarted) return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusText = () => {
    if (isCompleted) return 'Completed';
    if (isStarted) return 'In Progress';
    return 'Not Started';
  };

  const getCurrentStep = () => {
    if (!userPathway) return null;
    return pathway.steps.find(step => step.stepNumber === userPathway.currentStep);
  };

  const currentStep = getCurrentStep();

  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${pathway.color}20` }}
            >
              {getPathwayIcon(pathway.icon)}
            </div>
            <div>
              <CardTitle className="text-lg">{pathway.name}</CardTitle>
              <CardDescription>{pathway.description}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        {isStarted && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{userPathway?.completedSteps || 0}/{pathway.totalSteps} steps</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Current Step */}
        {currentStep && !isCompleted && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Circle className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-sm text-blue-900">Current Step</span>
            </div>
            <h4 className="font-medium text-sm mb-1">{currentStep.title}</h4>
            <p className="text-xs text-gray-600 mb-2">{currentStep.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Target: {currentStep.targetValue} {currentStep.target.replace('_', ' ')}
              </span>
              <span className="text-xs font-medium text-blue-600">
                +{currentStep.xpReward} XP
              </span>
            </div>
          </div>
        )}

        {/* Completed Steps Preview */}
        {isStarted && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-900">Steps</h4>
            <div className="space-y-1">
              {pathway.steps.slice(0, 3).map((step) => {
                const isStepCompleted = userPathway && step.stepNumber <= userPathway.completedSteps;
                const isCurrentStep = userPathway && step.stepNumber === userPathway.currentStep;
                
                return (
                  <div 
                    key={step.id}
                    className={`flex items-center space-x-2 p-2 rounded text-sm ${
                      isStepCompleted 
                        ? 'bg-green-50 text-green-800' 
                        : isCurrentStep 
                          ? 'bg-blue-50 text-blue-800' 
                          : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    {isStepCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="flex-1">{step.title}</span>
                    <span className="text-xs">+{step.xpReward} XP</span>
                  </div>
                );
              })}
              {pathway.steps.length > 3 && (
                <div className="text-xs text-gray-500 text-center py-1">
                  +{pathway.steps.length - 3} more steps
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Total Reward:</span>
            <Badge variant="outline" className="text-yellow-600">
              +{pathway.xpReward} XP
            </Badge>
          </div>
          
          {isCompleted ? (
            <Button variant="outline" size="sm" disabled>
              <CheckCircle className="h-4 w-4 mr-1" />
              Completed
            </Button>
          ) : isStarted ? (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => onContinue?.(pathway.id)}
            >
              Continue
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => onStart?.(pathway.id)}
            >
              Start Pathway
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}