"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";

export function formatPriceInput(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function PriceInput({ defaultValue = "", className }: { defaultValue?: string | number; className?: string }) {
  const id = useId();
  const [digits, setDigits] = useState(() => {
    if (defaultValue === "") return "";
    const value = Number(defaultValue);
    return Number.isSafeInteger(value) && value >= 0 ? String(value) : "";
  });
  const input = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  const formatted = formatPriceInput(digits);

  useLayoutEffect(() => {
    if (caret.current === null || !input.current) return;
    let position = 0;
    let count = 0;
    while (position < formatted.length && count < caret.current) {
      if (/\d/.test(formatted[position])) count++;
      position++;
    }
    input.current.setSelectionRange(position, position);
    caret.current = null;
  }, [formatted]);

  return <>
    <input type="hidden" name="price" value={digits} />
    <input ref={input} id={id} aria-label="Harga (Rp)" type="text" inputMode="numeric" autoComplete="off"
      required maxLength={21} value={formatted} placeholder="500.000.000" className={className}
      onChange={(event) => {
        const value = event.target.value;
        if (!/^[\d.\s]*$/.test(value)) return;
        caret.current = value.slice(0, event.target.selectionStart ?? value.length).replace(/\D/g, "").length;
        setDigits(value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""));
      }}
      onKeyDown={(event) => {
        const el = event.currentTarget;
        const start = el.selectionStart ?? 0;
        if (start !== el.selectionEnd) return;
        const back = event.key === "Backspace" && formatted[start - 1] === ".";
        const forward = event.key === "Delete" && formatted[start] === ".";
        if (!back && !forward) return;
        event.preventDefault();
        const count = formatted.slice(0, start).replace(/\D/g, "").length;
        const index = back ? count - 1 : count;
        caret.current = back ? index : count;
        setDigits((value) => (value.slice(0, index) + value.slice(index + 1)).replace(/^0+(?=\d)/, ""));
      }} />
  </>;
}
