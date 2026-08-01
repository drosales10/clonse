export const NOTIFICATION_TYPE_PROFILE_COMMENT = "profile_comment" as const;
export const NOTIFICATION_LEGACY_PROFILE_COMMENT_TYPE = 3;
export const NOTIFICATION_TYPE_FRIEND_REQUEST = "friend_request" as const;
export const NOTIFICATION_LEGACY_FRIEND_REQUEST_TYPE = 1;
export const NOTIFICATION_LIST_LIMIT = 10;

export interface ProfileCommentNotification {
  id: string;
  type: typeof NOTIFICATION_TYPE_PROFILE_COMMENT;
  actor: {
    username: string;
    displayName: string;
  };
  profileOwnerUsername: string;
  createdAt: Date;
}

export interface NotificationList {
  unreadCount: number;
  items: ProfileCommentNotification[];
}

export interface FriendRequestNotification {
  id: string;
  type: typeof NOTIFICATION_TYPE_FRIEND_REQUEST;
  actor: {
    username: string;
    displayName: string;
  };
  createdAt: Date;
}

export interface FriendRequestNotificationList {
  unreadCount: number;
  items: FriendRequestNotification[];
}
