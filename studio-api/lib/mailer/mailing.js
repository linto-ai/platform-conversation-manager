const debug = require("debug")("linto:lib:Mailer:mailing")
const Mailer = require(`./mailer`)
const TYPE = require("./dao/type")
const htmlBuilder = require("./templates/html.js")

const model = require(`${process.cwd()}/lib/mongodb/models`)

class Mailing {
  constructor() {
    this.no_reply = "noreply@convos.linto.ai"
    if (process.env.NO_REPLY_EMAIL !== undefined)
      this.no_reply = process.env.NO_REPLY_EMAIL
  }

  exctractRequestOrigin(req) {
    if (!!req.headers["x-forwarded-host"] && req.headers["x-forwarded-proto"])
      return `${req.headers["x-forwarded-proto"]}://${req.headers["x-forwarded-host"]}`
    else if (req.headers.origin) return req.headers.origin
    else if (req.headers.host) return req.headers.host
    else if (process.env.WEBSERVER_SWAGGER_HTTP_HOST !== undefined)
      return (
        process.env.WEBSERVER_SWAGGER_HTTP_HOST +
        ":" +
        process.env.WEBSERVER_HTTP_PORT
      )
    else return "http://localhost:" + process.env.WEBSERVER_HTTP_PORT
  }

  async userMailNotificationProfile(user, Type) {
    try {
      if (user.emailIsVerified === false) {
        // check if the user has a verified email
        if (user.verifiedEmail.length === 0) return false

        user.email = user.verifiedEmail[user.verifiedEmail.length - 1] // use the last verified email
      }

      if (user.emailNotifications === undefined) {
        let userSettings = await model.users.getByIdFilter(user.id, {
          emailNotifications: 1,
        })
        user = {
          ...user,
          emailNotifications: userSettings[0].emailNotifications,
        }
      }

      switch (Type.type) {
        case TYPE.SHARE_CONVERSATION.type:
          return user.emailNotifications.conversations.share.add
        case TYPE.SHARE_CONVERSATION_EXTERNAL.type:
          return user.emailNotifications.conversations.share.add
        case TYPE.SHARE_CONVERSATION_RIGHT_UPDATE.type:
          return user.emailNotifications.conversations.share.update
        case TYPE.UNSHARE_CONVERSATION.type:
          return user.emailNotifications.conversations.share.delete
        case TYPE.INVITE_ORGANIZATION.type:
          return user.emailNotifications.organizations.add
        case TYPE.DELETE_ORGANIZATION_RIGHT.type:
          return user.emailNotifications.organizations.delete
        case TYPE.UPDATE_ORGANIZATION_RIGHT.type:
          return user.emailNotifications.organizations.update
        case TYPE.RESET_PASSWORD.type:
        case TYPE.VERIFY_ADDRESS_EMAIL.type:
        case TYPE.ACCOUNT_CREATE_INVITE_ORGANIZATION.type:
        case TYPE.ACCOUNT_CREATED.type:
        default:
          return true
      }
    } catch (err) {
      debug("Notification user profile error, send a mail by default")
      return true
    }
  }

  /*Origin can be also the request */
  /*
        No need to check if the user has a verified email, because the user is in a process of verification / creation / reset
    */
  async accountCreate(email, origin, magicId) {
    if (typeof origin === "object") origin = this.exctractRequestOrigin(origin)

    return await this.sendMail(
      TYPE.ACCOUNT_CREATED,
      { email, origin },
      { origin, magicId },
    )
  }

  async resetPassword(email, origin, magicId) {
    if (typeof origin === "object") origin = this.exctractRequestOrigin(origin)

    return await this.sendMail(
      TYPE.RESET_PASSWORD,
      { email, origin },
      { origin, magicId, email },
    )
  }

  async verifyEmailAddress(email, origin, magicId) {
    if (typeof origin === "object") origin = this.exctractRequestOrigin(origin)

    return await this.sendMail(
      TYPE.VERIFY_ADDRESS_EMAIL,
      { email, origin },
      { email, origin, magicId },
    )
  }

  async organizationAccountCreate(
    email,
    origin,
    magicId,
    sharedByEmail,
    orgaName,
    organizationId,
  ) {
    if (typeof origin === "object") origin = this.exctractRequestOrigin(origin)

    return await this.sendMail(
      TYPE.ACCOUNT_CREATE_INVITE_ORGANIZATION,
      { email, origin },
      { origin, magicId, sharedByEmail, orgaName, organizationId },
    )
  }

