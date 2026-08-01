import Link from "next/link";

import type { PublicProfileFriend, PublicProfileFriendsPagination } from "@domain/friends";

export function ProfileFriends({
  friends,
  pagination,
  ownerUsername,
  isOwner,
}: {
  friends: PublicProfileFriend[];
  pagination: PublicProfileFriendsPagination;
  ownerUsername: string;
  isOwner: boolean;
}) {
  return (
    <section className="profile-friends-display" aria-labelledby="profile-friends-title">
      <div className="profile-friends-heading">
        <div>
          <p className="eyebrow">Red</p>
          <h2 id="profile-friends-title">Conexiones</h2>
        </div>
        {isOwner ? <Link className="text-link" href="/account/friends">Gestionar</Link> : null}
      </div>
      <form className="profile-friends-search" method="get">
        <label htmlFor="profile-friends-search">Buscar conexiones</label>
        <div>
          <input id="profile-friends-search" name="friendsSearch" defaultValue={pagination.search} maxLength={64} placeholder="Nombre o usuario" />
          <button className="button button-primary button-small" type="submit">Buscar</button>
        </div>
      </form>
      {friends.length > 0 ? (
        <div className="public-friends-list">
          {friends.map((friend) => (
            <Link className="public-friend" href={`/profile/${encodeURIComponent(friend.username)}`} key={friend.username}>
              <span className="friend-avatar" aria-hidden="true">{friend.displayName.slice(0, 1).toUpperCase()}</span>
              <span><strong>{friend.displayName}</strong><small>@{friend.username}</small></span>
            </Link>
          ))}
        </div>
      ) : <p className="empty-state">No hay conexiones que coincidan con la búsqueda.</p>}
      <ProfileFriendsPagination ownerUsername={ownerUsername} pagination={pagination} />
    </section>
  );
}

function ProfileFriendsPagination({ ownerUsername, pagination }: { ownerUsername: string; pagination: PublicProfileFriendsPagination }) {
  if (pagination.pageCount <= 1 && !pagination.search) return null;

  const pageLink = (page: number): string => {
    const params = new URLSearchParams();
    if (page > 1) params.set("friendsPage", String(page));
    if (pagination.search) params.set("friendsSearch", pagination.search);
    const query = params.toString();
    return `/profile/${encodeURIComponent(ownerUsername)}${query ? `?${query}` : ""}#profile-friends-title`;
  };

  return (
    <nav aria-label="Paginación de conexiones" className="profile-friends-pagination">
      {pagination.page > 1 ? <Link className="text-link" href={pageLink(pagination.page - 1)}>Conexiones anteriores</Link> : <span aria-disabled="true">Conexiones anteriores</span>}
      <span aria-current="page">{pagination.start}-{pagination.end} de {pagination.total}</span>
      {pagination.page < pagination.pageCount ? <Link className="text-link" href={pageLink(pagination.page + 1)}>Conexiones siguientes</Link> : <span aria-disabled="true">Conexiones siguientes</span>}
    </nav>
  );
}
