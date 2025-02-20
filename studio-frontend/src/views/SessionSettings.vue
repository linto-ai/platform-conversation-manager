<template>
  <MainContent noBreadcrumb :organizationPage="false" box>
    <template v-slot:breadcrumb-actions>
      <div class="flex flex1 gap-medium align-center justify-center">
        <router-link :to="sessionListRoute" class="btn secondary">
          <span class="icon back"></span>
          <span class="label">{{
            $t("session.detail_page.back_to_listing")
          }}</span>
        </router-link>

        <!-- title -->
        <SessionStatus
          v-if="sessionLoaded"
          :session="session"
          withText
          class="flex1" />

        <router-link :to="liveRoute" class="btn">
          <span class="icon text"></span>
          <span class="label">{{
            $t("session.detail_page.back_to_live")
          }}</span>
        </router-link>
      </div>
    </template>

    <div class="flex1 medium-padding" v-if="sessionLoaded">
      <h1 class="center-text">{{ name }}</h1>
      <div class="flex">
        <div class="flex1">
          <!-- General informations -->
          <section>
            <h2>
              {{ $t("session.settings_page.global_informations_title") }}
            </h2>
            <FormInput :field="fieldPublicLink">
              <template v-slot:content-after-input>
                <button class="btn" @click="copyPublicLink">
                  <span class="icon apply" v-if="linkHasBeenCopied"></span>
                  <span class="icon copy" v-else></span>
                  <span class="label" v-if="linkHasBeenCopied">{{
                    $t("session.settings_page.copy_link_button_done")
                  }}</span>
                  <span class="label" v-else>{{
                    $t("session.settings_page.copy_link_button")
                  }}</span>
                </button>
              </template>
            </FormInput>
            <FormCheckbox
              :field="fieldIsPublic"
              v-model="fieldIsPublic.value"
              :disabled="isActive"></FormCheckbox>
          </section>

          <!-- Auto start and datetime-->
          <section>
            <h2>{{ $t("session.settings_page.time_informations_title") }}</h2>
            <div v-if="isStarted">
              {{ $t("session.detail_page.session_already_started") }}
            </div>
            <div v-else>
              {{ $t("session.detail_page.session_auto_start_helper") }}
            </div>
            <AppointmentSelector
              :readonly="isStarted"
              :field="fieldAppointment"
              v-bind:error.sync="fieldAppointment.error"
              v-model="fieldAppointment.value" />
            <FormCheckbox
              :field="fieldAutoStop"
              v-model="fieldAutoStop.value"
              :disabled="isStarted"></FormCheckbox>
            <!-- <div class="flex gap-medium align-center medium-margin-top">
            <FormCheckbox
              :field="fieldAutoStart"
              v-model="fieldAutoStart.value"
              :disabled="isStarted"></FormCheckbox>
            
            <div></div>
          </div> -->
          </section>
        </div>
        <div class="flex col gap-medium session-settings-right align-center">
          <div class="flex col gap-medium">
            <!-- <button
            class="btn flex1"
            v-if="isPending"
            @click="startSession"
            :disabled="isStarting">
            <span class="icon play"></span>
            <span class="label">{{
              $t("session.detail_page.start_button")
            }}</span>
          </button> -->

            <!-- Delete and save -->
            <button
              class="btn flex1 red-border flex"
              v-if="isStarted && !isActive"
              @click="stopSession"
              :title="titleButtonDelete"
              :disabled="isStoping">
              <span class="icon stop"></span>
              <span class="label flex1">{{
                $t("session.detail_page.stop_button")
              }}</span>
            </button>
            <!-- Force delete and save -->
            <button
              class="btn flex1 red-border flex"
              v-if="isActive"
              @click="openModalDeleteSession"
              :title="titleButtonDelete"
              :disabled="isStoping">
              <span class="icon stop"></span>
              <span class="label flex1">{{
                $t("session.detail_page.stop_force_button")
              }}</span>
            </button>

            <!-- <button
            class="btn red-border flex1"
            :disabled="isDeleting || isActive"
            :title="titleButtonDelete"
            @click="openModalDeleteSession">
            <span class="icon trash"></span>
            <span class="label">{{
              $t("session.detail_page.delete_button")
            }}</span>
          </button> -->
          </div>
          <!-- it's not a vueJS component, it's a webcomponent. Code is imported in index.html -->

          <qr-code
            :contents="publicLink"
            class="session-settings-qr-code"></qr-code>
        </div>
      </div>

      <!-- Channels list -->
      <section>
        <h2>{{ $t("session.settings_page.channels_list_title") }}</h2>
        <div class="overflow-horizontal-auto">
          <SessionChannelsTable
            v-if="channels.length > 0"
            from="sessionSettings"
            @updateName="updateChannelName"
            :channelsList="localChannels"></SessionChannelsTable>
        </div>
      </section>

      <!-- Save bottom bar -->
      <div
        class="flex gap-medium conversation-create-footer align-center"
        v-if="hasChanged">
        <div class="flex1 small-padding-left">Session has been modified</div>
        <button class="btn secondary" @click="resetSession">
          <span class="label">Reset</span>
        </button>

        <button @click="updateSession" class="btn green">
          <span class="icon apply"></span>
          <span class="label">Sauvegarder</span>
        </button>
      </div>

      <ModalForceDeleteSession
        v-if="showModalDeleteSession"
        @on-close="closeModalDeleteSession"
        @on-confirm="stopSession" />
    </div>
  </MainContent>
