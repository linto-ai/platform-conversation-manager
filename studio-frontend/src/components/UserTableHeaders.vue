<template>
  <thead>
    <tr>
      <th class="no-size"></th>
      <!-- <ArrayHeader
        @list_sort_by="sortBy"
        eventLabel="id"
        :label="$t('userTable.header.id')"
        :sortListKey="sortListKey"
        :sortListDirection="sortListDirection" /> -->
      <ArrayHeader
        @list_sort_by="sortBy"
        eventLabel="created"
        :label="$t('userTable.header.creation_date')"
        :sortListKey="sortListKey"
        :sortListDirection="sortListDirection" />
      <ArrayHeader
        @list_sort_by="sortBy"
        eventLabel="email"
        :label="$t('userTable.header.email')"
        :sortListKey="sortListKey"
        :sortListDirection="sortListDirection" />

      <ArrayHeader
        @list_sort_by="sortBy"
        eventLabel="firstname"
        :label="$t('userTable.header.firstname')"
        :sortListKey="sortListKey"
        :sortListDirection="sortListDirection" />
      <ArrayHeader
        @list_sort_by="sortBy"
        eventLabel="lastname"
        :label="$t('userTable.header.lastname')"
        :sortListKey="sortListKey"
        :sortListDirection="sortListDirection" />
      <ArrayHeader
        @list_sort_by="sortBy"
        eventLabel="role"
        :label="$t('userTable.header.platform_role')"
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
