"use client";

import { useEffect, useState } from "react";

const RANGE_MAX = 10_000_000;

type Props = {
  budgetMaxFromUrl: number;
};

/** Keeps budget number + range slider in sync; must be client-side (event handlers). */
export function TripsFilterBudgetInputs({ budgetMaxFromUrl }: Props) {
  const [rangeVal, setRangeVal] = useState(() =>
    budgetMaxFromUrl > 0 ? Math.min(budgetMaxFromUrl, RANGE_MAX) : RANGE_MAX,
  );
  const [numStr, setNumStr] = useState(() =>
    budgetMaxFromUrl > 0 ? String(budgetMaxFromUrl) : "",
  );

  useEffect(() => {
    setRangeVal(budgetMaxFromUrl > 0 ? Math.min(budgetMaxFromUrl, RANGE_MAX) : RANGE_MAX);
    setNumStr(budgetMaxFromUrl > 0 ? String(budgetMaxFromUrl) : "");
  }, [budgetMaxFromUrl]);

  function onRangeChange(next: number) {
    setRangeVal(next);
    setNumStr(next >= RANGE_MAX ? "" : String(next));
  }

  function onNumChange(raw: string) {
    setNumStr(raw);
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) {
      setRangeVal(RANGE_MAX);
      return;
    }
    setRangeVal(Math.min(RANGE_MAX, Math.max(0, n)));
  }

  return (
    <>
      <input
        type="number"
        className="filter-input mb-2"
        name="budget_max"
        min={0}
        step={100000}
        value={numStr}
        onChange={(e) => onNumChange(e.target.value)}
        placeholder="Ж: 5000000"
      />
      <input
        type="range"
        className="price-range-slider"
        min={0}
        max={RANGE_MAX}
        step={100000}
        value={rangeVal}
        onChange={(e) => onRangeChange(Number(e.target.value))}
      />
      <div className="price-values">
        <span>₮0</span>
        <span>₮10,000,000+</span>
      </div>
    </>
  );
}
