import { useEffect, useRef, useState } from "react";
import type { Photo } from "../data/types";
import { creditLine } from "../photos";

const PREVIEW = 8;

function Credit({ photo }: { photo: Photo }) {
  return photo.source ? <a href={photo.source} target="_blank" rel="noopener">{creditLine(photo)}</a> : <span>{creditLine(photo)}</span>;
}

export function HeroPhoto({ photo }: { photo?: Photo }) {
  if (!photo) return null;
  return (
    <figure className="hero-photo-wrap" style={{ margin: 0 }}>
      <div className="hero-photo"><img src={`/photos/${photo.file}`} alt={photo.title} width={photo.width} height={photo.height} /></div>
      <figcaption className="credit">{photo.title}. <Credit photo={photo} /></figcaption>
    </figure>
  );
}

export function Gallery({ photos, heading }: { photos: Photo[]; heading: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open !== null && !el.open) el.showModal();
    if (open === null && el.open) el.close();
  }, [open]);

  if (photos.length === 0) return null;
  const current = open !== null ? photos[open] : null;
  const step = (by: number) => setOpen((i) => (i === null ? null : (i + by + photos.length) % photos.length));

  return (
    <section className="block flush">
      <h2>{heading}</h2>
      <div className="gallery">
        {(expanded ? photos : photos.slice(0, PREVIEW)).map((p, i) => (
          <button key={p.file} onClick={() => setOpen(i)} aria-label={`Open photo: ${p.title}`}>
            <img src={`/photos/${p.thumb}`} alt={p.title} loading="lazy" />
          </button>
        ))}
      </div>
      {!expanded && photos.length > PREVIEW && <button className="more" onClick={() => setExpanded(true)}>Show all {photos.length} photos</button>}
      <p className="credit">Select a photo for its title and credit. The full list is on the photo credits page.</p>
      <dialog className="lightbox" ref={dialog} onClose={() => setOpen(null)} onClick={(e) => { if (e.target === dialog.current) setOpen(null); }}
        onKeyDown={(e) => { if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); }}>
        {current && (
          <>
            <img src={`/photos/${current.file}`} alt={current.title} />
            <div className="bar">
              <button onClick={() => step(-1)}>Previous</button>
              <p><b>{current.title}</b>. <Credit photo={current} /></p>
              <button onClick={() => step(1)}>Next</button>
              <button onClick={() => setOpen(null)}>Close</button>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