</template>
<script>
import { bus } from "../main.js"

import { sessionMixin } from "@/mixins/session.js"

import EMPTY_FIELD from "@/const/emptyField"

import { formsMixin } from "@/mixins/forms.js"

import isSameDateTimeWithoutSeconds from "@/tools/isSameDateTimeWithoutSeconds.js"

import { apiUpdateSession } from "@/api/session.js"

import SessionNotStarted from "@/components/SessionNotStarted.vue"
import LabeledValue from "@/components/LabeledValue.vue"
import FormInput from "@/components/FormInput.vue"
import FormCheckbox from "@/components/FormCheckbox.vue"
import SessionChannelsTable from "@/components/SessionChannelsTable.vue"
import AppointmentSelector from "@/components/AppointmentSelector.vue"
import ModalForceDeleteSession from "@/components/ModalForceDeleteSession.vue"
import MainContent from "@/components/MainContent.vue"
import SessionStatus from "@/components/SessionStatus.vue"

export default {
  mixins: [sessionMixin, formsMixin],
  props: {},
  data() {
    return {
      fields: [
        "name",
        "fieldIsPublic",
        "fieldAppointment",
        "fieldAutoStop",
        "fieldAutoStart",
      ],
      fieldPublicLink: {
        value: null,
        error: null,
        valid: false,
        readOnly: true,
        label: this.$t("session.settings_page.publicLink_label"),
      },
      fieldIsPublic: {
        value: null,
        error: null,
        valid: false,
        label: this.$t("session.settings_page.isPublic_label"),
      },
      fieldAppointment: {
        ...EMPTY_FIELD,
        value: [null, null], // startDateTime, endDateTime
        label: this.$t("session.create_page.appointment_label"),
      },
      fieldAutoStop: {
        value: null, // computed property cannot be used here so fields are initialized in mounted
        error: null,
        valid: false,
        label: this.$t("session.create_page.auto_stop_label"),
      },
      fieldAutoStart: {
        value: null, // computed property cannot be used here so fields are initialized in mounted
        error: null,
        valid: false,
        label: this.$t("session.settings_page.autoStart_label"),
      },
      linkHasBeenCopied: false,
      showModalDeleteSession: false,
      formState: "idle",
      localChannels: [],
      channelsHasChanged: false,
    }
  },
  created() {
    // if not started, redirect to home
  },
  computed: {
    hasChanged() {
      const publicChanged = this.fieldIsPublic.value !== this.isPublic
      const autoStartChanged = this.fieldAutoStart.value !== this.autoStart
      const autoStopChanged = this.fieldAutoStop.value !== this.autoStop
      const startDateChanged = !isSameDateTimeWithoutSeconds(
        new Date(this.fieldAppointment.value[0]),
        new Date(this.startTime),
      )

      const stopDateChanged = !isSameDateTimeWithoutSeconds(
        new Date(this.fieldAppointment.value[1]),
        new Date(this.endTime),
      )

      return (
        publicChanged ||
        autoStartChanged ||
        autoStopChanged ||
        startDateChanged ||
        stopDateChanged ||
        this.channelsHasChanged
      )
    },
    titleButtonDelete() {
      return this.isActive
        ? this.$t("session.detail_page.stop_button_title_session_running")
        : null
    },
  },
  mounted() {},
  watch: {
    sessionLoaded(value) {
      if (value) this.initValues()
    },
    "fieldAppointment.value": {
      handler(value) {
        if (value[1] && value[1] != this.endTime) {
          this.fieldAutoStop.value = true
        }
      },
      deep: true,
    },
  },
  methods: {
    onSessionUpdatePostProcess(newSession) {
      this.initValues()
    },
    initValues() {
      this.fieldAutoStart.value = this.autoStart
      this.fieldAutoStop.value = this.autoStop
      this.fieldPublicLink.value = this.publicLink
      this.fieldIsPublic.value = this.isPublic

      this.fieldAppointment.value = [this.startTime, this.endTime]
      this.localChannels = structuredClone(this.session.channels)
    },
    updateChannelName(index, value) {
      this.localChannels[index].name = value
      this.channelsHasChanged = true
    },
    openModalDeleteSession() {
      this.showModalDeleteSession = true
    },
    closeModalDeleteSession() {
      this.showModalDeleteSession = false
    },
    copyPublicLink() {
      navigator.clipboard.writeText(this.publicLink)
      this.linkHasBeenCopied = true
      setTimeout(() => {
        try {
          this.linkHasBeenCopied = false
        } catch (error) {}
      }, 2000)
    },
    resetSession() {
      this.initValues()
    },
    async updateSession() {
      this.formState = "sending"
      const startDateTime = this.fieldAppointment.value[0]
        ? this.fieldAppointment.value[0].toISOString()
        : null

      const endDateTime = this.fieldAppointment.value[1]
        ? this.fieldAppointment.value[1].toISOString()
        : null

      if (this.testFields()) {
        let newValues = {
          ...this.session,
          scheduleOn: startDateTime,
          endOn: endDateTime,
          autoStart: this.fieldAutoStart.value,
          autoEnd: this.fieldAutoStop.value,
          visibility: this.fieldIsPublic.value ? "public" : "organization",
          channels: this.localChannels,
        }

        const res = await apiUpdateSession(
          this.currentOrganizationScope,
          this.session.id,
          newValues,
        )

        if (res.status == "success") {
          bus.$emit("app_notif", {
            status: "success",
            message: this.$i18n.t("session.settings_page.success_message"),
            redirect: false,
          })
          this.$emit("session_update", res.data)
          this.session = { ...this.session, ...res.data }
        } else {
          bus.$emit("app_notif", {
            status: "error",
            message: this.$i18n.t("session.settings_page.error_update_message"),
            redirect: false,
          })
          this.formState = "error"
        }
      } else {
        this.formState = "error"
      }
    },
  },
  components: {
    MainContent,
    SessionStatus,
    MainContent,
    SessionNotStarted,
    LabeledValue,
    FormInput,
    FormCheckbox,
    SessionChannelsTable,
    AppointmentSelector,
    ModalForceDeleteSession,
  },
}
</script>
