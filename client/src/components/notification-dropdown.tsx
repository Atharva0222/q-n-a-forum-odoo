import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Bell } from "lucide-react";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { NotificationWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['/api/notifications/unread-count'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch notifications when dropdown is open
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: isOpen,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
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
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PATCH', '/api/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
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
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-notification-dropdown]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: NotificationWithDetails) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    setIsOpen(false);
    // Navigate to question if available
    if (notification.questionId) {
      window.location.href = `/questions/${notification.questionId}`;
    }
  };

  const unreadCount = unreadData?.count || 0;

  return (
    <div className="relative" data-notification-dropdown>
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center p-0">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Mark all read
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              notifications.map((notification: NotificationWithDetails) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 border-b border-gray-100 cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={notification.triggeredBy?.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {notification.triggeredBy?.firstName?.[0] || 
                         notification.triggeredBy?.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">
                          {notification.triggeredBy?.firstName && notification.triggeredBy?.lastName
                            ? `${notification.triggeredBy.firstName} ${notification.triggeredBy.lastName}`
                            : notification.triggeredBy?.email || 'Someone'}
                        </span>{" "}
                        {notification.type === 'answer' && 'answered your question'}
                        {notification.type === 'accepted' && 'accepted your answer'}
                        {notification.type === 'comment' && 'commented on your post'}
                        {notification.type === 'mention' && 'mentioned you'}
                      </p>
                      {notification.question && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {notification.question.title}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt!), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications && notifications.length > 0 && (
            <div className="p-3 text-center border-t border-gray-200">
              <Button variant="ghost" size="sm" className="text-sm text-blue-600 hover:text-blue-700">
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