  async conversationSharedNewUser(
    email,
    origin,
    magicId,
    sharedByEmail,
    conversationId,
  ) {
    if (typeof origin === "object") origin = this.exctractRequestOrigin(origin)

    return await this.sendMail(
      TYPE.SHARE_CONVERSATION_EXTERNAL,
      { email, origin },
      { origin, magicId, sharedByEmail, conversationId },
    )
  }

  /*
        We need to check the user profile settings and if the user has a verified email
    */

  async conversationShared(user, origin, sharedByEmail, conversationId) {
    if (
      !(await this.userMailNotificationProfile(user, TYPE.SHARE_CONVERSATION))
    )
      return true

    if (typeof origin === "object") origin = this.exctractRequestOrigin(origin)

    return await this.sendMail(
      TYPE.SHARE_CONVERSATION,
      { email: user.email, origin },
      { origin, sharedByEmail, conversationId },
    )
  }

  async conversationRightUpdate(user, origin, sharedByEmail, conversationId) {
    if (
      !(await this.userMailNotificationProfile(
        user,
        TYPE.SHARE_CONVERSATION_RIGHT_UPDATE,
      ))
    )
      return true

    if (typeof origin === "object") origin = this.exctractRequestOrigin(origin)

    return await this.sendMail(
      TYPE.SHARE_CONVERSATION_RIGHT_UPDATE,
      { email: user.email, origin },
      { origin, sharedByEmail, conversationId },
    )
  }

  async multipleConversationRight(
    user,
    origin,
    sharedByEmail,
    conversationsList,
  ) {
    if (
      !(await this.userMailNotificationProfile(
        user,
        TYPE.SHARE_CONVERSATION_RIGHT_UPDATE,
      ))
    )
      return true

    if (typeof origin === "object") origin = this.exctractRequestOrigin(origin)

    return await this.sendMail(
      TYPE.SHARE_MULTIPLE_CONVERSATION_RIGHT,
      { email: user.email, origin },
      { origin, sharedByEmail, conversationsList },
    )
  }

  async conversationUnshare(user, origin, name) {
    if (
      !(await this.userMailNotificationProfile(user, TYPE.UNSHARE_CONVERSATION))
    )
      return true

    if (typeof origin === "object") origin = this.exctractRequestOrigin(origin)

    return await this.sendMail(
      TYPE.UNSHARE_CONVERSATION,
      { email: user.email, origin },
      { name },
    )
  }

  async organizationInvite(
    user,
    origin,
    sharedByEmail,
    orgaName,
    organizationId,
  ) {
    if (
      !(await this.userMailNotificationProfile(user, TYPE.INVITE_ORGANIZATION))
    )
      return true

    if (typeof origin === "object") origin = this.exctractRequestOrigin(origin)

    return await this.sendMail(
      TYPE.INVITE_ORGANIZATION,
      { email: user.email, origin },
      { origin, sharedByEmail, orgaName, organizationId },
    )
  }

  async organizationRightUpdate(user, origin, orgaName) {
    if (
      !(await this.userMailNotificationProfile(
        user,
        TYPE.UPDATE_ORGANIZATION_RIGHT,
      ))
    )
      return true

    if (typeof origin === "object") origin = this.exctractRequestOrigin(origin)

    return await this.sendMail(
      TYPE.UPDATE_ORGANIZATION_RIGHT,
      { email: user.email, origin },
      { origin, orgaName },
    )
  }

  async organizationDelete(user, origin, orgaName) {
    if (
      !(await this.userMailNotificationProfile(
        user,
        TYPE.DELETE_ORGANIZATION_RIGHT,
      ))
    )
      return true

    if (typeof origin === "object") origin = this.exctractRequestOrigin(origin)

    return await this.sendMail(
      TYPE.DELETE_ORGANIZATION_RIGHT,
      { email: user.email, origin },
      { origin, orgaName },
    )
  }

  async sendMail(TYPE, mail_data, payload) {
    const mail_payload = this.prepareMail(TYPE, mail_data, payload)
    const mail_result = await Mailer.sendMail(mail_payload)

    if (!mail_result) debug("Error while send email to ", mail_payload.to)
    return mail_result
  }

  prepareMail(TYPE, mail_data, payload) {
    const html = htmlBuilder(TYPE, payload)
    return this.generateMailPayload(mail_data, TYPE.subject, html)
  }

  generateMailPayload(mail_data, subject, html) {
    return {
      from: `${TYPE.TITLE_NAME} <${this.no_reply}>`,
      to: mail_data.email,
      subject: `${TYPE.TITLE_NAME} - ${subject}`,
      html: html,
    }
  }
}

module.exports = new Mailing()
