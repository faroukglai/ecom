"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Link2, Star, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useDashLocale } from "@/components/dashboard/locale";

export type ProductMediaItem = {
  id: string;
  src: string;
  file?: File;
  remote?: string;
};

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_COUNT = 12;

function isImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|avif|heic|heif|bmp)$/i.test(file.name);
}

export function ProductImages({
  images,
  onChange,
}: {
  images: ProductMediaItem[];
  onChange: (images: ProductMediaItem[]) => void;
}) {
  const { t } = useDashLocale();
  const computerRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [notice, setNotice] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  function addFiles(list: File[]) {
    const next = [...images];
    const messages: string[] = [];
    for (const file of list) {
      if (next.length >= MAX_COUNT) {
        messages.push(t.imageLimit);
        break;
      }
      if (!isImageFile(file)) {
        messages.push(t.notAnImage.replace("{name}", file.name));
        continue;
      }
      if (file.size > MAX_BYTES) {
        messages.push(t.imageTooBig.replace("{name}", file.name));
        continue;
      }
      next.push({
        id: crypto.randomUUID(),
        src: URL.createObjectURL(file),
        file,
      });
    }
    setNotice(messages[0] ?? "");
    onChange(next);
  }

  function addUrl() {
    try {
      const parsed = new URL(urlValue.trim());
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("protocol");
      if (images.length >= MAX_COUNT) {
        setNotice(t.imageLimit);
        return;
      }
      const src = parsed.toString();
      if (images.some((image) => image.remote === src)) {
        setNotice("");
        setUrlValue("");
        setUrlOpen(false);
        return;
      }
      onChange([...images, { id: crypto.randomUUID(), src, remote: src }]);
      setUrlValue("");
      setUrlOpen(false);
      setNotice("");
    } catch {
      setNotice(t.invalidImageUrl);
    }
  }

  function move(id: string, offset: number) {
    const from = images.findIndex((image) => image.id === id);
    const to = from + offset;
    if (from < 0 || to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    onChange(next);
  }

  function dropOn(id: string) {
    if (!dragId || dragId === id) return;
    const from = images.findIndex((image) => image.id === dragId);
    const to = images.findIndex((image) => image.id === id);
    if (from < 0 || to < 0) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    onChange(next);
    setDragId(null);
  }

  return (
    <section className="dash-card">
      <h2 style={{fontSize:18,marginBottom:8}}>{t.productImages}</h2>
      <p className="dash-help" style={{marginTop:0,marginBottom:14}}>{t.imageStudioHelp}</p>
      <div
        className={`dash-media-drop${over ? " is-over" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          addFiles(Array.from(event.dataTransfer.files));
        }}
        onPaste={(event) => {
          const files = Array.from(event.clipboardData.items)
            .map((item) => item.getAsFile())
            .filter((file): file is File => Boolean(file));
          if (files.length) {
            event.preventDefault();
            addFiles(files);
          }
        }}
      >
        <ImagePlus size={22} strokeWidth={1.6}/>
        <strong>{t.dropImages}</strong>
        <span>{t.dropImagesHelp}</span>
        <div className="dash-media-actions">
          <button className="dash-btn ghost" type="button" onClick={() => computerRef.current?.click()}>
            <ImagePlus size={15}/> {t.fromComputer}
          </button>
          <button className="dash-btn ghost" type="button" onClick={() => cameraRef.current?.click()}>
            <Camera size={15}/> {t.fromCamera}
          </button>
          <button className="dash-btn ghost" type="button" onClick={() => setUrlOpen((open) => !open)}>
            <Link2 size={15}/> {t.fromUrl}
          </button>
        </div>
        <input
          ref={computerRef}
          className="dash-media-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,image/*"
          multiple
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
        <input
          ref={cameraRef}
          className="dash-media-file"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>
      {urlOpen ? (
        <div className="dash-media-url">
          <input
            value={urlValue}
            onChange={(event) => setUrlValue(event.target.value)}
            placeholder={t.imageUrlPlaceholder}
            inputMode="url"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addUrl();
              }
            }}
          />
          <button className="dash-btn primary" type="button" onClick={addUrl}>{t.addUrl}</button>
        </div>
      ) : null}
      {notice ? <p className="dash-login-error" role="alert">{notice}</p> : null}
      {images.length ? (
        <div className="dash-media-grid">
          {images.map((image, index) => (
            <article
              key={image.id}
              className={`dash-media-item${index === 0 ? " is-cover" : ""}`}
              draggable
              onDragStart={() => setDragId(image.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dropOn(image.id)}
            >
              <img src={image.src} alt=""/>
              {index === 0 ? <span className="dash-media-cover">{t.cover}</span> : null}
              <div className="dash-media-tools">
                <button type="button" onClick={() => move(image.id, -1)} disabled={index === 0} aria-label={t.moveEarlier}>
                  <ChevronUp size={14}/>
                </button>
                <button type="button" onClick={() => move(image.id, 1)} disabled={index === images.length - 1} aria-label={t.moveLater}>
                  <ChevronDown size={14}/>
                </button>
                {index === 0 ? null : (
                  <button type="button" onClick={() => onChange([image, ...images.filter((item) => item.id !== image.id)])} aria-label={t.setAsCover}>
                    <Star size={14}/>
                  </button>
                )}
                <button
                  className="danger"
                  type="button"
                  aria-label={t.deleteImage}
                  onClick={() => {
                    if (image.src.startsWith("blob:")) URL.revokeObjectURL(image.src);
                    onChange(images.filter((item) => item.id !== image.id));
                  }}
                >
                  <Trash2 size={14}/>
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="dash-hero-img dash-upload-empty">{t.noPhoto}</div>}
      <small className="dash-help">{t.imageHelp}</small>
    </section>
  );
}
