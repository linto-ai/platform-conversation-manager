<template>
  <form @submit="updateOrganization">
    <section>
      <h2>{{ $t("organisation.general_settings") }}</h2>
      <!--Organization Name -->
      <FormInput
        v-if="isAdmin || (isSystemAdministrator && isBackofficePage)"
        :field="orgaName"
        v-model="orgaName.value" />
      <labeled-value
        v-else
        class="form-field flex col"
        :label="$t('organisation.name_label')"
        :value="orgaName.value" />
      <FormInput
        v-if="isAdmin || (isSystemAdministrator && isBackofficePage)"
        :field="orgaDescription"
        v-model="orgaDescription.value" />
      <labeled-value
        v-else-if="orgaDescription.value !== ''"
        class="form-field flex col"
        :label="$t('organisation.description_label')"
        :value="orgaDescription.value" />
      <button
        type="submit"
        class="btn green"
        v-if="isAdmin || (isSystemAdministrator && isBackofficePage)">
        <span class="icon apply"></span>
        <span class="label">{{ $t("organisation.update_button") }}</span>
      </button>
    </section>
  </form>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import { formsMixin } from "@/mixins/forms.js"
import { orgaRoleMixin } from "@/mixins/orgaRole.js"
import { platformRoleMixin } from "@/mixins/platformRole.js"

import EMPTY_FIELD from "@/const/emptyField"

import { testName } from "@/tools/fields/testName"
import { testContent } from "@/tools/fields/testContent"

import { apiUpdateOrganisation } from "@/api/organisation.js"

import FormInput from "@/components/FormInput.vue"
import LabeledValue from "@/components/LabeledValue.vue"
export default {
  mixins: [formsMixin, orgaRoleMixin, platformRoleMixin],
  props: {
    currentOrganization: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      fields: ["orgaName", "orgaDescription"],
      orgaName: {
        ...EMPTY_FIELD,
        value: this.currentOrganization.name,
        label: this.$t("organisation.name_label"),
        testField: testName,
      },
      orgaDescription: {
        ...EMPTY_FIELD,
        value: this.currentOrganization.description,
        label: this.$t("organisation.description_label"),
        testField: testContent,
      },
      organizationId: this.currentOrganization._id,
    }
  },
  mounted() {},
  methods: {
    async updateOrganization(event) {
      event.preventDefault()
      if (this.testFields()) {
        let payload = {
          name: this.orgaName.value.trim(),
          description: this.orgaDescription.value,
        }

        let req = await apiUpdateOrganisation(this.organizationId, payload, {
          timeout: 3000,
          redirect: false,
        })

        if (req.status === "success") {
          await this.dispatchOrganization()
        }
      }
      return false
    },
    async dispatchOrganization() {
      bus.$emit("user_orga_update")
    },
  },
  components: { Fragment, FormInput, LabeledValue },
}
</script>
