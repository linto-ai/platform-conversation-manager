<template>
  <div>
    <div
      class="flex row tabs"
      :class="{
        'horizontal-tabs': !secondary,
        'horizontal-tabs-secondary': secondary,
      }"
      role="tablist"
      :squareTabs="squareTabs">
      <div
        v-for="tab of tabs"
        class="tab"
        role="tab"
        :title="tab.label"
        :aria-disabled="tab.disabled"
        :selected="value == tab.name"
        :aria-selected="value == tab.name"
        :id="tab.id ? tab.id : undefined"
        :aria-controls="tab.ariaControl ? tab.ariaControl : undefined"
        @click="!disabled && !tab.disabled && $emit('input', tab.name)">
        <span class="icon" :class="tab.icon" v-if="tab.icon"></span>
        <img :src="tab.img" v-else-if="tab.img" class="icon" />
        <div class="flex flex1 col justify-center">
          <span class="tab__label">{{ tab.label }}</span>
        </div>
        <Badge v-if="tab.badge" :inverted="value == tab.name">{{
          tab.badge
        }}</Badge>
      </div>

      <div class="flex1 tab" v-if="secondary"></div>
    </div>
  </div>
</template>
<script>
import Badge from "@/components/Badge.vue"

export default {
  props: {
    tabs: { type: Array, required: true }, // array of tab objects { name: 'inbox', label: 'Inbox', icon: 'box', ?id, ?aria-control }
    value: { type: String, required: true }, // selected tab
    squareTabs: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    secondary: { type: Boolean, default: false },
  },
  data() {
    return {}
  },
  watch: {},
  computed: {},
  methods: {},
  components: {
    Badge,
  },
}
</script>
