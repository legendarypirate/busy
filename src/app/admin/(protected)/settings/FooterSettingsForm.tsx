import {
  FOOTER_ADMIN_SOCIAL_LINK_SLOTS,
  FOOTER_ADMIN_USEFUL_LINK_SLOTS,
  type FooterPublicConfig,
} from "@/lib/footer-public-config";
import { resetFooterPublicDefaultsAction, saveFooterPublicSettingsAction } from "./actions";

export function FooterSettingsForm({ cfg }: { cfg: FooterPublicConfig }) {
  const usefulRows = Array.from({ length: FOOTER_ADMIN_USEFUL_LINK_SLOTS }, (_, i) => ({
    label: cfg.usefulLinks[i]?.label ?? "",
    href: cfg.usefulLinks[i]?.href ?? "",
  }));
  const socialRows = Array.from({ length: FOOTER_ADMIN_SOCIAL_LINK_SLOTS }, (_, i) => ({
    href: cfg.socialLinks[i]?.href ?? "",
    label: cfg.socialLinks[i]?.label ?? "",
    iconClass: cfg.socialLinks[i]?.iconClass ?? "",
  }));

  return (
    <div className="card mb-4">
      <div className="card-header fw-semibold">Нийтийн footer (BUSY.mn)</div>
      <div className="card-body">
        <p className="small text-muted mb-3">
          Нүүр, холбоо барих хуудасны доод хэсэг, мөн холбоо барих хуудсын хажуугийн блокт харагдана. Утгууд{" "}
          <code>site_settings</code> хүснэгтийн <code>footer_public_json</code> түлхүүрт JSON хэлбэрээр хадгалагдана.
        </p>

        <form action={saveFooterPublicSettingsAction} className="row g-3">
          <div className="col-12">
            <h6 className="text-uppercase small text-muted mb-2">Брэнд</h6>
          </div>
          <div className="col-md-6">
            <label className="form-label small mb-0" htmlFor="brand_name">
              Брэндийн нэр (лого alt)
            </label>
            <input className="form-control form-control-sm" id="brand_name" name="brand_name" defaultValue={cfg.brandName} />
          </div>
          <div className="col-md-6">
            <label className="form-label small mb-0" htmlFor="copyright_name">
              Зохиогчийн эрхийн нэр (ж: BUSY эсвэл BUSY.mn)
            </label>
            <input
              className="form-control form-control-sm"
              id="copyright_name"
              name="copyright_name"
              defaultValue={cfg.copyrightName}
            />
          </div>
          <div className="col-12">
            <label className="form-label small mb-0" htmlFor="tagline">
              Товч тайлбар (лого доор)
            </label>
            <textarea className="form-control form-control-sm" id="tagline" name="tagline" rows={2} defaultValue={cfg.tagline} />
          </div>

          <div className="col-12 mt-2">
            <h6 className="text-uppercase small text-muted mb-2">Холбоо барих багана</h6>
          </div>
          <div className="col-md-6">
            <label className="form-label small mb-0" htmlFor="contact_col_title">
              Баганын гарчиг
            </label>
            <input
              className="form-control form-control-sm"
              id="contact_col_title"
              name="contact_col_title"
              defaultValue={cfg.contactColumnTitle}
            />
          </div>
          <div className="col-md-6" />
          <div className="col-md-6">
            <label className="form-label small mb-0" htmlFor="phone_display">
              Утас (харагдах)
            </label>
            <input
              className="form-control form-control-sm"
              id="phone_display"
              name="phone_display"
              defaultValue={cfg.contact.phoneDisplay}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label small mb-0" htmlFor="phone_tel">
              Утас (tel: холбоос)
            </label>
            <input className="form-control form-control-sm" id="phone_tel" name="phone_tel" defaultValue={cfg.contact.phoneTel} />
          </div>
          <div className="col-md-6">
            <label className="form-label small mb-0" htmlFor="contact_email">
              Имэйл
            </label>
            <input
              className="form-control form-control-sm"
              id="contact_email"
              name="contact_email"
              type="email"
              defaultValue={cfg.contact.email}
            />
          </div>
          <div className="col-12">
            <label className="form-label small mb-0" htmlFor="address_line">
              Хаяг (нэг мөр)
            </label>
            <input
              className="form-control form-control-sm"
              id="address_line"
              name="address_line"
              defaultValue={cfg.contact.addressLine}
            />
          </div>

          <div className="col-12 mt-2">
            <h6 className="text-uppercase small text-muted mb-2">Хэрэгтэй холбоосууд</h6>
          </div>
          <div className="col-md-6">
            <label className="form-label small mb-0" htmlFor="useful_col_title">
              Баганын гарчиг
            </label>
            <input
              className="form-control form-control-sm"
              id="useful_col_title"
              name="useful_col_title"
              defaultValue={cfg.usefulLinksColumnTitle}
            />
          </div>
          <div className="col-12">
            <p className="small text-muted mb-1">Холбоосын жагсаалт (хоосон мөрийг алгасна)</p>
            <div className="table-responsive border rounded">
              <table className="table table-sm mb-0 align-middle">
                <thead>
                  <tr>
                    <th className="small">Текст</th>
                    <th className="small">Зам (ж: /privacy эсвэл https://…)</th>
                  </tr>
                </thead>
                <tbody>
                  {usefulRows.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <input
                          className="form-control form-control-sm"
                          name={`useful_label_${i}`}
                          defaultValue={row.label}
                          placeholder="Ж: Нууцлалын бодлого"
                        />
                      </td>
                      <td>
                        <input
                          className="form-control form-control-sm"
                          name={`useful_href_${i}`}
                          defaultValue={row.href}
                          placeholder="/privacy эсвэл #"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-12 mt-2">
            <h6 className="text-uppercase small text-muted mb-2">Платформ багана</h6>
          </div>
          <div className="col-md-6">
            <label className="form-label small mb-0" htmlFor="platform_col_title">
              Гарчиг
            </label>
            <input
              className="form-control form-control-sm"
              id="platform_col_title"
              name="platform_col_title"
              defaultValue={cfg.platformColumnTitle}
            />
          </div>
          <div className="col-12">
            <label className="form-label small mb-0" htmlFor="platform_blurb">
              Текст
            </label>
            <textarea
              className="form-control form-control-sm"
              id="platform_blurb"
              name="platform_blurb"
              rows={2}
              defaultValue={cfg.platformBlurb}
            />
          </div>

          <div className="col-12 mt-2">
            <h6 className="text-uppercase small text-muted mb-2">Сошиал (Font Awesome анги)</h6>
            <p className="small text-muted mb-1">
              Жишээ: <code>fa-brands fa-facebook-f</code>, <code>fa-brands fa-linkedin-in</code>
            </p>
            <div className="table-responsive border rounded">
              <table className="table table-sm mb-0 align-middle">
                <thead>
                  <tr>
                    <th className="small">URL</th>
                    <th className="small">aria-label</th>
                    <th className="small">Icon class</th>
                  </tr>
                </thead>
                <tbody>
                  {socialRows.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <input
                          className="form-control form-control-sm"
                          name={`social_href_${i}`}
                          defaultValue={row.href}
                          placeholder="https://…"
                        />
                      </td>
                      <td>
                        <input
                          className="form-control form-control-sm"
                          name={`social_label_${i}`}
                          defaultValue={row.label}
                          placeholder="Facebook"
                        />
                      </td>
                      <td>
                        <input
                          className="form-control form-control-sm font-monospace"
                          name={`social_icon_${i}`}
                          defaultValue={row.iconClass}
                          placeholder="fa-brands fa-facebook-f"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-12 d-flex flex-wrap gap-2 mt-3">
            <button type="submit" className="btn btn-primary btn-sm">
              Footer-ийг хадгалах
            </button>
          </div>
        </form>

        <hr className="my-4" />

        <form action={resetFooterPublicDefaultsAction}>
          <p className="small text-muted mb-2">
            Доорх товч нь одоогийн footer тохиргоог устгаж, кодын анхны үндсэн утганд сэргээнэ.
          </p>
          <button type="submit" className="btn btn-outline-warning btn-sm">
            Үндсэн footer руу сэргээх
          </button>
        </form>
      </div>
    </div>
  );
}
