import Link from "next/link";
import Image from "next/image";

function CarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.3L19 11v7a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7zm2.2-4.5L6 11h12l-1.2-4.5H7.2zM7 16.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
    </svg>
  );
}

function usesDarkMark(logoUrl: string) {
  return logoUrl.includes("ekomobil-logo");
}

export function BrandLogo({
  href = "/",
  logoUrl,
  size = "header"
}: {
  href?: string;
  logoUrl: string;
  size?: "header" | "footer";
}) {
  if (usesDarkMark(logoUrl)) {
    const iconSize = size === "footer" ? "h-10 w-10" : "h-9 w-9";
    const textSize = size === "footer" ? "text-xl" : "text-lg";

    return (
      <Link href={href} className="group flex shrink-0 items-center gap-2.5">
        <span
          className={`flex ${iconSize} items-center justify-center rounded-xl bg-[#0057FF] shadow-[0_4px_14px_rgba(0,87,255,0.3)] transition group-hover:shadow-[0_6px_20px_rgba(0,87,255,0.4)]`}
        >
          <CarMark className={size === "footer" ? "h-5 w-5 text-white" : "h-[18px] w-[18px] text-white"} />
        </span>
        <span className={`${textSize} font-bold tracking-tight`}>
          <span className="text-slate-900">Eko</span>
          <span className="text-[#0057FF]">Mobil</span>
        </span>
      </Link>
    );
  }

  return (
    <Link href={href} className="group flex shrink-0 items-center gap-2">
      <Image
        src={logoUrl}
        alt="EkoMobil loqosu"
        width={144}
        height={40}
        unoptimized
        className={size === "footer" ? "h-10 w-auto object-contain" : "h-9 w-auto object-contain sm:h-10"}
      />
    </Link>
  );
}
