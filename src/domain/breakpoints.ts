// The one mobile breakpoint. CSS carries its own literal (media queries cannot
// read a JS value) — the @custom-variant `mobile` in globals.css. Keep in sync.
export const MOBILE_BP = 780;
export const MOBILE_QUERY = `(max-width: ${MOBILE_BP}px)`;
