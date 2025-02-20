export function getUserRoleInOrganization(organization, userId) {
  if (!organization || !userId) return 0

  try {
    if (organization.owner === userId) return 6
    else {
      let findUser = organization.users.filter(
        (usr) => usr._id === userId || usr.userId === userId,
      )
      return findUser.length > 0 ? findUser[0].role : 0
    }
  } catch (error) {
    return 0
  }
}
