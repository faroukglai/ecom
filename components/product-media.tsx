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
};

export function ProductMedia({ src, alt, fill, sizes, width, height, className, priority }: Props) {
  const remote = src.startsWith("http://") || src.startsWith("https://");
  if (remote) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } : undefined}
      />
    );
  }
  return <Image src={src} alt={alt} fill={fill} sizes={sizes} width={width} height={height} className={className} priority={priority} />;
}
