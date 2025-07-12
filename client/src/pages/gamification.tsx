import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XPProgress } from '@/components/gamification/xp-progress';
import { BadgeShowcase } from '@/components/gamification/badge-showcase';
import { PathwayCard } from '@/components/gamification/pathway-card';
import { Trophy, Target, Star, Award } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

interface UserStats {
  xp: number;
  level: number;
  streak: number;
  questionsAsked: number;
  answersProvided: number;
  votesReceived: number;
  acceptedAnswers: number;
}

export default function Gamification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user gamification stats
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/gamification/stats'],
    enabled: !!user,
  });

  // Fetch user badges
  const { data: badges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ['/api/gamification/badges'],
    enabled: !!user,
  });

  // Fetch pathways
  const { data: pathways = [], isLoading: pathwaysLoading } = useQuery({
    queryKey: ['/api/gamification/pathways'],
    enabled: !!user,
  });

  // Fetch user pathways
  const { data: userPathways = [], isLoading: userPathwaysLoading } = useQuery({
    queryKey: ['/api/gamification/user-pathways'],
    enabled: !!user,
  });

  // Start pathway mutation
  const startPathwayMutation = useMutation({
    mutationFn: async (pathwayId: number) => {
      const response = await apiRequest('POST', `/api/gamification/pathways/${pathwayId}/start`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gamification/user-pathways'] });
    },
  });

  const handleStartPathway = (pathwayId: number) => {
    startPathwayMutation.mutate(pathwayId);
  };

  const handleContinuePathway = (pathwayId: number) => {
    // TODO: Navigate to pathway details or current step
    console.log('Continue pathway:', pathwayId);
  };

  const stats: UserStats = userStats || {
    xp: user?.xp || 0,
    level: user?.level || 1,
    streak: user?.streak || 0,
    questionsAsked: 0,
    answersProvided: 0,
    votesReceived: 0,
    acceptedAnswers: 0,
  };

  const isLoading = statsLoading || badgesLoading || pathwaysLoading || userPathwaysLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Journey</h1>
        <p className="text-gray-600">
          Track your progress, earn badges, and level up your knowledge!
        </p>
      </div>

      {/* XP Progress */}
      <XPProgress 
        currentXP={stats.xp}
        currentLevel={stats.level}
        streak={stats.streak}
        className="mb-8"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.questionsAsked}</p>
                <p className="text-sm text-gray-600">Questions Asked</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.answersProvided}</p>
                <p className="text-sm text-gray-600">Answers Given</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.votesReceived}</p>
                <p className="text-sm text-gray-600">Votes Received</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.acceptedAnswers}</p>
                <p className="text-sm text-gray-600">Accepted Answers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="pathways" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pathways">Learning Pathways</TabsTrigger>
          <TabsTrigger value="badges">Badges & Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="pathways" className="mt-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Learning Pathways</h2>
              <p className="text-gray-600 mb-4">
                Follow structured learning paths to improve your skills and earn rewards.
              </p>
            </div>

            {pathways.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Pathways Available</h3>
                  <p className="text-gray-600">
                    Learning pathways will be available soon. Check back later!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pathways.map((pathway: any) => {
                  const userPathway = userPathways.find((up: any) => up.pathwayId === pathway.id);
                  return (
                    <PathwayCard
                      key={pathway.id}
                      pathway={pathway}
                      userPathway={userPathway}
                      onStart={handleStartPathway}
                      onContinue={handleContinuePathway}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="badges" className="mt-6">
          <BadgeShowcase badges={badges} />
        </TabsContent>
      </Tabs>
    </div>
  );
}