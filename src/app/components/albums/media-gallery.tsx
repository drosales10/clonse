"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import type { PublicAlbumMedia } from "@domain/albums";

import { albumMediaSrc } from "@/app/components/albums/utils";

type GalleryItem = PublicAlbumMedia & { src: string | null };

function MediaLightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const current = items[index];

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onNavigate(Math.min(index + 1, items.length - 1));
      if (event.key === "ArrowLeft") onNavigate(Math.max(index - 1, 0));
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [index, items.length, onClose, onNavigate]);

  if (!current?.src) return null;

  return (
    <div className="albums-lightbox-backdrop" onClick={onClose} role="presentation">
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="albums-lightbox"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Cerrar visor"
          className="albums-lightbox-close"
          onClick={onClose}
          ref={closeRef}
          type="button"
        >
          ×
        </button>
        {index > 0 ? (
          <button
            aria-label="Fotografía anterior"
            className="albums-lightbox-nav albums-lightbox-nav-prev"
            onClick={() => onNavigate(index - 1)}
            type="button"
          >
            ‹
          </button>
        ) : null}
        <figure className="albums-lightbox-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={current.title} id={titleId} src={current.src} />
          <figcaption>{current.title}</figcaption>
        </figure>
        {index < items.length - 1 ? (
          <button
            aria-label="Fotografía siguiente"
            className="albums-lightbox-nav albums-lightbox-nav-next"
            onClick={() => onNavigate(index + 1)}
            type="button"
          >
            ›
          </button>
        ) : null}
        <p className="albums-lightbox-counter">
          {index + 1} / {items.length}
        </p>
      </div>
    </div>
  );
}

export function MediaGallery({
  albumId,
  media,
}: {
  albumId: string;
  media: PublicAlbumMedia[];
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const visible = media
    .map((item) => ({
      ...item,
      src: item.hasFile ? albumMediaSrc(albumId, item.id) : null,
    }))
    .filter((item): item is GalleryItem & { src: string } => Boolean(item.src));

  const close = useCallback(() => setActiveIndex(null), []);
  const navigate = useCallback((next: number) => setActiveIndex(next), []);

  return (
    <>
      <ul className="albums-gallery">
        {visible.map((item, index) => (
          <li key={item.id}>
            <button
              aria-label={`Ver ${item.title}`}
              className="albums-gallery-item"
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={item.title} loading="lazy" src={item.src} />
              <span className="albums-gallery-overlay">
                <strong>{item.title}</strong>
                <span>Ver</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {activeIndex !== null ? (
        <MediaLightbox index={activeIndex} items={visible} onClose={close} onNavigate={navigate} />
      ) : null}
    </>
  );
}
