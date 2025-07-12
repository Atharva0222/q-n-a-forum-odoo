import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { formatDistanceToNow } from "date-fns";
import { ChevronUp, ChevronDown, Check, Eye } from "lucide-react";
import { QuestionWithDetails, AnswerWithDetails } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { AIAssistant } from "@/components/ai-assistant";

export default function QuestionDetail() {
  const { id } = useParams();
  const [answerContent, setAnswerContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const questionId = parseInt(id!);

  // Fetch question details
  const { data: question, isLoading: questionLoading } = useQuery({
    queryKey: [`/api/questions/${questionId}`],
    enabled: !isNaN(questionId),
  });

  // Fetch answers
  const { data: answers, isLoading: answersLoading } = useQuery({
    queryKey: [`/api/questions/${questionId}/answers`],
    enabled: !isNaN(questionId),
  });

  // Create answer mutation
  const createAnswerMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', `/api/questions/${questionId}/answers`, { content });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your answer has been posted!",
      });
      setAnswerContent("");
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}/answers`] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to post answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ targetType, targetId, voteType }: {
      targetType: string;
      targetId: number;
      voteType: 'up' | 'down';
    }) => {
      const response = await apiRequest('POST', '/api/votes', {
        targetType,
        targetId,
        voteType,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}/answers`] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Accept answer mutation
  const acceptAnswerMutation = useMutation({
    mutationFn: async (answerId: number) => {
      const response = await apiRequest('POST', `/api/questions/${questionId}/accept-answer`, { answerId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Answer accepted!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}/answers`] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to accept answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerContent.trim()) {
      toast({
        title: "Error",
        description: "Please write an answer before submitting.",
        variant: "destructive",
      });
      return;
    }
    createAnswerMutation.mutate(answerContent);
  };

  const handleVote = (targetType: string, targetId: number, voteType: 'up' | 'down') => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "You need to sign in to vote.",
        variant: "destructive",
      });
      return;
    }
    voteMutation.mutate({ targetType, targetId, voteType });
  };

  const handleAcceptAnswer = (answerId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "You need to sign in to accept answers.",
        variant: "destructive",
      });
      return;
    }
    acceptAnswerMutation.mutate(answerId);
  };

  const getTagColor = (color: string) => {
    const colorMap: Record<string, string> = {
      '#3B82F6': 'bg-blue-100 text-blue-800',
      '#10B981': 'bg-green-100 text-green-800',
      '#8B5CF6': 'bg-purple-100 text-purple-800',
      '#F59E0B': 'bg-yellow-100 text-yellow-800',
      '#EF4444': 'bg-red-100 text-red-800',
      '#06B6D4': 'bg-cyan-100 text-cyan-800',
      '#84CC16': 'bg-lime-100 text-lime-800',
      '#F97316': 'bg-orange-100 text-orange-800',
      '#EC4899': 'bg-pink-100 text-pink-800',
      '#6366F1': 'bg-indigo-100 text-indigo-800',
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800';
  };

  if (isNaN(questionId)) {
    return <div>Invalid question ID</div>;
  }

  if (questionLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Question not found</h2>
            <p className="text-gray-600 mt-2">The question you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const questionData = question as QuestionWithDetails;
  const isQuestionOwner = user?.id === questionData.authorId;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Question */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-4">
            {/* Vote Column */}
            <div className="flex flex-col items-center space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote('question', questionData.id, 'up')}
                disabled={voteMutation.isPending}
              >
                <ChevronUp className="h-6 w-6" />
              </Button>
              <span className="font-medium text-lg">{questionData.votes || 0}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote('question', questionData.id, 'down')}
                disabled={voteMutation.isPending}
              >
                <ChevronDown className="h-6 w-6" />
              </Button>
            </div>

            {/* Question Content */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{questionData.title}</h1>
              
              <div 
                className="prose prose-sm max-w-none mb-4"
                dangerouslySetInnerHTML={{ __html: questionData.content }}
              />

              {/* Tags */}
              <div className="flex items-center space-x-2 mb-4 flex-wrap gap-1">
                {questionData.tags && questionData.tags.length > 0 && questionData.tags.map((tag) => (
                  <Badge 
                    key={tag.id} 
                    variant="secondary"
                    className={getTagColor(tag.color || '#3B82F6')}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>

              {/* Question Meta */}
              <div className="flex items-center justify-between text-sm border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{questionData.views || 0} views</span>
                  </div>
                </div>
                {questionData.author && (
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={questionData.isAnonymous ? undefined : questionData.author.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {questionData.isAnonymous ? '🥷' : questionData.author.firstName?.[0] || questionData.author.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-gray-600">
                      asked by{" "}
                      <span className="font-medium">
                        {questionData.isAnonymous ? (
                          <span className="flex items-center gap-1">
                            <span className="text-gray-500">Anonymous</span>
                            <Badge variant="outline" className="text-xs">
                              🥷 Anonymous
                            </Badge>
                          </span>
                        ) : (
                          questionData.author.firstName && questionData.author.lastName
                            ? `${questionData.author.firstName} ${questionData.author.lastName}`
                            : questionData.author.email
                        )}
                      </span>
                    </span>
                    <span className="text-gray-400">
                      {formatDistanceToNow(new Date(questionData.createdAt!), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Answers Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {questionData.answerCount} Answer{questionData.answerCount !== 1 ? 's' : ''}
          </h2>

          {answersLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
            </div>
          ) : answers && Array.isArray(answers) && answers.length > 0 ? (
            <div className="space-y-6">
              {answers.map((answer: AnswerWithDetails) => (
                <div key={answer.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    {/* Vote Column */}
                    <div className="flex flex-col items-center space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote('answer', answer.id, 'up')}
                        disabled={voteMutation.isPending}
                      >
                        <ChevronUp className="h-6 w-6" />
                      </Button>
                      <span className="font-medium text-lg">{answer.votes || 0}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote('answer', answer.id, 'down')}
                        disabled={voteMutation.isPending}
                      >
                        <ChevronDown className="h-6 w-6" />
                      </Button>
                      
                      {/* Accept Answer Button */}
                      {isQuestionOwner && !questionData.acceptedAnswerId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAcceptAnswer(answer.id)}
                          disabled={acceptAnswerMutation.isPending}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="h-6 w-6" />
                        </Button>
                      )}
                      
                      {/* Accepted Answer Indicator */}
                      {answer.isAccepted && (
                        <div className="bg-green-500 text-white rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Answer Content */}
                    <div className="flex-1">
                      <div 
                        className="prose prose-sm max-w-none mb-4"
                        dangerouslySetInnerHTML={{ __html: answer.content }}
                      />

                      {/* Answer Meta */}
                      <div className="flex items-center justify-end text-sm border-t border-gray-200 pt-4">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={answer.author.profileImageUrl || undefined} />
                            <AvatarFallback>
                              {answer.author.firstName?.[0] || answer.author.email?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-gray-600">
                            answered by{" "}
                            <span className="font-medium">
                              {answer.author.firstName && answer.author.lastName
                                ? `${answer.author.firstName} ${answer.author.lastName}`
                                : answer.author.email}
                            </span>
                          </span>
                          <span className="text-gray-400">
                            {formatDistanceToNow(new Date(answer.createdAt!), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No answers yet. Be the first to answer!
            </div>
          )}
        </div>

        {/* Answer Form */}
        {isAuthenticated ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Answer</h3>
            <form onSubmit={handleSubmitAnswer}>
              <TiptapEditor
                content={answerContent}
                onChange={setAnswerContent}
                placeholder="Write your answer here..."
                className="mb-4"
              />
              
              {/* AI Assistant for Answer */}
              <div className="mb-4">
                <AIAssistant
                  content={answerContent}
                  onContentChange={setAnswerContent}
                  context="answer"
                  showTitleSuggestion={false}
                />
              </div>
              
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600"
                disabled={createAnswerMutation.isPending}
              >
                {createAnswerMutation.isPending ? "Posting..." : "Post Your Answer"}
              </Button>
            </form>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600 mb-4">Sign in to post an answer</p>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => window.location.href = '/api/login'}
            >
              Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
