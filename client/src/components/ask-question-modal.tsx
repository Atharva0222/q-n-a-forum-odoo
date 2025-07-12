import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { TiptapEditor } from "./ui/tiptap-editor";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { X, EyeOff, Eye } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tag } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { AIAssistant } from "./ai-assistant";

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AskQuestionModal({ isOpen, onClose }: AskQuestionModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search tags as user types
  const { data: searchResults } = useQuery({
    queryKey: ['/api/tags', tagInput],
    enabled: tagInput.length > 0,
    staleTime: 300,
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; tags: string[]; isAnonymous: boolean }) => {
      const response = await apiRequest('POST', '/api/questions', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your question has been posted!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      handleClose();
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
        description: "Failed to post question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setTitle("");
    setContent("");
    setTagInput("");
    setSelectedTags([]);
    setSuggestions([]);
    setIsAnonymous(false);
    onClose();
  };

  const handleAddTag = (tagName: string) => {
    const normalizedTag = tagName.toLowerCase().trim();
    if (normalizedTag && !selectedTags.includes(normalizedTag) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, normalizedTag]);
      setTagInput("");
      setSuggestions([]);
    }
  };

  const handleRemoveTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagName));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag(tagInput.trim());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and description.",
        variant: "destructive",
      });
      return;
    }

    if (selectedTags.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one tag.",
        variant: "destructive",
      });
      return;
    }

    createQuestionMutation.mutate({
      title: title.trim(),
      content,
      tags: selectedTags,
      isAnonymous,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ask a Question</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Title
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Be specific and imagine you're asking a question to another person"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2"
              required
            />
          </div>

          {/* AI Assistant for Title */}
          <div className="space-y-3">
            <AIAssistant
              content={title}
              onContentChange={setTitle}
              context="question"
              showTitleSuggestion={true}
            />
          </div>

          {/* Rich Text Editor */}
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Description
            </Label>
            <div className="mt-2">
              <TiptapEditor
                content={content}
                onChange={setContent}
                placeholder="Provide details about your question. Include what you've tried, what you expected to happen, and what actually happened."
              />
            </div>
            
            {/* AI Assistant for Content */}
            <div className="mt-3">
              <AIAssistant
                content={content}
                onContentChange={setContent}
                context="question"
                showTitleSuggestion={false}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Tags
            </Label>
            <div className="mt-2">
              <div className="flex flex-wrap items-center gap-2 p-3 border border-gray-200 rounded-md focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
                {/* Selected Tags */}
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-blue-100 text-blue-800">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-0 text-blue-600 hover:text-blue-800"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                
                {/* Tag Input */}
                <div className="relative flex-1 min-w-[120px]">
                  <Input
                    type="text"
                    placeholder="Add tags..."
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      if (e.target.value.length > 0) {
                        setSuggestions(searchResults || []);
                      } else {
                        setSuggestions([]);
                      }
                    }}
                    onKeyDown={handleTagInputKeyDown}
                    className="border-0 focus:ring-0 focus:border-0 p-0 h-auto bg-transparent"
                    disabled={selectedTags.length >= 5}
                  />
                  
                  {/* Tag Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      {suggestions.slice(0, 5).map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                          onClick={() => handleAddTag(tag.name)}
                        >
                          {tag.name} ({tag.questionCount})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Add up to 5 relevant tags to help others find your question
              </p>
            </div>
          </div>

          {/* Anonymity Toggle */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                id="anonymous-toggle"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Label htmlFor="anonymous-toggle" className="text-sm font-medium">
                Ask Anonymously
              </Label>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              {isAnonymous ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span>Your identity will be hidden</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>Your name will be visible</span>
                </>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createQuestionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600"
              disabled={createQuestionMutation.isPending}
            >
              {createQuestionMutation.isPending ? "Posting..." : "Post Question"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
