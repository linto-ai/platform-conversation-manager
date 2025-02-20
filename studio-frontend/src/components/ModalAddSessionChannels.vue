<template>
  <ModalNew
    large
    @on-cancel="($event) => this.$emit('on-cancel')"
    @on-confirm="addChannels"
    :title="$t('session.channels_list.modal_add.title')"
    :actionBtnLabel="
      $tc(
        'session.channels_list.modal_add.main_button',
        selectedProfiles.length,
      )
    ">
    <section>
      <h3>{{ $t("session.profile_selector.title") }}</h3>
      <TranscriberProfileSelector
        v-model="selectedProfiles"
        :profilesList="profilesList" />
    </section>
  </ModalNew>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import { apiGetTranscriberProfiles } from "@/api/session.js"

import ModalNew from "./ModalNew.vue"
import TranscriberProfileSelector from "@/components/TranscriberProfileSelector.vue"
import LoadingComponent from "@/components/Loading.vue"
export default {
  props: {
    value: {
      type: Array,
      required: true,
    },
    transcriberProfiles: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      profilesList: this.transcriberProfiles,
      loading: false,
    }
  },
  mounted() {
    //this.fetchProfiles()
  },
  methods: {
    async fetchProfiles() {
      const res = await apiGetTranscriberProfiles()
      this.profilesList = res
      this.loading = false
    },
    addChannels() {
      const newChannels = this.selectedProfiles.map((profile) => {
        return {
          id: profile.id,
          name: profile.config.description,
          type: profile.config.type,
          profileName: profile.config.name,
          profileId: profile.id,
          languages: profile.config.languages.map((l) => l.candidate),
          translations: profile.translations,
          availableTranslations: profile.config.availableTranslations,
          hasDiarization: profile.config.hasDiarization,
          // diarization: profile.config.diarization,
        }
      })
      this.$emit("on-confirm", newChannels)
    },
  },
  computed: {
    selectedProfiles: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit("input", value)
      },
    },
  },
  components: {
    Fragment,
    ModalNew,
    TranscriberProfileSelector,
    LoadingComponent,
  },
}
</script>
