"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { PublicProfileComment, ProfileCommentFormState, ProfileCommentsPagination } from "@domain/profile-comments";
import {
  createProfileCommentAction,
  deleteProfileCommentAction,
  updateProfileCommentAction,
} from "@/app/actions/profile-comments";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return <button className="button button-primary button-small" disabled={pending} type="submit">{pending ? pendingLabel : label}</button>;
}

function FormFeedback({ state }: { state: ProfileCommentFormState }) {
  if (state.errors?.form?.[0]) return <p className="form-error" role="alert">{state.errors.form[0]}</p>;
  if (state.errors?.body?.[0]) return <p className="field-error" role="alert">{state.errors.body[0]}</p>;
  if (state.message) return <p className="form-success" role="status">{state.message}</p>;
  return null;
}

function CreateProfileComment({ ownerUsername }: { ownerUsername: string }) {
  const [state, formAction] = useActionState<ProfileCommentFormState, FormData>(createProfileCommentAction, {});
  return (
    <form action={formAction} className="profile-comment-form">
      <input name="ownerUsername" type="hidden" value={ownerUsername} />
      <label htmlFor="profile-comment-body">Escribe un comentario</label>
      <textarea id="profile-comment-body" maxLength={2000} name="body" placeholder="Comparte algo respetuoso…" rows={4} />
      <div className="profile-comment-form-footer">
        <span className="field-help">Máximo 2.000 caracteres. El texto se mostrará sin HTML.</span>
        <SubmitButton label="Publicar" pendingLabel="Publicando…" />
      </div>
      <FormFeedback state={state} />
    </form>
  );
}

function ProfileCommentActions({ comment, ownerUsername }: { comment: PublicProfileComment; ownerUsername: string }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState<ProfileCommentFormState, FormData>(updateProfileCommentAction, {});
  const isEditing = editing && !state.success;

  return (
    <div className="profile-comment-actions">
      {comment.canEdit && !isEditing ? <button className="text-button" onClick={() => setEditing(true)} type="button">Editar</button> : null}
      {comment.canDelete ? (
        <form action={deleteProfileCommentAction}>
          <input name="ownerUsername" type="hidden" value={ownerUsername} />
          <input name="commentId" type="hidden" value={comment.id} />
          <button className="text-button text-button-danger" type="submit">Borrar</button>
        </form>
      ) : null}
      {comment.canEdit ? (
        <form action={formAction} className="profile-comment-edit-form" hidden={!isEditing}>
          <input name="ownerUsername" type="hidden" value={ownerUsername} />
          <input name="commentId" type="hidden" value={comment.id} />
          <textarea defaultValue={comment.body} maxLength={2000} name="body" rows={3} />
          <div className="profile-comment-form-footer">
            <button className="button button-quiet" onClick={() => setEditing(false)} type="button">Cancelar</button>
            <SubmitButton label="Guardar" pendingLabel="Guardando…" />
          </div>
          <FormFeedback state={state} />
        </form>
      ) : null}
    </div>
  );
}

function ProfileCommentsPager({
  ownerUsername,
  pagination,
}: {
  ownerUsername: string;
  pagination: ProfileCommentsPagination;
}) {
  const profilePath = `/profile/${encodeURIComponent(ownerUsername)}`;
  const pageLink = (page: number): string => `${profilePath}?commentsPage=${page}#profile-comments-title`;

  return (
    <nav aria-label="Paginación de comentarios" className="profile-comments-pagination">
      {pagination.page > 1 ? <Link className="text-link" href={pageLink(pagination.page - 1)}>Comentarios anteriores</Link> : <span aria-disabled="true">Comentarios anteriores</span>}
      <span aria-current="page">{pagination.start}-{pagination.end} de {pagination.total}</span>
      {pagination.page < pagination.pageCount ? <Link className="text-link" href={pageLink(pagination.page + 1)}>Comentarios siguientes</Link> : <span aria-disabled="true">Comentarios siguientes</span>}
    </nav>
  );
}

export function ProfileComments({
  canComment,
  comments,
  commentsPagination,
  ownerUsername,
  viewer,
}: {
  canComment: boolean;
  comments: PublicProfileComment[];
  commentsPagination: ProfileCommentsPagination;
  ownerUsername: string;
  viewer: boolean;
}) {
  return (
    <section className="profile-comments" aria-labelledby="profile-comments-title">
      <div className="profile-comments-heading">
        <div>
          <p className="eyebrow">Conversación</p>
          <h2 id="profile-comments-title">Comentarios</h2>
        </div>
        <span>{commentsPagination.total}</span>
      </div>
      {comments.length > 0 ? (
        <ol className="profile-comments-list">
          {comments.map((comment) => (
            <li className="profile-comment" key={comment.id}>
              <div className="friend-avatar" aria-hidden="true">{comment.author.displayName.slice(0, 1).toUpperCase()}</div>
              <div className="profile-comment-content">
                <div className="profile-comment-meta">
                  <Link href={`/profile/${encodeURIComponent(comment.author.username)}`}>{comment.author.displayName}</Link>
                  <time>{formatCommentDate(comment.createdAt)}</time>
                </div>
                <p>{comment.body}</p>
                <ProfileCommentActions comment={comment} ownerUsername={ownerUsername} />
              </div>
            </li>
          ))}
        </ol>
      ) : <p className="empty-state">Todavía no hay comentarios en este perfil.</p>}
      {commentsPagination.pageCount > 1 ? <ProfileCommentsPager ownerUsername={ownerUsername} pagination={commentsPagination} /> : null}
      {viewer && canComment ? <CreateProfileComment ownerUsername={ownerUsername} /> : null}
      {!viewer ? <p className="profile-comments-login"><Link href={`/login?returnUrl=/profile/${encodeURIComponent(ownerUsername)}`}>Inicia sesión</Link> para escribir un comentario.</p> : null}
      {viewer && !canComment ? <p className="profile-comments-note">La persona ha limitado quién puede comentar en su perfil.</p> : null}
    </section>
  );
}

function formatCommentDate(date: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
