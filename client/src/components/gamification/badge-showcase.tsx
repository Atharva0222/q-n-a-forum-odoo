import { Badge as UIBadge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@shared/schema';
import { Star, Award, Users, Activity } from 'lucide-react';

interface BadgeShowcaseProps {
  badges: Badge[];
  className?: string;
}

export function BadgeShowcase({ badges, className }: BadgeShowcaseProps) {
  const getBadgeIcon = (icon: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'star': <Star className="h-4 w-4" />,
      'award': <Award className="h-4 w-4" />,
      'users': <Users className="h-4 w-4" />,
      'activity': <Activity className="h-4 w-4" />,
    };
    return iconMap[icon] || <Award className="h-4 w-4" />;
  };

  const getRarityColor = (rarity: string) => {
    const colorMap: Record<string, string> = {
      'common': 'bg-gray-100 text-gray-800 border-gray-300',
      'uncommon': 'bg-green-100 text-green-800 border-green-300',
      'rare': 'bg-blue-100 text-blue-800 border-blue-300',
      'legendary': 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return colorMap[rarity] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'activity': 'text-blue-600',
      'quality': 'text-green-600',
      'community': 'text-purple-600',
    };
    return colorMap[category] || 'text-gray-600';
  };

  if (badges.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Badges</span>
          </CardTitle>
          <CardDescription>
            Complete activities to earn badges and show off your achievements!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No badges earned yet</p>
            <p className="text-sm">Start asking questions and providing answers to earn your first badge!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Award className="h-5 w-5" />
          <span>Badges ({badges.length})</span>
        </CardTitle>
        <CardDescription>
          Your earned achievements and milestones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {badges.map((badge) => (
            <div 
              key={badge.id}
              className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${getRarityColor(badge.rarity)}`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {getBadgeIcon(badge.icon)}
                <span className="font-medium text-sm">{badge.name}</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
              <div className="flex items-center justify-between">
                <UIBadge 
                  variant="outline" 
                  className={`text-xs ${getCategoryColor(badge.category)}`}
                >
                  {badge.category}
                </UIBadge>
                <span className="text-xs font-medium text-gray-500">
                  +{badge.xpReward} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}