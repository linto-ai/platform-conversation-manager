export function testMatchingEmail(field) {
  field.valid = false
  field.error = null
  field.value = field.value.toLowerCase().trim()

  if (field.value.length == 0) {
    return true
  }

  if (field.value.indexOf("@") > -1) {
    field.valid = true
  } else {
    field.error = "Invalid email"
  }

  return field.valid
}
