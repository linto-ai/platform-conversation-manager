<template>
  <ModalNew
    @on-cancel="($event) => this.$emit('on-cancel')"
    @on-confirm="createOrganisation"
    small
    :actionBtnLabel="$t('modal_create_organization.action_btn')"
    :title="$t('modal_create_organization.title')">
    <FormInput
      v-model="orgaName.value"
      :field="orgaName"
      inputId="organisation-name"
      required />
  </ModalNew>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
import EMPTY_FIELD from "@/const/emptyField"
import { testFieldEmpty } from "@/tools/fields/testEmpty.js"
import { formsMixin } from "@/mixins/forms.js"

import FormInput from "../components/FormInput.vue"
import { apiCreateOrganisation } from "../api/organisation"
import ModalNew from "./ModalNew.vue"

export default {
  mixins: [formsMixin],
  props: {},
  data() {
    return {
      fields: ["orgaName"],
      orgaName: {
        ...EMPTY_FIELD,
        value: "",
        testField: testFieldEmpty,
        autocomplete: "off",
        label: this.$t("modal_create_organization.label_name"),
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
          this.$emit("on-confirm", res)
          this.state = "idle"
        }
      }
    },
  },
  components: { Fragment, FormInput, ModalNew },
}
</script>
