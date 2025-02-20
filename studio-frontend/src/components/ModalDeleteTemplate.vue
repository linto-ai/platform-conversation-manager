<template>
  <ModalNew
    @on-cancel="($event) => this.$emit('on-cancel')"
    @on-confirm="deleteTemplate"
    :title="
      $t('session.create_page.delete_template_modal.title', {
        name: template.name,
      })
    "
    :actionBtnLabel="$t('session.create_page.delete_template_modal.action')"
    small>
    <div class="form-field flex col">
      {{ $t("session.create_page.delete_template_modal.description") }}
    </div>
  </ModalNew>
</template>
<script>
import { bus } from "../main.js"

import { formsMixin } from "@/mixins/forms.js"
import { apiDeleteSessionTemplate } from "@/api/session.js"
import ModalNew from "./ModalNew.vue"
export default {
  mixins: [formsMixin],
  props: {
    template: {
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
      conversationNumber: 0,
    }
  },
  mounted() {},
  methods: {
    async deleteTemplate() {
      const res = await apiDeleteSessionTemplate(
        this.currentOrganizationScope,
        this.template.id,
      )

      if (res.status == "success") {
        bus.$emit("app_notif", {
          status: "success",
          message: this.$i18n.t(
            "session.create_page.delete_template_modal.success",
          ),
          redirect: false,
        })
        this.$emit("on-confirm", res)
      } else {
        bus.$emit("app_notif", {
          status: "error",
          message: this.$i18n.t(
            "session.create_page.delete_template_modal.error",
          ),
          timeout: null,
        })
      }
    },
  },
  components: { ModalNew },
}
</script>
