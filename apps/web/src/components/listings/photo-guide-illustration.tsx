import type { PhotoGuideIllustrationId, VehiclePhotoGuideCategory } from "@/lib/vehicle-photo-guide";

const CAMERA_COLORS = {
  essential: "#0057FF",
  important: "#059669",
  recommended: "#d97706"
} as const;

interface IllustrationProps {
  id: PhotoGuideIllustrationId;
  category: VehiclePhotoGuideCategory;
  accent?: string;
}

function CameraMarker({ x, y, color = "#0057FF" }: { x: number; y: number; color?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="4.5" fill={color} opacity="0.9" />
      <circle cx={x} cy={y} r="2" fill="#fff" />
      <path
        d={`M${x} ${y - 6} L${x + 2} ${y - 2}`}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 1.5"
      />
    </g>
  );
}

function CarSilhouette({ variant }: { variant: PhotoGuideIllustrationId }) {
  const showSide = variant === "left_side" || variant === "right_side";
  const showFront = variant === "front_straight";
  const showRear = variant === "rear_straight";
  const showInterior = variant === "dashboard" || variant === "rear_seats" || variant === "odometer";
  const showTrunk = variant === "trunk" || variant === "cargo_area";
  const showEngine = variant === "engine";
  const showDamage = variant === "damage_detail";
  const isLeft34 = variant === "front_left_34" || variant === "rear_left_34";
  const isRight34 = variant === "front_right_34" || variant === "rear_right_34";

  if (showInterior) {
    return (
      <g>
        <rect x="14" y="12" width="52" height="30" rx="5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
        <rect x="18" y="16" width="28" height="16" rx="2" fill="#bae6fd" opacity="0.7" />
        <circle cx="30" cy="34" r="9" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
        <circle cx="30" cy="34" r="5.5" fill="#94a3b8" opacity="0.5" />
        <rect x="50" y="16" width="12" height="22" rx="2" fill="#f8fafc" stroke="#cbd5e1" />
        {variant === "odometer" && (
          <text x="22" y="27" fontSize="7" fill="#0f172a" fontWeight="700">
            72 415 km
          </text>
        )}
      </g>
    );
  }

  if (showTrunk) {
    return (
      <g>
        <path d="M18 22 L62 22 L58 40 L22 40 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
        <rect x="24" y="26" width="32" height="10" rx="2" fill="#f8fafc" stroke="#cbd5e1" />
        <circle cx="40" cy="38" r="3" fill="#64748b" />
      </g>
    );
  }

  if (showEngine) {
    return (
      <g>
        <rect x="12" y="18" width="56" height="24" rx="4" fill="#334155" opacity="0.15" />
        <rect x="18" y="22" width="44" height="16" rx="3" fill="#475569" opacity="0.35" />
        <rect x="24" y="25" width="14" height="10" rx="2" fill="#64748b" opacity="0.55" />
        <rect x="42" y="25" width="14" height="10" rx="2" fill="#64748b" opacity="0.45" />
        <circle cx="31" cy="24" r="2.5" fill="#0057FF" />
        <circle cx="49" cy="24" r="2.5" fill="#f59e0b" />
      </g>
    );
  }

  if (showDamage) {
    return (
      <g>
        <rect x="20" y="16" width="40" height="24" rx="4" fill="#e2e8f0" stroke="#94a3b8" />
        <path d="M34 20 L42 32" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        <path d="M36 22 L44 34" stroke="#f97316" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      </g>
    );
  }

  if (showSide) {
    return (
      <g>
        <rect x="8" y="22" width="64" height="14" rx="3" fill="#0057FF" opacity="0.12" />
        <rect x="12" y="24" width="56" height="10" rx="2" fill="#0057FF" opacity="0.2" />
        <ellipse cx="20" cy="36" rx="6" ry="6" fill="#334155" />
        <ellipse cx="20" cy="36" rx="3.5" ry="3.5" fill="#94a3b8" />
        <ellipse cx="60" cy="36" rx="6" ry="6" fill="#334155" />
        <ellipse cx="60" cy="36" rx="3.5" ry="3.5" fill="#94a3b8" />
        <rect x="16" y="20" width="18" height="9" rx="2" fill="#bae6fd" opacity="0.75" />
        <rect x="38" y="20" width="18" height="9" rx="2" fill="#bae6fd" opacity="0.55" />
      </g>
    );
  }

  if (showFront) {
    return (
      <g>
        <rect x="22" y="18" width="36" height="20" rx="4" fill="#0057FF" opacity="0.15" />
        <rect x="26" y="20" width="28" height="14" rx="3" fill="#0057FF" opacity="0.25" />
        <rect x="28" y="22" width="10" height="8" rx="1.5" fill="#bae6fd" opacity="0.8" />
        <rect x="42" y="22" width="10" height="8" rx="1.5" fill="#bae6fd" opacity="0.8" />
        <ellipse cx="30" cy="38" rx="5" ry="5" fill="#334155" />
        <ellipse cx="50" cy="38" rx="5" ry="5" fill="#334155" />
      </g>
    );
  }

  if (showRear) {
    return (
      <g>
        <rect x="22" y="18" width="36" height="20" rx="4" fill="#7c3aed" opacity="0.15" />
        <rect x="26" y="22" width="28" height="10" rx="2" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.6" />
        <rect x="30" y="24" width="8" height="5" rx="1" fill="#fca5a5" opacity="0.8" />
        <rect x="42" y="24" width="8" height="5" rx="1" fill="#fca5a5" opacity="0.8" />
        <ellipse cx="30" cy="38" rx="5" ry="5" fill="#334155" />
        <ellipse cx="50" cy="38" rx="5" ry="5" fill="#334155" />
      </g>
    );
  }

  return (
    <g transform={isRight34 ? "scale(-1,1) translate(-80,0)" : undefined}>
      <rect x="10" y="20" width="58" height="16" rx="3" fill={isLeft34 ? "#0057FF" : "#7c3aed"} opacity="0.14" />
      <rect x="14" y="22" width="50" height="12" rx="2" fill={isLeft34 ? "#0057FF" : "#7c3aed"} opacity="0.22" />
      <ellipse cx="22" cy="36" rx="6" ry="6" fill="#334155" />
      <ellipse cx="22" cy="36" rx="3.5" ry="3.5" fill="#94a3b8" />
      <ellipse cx="56" cy="36" rx="6" ry="6" fill="#334155" />
      <ellipse cx="56" cy="36" rx="3.5" ry="3.5" fill="#94a3b8" />
      <rect x="16" y="19" width="22" height="10" rx="2" fill="#bae6fd" opacity="0.75" />
      <rect x="40" y="21" width="16" height="8" rx="1.5" fill="#bae6fd" opacity="0.55" />
    </g>
  );
}

