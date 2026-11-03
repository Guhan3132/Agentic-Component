/**
 * Tiny scripts that run in <head> before the first paint, so there is no flash of the wrong theme or
 * brand colour. Plain strings in a server-safe module, so the layout can inline them.
 */

export const THEME_KEY = "agentic-ui:theme";
export const BRAND_KEY = "agentic-ui:brand";
export const BRAND_CSS_KEY = "agentic-ui:brand-css";
/** Bump when the brand maths or the stored format changes: older saved CSS is then ignored and re-derived. */
export const BRAND_CSS_VERSION = 2;
export const BRAND_STYLE_ID = "agentic-brand";

/** The saved choice, or the system setting when there is none. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

/** The saved brand CSS, only if it was written by this version of the maths. */
export const BRAND_SCRIPT = `try{var b=JSON.parse(localStorage.getItem("${BRAND_CSS_KEY}")||"null");if(b&&b.v===${BRAND_CSS_VERSION}&&b.css){var s=document.createElement("style");s.id="${BRAND_STYLE_ID}";s.textContent=b.css;document.head.appendChild(s)}}catch(e){}`;
