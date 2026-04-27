import { ButtonHTMLAttributes } from "react";
import { useTheme } from "../../contexts/ThemeContext";

type ButtonVariant =
  | "primary"
  | "ghost"
  | "ghost-cream"
  | "destructive"
  | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm";
  loading?: boolean;
}

export default function Button({
  variant = "primary",
  size,
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const { theme } = useTheme();

  const resolvedVariant = variant === "ghost" ? `ghost-${theme}` : variant;

  const classes = [
    "btn",
    `btn--${resolvedVariant}`,
    size === "sm" ? "btn--sm" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? "…" : children}
    </button>
  );
}
