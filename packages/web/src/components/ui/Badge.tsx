type StatusVariant = "applied" | "interview" | "offer" | "rejected" | "ghost";
type PortalVariant = "linkedin" | "justjoin" | "pracuj" | "other";
type BadgeVariant = StatusVariant | PortalVariant;

const STATUS_LABELS: Record<StatusVariant, string> = {
  applied: "Zaaplikowano",
  interview: "Rozmowa",
  offer: "Oferta",
  rejected: "Odrzucono",
  ghost: "Ghosting",
};

const PORTAL_LABELS: Record<PortalVariant, string> = {
  linkedin: "LinkedIn",
  justjoin: "JustJoin",
  pracuj: "Pracuj.pl",
  other: "Inne",
};

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
}

export default function Badge({ variant, label }: BadgeProps) {
  const defaultLabel =
    variant in STATUS_LABELS
      ? STATUS_LABELS[variant as StatusVariant]
      : PORTAL_LABELS[variant as PortalVariant];

  return (
    <span className={`badge badge--${variant}`}>
      {label ?? defaultLabel}
    </span>
  );
}
