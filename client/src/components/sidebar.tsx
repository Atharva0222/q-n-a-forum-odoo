import { useQuery } from "@tanstack/react-query";
import { Badge } from "./ui/badge";
import { Tag } from "@shared/schema";

export function Sidebar() {
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
  });

  const { data: popularTags } = useQuery({
    queryKey: ['/api/tags/popular'],
  });

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
    <aside className="lg:col-span-1">
      <div className="space-y-6">
        {/* Stats Card */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Community Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Questions</span>
              <span className="text-sm font-medium">
                {stats?.totalQuestions?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Answers</span>
              <span className="text-sm font-medium">
                {stats?.totalAnswers?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Users</span>
              <span className="text-sm font-medium">
                {stats?.totalUsers?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Popular Tags */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Popular Tags</h3>
          <div className="space-y-2">
            {popularTags && popularTags.length > 0 ? (
              popularTags.map((tag: Tag) => (
                <div key={tag.id} className="flex items-center justify-between">
                  <Badge 
                    variant="secondary"
                    className={getTagColor(tag.color || '#3B82F6')}
                  >
                    {tag.name}
                  </Badge>
                  <span className="text-xs text-gray-500">{tag.questionCount}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No tags yet</div>
            )}
          </div>
          {popularTags && popularTags.length > 0 && (
            <button className="text-sm text-blue-600 hover:underline mt-3 block">
              View all tags
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
