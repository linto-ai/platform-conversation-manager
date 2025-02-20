<template>
  <canvas
    id="scroller"
    width="100%"
    :height="canvaHeight"
    :style="style"></canvas>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
import { SubtitleScroller } from "@/models/SubtitleDrawer.js"

export default {
  props: {
    partialText: {
      type: String,
      required: true,
    },
    finalText: {
      type: String,
      required: true,
    },
    fontSize: {
      type: String,
      default: "40",
    },
    previousTurns: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      canvas: null,
      lineHeight: 1.2 * this.fontSize,
      subtitleDrawer: null,
      canvaHeight: 2.4 * this.fontSize,
    }
  },
  watch: {
    partialText: function (newVal, oldVal) {
      if (newVal.trim().length > 0) this.subtitleDrawer.newPartial(newVal)
    },
    finalText: function (newVal, oldVal) {
      this.subtitleDrawer.newFinal(newVal)
    },
  },
  computed: {
    style() {
      return {
        height: this.canvaHeight,
        lineHeight: this.lineHeight,
      }
    },
  },
  async mounted() {
    this.canvas = document.getElementById("scroller")
    this.subtitleDrawer = new SubtitleScroller(this.canvas, {
      fontSize: Number(this.fontSize),
      lineHeight: this.lineHeight,
    })
  },
  methods: {},
  components: { Fragment },
}
</script>
