import DEFAULTENV from "../const/defaultEnv"
import getCurrentTheme from "./getCurrentTheme"

export function getEnv(envKey) {
  const themeEnv = getCurrentTheme()?.defaultEnvValues || {}
  return themeEnv[envKey] || process.env[envKey] || DEFAULTENV[envKey]
}
