<template>
  <tr>
    <td class="content-size" v-if="from === 'formCreateSession'">
      <img
        class="icon medium"
        :src="type"
        :alt="alternativeTextForType"
        :title="alternativeTextForType" />
    </td>
    <td><FormInput v-model="nameField.value" :field="nameField" /></td>
    <td v-if="from === 'formCreateSession'">
      {{ profileName }}
    </td>
    <td v-if="from === 'sessionSettings'">
      <SessionChannelsEndpoints :endpoints="endpoints" />
    </td>
    <td v-if="from === 'sessionSettings'">
      <pre>{{ streamStatus }}</pre>
    </td>
    <!-- <td v-if="from === 'sessionSettings'">{{ transcriberStatus }}</td> -->
    <td>{{ languages }}</td>

    <!-- Translations -->
    <td v-if="from === 'formCreateSession'">
      <CustomSelect
        v-if="translationsOptions.channels.length > 0"
        multipleSelection
        v-model="selectedTranslations"
        :options="translationsOptions" />
    </td>
    <td v-else>
      {{ translations }}
    </td>
    <td v-if="from === 'sessionSettings'" class="text-center">
      <Checkbox v-model="item.diarization" />
    </td>
    <td class="content-size" v-if="from === 'formCreateSession'">
      <button class="btn red-border" @click="removeChannel" type="button">
        <span class="icon remove"></span>
        <span class="label">{{ $t("session.channels_list.remove") }}</span>
      </button>
    </td>
  </tr>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import { sessionChannelModelMixin } from "@/mixins/sessionChannelModel.js"

import ArrayHeader from "@/components/ArrayHeader.vue"
import FormInput from "@/components/FormInput.vue"
import EMPTY_FIELD from "@/const/emptyField"
import CustomSelect from "@/components/CustomSelect.vue"

import SessionChannelsEndpoints from "@/components/SessionChannelsEndpoints.vue"
import Checkbox from "@/components/Checkbox.vue"
import transriberImageFromtype from "@/tools/transriberImageFromtype.js"

export default {
  mixins: [sessionChannelModelMixin],
  props: {
    item: {
      type: Object,
      required: true,
    },
    from: {
      type: String,
      default: "formCreateSession", // formCreateSession, sessionSettings
    },
  },
  data() {
    const translations = this.item.availableTranslations || []
    let languageNames = new Intl.DisplayNames([this.$i18n.locale], {
      type: "language",
    })
    return {
      nameField: {
        ...EMPTY_FIELD,
        value: this.item.name || "",
      },
      selectedTranslations: this.item.translations || [],
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
      channelKeyObj: "item",
    }
  },
  computed: {
    type() {
      return transriberImageFromtype(this.channelType)
    },
    alternativeTextForType() {
      return this.channelType || ""
    },
    profileName() {
      return this.channelProfileName || ""
    },
    languages() {
      const langs_array = this.channelLanguages || []
      return langs_array.join(", ")
    },
    translations() {
      const translations_array = this.channelTranslations || []

      if (translations_array.length === 0) {
        return this.$t("session.channels_list.no_translations")
      }
      return translations_array.join(", ")
    },
    // endpoint() {
    //   return this.item.stream_endpoint || ""
    // },
    endpoints() {
      return this.channelStreamEndpoint || {}
    },
    streamStatus() {
      return this.channelStreamStatus || ""
    },
    transcriberStatus() {
      return this.channelTranscriberStatus || ""
    },
  },
  watch: {
    "nameField.value"(value) {
      this.$emit("updateName", value)
    },
    selectedTranslations(value) {
      this.item.translations = value // shallow copy, parent will be updated
    },
  },
  mounted() {},
  methods: {
    removeChannel() {
      this.$emit("removeChannel")
    },
  },
  components: {
    Fragment,
    ArrayHeader,
    FormInput,
    SessionChannelsEndpoints,
    CustomSelect,
    Checkbox,
  },
}
</script>
