<template>
  <ModalNew
    @on-cancel="() => this.$emit('on-close')"
    @on-confirm="deleteUsers"
    :title="title"
    :actionBtnLabel="actionBtnLabel"
    :customClassButton="{ red: true }"
    small>
    {{ $tc("modal_delete_users.content", selectedUsers.length) }}
  </ModalNew>
</template>
<script>
import { apiDeleteMultipleUsers } from "@/api/admin.js"

import ModalNew from "@/components/ModalNew.vue"
import { bus } from "../main"

export default {
  props: {
    selectedUsers: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      title: this.$tc("modal_delete_users.title", this.selectedUsers.length),
      actionBtnLabel: this.$tc(
        "modal_delete_users.action_btn",
        this.selectedUsers.length,
      ),
    }
  },
  methods: {
    async deleteUsers() {
      let req = await apiDeleteMultipleUsers(this.selectedUsers)

      if (req.status === "success") {
        this.$emit("on-confirm")
      } else {
        bus.$emit("app_notif", {
          status: "error",
          message: this.$tc(
            "modal_delete_users.error",
            this.selectedUsers.length,
          ),
        })
        this.$emit("on-close")
      }
    },
  },
  components: { ModalNew },
}
</script>
