"use client";

export function NotificationReadForm() {
  return (
    <form action="/account/notifications/read" method="post">
      <button className="button button-quiet" type="submit">Marcar todos como leídos</button>
    </form>
  );
}
