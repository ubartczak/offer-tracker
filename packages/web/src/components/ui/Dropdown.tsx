import { useRef, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
}

export default function Dropdown({ label, value, options, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    width: 120,
    background: "var(--color-field-bg)",
    color: "var(--color-field-text)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    padding: "6px 10px 6px 12px",
    fontSize: 13,
    fontFamily: "var(--font-sans)",
    fontWeight: selected ? 500 : 400,
    cursor: "pointer",
    outline: "none",
    boxShadow: open ? "inset 0 0 0 2px var(--color-field-focus)" : "none",
    transition: "box-shadow 0.15s ease",
    whiteSpace: "nowrap",
  };

  const listStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    width: 120,
    background: "var(--blush)",
    borderRadius: "var(--radius-sm)",
    boxShadow: "inset 0 0 0 2px var(--color-field-focus)",
    zIndex: 100,
    overflow: "hidden",
  };

  const optionStyle = (hovered: boolean): React.CSSProperties => ({
    padding: "7px 12px",
    fontSize: 13,
    fontFamily: "var(--font-sans)",
    color: hovered ? "var(--brick-deep)" : "var(--color-field-text)",
    cursor: "pointer",
    background: "transparent",
    transition: "color 0.1s ease",
  });

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button style={triggerStyle} onClick={() => setOpen((v) => !v)}>
        {selected ? selected.label : label}
        <ChevronDown size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
      </button>

      {open && (
        <div style={listStyle}>
          <OptionItem
            label={label}
            active={value === ""}
            style={optionStyle}
            onClick={() => { onChange(""); setOpen(false); }}
          />
          {options.map((o) => (
            <OptionItem
              key={o.value}
              label={o.label}
              active={o.value === value}
              style={optionStyle}
              onClick={() => { onChange(o.value); setOpen(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OptionItem({
  label, active, style, onClick,
}: {
  label: string;
  active: boolean;
  style: (hovered: boolean) => React.CSSProperties;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ ...style(hovered || active), fontWeight: active ? 500 : 400 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </div>
  );
}
