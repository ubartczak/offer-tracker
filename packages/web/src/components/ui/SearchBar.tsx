import { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";

type SearchBarProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export default function SearchBar({ style, ...props }: SearchBarProps) {
  return (
    <div style={{ position: "relative", display: "inline-block", ...style as object }}>
      <Search
        size={14}
        style={{
          position: "absolute",
          left: 10,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--color-field-text)",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />
      <input
        type="search"
        className="field-input__input"
        style={{ paddingLeft: 30, width: "100%" }}
        {...props}
      />
    </div>
  );
}
