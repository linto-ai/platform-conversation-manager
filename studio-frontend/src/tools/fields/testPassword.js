export function testPassword(field, t) {
  field.valid = false
  field.error = null
  field.value = obj.value.trim()
  if (field.value.length === 0) {
    field.error = field.error = t("error.required")
  } else if (field.value.length < 6) {
    field.error = "This field must contain at least 6 characters"
  } else {
    field.valid = true
  }
}
