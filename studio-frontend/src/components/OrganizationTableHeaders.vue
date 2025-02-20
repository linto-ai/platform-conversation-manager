<template>
  <thead>
    <tr>
      <th class="no-size"></th>
      <ArrayHeader
        @list_sort_by="sortBy"
        eventLabel="created"
        :label="$t('orgaTable.header.creation_date')"
        :sortListKey="sortListKey"
        :sortListDirection="sortListDirection" />
      <ArrayHeader
        @list_sort_by="sortBy"
        eventLabel="name"
        :label="$t('orgaTable.header.name')"
        :sortListKey="sortListKey"
        :sortListDirection="sortListDirection" />
      <ArrayHeader
        @list_sort_by="sortBy"
        eventLabel="userNumber"
        :label="$t('orgaTable.header.userNumber')"
        :sortListKey="sortListKey"
        :sortListDirection="sortListDirection" />
      <th class="no-size"></th>
    </tr>
  </thead>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import ArrayHeader from "@/components/ArrayHeader.vue"
export default {
  props: {
    sortListKey: {
      type: String,
      required: true,
    },
    sortListDirection: {
      type: String,
      required: true,
    },
  },
  data() {
    return {}
  },
  mounted() {},
  methods: {
    sortBy(event) {
      this.$emit("list_sort_by", event)
    },
  },
  components: { Fragment, ArrayHeader },
}
</script>
