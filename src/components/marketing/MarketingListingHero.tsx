"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import styles from "@/components/marketing/MarketingListingHero.module.css";

type Props = {
  /** Resolved image URLs (server may apply `mediaUrl`). */
  slides: string[];
  /** Shown when `slides` is empty. */
  fallbackImageUrl: string;
  children: ReactNode;
};

export function MarketingListingHero({ slides, fallbackImageUrl, children }: Props) {
  const slideSig = slides.join("|");
  const list = useMemo(
    () => (slides.length > 0 ? [...slides] : [fallbackImageUrl]),
    [slides, slideSig, fallbackImageUrl],
  );
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [slideSig, fallbackImageUrl, slides.length]);

  useEffect(() => {
    if (list.length <= 1) return;
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % list.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [list]);

  return (
    <section className={`${styles.hero} py-5`}>
      <div className={styles.slides} aria-hidden="true">
        {list.map((src, i) => (
          <div key={`${i}-${src}`} className={`${styles.slide} ${i === idx ? styles.slideActive : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className={styles.slideImg} loading={i === 0 ? "eager" : "lazy"} decoding="async" />
          </div>
        ))}
      </div>
      <div className={styles.overlay} />
      <div className={`container ${styles.inner}`}>{children}</div>
    </section>
  );
}
