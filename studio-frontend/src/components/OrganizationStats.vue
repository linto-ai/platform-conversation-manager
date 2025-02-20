<template>
  <section class="flex1 flex col gap-small">
    <h2>{{ $t("organisation.organization_stats.title") }}</h2>
    <StatCard
      :count="mediaCount"
      :title="$t('organisation.organization_stats.medias')"
      icon="transcription" />
  </section>
</template>
<script>
import { bus } from "../main.js"
import StatCard from "./StatCard.vue"

import { apiCountConversation } from "@/api/conversation.js"

export default {
  props: {
    organizationId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      mediaCount: null,
    }
  },
  mounted() {
    this.fetchStats()
  },
  methods: {
    async fetchStats() {
      this.mediaCount = await apiCountConversation(this.organizationId)
    },
  },
  components: {
    StatCard,
  },
}
</script>
