<template>
  <div>
    <div class="login-form-container flex col">
      <LocalSwitcher></LocalSwitcher>
      <img :src="logo" class="login-logo" />
      <h1 class="center-text">{{ title }}</h1>

      <form id="app-login" class="flex col" @submit.prevent="handleForm">
        <h2 class="login-title">{{ $t("login.recover_password") }}</h2>
        <p style="font-style: italic; font-size: 13px; margin-top: 0">
          {{ $t("login.recover_password_detail") }}
        </p>
        <div class="form-field flex col">
          <label for="email" class="form-label">Email</label>
          <input
            type="text"
            name="email"
            @change="testEmail"
            :class="email.error !== null ? 'error' : ''"
            v-model="email.value" />
          <span class="error-field" v-if="email.error !== null">{{
            email.error
          }}</span>
        </div>
        <div class="form-field flex row">
          <button type="submit" :disabled="sending" class="btn green">
            <span class="label">{{
              $t("login.recover_password_btn_label")
            }}</span>
          </button>
        </div>
        <div class="error-field global" v-if="globalError !== ''">
          {{ globalError }}
        </div>
      </form>
      <router-link to="/login" class="toggle-login-link">
        {{ $t("createaccount.signin_button") }}
      </router-link>
      <router-link to="/create-account" class="toggle-login-link">{{
        $t("login.create_account_button")
      }}</router-link>
    </div>
    <AppNotif></AppNotif>
  </div>
</template>
<script>
import { getEnv } from "@/tools/getEnv"

import AppNotif from "@/components/AppNotif.vue"
import LocalSwitcher from "@/components/LocalSwitcher.vue"
import EMPTY_FIELD from "@/const/emptyField.js"
import { apiRecoverPassword } from "../api/user"

export default {
  data() {
    return {
      email: {
        ...EMPTY_FIELD,
      },
      globalError: "",
      sending: false,
    }
  },
  computed: {
    logo() {
      return `/img/${getEnv("VUE_APP_LOGO")}`
    },
    title() {
      return getEnv("VUE_APP_NAME")
    },
  },
  methods: {
    testEmail() {
      return this.$options.filters.testEmail(this.email)
    },
    async handleForm() {
      if (!this.sending) {
        try {
          this.testEmail()
          this.globalError = ""
          if (this.email.valid) {
            this.sending = true
            const req = await apiRecoverPassword(this.email.value, {
              timeout: false,
              redirect: false,
            })
            if (req.status === "error") {
              throw req
            } else {
              this.email = { ...EMPTY_FIELD }
              this.$options.filters.setCookie("forgot_pwd", true, 7)
            }
            this.sending = false
          }
        } catch (error) {
          this.sending = false
          if (error?.message) {
            this.globalError = error.message
          }
        }
      }
    },
  },
  components: {
    AppNotif,
    LocalSwitcher,
  },
}
</script>
