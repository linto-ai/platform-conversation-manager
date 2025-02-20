module.exports = {
  conversation: {
    rights: require("./conversation/rights.js"),
  },
  organization: {
    roles: require("./organization/roles.js"),
    category_type: require("./organization/categoryType.js"),
  },
  date: {
    validity_date: require("./validityDate/validityDate.js"),
  },
}
