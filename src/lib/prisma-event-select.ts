/**
 * Columns optional in some DBs (`registration_form_json`, `advance_order_mnt`).
 * Listing fields explicitly avoids SELECT-ing missing columns on older schemas.
 */
export const bniEventPublicListSelect = {
  id: true,
  title: true,
  startsAt: true,
  endsAt: true,
  eventType: true,
  location: true,
  chapter: {
    select: {
      name: true,
      slug: true,
      region: { select: { name: true, slug: true } },
    },
  },
} as const;

export const bniEventPublicDetailSelect = {
  ...bniEventPublicListSelect,
  chapterId: true,
  curriculumId: true,
  curriculumOverrideJson: true,
  priceMnt: true,
  advanceOrderMnt: true,
  isOnline: true,
  curriculum: {
    select: { name: true, agendaJson: true },
  },
} as const;
