<template>
  <label
    class="droparea flex1 flex col justify-center align-center"
    for="fileInput"
    @dragenter.prevent
    @dragover.prevent
    @dragleave.prevent
    @drop.prevent="handleDrop($event)">
    <div class="droparea__description">
      <slot></slot>
      <div class="defaultOption">
        <div for="fileInput" class="droparea__label">
          {{ $t("droparea.openFileExplorer") }}
        </div>
        <input
          type="file"
          id="fileInput"
          ref="input"
          :accept="acceptString"
          :multiple="multiple"
          @change="handleInputChange" />
      </div>
    </div>
  </label>
</template>
<script>
export default {
  props: {
    accepts: {
      type: Array,
      default: [],
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    checkFileValidity: {
      type: Function,
      default: null,
    },
  },
  computed: {
    acceptString() {
      if (this.accepts.length > 0) {
        let res = this.accepts[0]
        for (let i = 1; i < this.accepts.length; i++) {
          res += ", " + this.accepts[i]
        }
        return res
      }
      return ""
    },
  },
  methods: {
    async checkFilesValidity(files) {
      if (this.checkFileValidity) {
        for (let i = 0; i < files.length; i++) {
          let valid = await this.checkFileValidity(files[i])
          if (!valid) {
            return false
          }
        }
      }
      return true
    },
    async handleDrop(e) {
      let files = [...e.dataTransfer.files]
      if (!this.multiple && files.length > 1) {
        this.$emit("error", {
          msg: this.$t("droparea.error.tooManyFiles"),
        })
      } else if (await this.checkFilesValidity(files)) {
        this.$emit("drop", files)
      } else {
        this.$emit("error", { msg: this.$t("droparea.error.wrongFormat") })
      }
    },
    async handleInputChange(e) {
      e.stopPropagation()
      let input = document.getElementById("fileInput")
      console.log("input.files 0", input.files)
      if (input.files.length > 0) {
        if (await this.checkFilesValidity(input.files)) {
          this.$emit("drop", input.files)
        } else {
          this.$emit("error", { msg: this.$t("droparea.error.wrongFormat") })
        }
      }

      input.value = ""
    },
  },
}
</script>
