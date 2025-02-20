<template>
  <div class="chip" :primary="primary">
    <span>{{ value }}</span>
    <!-- <span v-if="removable" class="chip__remove" @click="onRemove">x</span> -->
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
export default {
  props: {
    value: { type: String, default: "" },
    removable: { type: Boolean, default: false },
    primary: { type: Boolean, default: false },
  },
  data() {
    return {}
  },
  mounted() {
  },
  methods: {
    onRemove(e) {
      this.$emit("remove", e)
    },
  },
  components: { Fragment },
}
</script>