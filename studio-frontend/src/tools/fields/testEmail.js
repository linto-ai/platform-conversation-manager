export function testEmail(field) {
  field.valid = false
  field.error = null
  field.value = field.value.toLowerCase().trim()
  if (field.value.indexOf("@") > 0) {
    field.valid = true
  } else {
    field.error = "Invalid email"
  }

  return field.valid
}
