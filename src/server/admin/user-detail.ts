import { db } from "@/server/db/client";

export interface AdminUserDetail {
  id: string;
  username: string;
  displayName: string;
  email: string;
  enabled: boolean;
  verifiedAt: Date | null;
  signUpDate: Date;
  lastLoginAt: Date | null;
  lastActiveAt: Date | null;
  level: { id: string; name: string } | null;
  subnetwork: { id: string; legacyId: number | null } | null;
  acceptedConnections: number;
  profileCommentsAuthored: number;
  activitiesAuthored: number;
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      enabled: true,
      verifiedAt: true,
      signUpDate: true,
      lastLoginAt: true,
      lastActiveAt: true,
      level: { select: { id: true, name: true } },
      subnetwork: { select: { id: true, legacyId: true } },
    },
  });
  if (!user) return null;

  const [sentConnections, receivedConnections, profileCommentsAuthored, activitiesAuthored] =
    await Promise.all([
      db.friendConnection.count({ where: { requesterId: user.id, status: "accepted" } }),
      db.friendConnection.count({ where: { addresseeId: user.id, status: "accepted" } }),
      db.profileComment.count({ where: { authorId: user.id } }),
      db.activity.count({ where: { actorId: user.id } }),
    ]);

  return {
    ...user,
    acceptedConnections: sentConnections + receivedConnections,
    profileCommentsAuthored,
    activitiesAuthored,
  };
}
