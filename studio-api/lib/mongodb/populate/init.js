const ROLE = require(`${process.cwd()}/lib/dao/users/platformRole`)

async function createSuperAdmin() {
  if (process.env.SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_PWD) {
    const model = require(`${process.cwd()}/lib/mongodb/models`)
    let user = await model.users.getByEmail(process.env.SUPER_ADMIN_EMAIL, true)

    if (user.length > 0) return
    else {
      await model.users.createSuperAdmin({
        email: process.env.SUPER_ADMIN_EMAIL,
        password: process.env.SUPER_ADMIN_PWD,
        role: ROLE.superAdministratorRole(),
      })
    }
  }
}

module.exports = {
  createSuperAdmin,
}
