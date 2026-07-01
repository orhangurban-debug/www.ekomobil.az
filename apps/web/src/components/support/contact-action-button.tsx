import Link from "next/link";
import { CONTACT_INTENTS, type ContactIntent } from "@/lib/support-contact";

const VARIANT_CLASS: Record<"primary" | "secondary" | "link", string> = {
  primary: "btn-primary inline-flex items-center justify-center text-sm",
  secondary: "btn-secondary inline-flex items-center justify-center text-sm",
  link: "inline-flex items-center text-sm font-medium text-[#0057FF] hover:underline"
};

export function ContactActionButton({
  intent,
  className,
  variant
}: {
  intent: ContactIntent;
  className?: string;
  variant?: "primary" | "secondary" | "link";
}) {
  const preset = CONTACT_INTENTS[intent];
  const style = VARIANT_CLASS[variant ?? preset.variant];
  return (
    <Link href={preset.href} className={className ?? style}>
      {preset.label}
    </Link>
  );
}
