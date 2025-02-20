export function testContent(field, t, testEmpty = false) {
  field.error = null
  field.valid = false
  field.value = field.value.trim()
  if (field.value.length === 0) {
    if (testEmpty) {
      field.error = t("error.required")
    } else {
      field.valid = true
    }
  } else {
    if (field.value.indexOf(">") >= 0 || field.value.indexOf("<") >= 0) {
      field.error = t("error.unauthorized_caracters")
    } else {
      field.valid = true
    }
  }
  return field.valid
}
