"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveCompanyProfileAction, type ProfileSaveState } from "@/app/platform/actions";
import BankSelectClient from "@/components/platform/profile/BankSelectClient";
import { mediaUrl } from "@/lib/media-url";
import { MONGOLIA_BANKS_CATALOG, PROFILE_INDUSTRY_OPTIONS } from "@/lib/mongolia-banks";

export type CompanyProfileFormProps = {
  accountIdStr: string;
  email: string;
  completionPct: number;
  profile: {
    displayName: string;
    companyName: string;
    businessPhone: string;
    businessEmail: string;
    website: string;
    addressLine: string;
    bio: string;
    photoUrl: string;
  };
  businessJson: Record<string, unknown>;
  savedBankCode: string;
};

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

export default function CompanyProfileForm({
  accountIdStr,
  email,
  completionPct,
  profile,
  businessJson,
  savedBankCode,
}: CompanyProfileFormProps) {
  const [state, formAction] = useActionState(saveCompanyProfileAction, null as ProfileSaveState | null);

  const pPct = Math.max(0, Math.min(100, completionPct));
  const biz = businessJson;

  const pCoverUrl = str(biz.profile_cover_url);
  const pLogoUrl = profile.photoUrl ? mediaUrl(profile.photoUrl) : "";
  const coverSrc = pCoverUrl ? mediaUrl(pCoverUrl) : "";

  const contactFilled =
    profile.businessPhone.trim() !== "" || profile.businessEmail.trim() !== "";
  const logoOrCoverFilled = pLogoUrl !== "" || coverSrc !== "";
  const hasSocialAny =
    str(biz.facebook).trim() !== "" ||
    str(biz.instagram).trim() !== "" ||
    str(biz.whatsapp).trim() !== "" ||
    str(biz.wechat).trim() !== "" ||
    str(biz.kakaotalk).trim() !== "" ||
    str(biz.viber).trim() !== "";
  const certsOk = Array.isArray(biz.certificates) && biz.certificates.length > 0;

  const memberPhotoUrl = str(biz.member_photo_url);

  return (
    <>
      <div className="mb-4">
        <div className="pm-completion-header">
          <h2 className="h4 fw-bold text-dark mb-0">Профайлаа удирдах</h2>
          <div className="d-flex align-items-center flex-grow-1 mx-4 d-none d-md-flex">
            <span className="small text-muted me-2">
              Профайлын гүйцэтгэл <i className="fa-solid fa-circle-info" />
            </span>
            <div className="pm-completion-bar-bg">
              <div className="pm-completion-bar-fg" style={{ width: `${pPct}%` }} />
            </div>
            <span className="pm-completion-pct">{pPct}% бүрэн</span>
          </div>
        </div>
        <p className="text-muted small">
          Компанийн мэдээллээ бүрэн бөглөж, итгэлцэл болон харагдах байдлаа нэмэгдүүлнэ үү.
        </p>
      </div>

      {state?.message ? (
        <div className={`alert ${state.ok ? "alert-success" : "alert-danger"} border-0 rounded-3 mb-4`} role="alert">
          {state.message}
        </div>
      ) : null}

      <form action={formAction} encType="multipart/form-data">
        <div className="pm-layout">
          <div className="pm-main">
            <div className="pm-card">
              <div className="pm-card-header">
                <i className="fa-solid fa-building-shield" />
                <div>
                  <div className="pm-card-title">Компаний таних мэдээлэл</div>
                  <div className="pm-card-subtitle">Үндсэн компанийн тухай мэдээллийг оруулна уу.</div>
                </div>
              </div>
              <div className="pm-card-body">
                <div className="pm-form-grid">
                  <div className="pm-form-group">
                    <label className="pm-label">Төлөөлөгчийн нэр</label>
                    <input type="text" className="pm-input" name="display_name" defaultValue={profile.displayName} />
                  </div>
                  <div className="pm-form-group">
                    <label className="pm-label">Компанийн нэр</label>
                    <input type="text" className="pm-input" name="company_name" defaultValue={profile.companyName} />
                  </div>
                  <div className="pm-form-group col-span-2">
                    <label className="pm-label">Салбар</label>
                    <select className="pm-select" name="industry" defaultValue={str(biz.industry)}>
                      <option value="">Сонгох...</option>
                      {PROFILE_INDUSTRY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="pm-form-group">
                    <label className="pm-label">Компанийн хэмжээ</label>
                    <select className="pm-select" name="company_size" defaultValue={str(biz.company_size)}>
                      <option value="">Сонгох...</option>
                      <option value="Жижиг">Жижиг</option>
                      <option value="Дунд">Дунд</option>
                      <option value="Том">Том</option>
                    </select>
                  </div>
                  <div className="pm-form-group">
                    <label className="pm-label">Байгуулагдсан он</label>
                    <input
                      type="text"
                      className="pm-input"
                      name="founded_year"
                      maxLength={4}
                      placeholder="Жишээ: 2018"
                      defaultValue={str(biz.founded_year)}
                    />
                  </div>
                  <div className="pm-form-group col-span-2">
                    <label className="pm-label">Бүртгэлийн дугаар</label>
                    <input
                      type="text"
                      className="pm-input"
                      name="register_number"
                      placeholder="Компанийн бүртгэлийн дугаар"
                      autoComplete="off"
                      defaultValue={str(biz.register_number)}
                    />
                  </div>
                  <div className="pm-form-group">
                    <label className="pm-label">Банк</label>
                    <BankSelectClient banks={MONGOLIA_BANKS_CATALOG} savedBankCode={savedBankCode} />
                  </div>
                  <div className="pm-form-group">
                    <label className="pm-label">Дансны дугаар</label>
                    <input
                      type="text"
                      className="pm-input"
                      name="bank_account_number"
                      placeholder="IBAN эсвэл дансны дугаар"
                      inputMode="numeric"
                      autoComplete="off"
                      defaultValue={str(biz.bank_account_number)}
                    />
                  </div>
                  <div className="pm-form-group col-span-2">
                    <label className="pm-label">Бизнесийн төрөл</label>
                    <input
                      type="text"
                      className="pm-input"
                      name="legal_form"
                      placeholder="Жишээ: Хувийн хэвшлийн компани"
                      defaultValue={str(biz.legal_form)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pm-card">
              <div className="pm-card-header">
                <i className="fa-solid fa-address-book" />
                <div>
                  <div className="pm-card-title">Холбоо барих мэдээлэл</div>
                  <div className="pm-card-subtitle">
                    Үндсэн холбоо барих сувгууд — зөвхөн өөрийн бүртгэлээс харагдана.
                  </div>
                </div>
              </div>
              <div className="pm-card-body">
                <div className="pm-form-grid">
                  <div className="pm-form-group">
                    <label className="pm-label">Утас</label>
                    <input
                      type="text"
                      className="pm-input"
                      name="business_phone"
                      placeholder="Утасны дугаар оруулна уу"
                      autoComplete="tel"
                      defaultValue={profile.businessPhone}
                    />
                  </div>
                  <div className="pm-form-group">
                    <label className="pm-label">И-мэйл</label>
                    <input
                      type="email"
                      className="pm-input"
                      name="business_email"
                      placeholder="Байгууллагын и-мэйл"
                      autoComplete="email"
                      defaultValue={profile.businessEmail}
                    />
                  </div>
                  <div className="pm-form-group col-span-2">
                    <label className="pm-label">Вэбсайт</label>
                    <input
                      type="text"
                      className="pm-input"
                      name="website"
                      placeholder="https://company.mn"
                      defaultValue={profile.website}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pm-card">
              <div className="pm-card-header">
                <i className="fa-solid fa-images" />
                <div>
                  <div className="pm-card-title">Лого болон хавтас зураг</div>
                  <div className="pm-card-subtitle">
                    Зураг серверт шинээр байршуулагдана (тохируулга байвал CDN руу очих боломжтой).
                  </div>
                </div>
              </div>
              <div className="pm-card-body">
                <div className="pm-upload-grid">
                  <div className="pm-upload-box">
                    <div className="pm-label mb-2">Лого</div>
                    <div className="pm-upload-preview">
                      {pLogoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- remote logo URLs
                        <img src={pLogoUrl} alt="" />
                      ) : (
                        <i className="fa-solid fa-image pm-upload-placeholder" />
                      )}
                    </div>
                    <div className="pm-upload-info">PNG, JPG, WebP — серверт хадгалагдана.</div>
                    <button type="button" className="pm-btn-upload" onClick={() => document.getElementById("logoInput")?.click()}>
                      Файл сонгох
                    </button>
                    <input type="file" name="photo_file" id="logoInput" className="d-none" accept="image/*" />
                  </div>
                  <div className="pm-upload-box">
                    <div className="pm-label mb-2">Хавтас зураг</div>
                    <div className="pm-upload-preview">
                      {coverSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverSrc} alt="" />
                      ) : (
                        <i className="fa-solid fa-image pm-upload-placeholder" />
                      )}
                    </div>
                    <div className="pm-upload-info">JPG, PNG, WebP</div>
                    <button type="button" className="pm-btn-upload" onClick={() => document.getElementById("coverInput")?.click()}>
                      Файл сонгох
                    </button>
                    <input type="file" name="cover_photo_file" id="coverInput" className="d-none" accept="image/*" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pm-card">
              <div className="pm-card-header">
                <i className="fa-solid fa-share-nodes" />
                <div>
                  <div className="pm-card-title">Нийгмийн сүлжээний холбоосууд</div>
                  <div className="pm-card-subtitle">Компанийн нийгмийн сүлжээ хуудаснууд.</div>
                </div>
              </div>
              <div className="pm-card-body">
                <div className="pm-social-grid">
                  <div className="pm-social-input">
                    <i className="fa-brands fa-instagram" style={{ color: "#E1306C" }} />
                    <input type="text" name="instagram" placeholder="https://instagram.com/..." defaultValue={str(biz.instagram)} />
                  </div>
                  <div className="pm-social-input">
                    <i className="fa-brands fa-whatsapp" style={{ color: "#25D366" }} />
                    <input type="text" name="whatsapp" placeholder="https://wa.me/..." defaultValue={str(biz.whatsapp)} />
                  </div>
                  <div className="pm-social-input">
                    <i className="fa-brands fa-weixin" style={{ color: "#7BB32E" }} />
                    <input type="text" name="wechat" placeholder="https://weixin.qq.com/..." defaultValue={str(biz.wechat)} />
                  </div>
                  <div className="pm-social-input">
                    <i className="fa-solid fa-comment" style={{ color: "#FEE500" }} />
                    <input type="text" name="kakaotalk" placeholder="https://open.kakao.com/..." defaultValue={str(biz.kakaotalk)} />
                  </div>
                  <div className="pm-social-input">
                    <i className="fa-brands fa-viber" style={{ color: "#7360F2" }} />
                    <input type="text" name="viber" placeholder="https://invite.viber.com/..." defaultValue={str(biz.viber)} />
                  </div>
                  <div className="pm-social-input">
                    <i className="fa-brands fa-facebook" style={{ color: "#1877F2" }} />
                    <input type="text" name="facebook" placeholder="https://facebook.com/..." defaultValue={str(biz.facebook)} />
                  </div>
                </div>
                <button type="button" className="pm-btn-secondary mt-3 w-auto px-4 py-2 small" style={{ fontSize: "0.8rem" }}>
                  <i className="fa-solid fa-plus me-2" /> Нэмэлт холбоос нэмэх
                </button>
              </div>
            </div>

            <div className="pm-card">
              <div className="pm-card-header">
                <i className="fa-solid fa-quote-left" />
                <div>
                  <div className="pm-card-title">Слоган / Уриа</div>
                  <div className="pm-card-subtitle">Товч уриа эсвэл таних тэмдэг — хоосон бол placeholder харагдана.</div>
                </div>
              </div>
              <div className="pm-card-body">
                <div className="pm-form-group">
                  <label className="pm-label">Уриа</label>
                  <input
                    type="text"
                    className="pm-input"
                    name="slogan"
                    maxLength={240}
                    placeholder="Жишээ: Таны найдвартай түнш"
                    defaultValue={str(biz.slogan)}
                  />
                </div>
              </div>
            </div>

            <div className="pm-card">
              <div className="pm-card-header">
                <i className="fa-solid fa-star" />
                <div>
                  <div className="pm-card-title">Туршлага, онцлох тал</div>
                  <div className="pm-card-subtitle">Мэргэжил, байршил, туршлага.</div>
                </div>
              </div>
              <div className="pm-card-body">
                <div className="pm-form-grid">
                  <div className="pm-form-group">
                    <label className="pm-label">Мэргэжил / гол чиглэл</label>
                    <input
                      type="text"
                      className="pm-input"
                      name="profession_activity"
                      placeholder="Жишээ: Програм хангамжийн үйлчилгээ"
                      defaultValue={str(biz.profession_activity)}
                    />
                  </div>
                  <div className="pm-form-group">
                    <label className="pm-label">Компанийн байршил</label>
                    <input
                      type="text"
                      className="pm-input"
                      name="company_location"
                      placeholder="Жишээ: Улаанбаатар"
                      defaultValue={str(biz.company_location)}
                    />
                  </div>
                  <div className="pm-form-group">
                    <label className="pm-label">Энэ бизнесийг хэр удаан хийж байна</label>
                    <input
                      type="text"
                      className="pm-input"
                      name="years_in_business"
                      placeholder="Жишээ: 5+ жил"
                      defaultValue={str(biz.years_in_business)}
                    />
                  </div>
                  <div className="pm-form-group">
                    <label className="pm-label">Өмнө нь хийж байсан ажлууд</label>
                    <input
                      type="text"
                      className="pm-input"
                      name="previous_work"
                      placeholder="Товч дурдах (салбар, төслүүд)"
                      defaultValue={str(biz.previous_work)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pm-card">
              <div className="pm-card-header">
                <i className="fa-solid fa-location-dot" />
                <div>
                  <div className="pm-card-title">Хаяг</div>
                  <div className="pm-card-subtitle">Компанийн бүртгэлтэй хаяг.</div>
                </div>
              </div>
              <div className="pm-card-body">
                <div className="pm-form-group mb-3">
                  <label className="pm-label">Хаяг</label>
                  <input type="text" className="pm-input" name="address_line" defaultValue={profile.addressLine} />
                </div>
                <div className="pm-address-grid">
                  <div className="pm-form-group">
                    <label className="pm-label">Улс</label>
                    <input
                      type="text"
                      className="pm-input"
                      name="address_country"
                      placeholder="Жишээ: Монгол Улс"
                      defaultValue={str(biz.address_country)}
                    />
                  </div>
                  <div className="pm-form-group">
                    <label className="pm-label">Хот</label>
                    <input type="text" className="pm-input" name="address_city" placeholder="Хот оруулна уу" defaultValue={str(biz.address_city)} />
                  </div>
                  <div className="pm-form-group">
                    <label className="pm-label">Дүүрэг / Хороо</label>
                    <input
                      type="text"
                      className="pm-input"
                      name="address_district"
                      placeholder="Дүүрэг, хороо"
                      defaultValue={str(biz.address_district)}
                    />
                  </div>
                  <div className="pm-form-group">
                    <label className="pm-label">Шуудангийн код</label>
                    <input
                      type="text"
                      className="pm-input"
                      name="address_postal"
                      placeholder="Шуудангийн код"
                      defaultValue={str(biz.address_postal)}
                    />
                  </div>
                </div>
                <div className="pm-form-group mt-3">
                  <label className="pm-label">Ажлын цаг (олон нийтийн хуудас)</label>
                  <textarea
                    className="pm-input"
                    name="contact_hours"
                    rows={3}
                    placeholder="Жишээ: Даваа–Баасан 09:00–18:00"
                    defaultValue={str(biz.contact_hours)}
                  />
                </div>
              </div>
            </div>

            <div className="pm-card">
              <div className="pm-card-header">
                <i className="fa-solid fa-user-circle" />
                <div>
                  <div className="pm-card-title">Өмнө гишүүний профайл зураг (optional)</div>
                  <div className="pm-card-subtitle">
                    Олон нийтийн компанийн хуудас дээр «Хариуцсан хүн»-ийн хажууд дугуй зураг болж харагдана.
                  </div>
                </div>
              </div>
              <div className="pm-card-body">
                <div className="pm-upload-box" style={{ borderStyle: "dashed", background: "#f8fafc" }}>
                  <i className="fa-solid fa-cloud-arrow-up text-muted fs-3 mb-2" />
                  <div className="small fw-bold">
                    Файл чирээд оруулна уу эсвэл{" "}
                    <span className="text-primary cursor-pointer" onClick={() => document.getElementById("memberPhotoInput")?.click()}>
                      Файл сонгох
                    </span>
                  </div>
                  <div className="pm-upload-info">JPG, PNG - дээд хэмжээ 5MB</div>
                  <input type="file" name="profile_photo_file" id="memberPhotoInput" className="d-none" accept="image/*" />
                  {memberPhotoUrl ? (
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mediaUrl(memberPhotoUrl)} alt="" style={{ height: 40, borderRadius: 4 }} />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="pm-card">
              <div className="pm-card-header">
                <i className="fa-solid fa-align-left" />
                <div>
                  <div className="pm-card-title">Компанийн танилцуулга</div>
                  <div className="pm-card-subtitle">
                    Компанийн талаар дэлгэрэнгүй танилцуулга. Текст болон HTML хадгалагдана (Summernote удахгүй).
                  </div>
                </div>
              </div>
              <div className="pm-card-body pm-editor-container">
                <textarea name="bio" className="form-control rounded-3 border-secondary-subtle" rows={12} defaultValue={profile.bio} />
              </div>
            </div>
          </div>

          <div className="pm-sidebar">
            <div className="pm-card">
              <div className="pm-card-header">
                <div className="pm-card-title">Таны профайлын тойм</div>
              </div>
              <div className="pm-card-body">
                <div className="pm-progress-circle">{pPct}%</div>
                <div className="pm-card-title text-center mb-1">Профайлын гүйцэтгэл</div>
                <div className="pm-card-subtitle text-center mb-3">
                  Сайн байна! Дарж дүүргэх нэг бүрчлэн профайлаа бүрэн дүүргэх боломжтой.
                </div>

                <div className="pm-checklist">
                  <div className="pm-check-item">
                    <i className={`fa-solid fa-circle-check ${profile.companyName.trim() ? "checked" : "empty"}`} /> Компаний таних мэдээлэл
                  </div>
                  <div className="pm-check-item">
                    <i className={`fa-solid fa-circle-check ${contactFilled ? "checked" : "empty"}`} /> Холбоо барих мэдээлэл
                  </div>
                  <div className="pm-check-item">
                    <i className={`fa-solid fa-circle-check ${hasSocialAny ? "checked" : "empty"}`} /> Нийгмийн сүлжээний холбоосууд
                  </div>
                  <div className="pm-check-item">
                    <i className={`fa-solid fa-circle-check ${logoOrCoverFilled ? "checked" : "empty"}`} /> Лого болон зураг
                  </div>
                  <div className="pm-check-item">
                    <i className={`fa-solid fa-circle-check ${str(biz.previous_work).trim() ? "checked" : "empty"}`} /> Өмнөх төслүүдийн жишээ нэмэх
                  </div>
                  <div className="pm-check-item">
                    <i className={`fa-solid fa-circle-check ${certsOk ? "checked" : "empty"}`} /> Түншлэл, гэрчилгээ нэмэх
                  </div>
                </div>
              </div>
            </div>

            <div className="pm-help-box">
              <i className="fa-solid fa-circle-question fs-4" />
              <div className="pm-help-title">Тусламж хэрэгтэй юу?</div>
              <div className="pm-help-text">Профайл бүрэн дүүрсэн байх нь таны бизнест илүү олон боломж авчирна.</div>
              <a href="mailto:support@busy.mn" className="pm-help-link">
                Тусламжийн төв рүү очих <i className="fa-solid fa-arrow-up-right-from-square small" />
              </a>
            </div>

            <div className="pm-card">
              <div className="pm-card-header">
                <div className="pm-card-title">Профайлаа хэрхэн харагдах вэ?</div>
              </div>
              <div className="pm-card-body">
                <div className="pm-card-subtitle mb-3">Таны олон нийтэд харагдах профайл хуудасны урьдчилсан харагдац.</div>
                <Link href={`/company/${accountIdStr}`} target="_blank" className="pm-preview-btn">
                  <i className="fa-regular fa-eye" /> Урьдчилан харах
                </Link>
              </div>
            </div>

            <div className="pm-save-sticky">
              <div className="pm-card-title mb-1">Өөрчлөлтүүдээ хадгалах</div>
              <div className="pm-card-subtitle mb-4">Өөрчлөлтүүд автоматаар хадгалагдахгүй.</div>
              <div className="d-grid gap-2">
                <button type="submit" className="pm-btn-primary">
                  <i className="fa-solid fa-floppy-disk" /> Хадгалах
                </button>
                <button type="button" className="pm-btn-secondary" onClick={() => window.location.reload()}>
                  Цуцлах
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
