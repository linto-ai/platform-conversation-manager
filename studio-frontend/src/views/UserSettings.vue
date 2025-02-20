<template>
  <MainContent sidebar box v-if="dataLoaded">
    <!--
    <div class="flex col">
      <h1>{{ $t("usersettings.title") }}</h1>
    </div>
     LEFT COLUMN -->
    <div class="flex row" v-if="isInviteAccount">
      <div class="user-settings-notification">
        <span class="content">
          {{ $t("usersettings.invite_account_notif") }}
        </span>
      </div>
    </div>

    <UserSettingsPersonal :userInfo="userInfo" />

    <!-- Profil picture -->
    <section class="">
      <h2>{{ $t("usersettings.picture_label") }}</h2>
      <div>
        <img :src="imgUrl" class="user-settings-img" />
      </div>
      <div style="position: relative">
        <input
          type="file"
          ref="file"
          id="profile-picture"
          name="profile-picture"
          @change="handleFileUpload()" />
        <label
          for="profile-picture"
          :class="[
            picture.error !== null ? 'error' : '',
            picture.valid ? 'valid' : '',
            'btn black',
          ]">
          {{ pictureUploadLabel }}
        </label>
        <span class="error-field" v-if="picture.error !== null">
          {{ picture.error }}
        </span>

        <button v-if="picture.valid" @click="updateProfilPicture()">
          {{ $t("usersettings.update_picture_button") }}
        </button>
      </div>
    </section>

    <!-- Password -->
    <UserSettingsPassword :userInfo="userInfo" />

    <!-- Profile visibility -->
    <section>
      <h2>{{ $t("usersettings.profil_visibility.title") }}</h2>
      <FormCheckbox
        :field="profilePrivate"
        @input="updateVisibility"
        switchDisplay />
    </section>

    <!-- Email notification -->
    <UserSettingsNotifications :userInfo="userInfo" />
  </MainContent>
  <div v-else-if="!error">
    <loading></loading>
  </div>
  <div v-else>
    <ErrorView></ErrorView>
  </div>
</template>
<script>
import { apiUpdateUserInfo, apiSendVerificationLink } from "@/api/user.js"
import { bus } from "@/main.js"
import { getEnv } from "@/tools/getEnv"

import Loading from "@/components/Loading.vue"
import Breadcrumb from "@/components/Breadcrumb.vue"
import MainContent from "@/components/MainContent.vue"
import UserSettingsPersonal from "@/components/UserSettingsPersonal.vue"
import UserSettingsPassword from "@/components/UserSettingsPassword.vue"
import UserSettingsNotifications from "@/components/UserSettingsNotifications.vue"
import FormCheckbox from "@/components/FormCheckbox.vue"
import ErrorView from "@/views/Error.vue"

export default {
  props: {
    userInfo: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      picture: {
        value: "",
        error: null,
        valid: false,
      },
      profilePrivate: {
        value: this.userInfo.private ?? false,
        valid: true,
        error: null,
        label: this.$t("usersettings.profil_visibility.label_private"),
      },
      pictureUploadLabel: this.$t("usersettings.profile_image_button"),
    }
  },
  computed: {
    dataLoaded() {
      return !!this.userInfo
    },

    imgUrl() {
      return `${process.env.VUE_APP_PUBLIC_MEDIA}/${this.userInfo.img}`
    },
    isInviteAccount() {
      return this.userInfo?.accountNotifications?.inviteAccount ?? false
    },
  },
  methods: {
    async updateUserInfo(payload) {
      let req = await apiUpdateUserInfo(payload, {
        timeout: 3000,
        redirect: false,
      })

      if (req.status === "success") {
        if (payload?.email) {
          await this.sendVerificationEmail()
        }
        bus.$emit("user_settings_update", {})
      }
    },
    async updateVisibility(value) {
      await this.updateUserInfo({ private: value })
    },
    handleFileUpload() {
      this.picture.value = this.$refs.file.files[0]
      const acceptedTypes = [
        "image/gif",
        "image/png",
        "image/jpeg",
        "image/bmp",
        "image/webp",
      ]
      if (
        typeof this.picture.value !== "undefined" &&
        this.picture.value !== null &&
        !!this.picture.value.type
      ) {
        const type = this.picture.value.type
        if (acceptedTypes.indexOf(type) >= 0) {
          this.picture.valid = true
          this.picture.error = null
          this.pictureUploadLabel = "1 file selected"
        } else {
          this.picture.valid = false
          this.picture.error =
            "Invalid file type (accept jpg, png, gif, bmp, webp)"
          this.pictureUploadLabel = "Choose a file..."
        }
      } else {
        this.picture.valid = false
        this.picture.error = "This field is required"
        this.picture.value = ""
        this.pictureUploadLabel = "Choose a file..."
      }
    },
    async updateProfilPicture() {
      try {
        if (this.picture.valid) {
          let file = this.picture.value
          let formData = new FormData()
          formData.append("file", file)
          // TODO: put this function in api/user.js
          let req = await this.$options.filters.sendMultipartFormData(
            `${getEnv("VUE_APP_CONVO_API")}/users/self/picture`,
            "put",
            formData,
            { timeout: 3000, redirect: false },
          )
          if (req.status === "success") {
            this.picture = {
              value: "",
              error: null,
              valid: false,
            }
            this.pictureUploadLabel = "Choose a file..."
            bus.$emit("user_settings_update", {})
          }
        }
      } catch (error) {
        if (process.env.VUE_APP_DEBUG === "true") {
          console.error(error)
        }
      }
    },
  },
  components: {
    Loading,
    ErrorView,
    MainContent,
    UserSettingsPersonal,
    UserSettingsPassword,
    UserSettingsNotifications,
    FormCheckbox,
  },
}
</script>
