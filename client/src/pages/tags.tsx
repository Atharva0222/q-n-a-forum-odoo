import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Tag } from "@shared/schema";

export default function Tags() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tags, isLoading } = useQuery({
    queryKey: ['/api/tags'],
  });

  const { data: searchResults } = useQuery({
    queryKey: [`/api/tags/search?q=${searchQuery}`],
    enabled: searchQuery.length > 0,
  });

  const displayTags = searchQuery ? searchResults : tags;

  const getTagColor = (color: string) => {
    return {
      backgroundColor: color + '20',
      borderColor: color,
      color: color,
    };
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Tags</h1>
          <p className="text-gray-600 mb-6">
            A tag is a keyword or label that categorizes your question with other, similar questions.
            Using the right tags makes it easier for others to find and answer your question.
          </p>
          
          {/* Search Tags */}
          <div className="max-w-md">
            <Input
              type="text"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayTags && displayTags.length > 0 ? (
              displayTags.map((tag: Tag) => (
                <div 
                  key={tag.id} 
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <Badge 
                    variant="secondary"
                    style={getTagColor(tag.color || '#3B82F6')}
                    className="mb-2"
                  >
                    {tag.name}
                  </Badge>
                  {tag.description && (
                    <p className="text-sm text-gray-600 mb-2">{tag.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {tag.questionCount || 0} question{(tag.questionCount || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">
                  {searchQuery ? 'No tags found matching your search.' : 'No tags available yet.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}