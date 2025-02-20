<template>
  <div
    class="form-field flex row gap-small wrap"
    v-if="!loading && serviceList.length > 0">
    <ConversationCreateService
      v-for="(service, index) in serviceList"
      :key="service.host"
      :value="service"
      @select="select(index, $event)"
      :selected="value && service.serviceName == value.serviceName"
      :multiTrack="multiTrack"
      role="listbox" />
  </div>
  <div v-else-if="!loading">
    {{ $t("conversation.transcription_service_list_empty") }}
  </div>
  <div v-else class="flex1 relative" style="min-height: 250px; width: 300px">
    <loading title="Loading service list"></loading>
  </div>
</template>
<script>
import EMPTY_FIELD from "../const/emptyField"
import ConversationCreateService from "@/components/ConversationCreateService.vue"
import Loading from "@/components/Loading.vue"

export default {
  props: {
    serviceList: {
      type: Array,
      required: true,
    },
    value: {
      required: false,
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
    multiTrack: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  methods: {
    select(index, value) {
      if (this.disabled) return
      this.indexSelected = index
      this.$emit("input", value)
    },
  },
  data() {
    return {
      diarization: { ...EMPTY_FIELD },
      punctuation: { ...EMPTY_FIELD },
      indexSelected: -1,
    }
  },
  components: {
    ConversationCreateService,
    Loading,
  },
}
</script>
