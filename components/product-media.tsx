import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  objectFit?: "cover" | "contain";
};

/** Our own images (public folder and Supabase storage) go through the Next image optimizer; other hosts are shown as-is. */
const optimizable = (src: string) => src.startsWith("/") || src.includes(".supabase.co/");

export function ProductMedia({ src, alt, fill, sizes, width, height, className, priority, objectFit = "cover" }: Props) {
  if (!optimizable(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit } : undefined}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      priority={priority}
      style={fill ? { objectFit } : undefined}
    />
  );
}
