import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/media-url";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  industry?: string;
  location?: string;
  verified?: string;
};

export default async function MembersPage({ searchParams }: { searchParams: SearchParams }) {
  const query = searchParams.q?.trim() || "";
  const industryFilter = searchParams.industry?.trim() || "";
  const locationFilter = searchParams.location?.trim() || "";
  const verifiedFilter = ["1", "0", "all"].includes(searchParams.verified || "1") ? searchParams.verified : "1";

  const where: any = { status: "active" };

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { company: { contains: query, mode: "insensitive" } },
      { industry: { contains: query, mode: "insensitive" } },
      { bio: { contains: query, mode: "insensitive" } }
    ];
  }
  
  if (industryFilter) {
    where.industry = industryFilter;
  }
  
  if (locationFilter) {
    where.OR = [
      ...(where.OR || []),
      { position: locationFilter },
      { company: { contains: locationFilter, mode: "insensitive" } },
      { bio: { contains: locationFilter, mode: "insensitive" } }
    ];
  }
  
  if (verifiedFilter === "1") {
    where.featured = 1;
  } else if (verifiedFilter === "0") {
    where.featured = 0;
  }

  const members = await prisma.legacyMember.findMany({
    where,
    orderBy: [
      { featured: 'desc' },
      { updatedAt: 'desc' },
      { name: 'asc' }
    ]
  }).catch(() => []);

  const totalActive = await prisma.legacyMember.count({
    where: { status: "active" }
  }).catch(() => 0);

  const featuredMembers = await prisma.legacyMember.findMany({
    where: { status: "active", featured: 1 },
    orderBy: [ { updatedAt: 'desc' }, { name: 'asc' } ],
    take: 4
  }).catch(() => []);

  const recentMembers = await prisma.legacyMember.findMany({
    where: { status: "active" },
    orderBy: { updatedAt: 'desc' },
    take: 3
  }).catch(() => []);

  const allActiveMembers = await prisma.legacyMember.findMany({
    where: { status: "active" },
    select: { industry: true, position: true, bio: true }
  }).catch(() => []);

  const industriesSet = new Set<string>();
  const locationsSet = new Set<string>();

  for (const m of allActiveMembers) {
    if (m.industry && m.industry.trim()) {
      industriesSet.add(m.industry.trim());
    }
    
    let loc = "";
    if (m.position && /^[A-Za-zА-Яа-яӨөҮү ]+$/.test(m.position)) {
      loc = m.position.trim();
    } else if (m.bio && m.bio.includes("Улаанбаатар")) {
      loc = "Улаанбаатар";
    } else if (m.bio && m.bio.includes("Дархан")) {
      loc = "Дархан-Уул";
    } else if (m.bio && m.bio.includes("Эрдэнэт")) {
      loc = "Эрдэнэт";
    }
    if (loc) {
      locationsSet.add(loc);
    }
  }

  const industries = Array.from(industriesSet).sort();
  const locations = Array.from(locationsSet).sort();

  const mLogo = (name: string, company: string | null) => {
    const text = (company || name).trim();
    if (!text) return "BN";
    const tokens = text.split(/\s+/);
    let res = "";
    for (const t of tokens) {
      if (!t) continue;
      res += t.charAt(0);
      if (res.length >= 2) break;
    }
    if (!res) res = text.substring(0, 2);
    return res.toUpperCase();
  };

  const preview = members[0] || null;

  return (
    <main className="page-content" style={{ backgroundColor: "var(--bg-page)" }}>

      <div className="container pt-4">
          
          {/* Header */}
          <div className="members-header">
              <h1 className="members-title">Гишүүдийн сүлжээ</h1>
              <p className="members-subtitle">Салбар, байршил, боломжоор хайж баталгаажсан бизнесүүдтэй холбогдоорой.</p>
          </div>

          <form method="get" action="/members">
              {/* Search Box */}
              <div className="members-search-box">
                  <i className="fa-solid fa-magnifying-glass ms-3" style={{ color: "var(--text-muted)" }}></i>
                  <input type="text" className="m-search-input" name="q" defaultValue={query} placeholder="Компани, хүн, ур чадвар, үйлчилгээ, түлхүүр үгээр хайх..." />
                  <button className="btn-brand m-search-btn" type="submit">Хайх</button>
              </div>

              {/* Filters Row */}
              <div className="m-filters-row">
                  <div className="m-filter-group">
                      <label className="m-filter-label">Салбар</label>
                      <select className="m-filter-select" name="industry" defaultValue={industryFilter}>
                          <option value="">Бүгд</option>
                          {industries.map(ind => (
                              <option key={ind} value={ind}>{ind}</option>
                          ))}
                      </select>
                  </div>
                  <div className="m-filter-group">
                      <label className="m-filter-label">Байршил</label>
                      <select className="m-filter-select" name="location" defaultValue={locationFilter}>
                          <option value="">Бүгд</option>
                          {locations.map(loc => (
                              <option key={loc} value={loc}>{loc}</option>
                          ))}
                      </select>
                  </div>
                  <div className="m-filter-group">
                      <label className="m-filter-label">Хэрэгцээ</label>
                      <select className="m-filter-select" disabled>
                          <option>Бүгд</option>
                      </select>
                  </div>
                  <div className="m-filter-group">
                      <label className="m-filter-label">Санал болгож буй боломж</label>
                      <select className="m-filter-select" disabled>
                          <option>Бүгд</option>
                      </select>
                  </div>
              </div>
              
              <div className="m-filters-bottom">
                  <div className="m-filter-group" style={{ maxWidth: 250 }}>
                      <label className="m-filter-label">Verified</label>
                      <select className="m-filter-select" style={{ backgroundColor: "#fff" }} name="verified" defaultValue={verifiedFilter}>
                          <option value="1">Зөвхөн баталгаажсан</option>
                          <option value="all">Бүгд</option>
                          <option value="0">Зөвхөн энгийн</option>
                      </select>
                  </div>
                  <Link href="/members" className="reset-filters-link mt-3">Бүх шүүлтүүрийг дахин тохируулах</Link>
                  <button type="submit" className="d-none">Submit</button>
              </div>
          </form>

          {/* Layout */}
          <div className="members-layout">
              
              {/* Left Column: Main Content */}
              <div className="m-left-col">
                  
                  <div className="m-results-header">
                      <div className="m-results-title">Гишүүдийн хайлт <span className="m-results-count">({members.length} үр дүн)</span></div>
                      <div className="m-sort-bar">
                          <select className="m-filter-select m-0" style={{ width: "auto", paddingRight: "2rem" }} defaultValue="">
                              <option value="">Эрэмбэлэх: Хамгийн тохиромжтой</option>
                          </select>
                          <div className="view-toggles">
                              <div className="view-btn active"><i className="fa-solid fa-border-all"></i></div>
                              <div className="view-btn"><i className="fa-solid fa-list"></i></div>
                          </div>
                      </div>
                  </div>

                  <div className="m-cards-grid">
                      {members.length === 0 && (
                          <div className="m-card">
                              <h3 className="m-card-title">Үр дүн олдсонгүй</h3>
                              <div className="m-card-desc">Хайлтын нөхцөлөө өөрчлөөд дахин оролдоно уу.</div>
                          </div>
                      )}
                      {members.map((member, index) => {
                          const isFeatured = member.featured === 1;
                          const name = member.company || member.name;
                          const industryName = member.industry || 'Тодорхойгүй';
                          const locationText = member.position ? member.position : 'Улаанбаатар, Монгол';
                          let desc = member.bio ? member.bio.replace(/<[^>]*>?/gm, '') : '';
                          desc = desc ? (desc.length > 160 ? desc.substring(0, 160) + "..." : desc) : 'Танилцуулга мэдээлэл оруулаагүй байна.';

                          return (
                              <div key={member.id} className="m-card" style={index === 0 ? { border: "1px solid var(--brand-primary)", boxShadow: "var(--shadow-md)" } : {}}>
                                  <div className="m-card-badges">
                                      {index < 2 && <span className="m-badge top-match"><i className="fa-solid fa-star text-warning" style={{ fontSize: "0.5rem" }}></i> Top Match</span>}
                                      {isFeatured && <span className="m-badge verified"><i className="fa-solid fa-circle-check text-primary"></i> Verified</span>}
                                      <span className="m-badge bni">BNI Member</span>
                                  </div>
                                  <div className="d-flex align-items-center gap-3 mb-2">
                                      {member.photo ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img className="m-card-logo" src={mediaUrl(member.photo)} alt={name} style={{ objectFit: "cover" }} />
                                      ) : (
                                          <div className="m-card-logo">{mLogo(member.name, member.company)}</div>
                                      )}
                                      <div>
                                          <h3 className="m-card-title">{name}</h3>
                                          <div className="m-card-sector"><i className="fa-solid fa-building me-1"></i> {industryName}</div>
                                      </div>
                                  </div>
                                  <div className="m-card-loc"><i className="fa-solid fa-location-dot me-1"></i> {locationText}</div>
                                  <div className="m-card-desc">{desc}</div>
                                  <div className="m-card-tags">
                                      <span className="m-tag">{industryName}</span>
                                      {isFeatured && <span className="m-tag">Verified</span>}
                                      <span className="m-tag">BNI</span>
                                  </div>
                                  <div className="m-card-actions">
                                      <Link href={`/company/${member.id}`} className="m-card-btn outline">Профайл</Link>
                                      <a href={member.website ? (member.website.startsWith("http") ? member.website : `https://${member.website}`) : `mailto:${member.email || ''}`} className="m-card-btn fill">Холбогдох</a>
                                  </div>
                              </div>
                          );
                      })}
                  </div>

                  <div className="text-center">
                      <button type="button" className="btn-brand-outline px-4 py-2" style={{ borderRadius: 20, fontSize: "0.85rem", borderColor: "var(--border-color)", color: "var(--text-main)" }}>Илүү их харах <i className="fa-solid fa-chevron-down ms-1"></i></button>
                  </div>

                  {/* Featured & Recent Sections */}
                  <div className="m-bottom-sections">
                      
                      <div>
                          <div className="m-section-header">
                              <div className="m-section-title">Онцлох гишүүд <i className="fa-regular fa-circle-question text-muted" style={{ fontSize: "0.8rem" }}></i></div>
                              <Link href="/members?verified=1" className="m-section-link">Бүгдийг харах</Link>
                          </div>
                          <div className="featured-slider-card position-relative">
                              {featuredMembers.map(fMember => (
                                  <div key={fMember.id} className="f-slider-item">
                                      <div className="f-slider-logo">{mLogo(fMember.name, fMember.company)}</div>
                                      <div className="fw-bold text-truncate">{fMember.company || fMember.name}</div>
                                      <div className="text-muted">{fMember.position || 'Монгол'}</div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div>
                          <div className="m-section-header">
                              <div className="m-section-title">Сүүлийн холболтууд</div>
                              <Link href="/members" className="m-section-link">Бүгдийг харах</Link>
                          </div>
                          <div className="invest-widget m-0 p-3">
                              {recentMembers.map(rMember => (
                                  <div key={rMember.id} className="recent-conn-item">
                                      <div className="rc-logo">{mLogo(rMember.name, rMember.company)}</div>
                                      <div className="rc-info">
                                          <div className="rc-name">{rMember.company || rMember.name}</div>
                                          <div className="rc-desc">{rMember.industry || 'Хамтын ажиллагааны санал'}</div>
                                      </div>
                                      <div className="rc-time">{rMember.updatedAt ? rMember.updatedAt.toISOString().split("T")[0] : ""}</div>
                                  </div>
                              ))}
                          </div>
                      </div>

                  </div>

              </div>

              {/* Right Column: Profile Preview Sidebar */}
              <aside className="m-right-col">
                  {preview ? (
                      <div className="profile-preview-card">
                          
                          <div className="pp-top-bar">
                              {preview.featured === 1 && (
                                  <span className="m-badge verified"><i className="fa-solid fa-circle-check text-primary"></i> Verified</span>
                              )}
                              <div className="d-flex gap-2">
                                  <button className="btn btn-link text-muted p-0"><i className="fa-solid fa-expand" style={{ fontSize: "0.8rem" }}></i></button>
                                  <button className="btn btn-link text-muted p-0 ms-1"><i className="fa-solid fa-xmark" style={{ fontSize: "1rem" }}></i></button>
                              </div>
                          </div>

                          <div className="pp-header">
                              <div className="pp-logo" style={{ background: "#e0f2fe", color: "var(--brand-primary)" }}>{mLogo(preview.name, preview.company)}</div>
                              <div>
                                  <h2 className="pp-title">{preview.company || 'Мэдээлэл алга'}</h2>
                                  <div className="pp-info-line"><i className="fa-solid fa-building me-1 text-light"></i> {preview.industry || 'Салбар тодорхойгүй'}</div>
                                  <div className="pp-info-line"><i className="fa-solid fa-location-dot me-1 text-light"></i> {preview.position || 'Монгол'}</div>
                                  {preview.website && (
                                      <a href={preview.website.startsWith("http") ? preview.website : `https://${preview.website}`} className="pp-link"><i className="fa-solid fa-globe me-1"></i> {preview.website}</a>
                                  )}
                              </div>
                          </div>

                          <div className="pp-tags">
                              <span className="m-tag">{preview.industry || 'BNI'}</span>
                              <span className="m-tag">{preview.featured === 1 ? 'Verified' : 'Member'}</span>
                              <span className="m-tag">BNI</span>
                          </div>

                          <div className="pp-section-title">Товч танилцуулга</div>
                          <div className="pp-desc">
                              {preview.bio ? preview.bio.replace(/<[^>]*>?/gm, '') : 'Товч танилцуулга мэдээлэл алга.'}
                          </div>

                          <div className="pp-scores">
                              <div className="pp-score-box">
                                  <div className="pp-score-title">Итгэлцлийн оноо</div>
                                  <div className="pp-score-val">95<span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 400 }}>/100</span></div>
                                  <div className="pp-score-sub">Өндөр итгэлцэл</div>
                              </div>
                              <div className="pp-score-box position-relative">
                                  <div className="pp-score-title">Match оноо</div>
                                  <div className="pp-score-val">92%</div>
                                  <div className="pp-score-sub">Танд маш тохиромжтой</div>
                                  <div className="position-absolute" style={{ top: 20, right: 15 }}>
                                      <svg width="36" height="36" viewBox="0 0 36 36">
                                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--brand-primary)" strokeWidth="3" strokeDasharray="92, 100" />
                                      </svg>
                                  </div>
                              </div>
                          </div>

                          <div className="pp-section-title">Бидний санал болгож буй</div>
                          <ul className="pp-list">
                              <li><i className="fa-regular fa-circle-check text-primary"></i> {preview.industry || 'Бизнесийн үйлчилгээ'}</li>
                              <li><i className="fa-regular fa-circle-check text-primary"></i> BNI сүлжээний түншлэл</li>
                              <li><i className="fa-regular fa-circle-check text-primary"></i> Хамтарсан бизнес хөгжүүлэлт</li>
                          </ul>
                          <Link href="/members" className="m-section-link mb-3 d-block">Бүх үйлчилгээ харах</Link>

                          <div className="pp-section-title">Бидний хэрэгцээ</div>
                          <ul className="pp-list">
                              <li><i className="fa-regular fa-circle-check text-primary"></i> Шинэ харилцагч, хамтын ажиллагаа</li>
                              <li><i className="fa-regular fa-circle-check text-primary"></i> Стратегийн түншлэл</li>
                              <li><i className="fa-regular fa-circle-check text-primary"></i> Салбарын зөвлөх үйлчилгээ</li>
                          </ul>
                          <Link href="/members" className="m-section-link mb-4 d-block">Бүх хэрэгцээг харах</Link>

                          <div className="pp-section-title">Холбоо барих</div>
                          <div className="pp-contact-row">
                              <button className="pp-contact-btn"><i className="fa-solid fa-phone me-1"></i> Дуудлага</button>
                              <button className="pp-contact-btn"><i className="fa-regular fa-message me-1"></i> Мессеж</button>
                              <button className="pp-contact-btn"><i className="fa-regular fa-envelope me-1"></i> Имэйл</button>
                          </div>

                          <div className="pp-main-actions">
                              <button className="btn-brand pp-main-btn" style={{ background: "#fff", color: "var(--text-main)", border: "1px solid var(--border-color)" }}>Холбогдох</button>
                              <button className="btn btn-light px-3" style={{ border: "1px solid var(--border-color)", background: "transparent" }}><i className="fa-regular fa-bookmark"></i></button>
                          </div>

                      </div>
                  ) : (
                      <div className="profile-preview-card d-flex align-items-center justify-content-center text-muted" style={{ minHeight: "400px" }}>
                          Профайл сонгогдоогүй байна
                      </div>
                  )}
              </aside>

          </div>

      </div>

      {/* Bottom Stats Section */}
      <div className="m-bottom-stats-container">
          <div className="container">
              <h3 className="members-subtitle mb-4">Сүлжээний ерөнхий үзүүлэлт</h3>
              <div className="m-stats-grid">
                  
                  <div className="m-stat-box">
                      <div className="m-stat-icon"><i className="fa-solid fa-users"></i></div>
                      <div className="m-stat-info">
                          <div className="m-stat-label">Нийт гишүүд</div>
                              <div className="m-stat-val">{totalActive.toLocaleString()}</div>
                          <div className="m-stat-trend"><i className="fa-solid fa-arrow-up"></i> 12% энэ сард</div>
                      </div>
                  </div>

                  <div className="m-stat-box">
                      <div className="m-stat-icon"><i className="fa-solid fa-chart-pie"></i></div>
                      <div className="m-stat-info">
                          <div className="m-stat-label">Салбарын ангилал</div>
                              <div className="m-stat-val">{industries.length}+</div>
                          <div className="m-stat-sub mt-1">Бизнес салбар</div>
                      </div>
                  </div>

                  <div className="m-stat-box">
                      <div className="m-stat-icon"><i className="fa-solid fa-globe"></i></div>
                      <div className="m-stat-info">
                          <div className="m-stat-label">Төлөөлөгдсөн улс</div>
                              <div className="m-stat-val">{Math.max(1, locations.length)}</div>
                          <div className="m-stat-sub mt-1" style={{ lineHeight: 1.3 }}>Монгол, БНХАУ, Солонгос, Япон, АНУ, Сингапур</div>
                      </div>
                  </div>

                  <div className="m-stat-box">
                      <div className="m-stat-icon"><i className="fa-solid fa-handshake"></i></div>
                      <div className="m-stat-info">
                          <div className="m-stat-label">Амжилттай холболтууд</div>
                              <div className="m-stat-val">{totalActive > 0 ? Math.round(totalActive * 0.35).toLocaleString() : 0}</div>
                          <div className="m-stat-trend"><i className="fa-solid fa-arrow-up"></i> 18% энэ сард</div>
                      </div>
                  </div>

              </div>
          </div>
      </div>

    </main>
  );
}
