import themes from "../../themes/index.js"

export default function getCurrentTheme() {
  const THEME = process.env.VUE_APP_THEME ?? "LinTO-green"
  return themes[THEME] || themes["LinTO-green"]
}
