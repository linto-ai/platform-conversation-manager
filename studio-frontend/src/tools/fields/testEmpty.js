export function testFieldEmpty(field, t) {
  field.error = null
  field.valid = false

  if (!field.value) {
    field.error = t("error.required")
    field.valid = false
    return false
  }

  field.value = field.value.trim()

  if (field.value.length === 0) {
    field.error = t("error.required")
    field.valid = false
  } else {
    field.valid = true
  }
  return field.valid
}