function MotorcycleSilhouette({ variant }: { variant: PhotoGuideIllustrationId }) {
  const isPerspective =
    variant === "front_left_34" ||
    variant === "front_right_34" ||
    variant === "rear_left_34" ||
    variant === "rear_right_34";
  const showSide = variant === "left_side" || variant === "right_side" || isPerspective;
  const showFront = variant === "front_straight";
  const showRear = variant === "rear_straight";
  const showDash = variant === "dashboard" || variant === "odometer";
  const showEngine = variant === "engine";
  const showChain = variant === "chain_detail";
  const showTrunk = variant === "trunk";
  const showDamage = variant === "damage_detail";

  if (showDamage) {
    return <CarSilhouette variant="damage_detail" />;
  }

  if (showDash) {
    return (
      <g>
        <rect x="20" y="14" width="40" height="26" rx="4" fill="#1e293b" opacity="0.9" />
        <circle cx="40" cy="27" r="10" fill="#334155" stroke="#64748b" />
        <text x="33" y="30" fontSize="6" fill="#f8fafc" fontWeight="700">
          {variant === "odometer" ? "18k" : "120"}
        </text>
      </g>
    );
  }

  if (showEngine) {
    return (
      <g>
        <ellipse cx="40" cy="28" rx="16" ry="10" fill="#475569" opacity="0.45" />
        <rect x="30" y="22" width="20" height="12" rx="3" fill="#64748b" opacity="0.6" />
        <path d="M34 24 L46 24" stroke="#94a3b8" strokeWidth="1" />
      </g>
    );
  }

  if (showChain) {
    return (
      <g>
        <circle cx="40" cy="30" r="12" fill="none" stroke="#334155" strokeWidth="3" />
        <circle cx="40" cy="30" r="7" fill="#94a3b8" opacity="0.4" />
        <path d="M28 30 L52 30" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 2" />
      </g>
    );
  }

  if (showTrunk) {
    return (
      <g>
        <rect x="24" y="20" width="32" height="18" rx="3" fill="#e2e8f0" stroke="#94a3b8" />
        <path d="M28 24 L52 24" stroke="#cbd5e1" strokeWidth="1" />
      </g>
    );
  }

  if (showFront) {
    return (
      <g>
        <ellipse cx="30" cy="34" rx="6" ry="6" fill="#334155" />
        <ellipse cx="50" cy="34" rx="6" ry="6" fill="#334155" />
        <path d="M30 34 C36 20, 44 20, 50 34" fill="none" stroke="#0057FF" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="36" y="18" width="8" height="6" rx="2" fill="#bae6fd" opacity="0.85" />
      </g>
    );
  }

  if (showRear) {
    return (
      <g>
        <ellipse cx="30" cy="34" rx="6" ry="6" fill="#334155" />
        <ellipse cx="50" cy="34" rx="6" ry="6" fill="#334155" />
        <path d="M30 34 C36 22, 44 22, 50 34" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="34" y="24" width="12" height="4" rx="1" fill="#fca5a5" opacity="0.8" />
      </g>
    );
  }

  if (!showSide) {
    return null;
  }

  return (
    <g transform={variant === "right_side" ? "scale(-1,1) translate(-80,0)" : undefined}>
      <ellipse cx="22" cy="34" rx="7" ry="7" fill="#334155" />
      <ellipse cx="58" cy="34" rx="7" ry="7" fill="#334155" />
      <path
        d="M22 34 C30 18, 50 18, 58 34"
        fill="none"
        stroke="#0057FF"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />
      <rect x="34" y="20" width="12" height="8" rx="2" fill="#bae6fd" opacity="0.8" />
      <rect x="38" y="26" width="10" height="5" rx="1.5" fill="#64748b" opacity="0.5" />
    </g>
  );
}

