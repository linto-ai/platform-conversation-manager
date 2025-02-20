<template>
  <div
    class="select popover-parent"
    v-click-outside="close"
    :class="showList ? 'open' : 'close'"
    :inline="inline"
    :id="id"
    @keydown="onKeyDown"
    role="menu">
    <button
      @click="toggleMenu"
      class="select__head flex row no-propagation"
      :class="buttonClass"
      aria-haspopup="true"
      :disabled="disabled"
      :aria-expanded="showList">
      <span
        v-if="icon && iconType == 'icon'"
        class="icon select__head__icon no-propagation"
        :class="icon"
        :title="iconText" />
      <img
        v-if="icon && iconType == 'img'"
        :src="icon"
        :alt="iconText"
        class="icon select__head__icon no-propagation" />

      <span
        class="flex1 select__head__label label no-propagation"
        v-if="!multipleSelection"
        >{{ _valueText }}</span
      >

      <span
        class="flex1 select__head__label label no-propagation flex gap-small"
        v-else>
        <Badge v-if="value.length">{{ value.length }}</Badge>
        <Chip
          v-for="value in _multipleValueText"
          :key="value"
          :value="value"
          :removable="true"
          @remove="onClickOption($event, value)" />
      </span>

      <span class="icon small-arrow-down no-propagation"></span>
      <span class="badge no-propagation" v-if="badge">
        <span class="badge__content no-propagation">{{ badge }}</span>
      </span>
    </button>
    <ContextMenu :name="p_id" first v-if="showList" overflow getContainerSize>
      <div
        class="select__list__section flex col context-menu__element"
        v-for="sectionName in Object.keys(options)">
        <button
          v-for="(option, index) in options[sectionName]"
          :key="valueKey(option.value)"
          @click="onClickOption($event, option.value)"
          @mouseover="onHoverOption($event, index, sectionName)"
          :hovered="
            highlightedIndex == index && highlightedSection == sectionName
          "
          class="select__list__item"
          role="option">
          <Checkbox
            v-if="multipleSelection"
            :checkboxValue="option.value"
            v-model="value"
            class="select__list__item__checkbox" />
          <span v-if="option.icon" class="icon" :class="option.icon"></span>
          <span class="label">{{ option.text }}</span>
          <Badge v-if="option.badge">{{ option.badge }}</Badge>
        </button>
      </div>
    </ContextMenu>
  </div>
</template>
<script>
/*
TODO :
- keyboard navigation
*/
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import Checkbox from "@/components/Checkbox.vue"
import Chip from "@/components/Chip.vue"
import Badge from "@/components/Badge.vue"
import ContextMenu from "@/components/ContextMenu.vue"

export default {
  props: {
    valueText: { required: false },
    value: { required: true },
    icon: { type: String, default: "" },
    iconText: { type: String, default: "" },
    iconType: { type: String, default: "icon" }, //can be img (for user menu...)
    options: { required: true }, // { key: [{ text: "", value: "", icon: "" }, ...]}], key2: [{}, ...]}
    menuPosition: { type: String, default: "right" },
    badge: { type: Number, required: false },
    inline: { type: Boolean, default: false },
    buttonClass: { type: String, default: "" },
    id: { type: String, default: null },
    disabled: { type: Boolean, default: false },
    valueKey: { type: Function, default: (value) => value },
    multipleSelection: { type: Boolean, default: false },
  },
  data() {
    return {
      showList: false,
      highlightedIndex: 0,
      highlightedSection: Object.keys(this.options)[0],
      p_id: this.id || "select-" + Math.floor(Math.random() * 1000000000),
    }
  },
  mounted() {
    bus.$on("navigation", this.close)
  },
  beforeDestroy() {
    bus.$off("navigation", this.close)
  },
  // watch: {
  //   options: {
  //     immediate: true,
  //     handler: function (data) {
  //       console.log("options changed", data)
  //     },
  //   },
  // },
  computed: {
    _valueText() {
      if (this.valueText) return this.valueText
      else {
        for (const sectionName in this.options) {
          for (const option of this.options[sectionName]) {
            if (this.valueKey(option.value) == this.valueKey(this.value)) {
              return option.text
            }
          }
        }
      }

      return ""
    },
    _multipleValueText() {
      // test if value is an array
      if (!Array.isArray(this.value)) return []

      let res = []
      for (const sectionName in this.options) {
        for (const option of this.options[sectionName]) {
          for (const value of this.value) {
            if (this.valueKey(option.value) == this.valueKey(value)) {
              res.push(option.text)
            }
          }
        }
      }

      return res
    },
  },
  methods: {
    onClickOption(e, value) {
      if (this.multipleSelection) {
        const valueCopy = structuredClone(this.value)
        const index = valueCopy.indexOf(value)
        if (index > -1) {
          valueCopy.splice(index, 1)
        } else {
          valueCopy.push(value)
        }
        this.$emit("input", valueCopy)
      } else {
        this.showList = false
        this.$emit("input", structuredClone(value))
      }

      e.preventDefault()
      e.stopPropagation()
    },
    toggleMenu(e) {
      e.preventDefault()
      //e.stopPropagation()
      if (this.disabled) return
      this.showList = !this.showList
    },
    onHoverOption(e, index, sectionName) {
      this.highlightedIndex = index
      this.highlightedSection = sectionName
    },
    onKeyDown(e) {
      e.preventDefault()
      e.stopPropagation()
      switch (e.key) {
        case "ArrowDown":
          this.highlightNext()
          break
        case "ArrowUp":
          this.highlightPrevious()
          break
        case "Enter":
          this.onClickOption(
            e,
            this.options[this.highlightedSection][this.highlightedIndex].value,
          )
          break
        default:
          break
      }
    },
    highlightNext() {
      if (
        this.highlightedIndex <
        this.options[this.highlightedSection].length - 1
      ) {
        this.highlightedIndex++
      } else {
        const sectionKeys = Object.keys(this.options)
        const currentSectionIndex = sectionKeys.indexOf(this.highlightedSection)
        if (currentSectionIndex < Object.keys(this.options).length - 1) {
          this.highlightedSection = sectionKeys[currentSectionIndex + 1]
          this.highlightedIndex = 0
        }
      }
    },
    highlightPrevious() {
      if (this.highlightedIndex > 0) {
        this.highlightedIndex--
      } else {
        const sectionKeys = Object.keys(this.options)
        const currentSectionIndex = sectionKeys.indexOf(this.highlightedSection)
        if (currentSectionIndex > 0) {
          this.highlightedSection = sectionKeys[currentSectionIndex - 1]
          this.highlightedIndex =
            this.options[this.highlightedSection].length - 1
        }
      }
    },
    close() {
      this.showList = false
    },
  },
  components: { Fragment, Checkbox, Chip, Badge, ContextMenu },
}
</script>
