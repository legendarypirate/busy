"use client";

import { useRef, useState } from "react";

type Props = {
  existingSlides: string[];
  coverPreviewUrl?: string | null;
};

export default function TripCoverHero({ existingSlides, coverPreviewUrl }: Props) {
  const coverRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLInputElement>(null);
  const [keptSlides, setKeptSlides] = useState<string[]>(() =>
    existingSlides.map((u) => u.trim()).filter(Boolean),
  );
  const [coverFileHint, setCoverFileHint] = useState("");
  const [heroFileHint, setHeroFileHint] = useState("");

  return (
    <>
      <div className="col-md-4">
        <div className="tps-form-section h-100">
          <div className="tps-section-head">
            <div className="tps-section-num">7</div>
            <span className="tps-section-title">Ковер зураг</span>
          </div>
          <label className="pm-label mb-1">Аяллын нүүр зураг (16:9)</label>
          <button
            type="button"
            className="pm-upload-box w-100 border border-2 bg-transparent"
            style={{ borderStyle: "dashed", padding: 40 }}
            onClick={() => coverRef.current?.click()}
          >
            <i className="fa-solid fa-image text-muted fs-2 mb-2 d-block" />
            <div className="small fw-bold">Файл сонгох эсвэл чирч оруулна уу</div>
            <div className="pm-upload-info">JPG, PNG, WEBP • Дээд хэмжээ 10MB</div>
          </button>
          <input
            ref={coverRef}
            type="file"
            name="trip_cover_file"
            id="coverInput"
            className="d-none"
            accept="image/*"
            onChange={() => {
              const f = coverRef.current?.files?.[0];
              setCoverFileHint(f ? `${f.name} — «Хадгалах» дарвал Cloudinary руу илгээнэ` : "");
            }}
          />
          {coverFileHint ? <div className="small text-primary mt-2">{coverFileHint}</div> : null}
          {coverPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverPreviewUrl.startsWith("/") || coverPreviewUrl.startsWith("http") ? coverPreviewUrl : `/${coverPreviewUrl}`}
              alt=""
              className="mt-2 rounded border w-100"
              style={{ maxHeight: 140, objectFit: "cover" }}
            />
          ) : null}
        </div>
      </div>

      <div className="col-md-4">
        <div className="tps-form-section h-100">
          <div className="tps-section-head">
            <div className="tps-section-num">8</div>
            <span className="tps-section-title">Геройн зургууд (слайдер)</span>
          </div>
          <label className="pm-label mb-1">Аяллын слайдерт харагдах зургууд</label>
          <div className="tps-gallery-grid">
            {keptSlides.map((url, idx) => (
              <div key={`${url}-${idx}`} className="tps-gallery-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-100 h-100 object-fit-cover" style={{ objectFit: "cover" }} />
                <input type="hidden" name="trip_existing_slides" value={url} />
                <div className="position-absolute top-0 end-0 p-1">
                  <button
                    type="button"
                    className="btn btn-danger btn-sm p-0 rounded-circle"
                    style={{ width: 18, height: 18, lineHeight: 1 }}
                    onClick={() => setKeptSlides((s) => s.filter((_, j) => j !== idx))}
                  >
                    <i className="fa-solid fa-xmark" style={{ fontSize: "0.6rem" }} />
                  </button>
                </div>
              </div>
            ))}
            <div className="tps-gallery-add" onClick={() => heroRef.current?.click()} role="button" tabIndex={0}>
              <i className="fa-solid fa-plus" />
              <input
                ref={heroRef}
                type="file"
                name="trip_hero_files"
                id="sliderInput"
                className="d-none"
                multiple
                accept="image/*"
                onChange={() => {
                  const n = heroRef.current?.files?.length ?? 0;
                  setHeroFileHint(n > 0 ? `${n} файл — «Хадгалах» дарвал Cloudinary руу илгээнэ` : "");
                }}
              />
            </div>
          </div>
          {heroFileHint ? <div className="small text-primary mt-2">{heroFileHint}</div> : null}
          <div className="small text-muted mt-2">Шинэ файлууд хадгалахад автоматаар нэмэгдэнэ.</div>
        </div>
      </div>
    </>
  );
}
