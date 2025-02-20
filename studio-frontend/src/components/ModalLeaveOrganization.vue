<template>
  <ModalNew
    @on-cancel="($event) => this.$emit('on-cancel')"
    @on-confirm="deleteOrganization"
    :title="$t('organisation.leave_modal.title')"
    :actionBtnLabel="$t('organisation.leave_modal.action')"
    :custom-class-button="{ red: true }"
    small>
    <p>
      {{
        $t("organisation.leave_modal.content", {
          name: currentOrganization.name,
        })
      }}
    </p>
  </ModalNew>
</template>
<script>
import { Fragment } from "vue-fragment"

import { bus } from "../main.js"
import { apiLeaveOrganisation } from "@/api/organisation.js"

import ModalNew from "./ModalNew.vue"
export default {
  props: {
    currentOrganization: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {}
  },
  mounted() {},
  methods: {
    async deleteOrganization() {
      const res = await apiLeaveOrganisation(this.currentOrganization._id)
      this.$emit("on-confirm", res)
    },
  },
  components: { Fragment, ModalNew },
}
</script>
