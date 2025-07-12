import { QuestionWithDetails } from "@shared/schema";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, Eye, MessageSquare, ArrowUp } from "lucide-react";
import { Link } from "wouter";

interface QuestionCardProps {
  question: QuestionWithDetails;
}

export function QuestionCard({ question }: QuestionCardProps) {
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Vote and Stats Column */}
        <div className="flex flex-col items-center space-y-2 text-sm text-gray-600 min-w-0">
          <div className="flex flex-col items-center">
            <span className="font-medium text-gray-900">{question.votes || 0}</span>
            <span className="text-xs">votes</span>
          </div>
          <div className="flex flex-col items-center">
            <span className={`font-medium ${question.answerCount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
              {question.answerCount}
            </span>
            <span className="text-xs">answers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-medium text-gray-900">{question.views || 0}</span>
            <span className="text-xs">views</span>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <Link href={`/questions/${question.id}`}>
              <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-700 cursor-pointer mb-2">
                {question.title}
              </h3>
            </Link>
            {question.acceptedAnswerId && (
              <CheckCircle className="text-green-500 ml-2 mt-1 h-5 w-5" title="Has accepted answer" />
            )}
          </div>
          
          {/* Question excerpt */}
          <div 
            className="text-gray-600 text-sm mb-3 line-clamp-2"
            dangerouslySetInnerHTML={{ 
              __html: question.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' 
            }}
          />
          
          {/* Tags */}
          <div className="flex items-center space-x-2 mb-3 flex-wrap gap-1">
            {question.tags.map((tag) => (
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
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={question.isAnonymous ? undefined : question.author.profileImageUrl || undefined} />
                <AvatarFallback>
                  {question.isAnonymous ? '🥷' : question.author.firstName?.[0] || question.author.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-gray-600">
                asked by{" "}
                <span className="text-blue-600 hover:underline">
                  {question.isAnonymous ? (
                    <span className="flex items-center gap-1">
                      <span className="text-gray-500">Anonymous</span>
                      <Badge variant="outline" className="text-xs">
                        🥷
                      </Badge>
                    </span>
                  ) : (
                    question.author.firstName && question.author.lastName
                      ? `${question.author.firstName} ${question.author.lastName}`
                      : question.author.email
                  )}
                </span>
              </span>
            </div>
            <span className="text-gray-400">
              {formatDistanceToNow(new Date(question.createdAt!), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
