import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Search, ChevronDown, Settings, LogOut, User, Play } from "lucide-react";
import { NotificationDropdown } from "./notification-dropdown";
import { AskQuestionModal } from "./ask-question-modal";
import { ReelsFeed } from "./reels-feed";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export function Header() {
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [isReelsFeedOpen, setIsReelsFeedOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Search query:", searchQuery);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <Link href="/">
                  <h1 className="text-2xl font-bold text-gray-900 cursor-pointer">StackIt</h1>
                </Link>
              </div>
              {isAuthenticated && (
                <nav className="hidden md:flex space-x-6">
                  <Link href="/">
                    <span className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer">
                      Questions
                    </span>
                  </Link>
                  <Link href="/tags">
                    <span className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer">
                      Tags
                    </span>
                  </Link>
                  <Link href="/users">
                    <span className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer">
                      Users
                    </span>
                  </Link>
                  <Link href="/gamification">
                    <span className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer">
                      Journey
                    </span>
                  </Link>
                </nav>
              )}
            </div>

            {/* Search Bar */}
            {isAuthenticated && (
              <div className="flex-1 max-w-lg mx-8">
                <form onSubmit={handleSearch} className="relative">
                  <Input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </form>
              </div>
            )}

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {/* Notification Bell */}
                  <NotificationDropdown />

                  {/* User Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center space-x-2 hover:bg-gray-50 rounded-md px-2 py-1 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-900 hidden sm:block">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user?.email}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="flex items-center space-x-2 cursor-pointer text-red-600 hover:text-red-700"
                        onClick={() => window.location.href = '/api/logout'}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Reels Feed Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                    onClick={() => setIsReelsFeedOpen(true)}
                  >
                    <Play className="h-4 w-4" />
                    <span>Reels</span>
                  </Button>

                  {/* Ask Question Button */}
                  <Button
                    className="bg-orange-500 text-white hover:bg-orange-600"
                    onClick={() => setIsAskModalOpen(true)}
                  >
                    Ask Question
                  </Button>
                </>
              ) : (
                <Button
                  className="bg-orange-500 text-white hover:bg-orange-600"
                  onClick={() => window.location.href = '/api/login'}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AskQuestionModal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
      />

      {isReelsFeedOpen && (
        <ReelsFeed onClose={() => setIsReelsFeedOpen(false)} />
      )}
    </>
  );
}
