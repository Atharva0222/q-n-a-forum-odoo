import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { QuestionCard } from "@/components/question-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuestionWithDetails } from "@shared/schema";

export default function Home() {
  const [sortBy, setSortBy] = useState<'newest' | 'active' | 'unanswered' | 'votes'>('newest');
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: questions, isLoading, error } = useQuery({
    queryKey: ['/api/questions', { limit, offset: page * limit, sortBy }],
  });

  const handleSortChange = (value: string) => {
    setSortBy(value as 'newest' | 'active' | 'unanswered' | 'votes');
    setPage(0); // Reset to first page when sorting changes
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Sidebar />

          <main className="lg:col-span-3">
            {/* Questions Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All Questions</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {questions?.length ? `${questions.length} questions` : 'Loading questions...'}
                </p>
              </div>
              
              {/* Filter Options */}
              <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="unanswered">Unanswered</SelectItem>
                    <SelectItem value="votes">Most Voted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Question List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading questions...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500">Failed to load questions. Please try again.</p>
                </div>
              ) : !questions || questions.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                  <p className="text-gray-500 mb-4">Be the first to ask a question!</p>
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    Ask Question
                  </Button>
                </div>
              ) : (
                questions.map((question: QuestionWithDetails) => (
                  <QuestionCard key={question.id} question={question} />
                ))
              )}
            </div>

            {/* Pagination */}
            {questions && questions.length >= limit && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {page + 1}
                  </span>
                  <Button
                    variant="outline"
                    disabled={questions.length < limit}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </nav>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
