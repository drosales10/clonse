export const ACTIVITY_TYPE_STATUS = "editstatus" as const;
export const ACTIVITY_TYPE_FRIEND = "addfriend" as const;
export const ACTIVITY_COALESCE_WINDOW_MS = 10 * 60 * 1000;
export const ACTIVITY_FEED_PAGE_SIZE = 10;

export interface ActivityFeedItem {
  id: string;
  type: typeof ACTIVITY_TYPE_STATUS | typeof ACTIVITY_TYPE_FRIEND;
  text: string;
  createdAt: Date;
  actor: {
    username: string;
    displayName: string;
  };
}

export interface ActivityFeedPagination {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  start: number;
  end: number;
}

export interface ActivityFeedResult {
  items: ActivityFeedItem[];
  pagination: ActivityFeedPagination;
}
