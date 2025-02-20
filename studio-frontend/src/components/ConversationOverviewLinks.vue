<template>
  <aside class="flex col gap-small conversation-overview-links">
    <h2>{{ $t("conversation_overview.tools_links.title") }}</h2>

    <router-link
      :to="{
        name: 'conversations transcription',
        params: { conversationId: conversation._id },
      }">
      {{ $t("conversation_overview.tools_links.transcription") }}
    </router-link>

    <router-link
      :to="{
        name: 'conversations subtitles',
        params: { conversationId: conversation._id },
      }">
      {{ $t("conversation_overview.tools_links.subtitles") }}
    </router-link>

    <router-link
      :to="{
        name: 'conversations publish',
        params: { conversationId: conversation._id },
      }">
      {{ $t("conversation_overview.tools_links.export") }}
    </router-link>

    <!-- <a href="">Acceder à la transcription</a>
    <a href="">Editeur de sous titre</a>
    <a href="">Export et résumé</a> -->
  </aside>
</template>
<script>
import { bus } from "@/main.js"
export default {
  props: {
    conversation: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {}
  },
  mounted() {},
  methods: {},
  components: {},
}
</script>
