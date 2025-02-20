<template>
  <form @submit="updateOrganization">
    <section>
      <h2>{{ $t("organisation.matching_users.title") }}</h2>

      <FormInput :field="matchingMail" v-model="matchingMail.value" />

      <div class="flex gap-small wrap">
        <button type="submit" class="btn green">
          <span class="icon apply"></span>
          <span class="label">{{
            $t("organisation.matching_users.update_button")
          }}</span>
        </button>

        <button type="button" class="btn call-to-action" @click="applyMatch">
          <span class="icon plus"></span>
          <span class="label">{{
            $t("organisation.matching_users.apply_button")
          }}</span>
        </button>
      </div>
    </section>
  </form>
</template>
<script>
import { bus } from "@/main.js"

import { formsMixin } from "@/mixins/forms.js"
import { orgaRoleMixin } from "@/mixins/orgaRole.js"
import { platformRoleMixin } from "@/mixins/platformRole.js"

import { testMatchingEmail } from "@/tools/fields/testMatchingEmail"
import EMPTY_FIELD from "@/const/emptyField"
import {
  apiAdminUpdateOrganisation,
  apiInviteUsersMachingEmail,
} from "@/api/organisation.js"

import FormInput from "@/components/FormInput.vue"

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
      fields: ["matchingMail"],
      matchingMail: {
        ...EMPTY_FIELD,
        value: this.currentOrganization.matchingMail ?? "",
        label: this.$t("organisation.matching_users.matching_mail.label"),
        testField: testMatchingEmail,
      },
      organizationId: this.currentOrganization._id,
    }
  },
  mounted() {},
  methods: {
    async updateOrganization(event) {
      event.preventDefault()
      if (await this.updateOrganizationRequest()) {
        await this.dispatchOrganization()
      }
      return false // send false to not trigger page reload
    },
    async updateOrganizationRequest() {
      if (this.testFields()) {
        let payload = {
          matchingMail: this.matchingMail.value.trim(),
        }

        let req = await apiAdminUpdateOrganisation(
          this.organizationId,
          payload,
          {
            timeout: 3000,
            redirect: false,
          },
        )

        if (req.status === "success") {
          return true //send true because request success
        }
      }
      return false // send false because request failed
    },
    async applyMatch(event) {
      event.preventDefault()

      if (await this.updateOrganizationRequest()) {
        let req = await apiInviteUsersMachingEmail(this.organizationId, {
          timeout: 3000,
          redirect: false,
        })
        if (req.status === "success") {
          await this.dispatchOrganization()
        }
      }
    },
    async dispatchOrganization() {
      bus.$emit("user_orga_update")
    },
  },
  components: {
    FormInput,
  },
}
</script>
