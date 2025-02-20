export function testEmail(field, t) {
  field.valid = false
  field.error = null
  field.value = field.value.toLowerCase().trim()
  if (field.value.indexOf("@") > 0) {
    field.valid = true
  } else {
    field.error = t("error.invalid_email")
  }

  return field.valid
}
