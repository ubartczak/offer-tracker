import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, id, className = "", ...props }: InputProps) {
  return (
    <div className="field">
      {label && (
        <label htmlFor={id} className="field-input__label">
          {label}
        </label>
      )}
      <input id={id} className={`field-input__input ${className}`} {...props} />
    </div>
  );
}
