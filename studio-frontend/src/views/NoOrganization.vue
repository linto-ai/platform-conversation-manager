<template>
  <div class="login-form-container flex col">
    <form
      id="app-login"
      class="flex col"
      @submit="createOrganisation"
      v-if="isAtLeastOrganizationInitiator">
      <h2>{{ $t("no_orga.can_create.title") }}</h2>
      <p>{{ $t("no_orga.can_create.subtitle") }}</p>
      <FormInput
        v-model="orgaName.value"
        :field="orgaName"
        inputId="organisation-name"
        required />
      <button type="submit" class="btn green" v-if="state !== 'sending'">
        <span class="label"> {{ $t("no_orga.can_create.create") }} </span>
        <span class="icon apply"></span>
      </button>

      <button type="submit" class="btn green" disabled v-else>
        <span class="label"> {{ $t("no_orga.can_create.creating") }} </span>
        <span class="icon loading"></span>
      </button>
    </form>

    <div id="app-login" v-else>
      <h2 class="">{{ $t("no_orga.cannot_create.title") }}</h2>
      <p>{{ $t("no_orga.cannot_create.subtitle_line_one") }}</p>
      <p>{{ $t("no_orga.cannot_create.subtitle_line_two") }}</p>
    </div>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
import EMPTY_FIELD from "@/const/emptyField"
import { testFieldEmpty } from "@/tools/fields/testEmpty.js"

import { platformRoleMixin } from "@/mixins/platformRole.js"
import { formsMixin } from "@/mixins/forms.js"

import FormInput from "@/components/FormInput.vue"
import { apiCreateOrganisation } from "@/api/organisation"

export default {
  mixins: [formsMixin, platformRoleMixin],
  props: {},
  data() {
    return {
      fields: ["orgaName"],
      orgaName: {
        ...EMPTY_FIELD,
        value: "",
        testField: testFieldEmpty,
        autocomplete: "off",
        label: this.$t("no_orga.label"),
      },
      state: "idle",
    }
  },
  mounted() {},
  methods: {
    async createOrganisation(event) {
      event?.preventDefault()
      if (this.testFields()) {
        this.state = "sending"
        let res = await apiCreateOrganisation({ name: this.orgaName.value })
        if (res.status == "error") {
          this.orgaName.error = "Name already exist"
          this.state = "idle"
        } else {
          window.location.href = "/"
        }
      }
    },
  },
  components: { Fragment, FormInput, platformRoleMixin },
}
</script>
