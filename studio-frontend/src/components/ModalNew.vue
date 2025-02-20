<template>
  <div class="modal-wrapper flex col visible">
    <component
      aria-modal="true"
      aria-labelledby="modal-title"
      class="modal flex col"
      :is="modalComponentType"
      :class="{
        'modal--small': small,
        'modal--large': large,
        'modal--full-height': fullHeight,
        [customModalClass]: true,
      }"
      v-click-outside="close">
      <div class="modal-header flex row align-center">
        <span class="title flex1" id="modal-title">{{ title }}</span>
        <button class="btn transparent" @click="close()" type="button">
          <span class="icon close" :title="$t('modal.close_title')"></span>
        </button>
      </div>
      <div class="modal-body flex col flex1">
        <slot></slot>
      </div>
      <div class="modal-footer flex row gap-small">
        <button
          class="btn secondary"
          @click="close()"
          v-if="cancelButton"
          type="button">
          <span class="label">{{ $t("modal.cancel") }}</span>
        </button>
        <button
          :class="customClass"
          @click="apply"
          v-if="!noApply"
          type="submit">
          <span class="icon apply"></span>
          <span class="label">{{ actionBtnLabel }}</span>
        </button>
      </div>
    </component>
  </div>
</template>
<script>
// TODO:
// - use https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
// - when isForm is true, set the modal as a form tag so button are submit buttons instead of regular buttons (with https://v2.vuejs.org/v2/guide/components#Dynamic-Components ?)
export default {
  props: {
    title: { type: String, required: true },
    actionBtnLabel: { type: String, required: true },
    cancelButton: { type: Boolean, default: true },
    small: { type: Boolean, default: false },
    large: { type: Boolean, default: false },
    fullHeight: { type: Boolean, default: false },
    customClassButton: { type: Object, default: () => ({}) },
    noApply: { type: Boolean, default: false },
    customModalClass: { type: String, default: "" },
    isForm: { type: Boolean, default: false },
  },
  mounted() {
    document.onkeydown = (e) => {
      if (e.key === "Escape") {
        this.close()
      }
      if (e.key === "Enter") {
        this.apply()
      }
    }
  },
  computed: {
    customClass() {
      if (
        this.customClassButton &&
        Object.keys(this.customClassButton).length > 0
      ) {
        return this.customClassButton
      }
      return {
        green: true,
      }
    },
    modalComponentType() {
      return this.isForm ? "form" : "div"
    },
  },
  methods: {
    close(e) {
      this.$emit("on-cancel")
      e?.preventDefault()
    },
    apply(e) {
      this.$emit("on-confirm")
      e?.preventDefault()
    },
  },
}
</script>
