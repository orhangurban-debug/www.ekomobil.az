import Link from "next/link";
import Image from "next/image";

export function BrandLogo({
  href = "/",
  logoUrl,
  size = "header"
}: {
  href?: string;
  logoUrl: string;
  size?: "header" | "footer";
}) {
  return (
    <Link href={href} className="group flex shrink-0 items-center gap-2">
      <Image
        src={logoUrl}
        alt="EkoMobil loqosu"
        width={828}
        height={167}
        unoptimized
        priority={size === "header"}
        className={size === "footer" ? "h-9 w-auto object-contain" : "h-8 w-auto object-contain sm:h-9"}
      />
    </Link>
  );
}
