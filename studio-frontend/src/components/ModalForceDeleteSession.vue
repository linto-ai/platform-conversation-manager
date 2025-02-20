<template>
  <ModalNew
    @on-cancel="() => this.$emit('on-close')"
    @on-confirm="deleteSession"
    :title="title"
    :actionBtnLabel="actionBtnLabel"
    small>
    {{ $t("session.settings_page.force_delete_modal.content") }}
  </ModalNew>
</template>
<script>
import ModalNew from "./ModalNew.vue"
export default {
  props: {},
  data() {
    return {
      title: this.$t("session.settings_page.force_delete_modal.title"),
      actionBtnLabel: this.$t(
        "session.settings_page.force_delete_modal.action",
      ),
    }
  },
  methods: {
    async deleteSession() {
      this.$emit("on-confirm")
    },
  },
  components: { ModalNew },
}
</script>
