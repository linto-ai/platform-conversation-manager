<template>
  <MainContent sidebar box>
    <OrganizationUpdateHelper
      :showHelper="helperVisible"
      @close="closeHelper()"></OrganizationUpdateHelper>

    <template v-slot:breadcrumb-actions>
      <div class="flex gap-medium">
        <button
          v-if="isAdmin"
          @click="deleteOrganization()"
          class="btn red-border">
          <span class="icon trash"></span>
          <span class="label">{{
            $t("organisation.delete_organization")
          }}</span>
        </button>
        <button class="btn" @click="showHelper()" style="min-width: 80px">
          <span class="icon help"></span>
          <span class="label">{{
            $t("conversation.transcription_help.help_button_label")
          }}</span>
        </button>
      </div>
    </template>

    <UpdateOrganizationForm :currentOrganization="currentOrganization" />

    <UpdateOrganizationUsers
      :currentOrganization="currentOrganization"
      :userInfo="userInfo" />

    <ModalDeleteOrganization
      v-if="displayDeleteModal"
      :currentOrganization="currentOrganization"
      :currentOrganizationScope="currentOrganizationScope"
      @on-confirm="closeDeleteModal"
      @on-cancel="closeDeleteModal" />

    <Modal />
  </MainContent>
</template>
<script>
import { bus } from "../main.js"

import { orgaRoleMixin } from "@/mixins/orgaRole.js"

import { setCookie } from "@/tools/setCookie"

import OrganizationUpdateHelper from "@/components/OrganizationUpdateHelper.vue"
import ModalDeleteOrganization from "@/components/ModalDeleteOrganization.vue"
import MainContent from "@/components/MainContent.vue"
import Modal from "@/components/Modal.vue"
import UpdateOrganizationForm from "@/components/UpdateOrganizationForm.vue"
import UpdateOrganizationUsers from "../components/UpdateOrganizationUsers.vue"

export default {
  mixins: [orgaRoleMixin],
  props: {
    userInfo: {
      type: Object,
      required: true,
    },
    currentOrganization: {
      type: Object,
      required: true,
    },
    currentOrganizationScope: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      helperVisible: false,
      displayDeleteModal: false,
    }
  },
  computed: {},
  async mounted() {
    bus.$on("remove_organization_user", async (data) => {
      await this.dispatchOrganization()
      this.removeFromMembers(data.userId)
    }) // event from the modal component, TODO: use new modal component instead
  },
  beforeDestroy() {
    bus.$off("remove_organization_user")
  },
  methods: {
    showHelper() {
      this.helperVisible = true
    },
    closeHelper() {
      this.helperVisible = false
    },
    async deleteOrganization() {
      this.displayDeleteModal = true
    },
    closeDeleteModal(apiRes) {
      if (apiRes) {
        if (apiRes.status === "success") {
          setCookie("cm_orga_scope", "")
          window.location.href = "/"
        } else {
          bus.$emit("app_notif", {
            status: "error",
            message: this.$i18n.t("organisation.delete_error_message"),
          })
        }
      }
      this.displayDeleteModal = false
    },
  },
  components: {
    OrganizationUpdateHelper,
    ModalDeleteOrganization,
    MainContent,
    Modal,
    UpdateOrganizationForm,
    UpdateOrganizationUsers,
  },
}
</script>
