import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  const filteredUsers = users?.filter((user: User) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const email = user.email?.toLowerCase() || '';
    return name.includes(query) || email.includes(query);
  }) || [];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Users</h1>
          <p className="text-gray-600 mb-6">
            Browse and connect with other community members who are asking and answering questions.
          </p>
          
          {/* Search Users */}
          <div className="max-w-md">
            <Input
              type="text"
              placeholder="Search users..."
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user: User) => (
                <div 
                  key={user.id} 
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-16 w-16 mb-4">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="text-lg">
                        {user.firstName?.[0] || user.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email}
                    </h3>
                    
                    {user.email && (user.firstName || user.lastName) && (
                      <p className="text-sm text-gray-500 mb-3">{user.email}</p>
                    )}
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        User
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Joined {formatDistanceToNow(new Date(user.createdAt!), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">
                  {searchQuery ? 'No users found matching your search.' : 'No users available yet.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}