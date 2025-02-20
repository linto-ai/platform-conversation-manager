export const formsMixin = {
  methods: {
    testFields({ fieldsToTest = this.fields, autoContains = false } = {}) {
      this.debug("testing fields %o", fieldsToTest)
      return fieldsToTest.every((fieldName) => {
        if (!autoContains) {
          const res = this.testSingleField(this[fieldName])
          this.debug("field %s is valid: %s", fieldName, res)
          return res
        } else {
          const res = this.testSingleField(fieldName)
          this.debug("field %s is valid: %s", fieldName, res)
          return res
        }
      })
    },
    testSingleField(field) {
      if (typeof field === "object" && field.length !== undefined) {
        return field.every((field) => this.testSingleField(field))
      }

      // maybe check if testField is a function and display warning if not
      if (field.required && !field.value) {
        field.error = this.$i18n.t("error.required")
        return false
      }

      if (!field.testField) {
        return true
      }

      return field.testField(field, this.$i18n.t.bind(this.$i18n))
    },
  },
}