function CommercialSilhouette({ variant }: { variant: PhotoGuideIllustrationId }) {
  const showCargo = variant === "cargo_area" || variant === "trunk";
  const showDash = variant === "dashboard" || variant === "odometer";
  const showEngine = variant === "engine";
  const showDamage = variant === "damage_detail";

  if (showCargo) {
    return (
      <g>
        <rect x="14" y="16" width="52" height="26" rx="3" fill="#e2e8f0" stroke="#94a3b8" />
        <path d="M18 22 H62" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M18 28 H62" stroke="#cbd5e1" strokeWidth="1" />
        <rect x="20" y="32" width="20" height="6" rx="1" fill="#f8fafc" stroke="#cbd5e1" />
      </g>
    );
  }

  if (showDash) {
    return (
      <g>
        <rect x="16" y="14" width="28" height="24" rx="3" fill="#e2e8f0" stroke="#94a3b8" />
        <circle cx="28" cy="30" r="7" fill="#cbd5e1" />
        <rect x="46" y="16" width="18" height="20" rx="2" fill="#f8fafc" stroke="#cbd5e1" />
        {variant === "odometer" && (
          <text x="20" y="22" fontSize="6" fill="#0f172a" fontWeight="700">
            245k
          </text>
        )}
      </g>
    );
  }

  if (showEngine || showDamage) {
    return showEngine ? <CarSilhouette variant="engine" /> : <CarSilhouette variant="damage_detail" />;
  }

  const isSide = variant === "left_side" || variant === "right_side";
  if (isSide) {
    return (
      <g transform={variant === "right_side" ? "scale(-1,1) translate(-80,0)" : undefined}>
        <rect x="6" y="24" width="48" height="12" rx="2" fill="#0057FF" opacity="0.15" />
        <rect x="54" y="20" width="20" height="18" rx="2" fill="#0057FF" opacity="0.22" />
        <ellipse cx="18" cy="36" rx="5" ry="5" fill="#334155" />
        <ellipse cx="66" cy="36" rx="5" ry="5" fill="#334155" />
        <rect x="10" y="22" width="14" height="10" rx="2" fill="#bae6fd" opacity="0.7" />
      </g>
    );
  }

  return <CarSilhouette variant={variant} />;
}

function cameraPosition(id: PhotoGuideIllustrationId, category: VehiclePhotoGuideCategory): { x: number; y: number } {
  const positions: Partial<Record<PhotoGuideIllustrationId, { x: number; y: number }>> = {
    front_left_34: { x: 10, y: 30 },
    front_right_34: { x: 70, y: 30 },
    rear_left_34: { x: 12, y: 32 },
    rear_right_34: { x: 68, y: 32 },
    left_side: { x: 40, y: 46 },
    right_side: { x: 40, y: 46 },
    front_straight: { x: 40, y: 10 },
    rear_straight: { x: 40, y: 10 },
    dashboard: { x: 14, y: 18 },
    rear_seats: { x: 40, y: 14 },
    odometer: { x: 20, y: 16 },
    trunk: { x: 40, y: 12 },
    engine: { x: 40, y: 10 },
    cargo_area: { x: 40, y: 10 },
    chain_detail: { x: 58, y: 28 },
    damage_detail: { x: 52, y: 22 }
  };
  const base = positions[id] ?? { x: 40, y: 12 };
  if (category === "motorcycle") {
    if (id === "front_left_34" || id === "rear_left_34") return { x: 12, y: 28 };
    if (id === "front_right_34" || id === "rear_right_34") return { x: 68, y: 28 };
  }
  return base;
}

export function PhotoGuideIllustration({ id, category, accent = "#0057FF" }: IllustrationProps) {
  const camera = cameraPosition(id, category);

  return (
    <svg viewBox="0 0 80 50" className="h-full w-full max-h-[88px]" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`photo-guide-bg-${category}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.08" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="4" y="6" width="72" height="38" rx="8" fill={`url(#photo-guide-bg-${category})`} />
      {category === "motorcycle" ? (
        <MotorcycleSilhouette variant={id} />
      ) : category === "commercial" ? (
        <CommercialSilhouette variant={id} />
      ) : (
        <CarSilhouette variant={id} />
      )}
      <CameraMarker x={camera.x} y={camera.y} color={accent} />
    </svg>
  );
}

export function priorityAccent(priority: keyof typeof CAMERA_COLORS): string {
  return CAMERA_COLORS[priority];
}
