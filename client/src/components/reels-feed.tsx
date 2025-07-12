import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QuestionWithDetails } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Heart, MessageSquare, Share2, Eye, ArrowUp, ArrowDown, ChevronUp, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';

interface ReelsFeedProps {
  onClose: () => void;
}

interface FeedItem {
  question: QuestionWithDetails;
  isExpanded: boolean;
  autoScrollTimer: number;
}

export function ReelsFeed({ onClose }: ReelsFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch questions for the feed
  const { data: questions, isLoading } = useQuery({
    queryKey: ['/api/questions', { limit: 20, sortBy: 'newest' }],
  });

  // Initialize feed items
  useEffect(() => {
    if (questions) {
      const items: FeedItem[] = questions.map((q: QuestionWithDetails) => ({
        question: q,
        isExpanded: false,
        autoScrollTimer: 15000, // 15 seconds
      }));
      setFeedItems(items);
    }
  }, [questions]);

  // Auto-scroll functionality
  useEffect(() => {
    if (isAutoScrolling && feedItems.length > 0) {
      const currentItem = feedItems[currentIndex];
      if (currentItem && !currentItem.isExpanded) {
        timerRef.current = setTimeout(() => {
          goToNext();
        }, currentItem.autoScrollTimer);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, isAutoScrolling, feedItems]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % feedItems.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + feedItems.length) % feedItems.length);
  };

  const toggleExpanded = (index: number) => {
    setFeedItems(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, isExpanded: !item.isExpanded } : item
      )
    );
    setIsAutoScrolling(false);
  };

  const handleLike = (questionId: number) => {
    // TODO: Implement like functionality
    console.log('Like question:', questionId);
  };

  const handleShare = (questionId: number) => {
    // TODO: Implement share functionality
    console.log('Share question:', questionId);
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

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!feedItems.length) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="text-white text-center">
          <p className="text-xl mb-4">No questions to show</p>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    );
  }

  const currentItem = feedItems[currentIndex];
  const question = currentItem.question;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
    >
      {/* Navigation Controls */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrevious}
          className="text-white hover:text-gray-300 p-2"
        >
          <ChevronUp className="h-8 w-8" />
        </Button>
      </div>

      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNext}
          className="text-white hover:text-gray-300 p-2"
        >
          <ChevronDown className="h-8 w-8" />
        </Button>
      </div>

      {/* Close Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:text-gray-300"
        >
          ✕
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex space-x-1">
          {feedItems.map((_, index) => (
            <div
              key={index}
              className={`h-1 w-8 rounded-full transition-all ${
                index === currentIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md mx-auto h-full flex flex-col">
        <Card className="flex-1 bg-gray-900 border-gray-700 text-white m-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={question.isAnonymous ? undefined : question.author.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-gray-700 text-white">
                    {question.isAnonymous ? '🥷' : question.author.firstName?.[0] || question.author.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">
                    {question.isAnonymous ? 'Anonymous' : 
                      question.author.firstName && question.author.lastName
                        ? `${question.author.firstName} ${question.author.lastName}`
                        : question.author.email}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(question.createdAt!), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Eye className="h-4 w-4" />
                <span>{question.views || 0}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Question Title */}
            <h3 className="text-lg font-semibold text-white leading-tight">
              {question.title}
            </h3>

            {/* Question Content */}
            <div className={`text-gray-300 text-sm transition-all duration-300 ${
              currentItem.isExpanded ? 'max-h-none' : 'max-h-20 overflow-hidden'
            }`}>
              <div dangerouslySetInnerHTML={{ 
                __html: question.content.replace(/<[^>]*>/g, '').substring(0, currentItem.isExpanded ? 1000 : 200) + (currentItem.isExpanded ? '' : '...') 
              }} />
            </div>

            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(currentIndex)}
              className="text-blue-400 hover:text-blue-300 p-0 h-auto"
            >
              {currentItem.isExpanded ? 'Show less' : 'Read more'}
            </Button>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {question.tags.slice(0, 3).map((tag) => (
                <Badge 
                  key={tag.id} 
                  variant="secondary"
                  className="text-xs bg-gray-800 text-gray-300 border-gray-600"
                >
                  {tag.name}
                </Badge>
              ))}
              {question.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-gray-800 text-gray-300 border-gray-600">
                  +{question.tags.length - 3} more
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(question.id)}
                  className="flex items-center space-x-1 text-gray-400 hover:text-red-400"
                >
                  <Heart className="h-5 w-5" />
                  <span>{question.votes || 0}</span>
                </Button>

                <Link href={`/questions/${question.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1 text-gray-400 hover:text-blue-400"
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span>{question.answerCount}</span>
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare(question.id)}
                  className="flex items-center space-x-1 text-gray-400 hover:text-green-400"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              <Link href={`/questions/${question.id}`}>
                <Button variant="outline" size="sm" className="text-xs">
                  View Full Question
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Auto-scroll controls */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className="text-white hover:text-gray-300"
            >
              {isAutoScrolling ? 'Pause' : 'Resume'} Auto-scroll
            </Button>
            <div className="text-white text-sm">
              {currentIndex + 1} / {feedItems.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}