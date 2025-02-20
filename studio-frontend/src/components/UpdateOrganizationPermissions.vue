<template>
  <section class="flex col gap-small justify-start align-top">
    <h2>{{ $t("organisation.organization_permissions.title") }}</h2>
    <FormCheckbox
      :field="fieldUploadPermission"
      v-model="fieldUploadPermission.value"></FormCheckbox>

    <FormCheckbox
      :field="fieldSummaryPermission"
      v-model="fieldSummaryPermission.value"></FormCheckbox>

    <FormCheckbox
      :field="fieldSessionPermission"
      v-model="fieldSessionPermission.value"></FormCheckbox>

    <button
      type="submit"
      class="btn green"
      @click="updateOrganization"
      v-if="isAdmin || isSystemAdministrator">
      <span class="icon apply"></span>
      <span class="label">{{
        $t("organisation.organization_permissions.update_button")
      }}</span>
    </button>
  </section>
</template>
<script>
import {
  organizationPermissionsMixin,
  PERMISSIONS,
} from "@/mixins/organizationPermissions"
import { orgaRoleMixin } from "@/mixins/orgaRole.js"
import { platformRoleMixin } from "@/mixins/platformRole.js"

import EMPTY_FIELD from "@/const/emptyField"

import { apiAdminUpdateOrganisation } from "@/api/organisation.js"

import FormRadio from "@/components/FormRadio.vue"
import FormCheckbox from "@/components/FormCheckbox.vue"

export default {
  mixins: [organizationPermissionsMixin, orgaRoleMixin, platformRoleMixin],
  props: {
    currentOrganization: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      fieldUploadPermission: {
        ...EMPTY_FIELD,
        value: this.hasUploadPermission(this.currentOrganization.permissions),
        label: this.$t(
          "organisation.organization_permissions.upload_permission",
        ),
      },
      fieldSummaryPermission: {
        ...EMPTY_FIELD,
        value: this.hasSummaryPermission(this.currentOrganization.permissions),
        label: this.$t(
          "organisation.organization_permissions.summary_permission",
        ),
      },
      fieldSessionPermission: {
        ...EMPTY_FIELD,
        value: this.hasSessionPermission(this.currentOrganization.permissions),
        label: this.$t(
          "organisation.organization_permissions.session_permission",
        ),
      },
      organizationId: this.currentOrganization._id,
    }
  },
  mounted() {},
  methods: {
    async updateOrganization(event) {
      event.preventDefault()
      let payload = {
        permissions: this.computePermissionsNumber({
          upload: this.fieldUploadPermission.value,
          summary: this.fieldSummaryPermission.value,
          session: this.fieldSessionPermission.value,
        }),
      }

      let req = await apiAdminUpdateOrganisation(this.organizationId, payload, {
        timeout: 3000,
        redirect: false,
      })

      if (req.status === "success") {
        //await this.dispatchOrganization()
      }

      return false
    },
  },
  components: {
    FormRadio,
    FormCheckbox,
  },
}
</script>
