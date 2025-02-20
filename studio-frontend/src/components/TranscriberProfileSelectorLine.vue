<template>
  <tr @click="onClickLine">
    <td class="content-size">
      <Checkbox
        v-if="multiple"
        class="line-selector"
        :checkboxValue="id_profile"
        v-model="selectedProfiles" />
      <Radio
        v-else
        class="line-selector"
        :radioValue="id_profile"
        v-model="selectedProfiles"
        name="select-profile" />
    </td>
    <td class="content-size center-text">
      <img
        class="icon medium"
        :src="type"
        :alt="alternativeTextForType"
        :title="alternativeTextForType" />
    </td>
    <td>{{ name }}</td>
    <td>{{ description }}</td>
    <td>{{ languages }}</td>
    <td>
      <CustomSelect
        v-if="translationsOptions.channels.length > 0"
        multipleSelection
        v-model="selectedTranslations"
        :options="translationsOptions" />
      <div v-else class="btn placeholder transparent">
        {{ $t("session.profile_selector.translation_not_available") }}
      </div>
    </td>
    <!-- <td class="center-text" @click="preventClick">
      <SwitchInput
        v-if="profile.config.hasDiarization"
        v-model="profile.config.diarization"
        :id="`${profile.id}-diarization`" />

      <div v-else>
        {{ $t("session.profile_selector.diarization_not_available") }}
      </div>
    </td> -->
  </tr>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import ArrayHeader from "@/components/ArrayHeader.vue"
import CustomSelect from "@/components/CustomSelect.vue"
import Checkbox from "@/components/Checkbox.vue"
import SwitchInput from "@/components/SwitchInput.vue"
import Radio from "./Radio.vue"
import transriberImageFromtype from "@/tools/transriberImageFromtype.js"

export default {
  props: {
    profile: {
      type: Object,
      required: true,
    },
    value: {
      type: [Array, Object],
      required: false,
    },
    profilesList: {
      type: Array,
      required: true,
    },
    multiple: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    const translations = this.profile?.config?.availableTranslations || []
    let languageNames = new Intl.DisplayNames([this.$i18n.locale], {
      type: "language",
    })
    return {
      selectedTranslations: [],
      id_profile: this.profile.id,
      translationsOptions: {
        channels: translations
          .map((translation) => {
            return {
              value: translation,
              text: languageNames.of(translation),
            }
          })
          .sort((t1, t2) => t1.text.localeCompare(t2.text)),
      },
    }
  },
  watch: {
    selectedTranslations: {
      handler(value) {
        this.selectProfile()
        // it uses shallow copy so profile from parent is updated (it's an optimisation feature instead of emiting update event...)
        // maybe use https://v2.vuejs.org/v2/guide/components-custom-events.html#sync-Modifier instead ?
        this.profile.translations = value
      },
      deep: true,
    },
  },
  computed: {
    selectedProfiles: {
      get() {
        if (this.multiple) {
          const list =
            this.value.map((profile) => {
              return profile.id
            }) || []
          return list
        } else {
          return this.value ? this.value.id : null
        }
      },
      set(value) {
        if (this.multiple) {
          const list = value.map((id) =>
            this.profilesList.find((p) => p.id === id),
          )
          this.$emit("input", list)
        } else {
          this.$emit(
            "input",
            value ? this.profilesList.find((p) => p.id === value) : null,
          )
        }
      },
    },
    sortListKey() {
      return "profileSelector"
    },
    name() {
      return this.profile.config.name || ""
    },
    description() {
      return this.profile.config.description || ""
    },
    type() {
      return transriberImageFromtype(this.profile.config.type)
    },
    alternativeTextForType() {
      return this.profile.config.type || ""
    },
    languages() {
      const langs_str = this.profile.config.languages.map(
        (lang) => lang.candidate,
      )
      return langs_str.join(", ")
    },
  },
  methods: {
    preventClick(e) {
      e.stopPropagation()
    },
    selectProfile(e) {
      if (e && e.target.classList.contains("no-propagation")) return
      // do same as checkbox
      if (this.multiple) {
        if (this.selectedProfiles.includes(this.id_profile)) {
          return
        }

        this.selectedProfiles = [...this.selectedProfiles, this.id_profile]
      } else {
        this.selectedProfiles = this.id_profile
      }
    },
    unSelectProfile(e) {
      if (e && e.target.classList.contains("no-propagation")) return
      // do same as checkbox
      if (!this.selectedProfiles.includes(this.id_profile)) {
        return
      }

      this.selectedProfiles = this.selectedProfiles.filter(
        (profile_id) => profile_id !== this.id_profile,
      )
    },
    onClickLine(e) {
      if (e && e.target.classList.contains("no-propagation")) return

      if (this.multiple) {
        this.selectedProfiles.includes(this.id_profile)
          ? this.unSelectProfile(e)
          : this.selectProfile(e)
      } else {
        this.selectedProfiles = this.id_profile
      }
    },
  },
  components: {
    Fragment,
    ArrayHeader,
    CustomSelect,
    Checkbox,
    CustomSelect,
    SwitchInput,
    Radio,
  },
}
</script>
