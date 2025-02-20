<template>
  <tr @click="selectUser">
    <td class="fit-content">
      <Checkbox
        class="line-selector"
        v-model="p_selectedUsers"
        :checkboxValue="id"></Checkbox>
    </td>
    <!-- <td>
      <router-link :to="to">{{ id }}</router-link>
    </td> -->
    <td>
      <router-link :to="to">{{ creationDateFormatted }}</router-link>
    </td>
    <td>
      <router-link :to="to">{{ email }}</router-link>
    </td>

    <td>
      <router-link :to="to">{{ firstname }}</router-link>
    </td>
    <td>
      <router-link :to="to">{{ lastname }}</router-link>
    </td>
    <td>
      <router-link :to="to" class="flex flex1 gap-small">
        <span class="flex1">{{ platformRoleName }}</span>
        <span>({{ platformRole }})</span>
      </router-link>
    </td>
    <td class="fit-content">
      <button @click="editUser">
        <span class="icon edit"></span>
        <span class="label">{{ $t("userTable.edit_button_label") }}</span>
      </button>
    </td>
  </tr>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
import router from "../routers/app-router"

import { userModelMixin } from "@/mixins/userModel"
import Checkbox from "./Checkbox.vue"

export default {
  mixins: [userModelMixin],
  props: {
    user: {
      type: Object,
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
  },
  data() {
    return {}
  },
  mounted() {},
  methods: {
    editUser() {
      router.push(this.to)
    },
    selectUser() {
      this.p_selectedUsers = this.p_selectedUsers.includes(this.id)
        ? this.p_selectedUsers.filter((id) => id !== this.id)
        : [...this.p_selectedUsers, this.id]
    },
  },
  computed: {
    to() {
      return {
        ...this.linkTo,
        params: { userId: this.id },
      }
    },
    p_selectedUsers: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit("input", value)
      },
    },
  },
  components: { Fragment, Checkbox },
}
</script>
