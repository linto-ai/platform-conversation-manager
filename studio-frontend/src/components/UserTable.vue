<template>
  <table
    class="table-grid"
    style="grid-template-columns: auto 1fr 1fr 1fr 1fr 1fr auto; width: 100%">
    <UserTableHeaders
      @list_sort_by="sortBy"
      :sortListKey="sortListKey"
      :sortListDirection="sortListDirection" />
    <tbody>
      <div class="table-loader" v-if="loading">
        <Loading />
      </div>
      <UserTableLine
        v-for="user in users"
        :key="user.id"
        :user="user"
        v-model="p_selectedUsers"
        :linkTo="linkTo" />
    </tbody>
  </table>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import UserTableHeaders from "@/components/UserTableHeaders.vue"
import UserTableLine from "@/components/UserTableLine.vue"
import Loading from "./Loading.vue"

export default {
  props: {
    users: {
      type: Array,
      required: true,
    },
    linkTo: {
      type: Object,
      required: false,
    },
    value: {
      //selectedUsers
      type: Array,
      required: true,
    },
    sortListKey: {
      type: String,
      required: true,
    },
    sortListDirection: {
      type: String,
      required: true,
    },
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  mounted() {},
  methods: {
    sortBy(key) {
      this.$emit("list_sort_by", key)
    },
  },
  computed: {
    p_selectedUsers: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit("input", value)
      },
    },
  },
  components: { Fragment, UserTableHeaders, UserTableLine, Loading },
}
</script>
