export const ACTIVITY_TYPE_STATUS = "editstatus" as const;
export const ACTIVITY_COALESCE_WINDOW_MS = 10 * 60 * 1000;
export const ACTIVITY_FEED_LIMIT = 30;

export interface ActivityFeedItem {
  id: string;
  type: typeof ACTIVITY_TYPE_STATUS;
  text: string;
  createdAt: Date;
  actor: {
    username: string;
    displayName: string;
  };
}
