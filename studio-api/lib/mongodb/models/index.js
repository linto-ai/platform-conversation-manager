module.exports = {
  categories: require("./categories.js"),
  conversations: require("./conversations.js"),
  conversationSubtitles: require("./conversationSubtitles.js"),
  conversationExport: require("./conversationExport.js"),
  metadata: require("./metadata.js"),
  organizations: require("./organizations.js"),
  tags: require("./tags.js"),
  users: require("./users.js"),
  favorites: require("./favorites.js"),
  tokens: require("./tokens.js"),
  search: {
    conversations: require("./search/conversations.js"),
    tags: require("./search/tags.js"),
  },
}
