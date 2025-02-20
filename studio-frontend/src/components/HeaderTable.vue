<template>
  <div class="flex gap-medium backoffice-listing-header align-center">
    <div
      class="flex1 flex gap-small backoffice-listing-header__title align-center">
      <h2>{{ title }}</h2>
      <span class="backoffice-listing-header__total">{{ count }}</span>
    </div>
    <form class="flex align-center gap-small">
      <input
        type="text"
        placeholder="Search"
        :value="search"
        @input="updateSearch" />
      <!-- <button type="submit">
        <span class="icon search"></span>
        <span class="label">Rechercher</span>
      </button> -->
    </form>
    <button
      v-if="add_button_label"
      class="btn green"
      @click="$emit('on-create')">
      <span class="icon plus"></span>
      <span class="label">{{ add_button_label }}</span>
    </button>
    <button
      v-if="remove_button_label"
      class="btn red-border"
      @click="$emit('on-delete')"
      :disabled="disableDelete">
      <span class="icon delete"></span>
      <span class="label">{{ remove_button_label }}</span>
    </button>
  </div>
</template>
<script>
export default {
  props: {
    title: { type: String, required: true },
    count: { type: Number, required: true },
    add_button_label: { type: String, required: false },
    remove_button_label: { type: String, required: false },
    disableDelete: { type: Boolean, default: false },
    search: { type: String, required: false },
  },
  data() {
    return {}
  },
  mounted() {},
  methods: {
    updateSearch(e) {
      this.$emit("update:search", e.target.value)
    },
  },
  components: {},
}
</script>
