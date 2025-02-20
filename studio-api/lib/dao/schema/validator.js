const Validator = new (require("jsonschema").Validator)()

function validateJson(jsonToValidate, schemaName) {
  try {
    if (!jsonToValidate) return false
    else if (typeof jsonToValidate !== "object")
      jsonToValidate = JSON.parse(jsonToValidate)

    const schema = require(`${process.cwd()}/lib/dao/schema/${schemaName}.json`)

    if (schema === "undefined") return false

    const validationResult = Validator.validate(jsonToValidate, schema)

    if (validationResult.errors.length === 0) {
      return true
    } else {
      validationResult.errors.forEach((error) => {
        console.log(error.stack)
      })

      return false
    }
  } catch (error) {
    return false
  }
}

module.exports = validateJson
