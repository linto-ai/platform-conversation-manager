<template>
  <div
    v-if="canEdit"
    class="form-field fullwidth flex col"
    :style="editorTurn ? 'margin: 0;' : ''">
    <!-- <span class="form-label" v-if="label !== false">{{ label }}</span> -->
    <div class="flex col">
      <div
        :class="[
          'collab-input',
          customClass ? customClass : '',
        ]"
        :id="flag"></div>
    </div>
  </div>
  <div v-else>
    <div>
      <!-- <div class="form-label">{{ label }}</div> -->
      <div>{{ _currentValue }}</div>
    </div>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import Quill from 'quill'

export default {
  props: {
    startValue: { type: String, required: true },
    editable: { type: Boolean, default: () => true },
    flag: { type: String, required: true },
    conversationId: { type: String, required: true },
    editorTurn: { type: Boolean, default: () => false },
    canEdit: { type: Boolean, default: () => false },
    customClass: { type: String, required: false },

  },
  data() {
    return {
      quillEditor: null,
    }
  },
  mounted() {
    const input = document.getElementById(this.flag)
    this.quillEditor = new Quill(input, {
      //theme: 'snow',
      modules: {
        toolbar: []
      }
    })
    this.quillEditor.setText(this.startValue)
    this.quillEditor.on('editor-change', this.onEditorChange)
    //quill.setContents(type.toDelta(), this)
  },
  methods: {
    onEditorChange(eventType, delta, state, origin) {
      console.log("editor changed", eventType, delta, state, origin)
      const extractedDelta = delta?.ops
      const extractedText = this.quillEditor.getText()

      if(eventType === 'text-change' && origin === 'user' && extractedDelta.length > 0) {
        this.$emit('onDelta', 
          {
            delta: extractedDelta,
            text: extractedText,
          }
        )
      }
    },
  },
  components: { Fragment },
}
</script>