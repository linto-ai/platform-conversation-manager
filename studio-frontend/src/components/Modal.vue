<template>
  <div class="modal-wrapper flex col" :class="modalShow ? 'visible' : 'hidden'">
    <div class="modal">
      <div class="modal-header flex row align-center">
        <span class="title flex1">{{ title }}</span>
        <button class="btn" @click="close()">
          <span class="icon close"></span>
        </button>
      </div>
      <div class="modal-body flex col">
        {{ content }}
      </div>
      <div class="modal-footer flex row gap-small">
        <button class="btn secondary" @click="close()" v-if="cancelButton">
          <span class="label">{{ $t("modal.cancel") }}</span>
        </button>
        <button class="btn green" @click="exec(actionName)">
          <span class="label">{{ actionBtnLabel }}</span>
          <span class="icon apply"></span>
        </button>
      </div>
    </div>
  </div>
</template>
<script>
import {
  apiDeleteConversation,
  apiDeleteMultipleConversation,
} from "../api/conversation.js"
import {
  apiDeleteOrganisation,
  apiLeaveOrganisation,
} from "../api/organisation.js"
import { apiRemoveUserFromOrganisation } from "../api/user.js"
import { bus } from "../main.js"

// Outdated component, use ModalNew instead and put the logic outside of the modal.
// See Modal**.vue components for examples.

export default {
  data() {
    return {
      modalShow: false,
      title: "",
      content: "",
      actionBtnLabel: "",
      actionName: "",
      modalData: "",
      cancelButton: true,
    }
  },
  mounted() {
    bus.$on("show_modal", (data) => {
      this.modalData = data
      this.title = data.title
      this.content = data.content
      this.actionBtnLabel = data.actionBtnLabel
      this.actionName = data.actionName
      this.cancelButton = data.cancelButton ?? true
      this.show()
    })
  },
  beforeDestroy() {
    bus.$off("show_modal")
  },
  methods: {
    show() {
      this.modalShow = true
    },
    close() {
      this.$emit("close")
      this.modalShow = false
    },
    async exec(actionName) {
      switch (actionName) {
        case "leave_organization":
          await this.leaveOrganization()
          break
        case "remove_user_from_organization":
          await this.removeUserFromOrganization()
          break
        case "unshare_user_conversation":
          await this.unshareUserConversation()
          break
        case "delete_conversation":
          await this.deleteConversation()
          break
        case "delete_multiple_conversation":
          await this.deleteMutipleConversation()
          break
        case "delete_organization":
          await this.deleteOrganization()
          break
        default:
          this.$emit("apply")
          this.modalShow = false
          break
      }
    },
    // TODO: put this logic outside of the modal
    unshareUserConversation() {
      bus.$emit("confirm_unshare_user_conversation", {
        user: this.modalData.user,
      })
      this.close()
    },
    async leaveOrganization() {
      let req = await apiLeaveOrganisation(this.modalData.organization._id, {
        timeout: 0,
        redirect: "organizations list",
      })

      if (req?.status === "success") {
        this.close()
      }
    },
    async deleteOrganization() {
      let req = await apiDeleteOrganisation(this.modalData.organizationId, {
        timeout: 3000,
        redirect: "conversations",
      })

      if (req?.status === "success") {
        await this.$store.getters.getCurrentOrganizationScope()
        bus.$emit("user_orga_update", {})
        this.close()
      }
    },
    async removeUserFromOrganization() {
      let req = await apiRemoveUserFromOrganisation(
        this.modalData.organizationId,
        this.modalData.user._id,
        { timeout: 3000, redirect: false },
      )

      if (req?.status === "success") {
        bus.$emit("remove_organization_user", {
          userId: this.modalData.user._id,
        })
        this.close()
      }
    },
    async deleteConversation() {
      let req = await apiDeleteConversation(this.modalData.conversation._id, {
        redirect: "conversations",
        message: this.$i18n.tc("conversation.delete_success_message", 1),
      })

      if (req?.status === "success") {
        this.close()
      }
    },
    async deleteMutipleConversation() {},
    // TODO: delete this 3 functions ?
    async dispatchUserOrganizations() {
      await this.$options.filters.dispatchStore("getUserOrganizations")
    },
    async dispatchUserRights() {
      this.userRightsLoaded =
        await this.$options.filters.dispatchStore("getUserRights")
    },
  },
}
</script>
