export function testFieldEmpty(field) {
  field.error = null
  field.valid = false

  if (!field.value) {
    field.error = "This field is required"
    field.valid = false
    return false
  }

  field.value = field.value.trim()

  if (field.value.length === 0) {
    field.error = "This field is required"
    field.valid = false
  } else {
    field.valid = true
  }
  return field.valid
}
