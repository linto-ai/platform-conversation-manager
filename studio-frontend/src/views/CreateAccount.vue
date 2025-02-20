<template>
  <MainContentPublic>
    <form
      class="flex col login-page__form gap-small"
      @submit="handlePersonalForm"
      v-if="state == 'personal-information'">
      <h2 class="login-title">{{ $t("createaccount.personal_title") }}</h2>
      <!-- First name -->
      <div class="form-field flex col">
        <label class="form-label" for="firstname">
          {{ $t("createaccount.first_name_label") }}<strong>*</strong> :
        </label>
        <input
          id="firstname"
          type="text"
          v-model="firstname.value"
          :class="firstname.error !== null ? 'error' : ''"
          @change="testName(firstname)" />
        <span class="error-field" v-if="firstname.error !== null">
          {{ firstname.error }}
        </span>
      </div>
      <!-- Last name -->
      <div class="form-field flex col">
        <label class="form-label" for="lastname">
          {{ $t("createaccount.last_name_label") }}<strong>*</strong> :
        </label>
        <input
          id="lastname"
          type="text"
          v-model="lastname.value"
          :class="lastname.error !== null ? 'error' : ''"
          @change="testName(lastname)" />
        <span class="error-field" v-if="lastname.error !== null">
          {{ lastname.error }}
        </span>
      </div>
      <!-- Email -->
      <div class="form-field flex col">
        <label class="form-label" for="email">
          {{ $t("createaccount.email_label") }}<strong>*</strong> :
        </label>
        <input
          id="email"
          type="email"
          v-model="email.value"
          :class="email.error !== null ? 'error' : ''"
          @change="testEmail(email)" />
        <span class="error-field" v-if="email.error !== null">
          {{ email.error }}
        </span>
      </div>
      <!-- Profil picture -->
      <div class="form-field flex col">
        <label class="form-label">{{ $t("createaccount.image_label") }}</label>
        <div class="input-file-container flex row">
          <input
            type="file"
            id="file"
            ref="file"
            class="input__file"
            v-on:change="handleFileUpload()"
            accept=".png, .jpg, .jpeg" />
          <label
            for="file"
            class="input__file-label-btn"
            :class="[
              picture.error !== null ? 'error' : '',
              picture.valid ? 'valid' : '',
              'btn black',
            ]">
            <span class="icon upload"></span>
            <span class="label">{{
              picture.valid
                ? $t("createaccount.picture_selected")
                : $t("createaccount.picture_upload_label")
            }}</span>
          </label>
        </div>
        <span
          class="input__file-name"
          v-if="!!picture.value['name'] && picture.value['name'] !== ''"
          >{{ picture.value.name }}</span
        >
        <span class="error-field" v-if="picture.error !== null">
          {{ picture.error }}
        </span>
      </div>
      <!-- Password -->
      <div class="form-field flex col">
        <label class="form-label" for="password">
          {{ $t("createaccount.password_label") }}<strong>*</strong> :
        </label>
        <input
          id="password"
          type="password"
          autocomplete="new-password"
          v-model="password.value"
          :class="password.error !== null ? 'error' : ''"
          @change="testPassword(password)" />
        <span class="error-field" v-if="password.error !== null">
          {{ password.error }}
        </span>
      </div>
      <!-- Password confirmation -->
      <div class="form-field flex col">
        <label class="form-label" for="passwordconfirm">
          {{ $t("createaccount.password_confirmation_label") }}
          <strong>*</strong> :
        </label>
        <input
          id="passwordconfirm"
          type="password"
          autocomplete="new-password"
          v-model="passwordConfirm.value"
          :class="passwordConfirm.error !== null ? 'error' : ''"
          @change="testPasswordConfirm(passwordConfirm, password)" />
        <span class="error-field" v-if="passwordConfirm.error !== null">
          {{ passwordConfirm.error }}
        </span>
      </div>

      <div class="form-field flex row">
        <button type="submit" class="btn green fullwidth">
          <span class="label">
            {{ $t("createaccount.personal_button") }}
          </span>
          <span class="icon apply"></span>
        </button>
      </div>
      <div class="form-field" v-if="formError !== null">
        <span class="form-error">{{ formError }}</span>
      </div>
    </form>

    <form
      class="flex col login-page__form gap-small"
      v-else-if="state == 'organization-information' || state == 'sending'"
      @submit="handleOrgaForm">
      <h2>{{ $t("createaccount.organization_title") }}</h2>
      <p>
        {{ $t("createaccount.organization_description") }}
      </p>
      <!-- Organization name -->
      <div class="form-field flex col">
        <label class="form-label" for="organizationName">
          {{ $t("createaccount.organization_name_label") }}
        </label>
        <input
          id="organizationName"
          type="text"
          v-model="organizationName.value"
          :class="organizationName.error !== null ? 'error' : ''" />
        <span class="error-field" v-if="organizationName.error !== null">
          {{ organizationName.error }}
        </span>
      </div>

      <button
        type="submit"
        class="btn green fullwidth"
        v-if="state !== 'sending'">
        <span class="label">
          {{ $t("createaccount.create_account_button") }}
        </span>
        <span class="icon apply"></span>
      </button>

      <button type="submit" class="btn green fullwidth" disabled v-else>
        <span class="label"> Creating account... </span>
        <span class="icon loading"></span>
      </button>
    </form>

    <div
      class="flex col login-page__form gap-small"
      v-else-if="state == 'email-verification'">
      <h2>{{ $t("createaccount.email_verification_title") }}</h2>
      <div>
        {{ $t("createaccount.email_verification_text") }}
      </div>
    </div>
    <div class="medium-margin-top">
      <router-link to="/login" class="underline">
        {{ $t("createaccount.signin_button") }}
      </router-link>
    </div>
  </MainContentPublic>
