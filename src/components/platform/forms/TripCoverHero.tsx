"use client";

import { useRef, useState } from "react";

type Props = {
  coverPreviewUrl?: string | null;
};

export default function TripCoverHero({ coverPreviewUrl }: Props) {
  const coverRef = useRef<HTMLInputElement>(null);
  const [coverFileHint, setCoverFileHint] = useState("");

  return (
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
  );
}
