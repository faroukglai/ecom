import Image from "next/image";

export function BrandLogo({ size = 44, priority = false }: { size?: number; priority?: boolean }) {
  return (
    <Image
      src="/logo.jpeg"
      alt="Darivo"
      width={size}
      height={size}
      className="brand-logo"
      priority={priority}
    />
  );
}
