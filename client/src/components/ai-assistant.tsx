import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, Eye, Zap, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AIAssistantProps {
  content: string;
  onContentChange: (newContent: string) => void;
  context?: 'question' | 'answer';
  showTitleSuggestion?: boolean;
}

interface AIResult {
  originalContent: string;
  improvedContent: string;
  suggestions: string[];
  reasoning: string;
}

export function AIAssistant({ 
  content, 
  onContentChange, 
  context = 'question',
  showTitleSuggestion = false 
}: AIAssistantProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AIResult | null>(null);
  const { toast } = useToast();

  const handleAIAssist = async (action: 'polish' | 'suggest-title' | 'clarify' | 'concise') => {
    if (!content.trim()) {
      toast({
        title: "No content to process",
        description: "Please add some content first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setCurrentAction(action);

    try {
      const response = await apiRequest('POST', '/api/ai/assist', { content, action, context });
      const result = await response.json();

      setLastResult(result);
      
      if (action === 'suggest-title') {
        toast({
          title: "Title suggestions generated",
          description: "Click on any suggestion to use it.",
        });
      } else {
        toast({
          title: "Content improved",
          description: "Review the changes and apply if you like them.",
        });
      }
    } catch (error) {
      console.error('AI assist error:', error);
      toast({
        title: "AI assistance failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  const applyImprovement = () => {
    if (lastResult) {
      onContentChange(lastResult.improvedContent);
      toast({
        title: "Changes applied",
        description: "Your content has been updated.",
      });
      setLastResult(null);
    }
  };

  const applySuggestion = (suggestion: string) => {
    onContentChange(suggestion);
    toast({
      title: "Suggestion applied",
      description: "Your content has been updated.",
    });
    setLastResult(null);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'polish':
        return <Sparkles className="w-4 h-4" />;
      case 'suggest-title':
        return <RefreshCw className="w-4 h-4" />;
      case 'clarify':
        return <Eye className="w-4 h-4" />;
      case 'concise':
        return <Zap className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'polish':
        return 'Polish';
      case 'suggest-title':
        return 'Suggest Title';
      case 'clarify':
        return 'Clarify';
      case 'concise':
        return 'Make Concise';
      default:
        return action;
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Assistant Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => handleAIAssist('polish')}
          disabled={isProcessing}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          {isProcessing && currentAction === 'polish' ? (
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3 mr-1" />
          )}
          Polish {context}
        </Button>

        {showTitleSuggestion && (
          <Button
            onClick={() => handleAIAssist('suggest-title')}
            disabled={isProcessing}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {isProcessing && currentAction === 'suggest-title' ? (
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            Suggest Title
          </Button>
        )}

        <Button
          onClick={() => handleAIAssist('clarify')}
          disabled={isProcessing}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          {isProcessing && currentAction === 'clarify' ? (
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Eye className="w-3 h-3 mr-1" />
          )}
          Clarify
        </Button>

        <Button
          onClick={() => handleAIAssist('concise')}
          disabled={isProcessing}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          {isProcessing && currentAction === 'concise' ? (
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Zap className="w-3 h-3 mr-1" />
          )}
          Make Concise
        </Button>
      </div>

      {/* AI Results */}
      {lastResult && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getActionIcon(currentAction || 'polish')}
              AI {getActionLabel(currentAction || 'polish')} Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lastResult.suggestions.length > 0 && currentAction === 'suggest-title' ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Title Suggestions:
                </p>
                <div className="space-y-1">
                  {lastResult.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-2 border rounded-lg cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      <p className="text-sm">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Improved Content:
                </p>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <p className="text-sm whitespace-pre-wrap">{lastResult.improvedContent}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {lastResult.reasoning}
                </p>
                <Button
                  onClick={applyImprovement}
                  size="sm"
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Apply Changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Tip */}
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <Sparkles className="w-3 h-3" />
        <span>AI-powered writing assistance - just like having Grammarly + ChatGPT built in!</span>
      </div>
    </div>
  );
}