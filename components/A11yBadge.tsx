"use client";

import { getContrastRatio } from "@/lib/color-utils";

export function A11yBadge({ textColor, bgColor }: { textColor: string, bgColor: string }) {
  // Ensure both colors exist before calculating
  if (!textColor || !bgColor) return null;

  const ratio = getContrastRatio(textColor, bgColor);
  const passesAA = ratio >= 4.5;
  const passesAAA = ratio >= 7;

  return (
    <div className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
      passesAAA ? 'bg-green-500/20 text-green-400' : 
      passesAA ? 'bg-blue-500/20 text-blue-400' : 
      'bg-red-500/20 text-red-400'
    }`}>
      {ratio.toFixed(1)} {passesAAA ? 'AAA' : passesAA ? 'AA' : 'Fail'}
    </div>
  );
}