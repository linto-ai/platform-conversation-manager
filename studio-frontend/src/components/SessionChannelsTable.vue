<template>
  <table style="width: 100%">
    <thead>
      <tr>
        <ArrayHeader
          v-if="from === 'formCreateSession'"
          @list_sort_by="sortBy"
          eventLabel="type"
          :label="$t('session.channels_list.labels.type')"
          :sortListKey="sortListKey"
          :sortListDirection="sortListDirection" />
        <ArrayHeader
          @list_sort_by="sortBy"
          eventLabel="name"
          :label="$t('session.channels_list.labels.name')"
          :sortListKey="sortListKey"
          :sortListDirection="sortListDirection" />
        <ArrayHeader
          v-if="from === 'formCreateSession'"
          @list_sort_by="sortBy"
          eventLabel="profileName"
          :label="$t('session.channels_list.labels.profile_name')"
          :sortListKey="sortListKey"
          :sortListDirection="sortListDirection" />
        <ArrayHeader
          v-if="from === 'sessionSettings'"
          @list_sort_by="sortBy"
          eventLabel="endpoint"
          :label="$t('session.channels_list.labels.endpoint')"
          :sortListKey="sortListKey"
          :sortListDirection="sortListDirection" />
        <ArrayHeader
          v-if="from === 'sessionSettings'"
          @list_sort_by="sortBy"
          eventLabel="stream_status"
          :label="$t('session.channels_list.labels.stream_status')"
          :sortListKey="sortListKey"
          :sortListDirection="sortListDirection" />
        <!-- <ArrayHeader
          v-if="from === 'sessionSettings'"
          @list_sort_by="sortBy"
          eventLabel="stream_status"
          :label="$t('session.channels_list.labels.transcriber_status')"
          :sortListKey="sortListKey"
          :sortListDirection="sortListDirection" /> -->
        <ArrayHeader
          @list_sort_by="sortBy"
          eventLabel="language"
          :label="$t('session.channels_list.labels.language')"
          :sortListKey="sortListKey"
          :sortListDirection="sortListDirection" />

        <ArrayHeader
          @list_sort_by="sortBy"
          eventLabel="translations"
          :label="$t('session.channels_list.labels.translations')"
          :sortListKey="sortListKey"
          :sortListDirection="sortListDirection" />

        <!-- diarization -->
        <th class="no-size" v-if="from === 'sessionSettings'">
          <span
            class="icon diarization large"
            :title="$t('session.channels_list.labels.diarization')"></span>
        </th>
        <!-- remove button -->
        <th v-if="from === 'formCreateSession'"></th>

        <!-- <ArrayHeader
          class="no-size"
          @list_sort_by="sortBy"
          eventLabel="translations"
          :label="$t('session.channels_list.labels.diarization')"
          :sortListDirection="sortListDirection"
          :sortListKey="sortListKey" /> -->
      </tr>
    </thead>
    <tbody>
      <SessionChannelsLine
        v-for="(channel, index) in channelsList"
        @removeChannel="removeChannel(index)"
        @updateName="updateName(index, $event)"
        :key="channel.id"
        :from="from"
        :item="channel" />
    </tbody>
  </table>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
import ArrayHeader from "@/components/ArrayHeader.vue"
import SessionChannelsLine from "@/components/SessionChannelsLine.vue"
export default {
  props: {
    channelsList: {
      type: Array,
      required: true,
    },
    // An improvement would be to pass an array for each column the parent want to display,
    // but for now we will keep it simple (there is only two cases for now)
    from: {
      type: String,
      default: "formCreateSession", // formCreateSession, sessionSettings
    },
  },
  data() {
    return {
      sortListKey: "name",
      sortListDirection: "asc",
    }
  },
  mounted() {},
  methods: {
    sortBy(key) {
      // not implemented yet
    },
    removeChannel(index) {
      this.$emit("removeChannel", index)
    },
    updateName(index, value) {
      this.$emit("updateName", index, value)
    },
  },
  components: { Fragment, ArrayHeader, SessionChannelsLine },
}
</script>
