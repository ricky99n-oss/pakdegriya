"use client";
import { useEffect, type Dispatch, type SetStateAction } from "react";
export function useAutoDismiss<T>(value: T | null, setValue: Dispatch<SetStateAction<T | null>>) {
  useEffect(() => {
    if (value === null) return;
    const timer = setTimeout(() => setValue(null), 3000);
    return () => clearTimeout(timer);
  }, [value, setValue]);
}
