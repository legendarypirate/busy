"use client";

import { useActionState, useMemo, useState } from "react";
import { saveHeroSlidesAction, type ProfileSaveState } from "@/app/platform/actions";

type Props = {
  slides: string[];
};

export default function MediaHeroShell({ slides: initialSlides }: Props) {
  const [state, formAction] = useActionState(saveHeroSlidesAction, null as ProfileSaveState | null);
  const slides = initialSlides;
  const [previewIdx, setPreviewIdx] = useState(0);

  const previewSrc = useMemo(() => {
    if (slides.length === 0) {
      return "https://via.placeholder.com/960x423/e2e8f0/64748b?text=Preview";
    }
    return slides[Math.min(previewIdx, slides.length - 1)];
  }, [slides, previewIdx]);

  return (
    <>
      <div className="tps-greeting">Медиа сан</div>
      <div className="text-muted small mb-4">Таны бизнес болон хувийн мэдээллээ удирдах хэсэг.</div>

      {state?.message ? (
        <div className={`alert ${state.ok ? "alert-success" : "alert-danger"} border-0 rounded-3 mb-3`}>{state.message}</div>
      ) : null}

      <form action={formAction} encType="multipart/form-data">
        <div className="med-grid">
          <div className="med-main">
            <div className="med-card">
              <div className="med-card-title">Hero зураг удирдах</div>
              <div className="med-card-subtitle">Компанийн профайлын дээд хэсэгт харагдах слайдер зургуудаа удирдана.</div>

              <div className="d-flex align-items-center mb-4 flex-column flex-lg-row gap-3">
                <div className="med-upload-zone flex-grow-1 w-100" onClick={() => document.getElementById("hero_files")?.click()}>
                  <i className="fa-solid fa-cloud-arrow-up med-upload-icon" />
                  <div className="med-upload-text">Зураг (файл)-аа чирч оруулна уу</div>
                  <div className="small text-muted mb-2">эсвэл</div>
                  <div className="med-btn med-btn-outline d-inline-flex">Файл сонгох</div>
                  <div className="med-upload-hint mt-3">JPG, PNG, WebP • Дээд хэмжээ 10MB • Дээд тал нь 10 зураг</div>
                  <input type="file" id="hero_files" name="hero_files" multiple className="d-none" />
                </div>

                <div className="med-size-box">
                  <i className="fa-solid fa-desktop med-size-icon" />
                  <div className="med-size-info">
                    <div className="med-size-lbl">Зөвлөмжит хэмжээ</div>
                    <div className="med-size-val">
                      Ширээний дэлгэц: <span>1920 x 800px</span>
                    </div>
                    <div className="med-size-val">
                      Гар утас: <span>960 x 423px</span>
                    </div>
                    <div className="med-size-val">
                      Харьцаа: <span>12 : 5</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="h6 fw-bold mb-0">
                  Оруулсан зургууд ({slides.length}/10)
                </h3>
              </div>
              <div className="text-muted small mb-4">Хуучин зургуудыг устгахын тулд доорх жагсаалтаас сонгоод «Хадгалах» дарна уу.</div>

              <div className="med-list">
                {slides.length === 0 ? (
                  <div className="text-center py-5 text-muted border rounded-4">Зураг оруулаагүй байна.</div>
                ) : (
                  slides.map((hs, idx) => (
                    <div key={`${hs}-${idx}`} className="med-item">
                      <div className="med-item-handle">
                        <i className="fa-solid fa-grip-vertical" />
                      </div>
                      <div className="position-relative">
                        <span className="badge bg-primary position-absolute top-0 start-0 m-1" style={{ fontSize: "0.6rem" }}>
                          {idx + 1}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={hs} className="med-item-thumb" alt="" />
                      </div>
                      <div className="med-item-info">
                        <div className="med-item-name">slide-{idx + 1}</div>
                        <div className="med-item-meta">
                          <span>Slider</span>
                        </div>
                        <div className="med-item-status">
                          <i className="fa-solid fa-circle" /> Идэвхтэй
                        </div>
                      </div>
                      <div className="med-item-actions">
                        <label className="med-cover-btn mb-0 cursor-pointer">
                          <input type="checkbox" name="remove_slide" value={String(idx)} className="form-check-input me-1" />
                          Устгах
                        </label>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="med-sidebar">
            <div className="med-preview-card mb-4">
              <div className="med-card-title text-uppercase" style={{ fontSize: "0.75rem" }}>
                Нийтэд харагдах байдал (урьдчилсан харагдац)
              </div>
              <div className="text-muted small mb-3">Таны профайлын хуудсанд ингэж харагдана.</div>

              <div className="med-preview-img-wrap">
                <button
                  type="button"
                  className="med-preview-nav med-preview-prev"
                  onClick={() => slides.length && setPreviewIdx((i) => (i - 1 + slides.length) % slides.length)}
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>
                <button
                  type="button"
                  className="med-preview-nav med-preview-next"
                  onClick={() => slides.length && setPreviewIdx((i) => (i + 1) % slides.length)}
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewSrc} className="med-preview-img" alt="" />
                <div className="med-preview-dots">
                  {Array.from({ length: Math.min(5, slides.length || 1) }).map((_, i) => (
                    <div key={i} className={`med-preview-dot ${i === previewIdx ? "active" : ""}`} />
                  ))}
                </div>
              </div>
            </div>

            <div className="med-card">
              <div className="med-card-title">Зураг оруулах зөвлөмж</div>
              <ul className="med-tips">
                <li className="med-tip-item">
                  <i className="fa-solid fa-circle-check med-tip-icon" /> Өндөр чанартай, тод зураг ашиглана уу.
                </li>
                <li className="med-tip-item">
                  <i className="fa-solid fa-circle-check med-tip-icon" /> Голчлон компанийн үйл ажиллагаа, баг, үйлчилгээ, бүтээгдэхүүнээ харуулсан зураг тохиромжтой.
                </li>
                <li className="med-tip-item">
                  <i className="fa-solid fa-circle-check med-tip-icon" /> Текст ихтэй зураг ашиглахаас зайлсхий.
                </li>
                <li className="med-tip-item">
                  <i className="fa-solid fa-circle-check med-tip-icon" /> Нэг удаа 10 хүртэл зураг оруулах боломжтой.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="med-footer">
          <button type="button" className="med-btn med-btn-outline" onClick={() => window.history.back()}>
            <i className="fa-solid fa-arrow-left" /> Буцах
          </button>
          <div className="d-flex gap-2">
            <button type="submit" className="med-btn med-btn-primary">
              <i className="fa-solid fa-floppy-disk" /> Хадгалах
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
