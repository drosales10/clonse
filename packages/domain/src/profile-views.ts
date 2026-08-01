export const PROFILE_VIEWER_LIMIT = 50;

export interface ProfileViewer {
  username: string;
  displayName: string;
}

export interface ProfileViewStats {
  totalViews: number;
  viewers: ProfileViewer[];
}

export interface PublicProfileViews {
  totalViews: number;
}

export function normalizeProfileViewTotal(value: number): number {
  return Number.isInteger(value) && value > 0 ? value : 0;
}
