/** Resolved/closed müraciətlər neçə gün sonra avtomatik arxivlənir */
export const SUPPORT_ARCHIVE_AFTER_DAYS = Math.max(
  30,
  Number(process.env.SUPPORT_ARCHIVE_AFTER_DAYS ?? 90) || 90
);
