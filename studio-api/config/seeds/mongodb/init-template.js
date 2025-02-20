conn = new Mongo()
db = conn.getDB("${DB_NAME}")

try {
  db.createUser({
    user: "${DB_USER}",
    pwd: "${DB_PASS}",
    roles: [
      {
        role: "readWrite",
        db: "${DB_NAME}",
      },
    ],
  })
} catch (error) {
  if (
    error.message ===
    'couldn\'t add user: User "${DB_USER}@${DB_NAME}" already exists'
  ) {
    print("Skip user creation, user alraedy created")
  } else {
    throw error
  }
}

//this an example of the acousticModel collection information
db.createCollection("conversations")
db.createCollection("organizations")
db.createCollection("users")
db.createCollection("logs")
