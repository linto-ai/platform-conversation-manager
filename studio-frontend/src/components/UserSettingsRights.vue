<template>
  <section>
    <form @submit="updateRoles">
      <h2 class="small-margin-bottom">
        {{ $t("usersettings.role_section.title") }}
      </h2>

      <div class="flex col gap-small">
        <FormCheckbox
          :disabled="!dataLoaded"
          :field="organization_initiator_field"
          v-model="organization_initiator_field.value" />
        <FormCheckbox
          :disabled="!dataLoaded"
          :field="session_operator_field"
          v-model="session_operator_field.value" />
        <FormCheckbox
          :disabled="!dataLoaded"
          :field="system_administrator_field"
          v-model="system_administrator_field.value" />
        <FormCheckbox
          :disabled="!dataLoaded"
          :field="super_administrator_field"
          v-model="super_administrator_field.value" />
      </div>

      <button type="submit" class="medium-margin-top">
        {{ $t("usersettings.role_section.submit_button") }}
      </button>
    </form>
    <div class="flex col gap-small medium-margin-top">
      <FormCheckbox
        switchDisplay
        :disabled="!dataLoaded"
        :field="suspend_field"
        v-model="suspend_field.value" />
    </div>
  </section>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
import { apiAdminUpdateUser } from "@/api/admin.js"

import Checkbox from "@/components/Checkbox.vue"
import FormCheckbox from "@/components/FormCheckbox.vue"

import { platformRoleMixin } from "@/mixins/platformRole.js"

export default {
  mixins: [platformRoleMixin],
  props: {
    userInfo: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      dataLoaded: false,
      organization_initiator_field: {
        label: this.$t("platform_role.organization_initiator"),
        value: false,
        error: null,
        disabled: false,
      },
      session_operator_field: {
        label: this.$t("platform_role.session_operator"),
        value: false,
        error: null,
        disabled: false,
      },
      system_administrator_field: {
        label: this.$t("platform_role.system_administrator"),
        value: false,
        error: null,
        disabled: false,
      },
      super_administrator_field: {
        label: this.$t("platform_role.super_administrator"),
        value: false,
        error: null,
        disabled: false,
      },
      suspend_field: {
        label: this.$t("platform_role.suspend"),
        value: false,
        error: null,
        disabled: false,
      },
    }
  },
  mounted() {
    this.organization_initiator_field.value = this.roleIsOrganizationInitiator(
      this.userInfo.role,
    )
    this.session_operator_field.value = this.roleIsSessionOperator(
      this.userInfo.role,
    )
    this.system_administrator_field.value = this.roleIsSystemAdministrator(
      this.userInfo.role,
    )
    this.super_administrator_field.value = this.roleIsSuperAdministrator(
      this.userInfo.role,
    )
    this.suspend_field.value = this.userInfo.suspend
    this.dataLoaded = true
  },
  methods: {
    async updateRoles(e) {
      e.preventDefault()
      const role_value = this.computeRoleValue({
        USER: true,
        ORGANIZATION_INITIATOR: this.organization_initiator_field.value,
        SESSION_OPERATOR: this.session_operator_field.value,
        SYSTEM_ADMINISTRATOR: this.system_administrator_field.value,
        SUPER_ADMINISTRATOR: this.super_administrator_field.value,
      })

      let req = await apiAdminUpdateUser(this.userInfo._id, {
        role: role_value,
      })

      if (req.status === "success") {
        bus.$emit("app_notif", {
          status: "success",
          message: this.$t("usersettings.role_section.notif_success"),
        })
      } else {
        bus.$emit("app_notif", {
          status: "error",
          message: this.$t("usersettings.role_section.notif_error"),
        })
      }

      return false
    },
  },
  watch: {
    "super_administrator_field.value"() {
      if (this.super_administrator_field.value) {
        this.system_administrator_field.value = true
        this.system_administrator_field.disabled = true
        this.session_operator_field.value = true
        this.session_operator_field.disabled = true
        this.organization_initiator_field.value = true
        this.organization_initiator_field.disabled = true
      } else {
        this.system_administrator_field.disabled = false
        this.session_operator_field.disabled = false
        this.organization_initiator_field.disabled = false
      }
    },
    async "suspend_field.value"(value) {
      this.suspend_field.disabled = true
      let req = await apiAdminUpdateUser(this.userInfo._id, {
        suspend: value,
      })

      if (req.status === "success") {
        bus.$emit("app_notif", {
          status: "success",
          message: this.$t("usersettings.role_section.notif_success"),
        })
      } else {
        bus.$emit("app_notif", {
          status: "error",
          message: this.$t("usersettings.role_section.notif_error"),
        })
      }
      this.suspend_field.disabled = false
    },
  },
  components: { Fragment, Checkbox, FormCheckbox },
}
</script>
