<template>
  <section>
    <h2>{{ $t("conversation_overview.rights.title") }}</h2>
    <div class="form-field flex col">
      <label class="form-label">
        {{ $t("conversation_overview.rights.owner_label") }}
      </label>
      <div class="flex align-center gap-medium">
        <img :src="convOwner.img" class="list-profil-picture" />
        <span>{{ convOwner.fullName }}</span>
      </div>
    </div>
    <div class="flex gap-medium align-end">
      <div class="form-field flex col">
        <label class="form-label">
          {{ $t("conversation_overview.rights.orga_right_label") }}
        </label>

        <select v-model="membersRight.value">
          <option
            v-for="uright in membersRight.list"
            :key="uright.value"
            :value="uright.value">
            {{ uright.txt }}
          </option>
        </select>
      </div>

      <div class="form-field flex col">
        <ConversationShareMultiple
          :currentOrganizationScope="currentOrganizationScope"
          :userInfo="userInfo"
          :selectedConversations="selectedConversations" />
      </div>

      <div></div>
    </div>
  </section>
</template>
<script>
import { bus } from "@/main.js"
import { userName } from "@/tools/userName"
import RIGHTS_LIST from "@/const/rigthsList"
import EMPTY_FIELD from "@/const/emptyField"
import { apiUpdateConversation } from "@/api/conversation"

import ConversationShareMultiple from "@/components/ConversationShareMultiple.vue"

export default {
  props: {
    conversation: {
      type: Object,
      required: true,
    },
    currentOrganizationScope: { type: String, required: true },
    userInfo: { type: Object, required: true },
  },
  data() {
    return {
      membersRight: {
        ...EMPTY_FIELD,
        value: this.conversation.organization.membersRight,
        list: RIGHTS_LIST((key) => this.$i18n.t(key)),
      },
    }
  },
  computed: {
    convOwner() {
      const userList = this.$store.state?.currentOrganization?.users ?? []
      const owner = userList.find((u) => u._id == this.conversation.owner)
      if (owner) {
        return {
          fullName: userName(owner),
          img: process.env.VUE_APP_PUBLIC_MEDIA + "/" + owner.img,
        }
      } else {
        return {
          fullName: "Private user",
          img: process.env.VUE_APP_PUBLIC_MEDIA + "/pictures/default.jpg",
        }
      }
    },
    selectedConversations() {
      const selectedConversations = new Map()
      selectedConversations.set(this.conversation._id, this.conversation)
      return selectedConversations
    },
  },
  watch: {
    "membersRight.value"(newValue) {
      this.updateOrgaRights(newValue)
    },
  },
  mounted() {},
  methods: {
    async updateOrgaRights(newRight) {
      const res = await apiUpdateConversation(this.conversation._id, {
        "organization.membersRight": newRight,
      })

      if (res.status === "error") {
        bus.$emit("app_notif", {
          status: "error",
          message: this.$i18n.t(
            "conversation_overview.rights.orga_right_update_error",
          ),
          redirect: false,
        })
      } else {
        bus.$emit("app_notif", {
          status: "success",
          message: this.$i18n.t(
            "conversation_overview.rights.orga_right_update_success",
          ),
          redirect: false,
        })
      }
    },
  },
  components: {
    ConversationShareMultiple,
  },
}
</script>
