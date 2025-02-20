<template>
  <form @submit="update">
    <section>
      <h2>
        {{ $t("usersettings.personal_information") }}
      </h2>

      <FormInput :field="firstName" v-model="firstName.value" />

      <FormInput :field="lastName" v-model="lastName.value" />

      <FormInput :field="email" v-model="email.value" :disabled="fromSso">
        <template v-slot:content-after-label>
          <span
            class="icon email-verified"
            v-if="userInfo.emailIsVerified"></span>
        </template>
      </FormInput>

      <div
        class="flex row align-center"
        v-if="!userInfo.emailIsVerified || emailSent">
        <div class="user-settings-notification" v-if="!emailSent">
          <span class="content">{{
            $t("usersettings.verify_email_notif")
          }}</span>
        </div>
        <span v-else class="email-verified-notif">{{
          $t("usersettings.check_verify_email")
        }}</span>
        <button
          v-if="!userInfo.emailIsVerified && !emailSent"
          class="btn yellow"
          @click="sendVerificationEmail()"
          style="margin: 0 5px">
          <span
            :class="['icon', sendingEmail ? 'loading' : 'send-mail']"></span>
          <span class="label">{{
            $t("usersettings.send_verification_link")
          }}</span>
        </button>
      </div>

      <button type="submit" class="btn">
        <span class="icon apply"></span>
        <span class="label">{{
          $t("usersettings.update_personal_information_button")
        }}</span>
      </button>
    </section>
  </form>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import { formsMixin } from "@/mixins/forms.js"

import { apiUpdateUserInfo, apiSendVerificationLink } from "@/api/user.js"
import { apiAdminUpdateUser } from "@/api/admin.js"

import { testName } from "@/tools/fields/testName"
import { testEmail } from "@/tools/fields/testEmail"

import FormInput from "@/components/FormInput.vue"

export default {
  mixins: [formsMixin],
  props: {
    userInfo: {
      type: Object,
      required: true,
    },
    isAdminPage: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      firstName: {
        value: this.userInfo.firstname,
        error: null,
        valid: false,
        label: this.$t("usersettings.firstname_label"),
        testField: testName,
      },
      lastName: {
        value: this.userInfo.lastname,
        error: null,
        valid: false,
        label: this.$t("usersettings.lastname_label"),
        testField: testName,
      },
      email: {
        value: this.userInfo.email,
        error: null,
        valid: false,
        label: this.$t("usersettings.email_label"),
        testField: testEmail,
      },
      fields: ["firstName", "lastName", "email"],
      sendingEmail: false,
      emailSent: false,
    }
  },
  mounted() {},
  computed: {
    fromSso() {
      return this.userInfo.fromSso
    },
  },
  methods: {
    async update(event) {
      event?.preventDefault()

      if (this.testFields()) {
        const payload = {
          firstname: this.firstName.value,
          lastname: this.lastName.value,
        }

        if (!this.fromSso) {
          payload["email"] = this.email.value
        }

        let req = null

        if (!this.isAdminPage) {
          req = await apiUpdateUserInfo(payload, {
            timeout: 3000,
            redirect: false,
          })

          if (req.status === "success") {
            if (this.email.value !== this.userInfo.email) {
              await this.sendVerificationEmail()
            }
          }
        } else {
          req = await apiAdminUpdateUser(this.userInfo._id, payload)
        }

        if (req.status === "success") {
          bus.$emit("app_notif", {
            status: "success",
            message: this.$t("usersettings.notif_success"),
          })
        } else {
          bus.$emit("app_notif", {
            status: "error",
            message: this.$t("usersettings.notif_error"),
          })
        }
      }

      return false
    },
    async sendVerificationEmail() {
      this.sendingEmail = true
      const sendLink = await apiSendVerificationLink({
        timeout: 3000,
        redirect: false,
      })

      if (sendLink.status === "success") {
        this.sendingEmail = false
        this.emailSent = true
      }
    },
  },
  components: { Fragment, FormInput },
}
</script>