</template>
<script>
import { getEnv } from "@/tools/getEnv"

import AppNotif from "@/components/AppNotif.vue"
import LocalSwitcher from "@/components/LocalSwitcher.vue"
import EMPTY_FIELD from "@/const/emptyField.js"
import { apiCreateUser } from "@/api/user.js"
import MainContentPublic from "@/components/MainContentPublic.vue"
import { testEmail } from "@/tools/fields/testEmail.js"
import { testName } from "@/tools/fields/testName.js"
import { testPassword } from "@/tools/fields/testPassword.js"

export default {
  data() {
    return {
      firstname: { ...EMPTY_FIELD },
      lastname: { ...EMPTY_FIELD },
      email: { ...EMPTY_FIELD },
      password: { ...EMPTY_FIELD },
      passwordConfirm: { ...EMPTY_FIELD },
      picture: { ...EMPTY_FIELD },
      organizationName: { ...EMPTY_FIELD },
      formError: null,
      state: "personal-information",
    }
  },
  mounted() {
    if (!this.enable_inscription) {
      this.$router.push("/login")
    }
  },
  computed: {
    formValid() {
      if (!this.pictureSelected) {
        return (
          this.email.valid &&
          this.firstname.valid &&
          this.lastname.valid &&
          this.password.valid &&
          this.passwordConfirm.valid
        )
      } else {
        return (
          this.email.valid &&
          this.firstname.valid &&
          this.lastname.valid &&
          this.password.valid &&
          this.passwordConfirm.valid &&
          this.picture.valid
        )
      }
    },
    pictureSelected() {
      return this.picture.value !== ""
    },
    enable_inscription() {
      return process.env.VUE_APP_DISABLE_USER_CREATION !== "true"
    },
    logo() {
      return `/img/${getEnv("VUE_APP_LOGO")}`
    },
    title() {
      return getEnv("VUE_APP_NAME")
    },
  },

  methods: {
    async handlePersonalForm(event) {
      event.preventDefault()
      try {
        this.formError = null
        this.testEmail(this.email)
        this.testName(this.firstname)
        this.testName(this.lastname)
        this.testPassword(this.password)
        this.testPasswordConfirm(this.passwordConfirm, this.password)
        if (this.pictureSelected) {
          this.handleFileUpload()
        }
        if (this.formValid) {
          this.organizationName.value = `${this.email.value}'s organization`
          this.state = "organization-information"
        }
      } catch (error) {
        if (process.env.VUE_APP_DEBUG === "true") {
          console.error(error)
        }
      }
      return false
    },
    async handleOrgaForm(event) {
      event.preventDefault()
      if (this.formValid && this.organizationName.value !== "") {
        this.state = "sending"
        let formData = new FormData()
        if (this.pictureSelected) {
          formData.append("file", this.picture.value)
        }
        formData.append("firstname", this.firstname.value)
        formData.append("lastname", this.lastname.value)
        formData.append("email", this.email.value)
        formData.append("password", this.password.value)
        formData.append("organizationName", this.organizationName.value)

        const res = await apiCreateUser(formData, {
          timeout: null,
          redirect: false,
        })
        if (res.message === "User address already use") {
          this.state = "personal-information"
          this.email.error = this.$t("userCreation.email_already_exists")
        } else if (res.status === "success") {
          this.firstname = { ...EMPTY_FIELD }
          this.lastname = { ...EMPTY_FIELD }
          this.email = { ...EMPTY_FIELD }
          this.password = { ...EMPTY_FIELD }
          this.passwordConfirm = { ...EMPTY_FIELD }
          this.picture = { ...EMPTY_FIELD }

          this.state = "email-verification"
        } else {
          this.state = "personal-information"
          this.formError = this.$t("userCreation.error_message")
        }
      } else {
        console.log("invalid form")
      }
      return false
    },
    handleFileUpload() {
      this.picture.value = this.$refs.file.files[0]
      const acceptedTypes = ["image/png", "image/jpeg"]
      if (
        typeof this.picture.value !== "undefined" &&
        this.picture.value !== null &&
        !!this.picture.value.type
      ) {
        const type = this.picture.value.type
        if (acceptedTypes.indexOf(type) >= 0) {
          this.picture.valid = true
          this.picture.error = null
        } else {
          this.picture.valid = false
          this.picture.error = "Invalid file type (accept .png, .jpg, .jpeg)"
        }
      } else {
        this.picture.value = ""
        this.picture.valid = false
        this.picture.error = null
      }
    },
    testName(obj) {
      return testName(obj, (key) => this.$t(key))
    },
    testEmail(obj) {
      obj.value = obj.value.toLowerCase()
      return testEmail(obj, (key) => this.$t(key))
    },
    testPassword(obj) {
      return testPassword(obj, (key) => this.$t(key))
    },
    testPasswordConfirm(obj, password) {
      return testPasswordConfirm(obj, password)
    },
  },
  components: {
    AppNotif,
    LocalSwitcher,
    MainContentPublic,
  },
}
</script>
