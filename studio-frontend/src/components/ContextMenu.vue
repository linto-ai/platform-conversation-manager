<template>
  <!--  -->
  <div
    class="context-menu flex col"
    :style="style"
    ref="content"
    :positionHorizontal="positionMenuHorizontal"
    :positionVertical="positionMenuVertical">
    <div :class="{ 'overflow-vertical-auto': overflow }">
      <slot></slot>
    </div>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import findParentByClass from "../tools/findParentByClass"
import { bus } from "../main.js"

/*
=== TODO ===
  Placement is handmade, it's not perfect.
  Use a lib like https://floating-ui.com/
  or use api popover https://developer.mozilla.org/fr/docs/Web/API/Popover_API/Using (only supported by latest firefox ESR, end 2024 (no debian <= 12))
  see https://mdn.github.io/dom-examples/popover-api/nested-popovers/ as example
*/

/* 
=== USAGE ===
  <container class="popover-parent">
    <!-- First context-menu in the chain, set "overflow" prop if needed so it will not extend beyond the edge of the screen -->
    <ContextMenu first>
      <div class="context-menu__element">
        content
        <!-- Nested context-menu, will appear left or right and top or bottom depending of space on screen -->
        <ContextMenu>
        </ContextMenu>
      </div>
      <div class="context-menu__element">
        another content
      </div>
    </ContextMenu>
  </container>
*/
export default {
  props: {
    x: {
      type: Number,
      default: 0,
    },
    y: {
      type: Number,
      default: 0,
    },
    topRelativeParent: {
      type: HTMLElement,
      default: null,
    },
    container: {
      type: HTMLElement,
      default: () => {
        return document.getElementById("app")
      },
    },
    first: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      default: () => "context-menu-" + Math.floor(Math.random() * 1000000000),
    },
    // this prop works only for last context-menu in the chain else next context-menu will be hidden
    overflow: {
      type: Boolean,
      default: false,
    },
    getContainerSize: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      heightContent: 0,
      widthContent: 0,
      heightContainer: 0,
      widthContainer: 0,
      contentYBottom: 0,
      contentYTop: 0,
      contentX: 0,
      resizeObserverContent: null,
      resizeObserverContainer: null,
    }
  },
  mounted() {
    //await this.$nextTick()
    this.heightContent = this.$refs.content.clientHeight

    this.computeElementPosition()

    this.initObserverContent()
    this.initObserverContainer()
  },
  beforeDestroy() {
    this.resizeObserverContent?.disconnect()
    this.resizeObserverContainer?.disconnect()
  },
  computed: {
    style() {
      let res = {}

      if (this.positionMenuVertical === "hidden") {
        return { hidden: true }
      }

      switch (this.positionMenuVertical) {
        case "top":
          res["bottom"] = `1rem`
          break
        case "bottom":
          res["top"] = `${this.YpositionBottom}px`
          break
      }

      switch (this.positionMenuHorizontal) {
        case "left":
          res["right"] = `1rem`
          break
        case "right":
          res["left"] = `${this.Xposition}px`
          break
      }

      if (this.getContainerSize) {
        const widthRelativeParent = this._topRelativeParent.clientWidth
        res["min-width"] = `${widthRelativeParent}px`
        res["width"] = "auto"
        res["box-sizing"] = "border-box"
      }

      return res
    },
    positionMenuVertical() {
      if (this.heightContent === 0) {
        return "hidden"
      }

      if (this.heightContent + this.YpositionBottom > this.heightContainer) {
        return "top"
      }

      return "bottom"
    },
    positionMenuHorizontal() {
      if (this.widthContent + this.Xposition > this.widthContainer)
        return "left"
      return "right"
    },
    YpositionTop() {
      return this.y || this.contentYTop || 0
    },
    YpositionBottom() {
      return this.y || this.contentYBottom || 0
    },
    Xposition() {
      return this.x || this.contentX || 0
    },
    _topRelativeParent() {
      return (
        this.topRelativeParent ||
        findParentByClass(this.$refs.content, "popover-parent")
      )
    },
  },
  methods: {
    initObserverContent() {
      this.resizeObserverContent = new ResizeObserver(
        function (entries) {
          this.heightContent = this.$refs.content.clientHeight
          this.widthContent = this.$refs.content.clientWidth
          this.computeElementPosition()
        }.bind(this),
      )

      this.resizeObserverContent.observe(this.$refs.content)

      // this.observerContent = new MutationObserver(
      //   function (mutations) {
      //     this.heightContent = this.$refs.content.clientHeight
      //     this.widthContent = this.$refs.content.clientWidth
      //   }.bind(this)
      // )

      // this.observerContent.observe(this.$refs.content, {
      //   attributes: true,
      //   childList: true,
      //   characterData: true,
      //   subtree: true,
      // })
    },
    initObserverContainer() {
      this.resizeObserverContainer = new ResizeObserver(
        function (entries) {
          this.heightContainer = this.container.clientHeight
          this.widthContainer = this.container.clientWidth
          this.computeElementPosition()
        }.bind(this),
      )

      this.resizeObserverContainer.observe(this.container)
    },
    computeElementPosition() {
      const relativeParent = findParentByClass(
        this.$refs.content,
        "context-menu__element",
      )
      // TODO: see https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API to update current position when scrolling
      if (this.first) {
        this.contentYTop = this._topRelativeParent.getBoundingClientRect().top
        this.contentYBottom =
          this._topRelativeParent.getBoundingClientRect().bottom
        this.contentX = this._topRelativeParent.getBoundingClientRect().left
      } else if (relativeParent) {
        this.contentYTop = relativeParent.getBoundingClientRect().top
        this.contentYBottom =
          relativeParent.getBoundingClientRect().top +
          relativeParent.getBoundingClientRect().height
        this.contentX =
          relativeParent.getBoundingClientRect().left +
          relativeParent.getBoundingClientRect().width
      } else {
        this.contentYTop = this.y || 0
        this.contentYBottom = this.y || 0
        this.contentX = this.x || 0
      }
    },
  },
  components: { Fragment },
}
</script>
