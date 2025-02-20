const rules = require(`./rules.json`)

function createIndex(MongoDriver) {
  //read all key in the json rules and get all value
  let collectionRules = Object.keys(rules)
  collectionRules.map((collectionName) => {
    rules[collectionName].map((rule) => {
      MongoDriver.db.collection(collectionName).createIndex(rule, () => {
        // console.log(`> MongoDB : Index created for ${collectionName} collection`)
      })
    })
  })
}

module.exports = {
  createIndex,
}
