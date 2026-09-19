"use client";

import React from "react";
import {
  formatThousandSeparator,
  unformatThousandSeparator,
} from "@/lib/utils/format";

interface FormattedNumberInputProps {
  value: string;
  onChange: (raw: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: number;
  name?: string;
  id?: string;
  required?: boolean;
}

export default function FormattedNumberInput({
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
  min,
  name,
  id,
  required,
}: FormattedNumberInputProps) {
  return (
    <input
      type="text"
      inputMode="numeric"
      id={id}
      name={name}
      value={formatThousandSeparator(value)}
      onChange={(e) => onChange(unformatThousandSeparator(e.target.value))}
      onFocus={(e) => e.target.select()}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      required={required}
      className={`border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
    />
  );
}
