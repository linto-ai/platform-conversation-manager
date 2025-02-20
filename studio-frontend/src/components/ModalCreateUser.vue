<template>
  <ModalNew
    isForm
    @on-cancel="() => this.$emit('on-close')"
    @on-confirm="createUser"
    :title="title"
    :actionBtnLabel="actionBtnLabel">
    <div v-if="formError" class="error-field">{{ formError }}</div>
    <FormInput
      :field="firstName"
      v-model="firstName.value"
      :disabled="status == 'loading'" />
    <FormInput
      :field="lastName"
      v-model="lastName.value"
      :disabled="status == 'loading'" />
    <FormInput
      :field="email"
      v-model="email.value"
      :disabled="status == 'loading'" />
    <FormInput
      :field="newPassword"
      v-model="newPassword.value"
      :disabled="status == 'loading'" />
    <FormInput
      :field="newPasswordConfirm"
      v-model="newPasswordConfirm.value"
      :disabled="status == 'loading'" />
  </ModalNew>
</template>
<script>
import { bus } from "@/main"
import { formsMixin } from "@/mixins/forms.js"

import { testName } from "@/tools/fields/testName.js"
import { testEmail } from "@/tools/fields/testEmail.js"

import { apiAdminCreateUser } from "@/api/admin.js"

import FormInput from "@/components/FormInput.vue"
import ModalNew from "@/components/ModalNew.vue"

export default {
  mixins: [formsMixin],
  props: {},
  data() {
    return {
      title: this.$t("userCreation.title"),
      actionBtnLabel: this.$t("userCreation.confirm_button"),
      firstName: {
        value: "",
        error: null,
        valid: false,
        label: this.$t("usersettings.firstname_label"),
        testField: testName,
      },
      lastName: {
        value: "",
        error: null,
        valid: false,
        label: this.$t("usersettings.lastname_label"),
        testField: testName,
      },
      email: {
        value: "",
        error: null,
        valid: false,
        label: this.$t("usersettings.email_label"),
        testField: testEmail,
      },
      newPassword: {
        value: "",
        error: null,
        valid: false,
        label: this.$t("usersettings.new_password_label"),
        type: "password",
      },
      newPasswordConfirm: {
        value: "",
        error: null,
        valid: false,
        label: this.$t("usersettings.new_password_confirmation_label"),
        type: "password",
      },
      fields: [
        "firstName",
        "lastName",
        "email",
        "newPassword",
        "newPasswordConfirm",
      ],
      status: "idle",
      formError: null,
    }
  },
  methods: {
    async createUser() {
      if (this.newPassword.value !== this.newPasswordConfirm.value) {
        this.newPasswordConfirm.error = this.$t(
          "userCreation.passwords_do_not_match",
        )
        return false
      }

      if (this.testFields()) {
        this.status = "loading"
        const res = await apiAdminCreateUser({
          firstname: this.firstName.value,
          lastname: this.lastName.value,
          email: this.email.value,
          password: this.newPassword.value,
          role: 1,
        })
        if (res.status == "error") {
          const statusCode = res.error.response.status
          if (statusCode == 409) {
            this.email.error = this.$t("userCreation.email_already_exists")
          } else {
            this.formError = this.$t("userCreation.error_message")
          }
        } else {
          this.$emit("on-confirm", res)
        }
      }
      this.status = "idle"
      return false
    },
  },
  components: { ModalNew, FormInput },
}
</script>
