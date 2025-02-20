const debug = require("debug")("linto:lib:Mailer:mailer")
const nodemailer = require("nodemailer")
const { MailError } = require("./../error/customErrors")

const SMTP_SECURE = process.env.SMTP_SECURE === "true"
const SMTP_REQUIRE_TLS = process.env.SMTP_REQUIRE_TLS === "true"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: SMTP_SECURE, // true for 465, false for other ports
  requireTLS: SMTP_REQUIRE_TLS,
  auth: {
    user: process.env.SMTP_AUTH, // generated ethereal user
    pass: process.env.SMTP_PSWD, // generated ethereal password
  },
})

class Mailer {
  // const SMTP_REQUIRE_TLS = true
  // const SMTP_SECURE = false

  static transporter = transporter
  static connected = false

  constructor() {
    if (Mailer.checkConfig() && Mailer.checkConnection()) {
      Mailer.connected = true
    }
    return Mailer
  }

  static async sendMail(mail_payload) {
    if (process.env.SMTP_HOST === "") {
      debug("SMTP wasn't define, mailing disable")
      return true
    }

    try {
      if (Mailer.connected === false) {
        Mailer.connected = await Mailer.checkConnection()
        if (Mailer.connected === false) {
          debug("Mailer is not connected")
          return false
        }
      }

      const mail_result = await Mailer.transporter.sendMail(mail_payload)
      if (
        mail_result.accepted.length > 0 &&
        mail_result.accepted.indexOf(mail_payload.to) >= 0
      )
        return true
      else if (
        mail_result.rejected.length > 0 &&
        mail_result.rejected.indexOf(mail_payload.to) >= 0
      )
        return false
      else
        throw new MailError("Mailer was not able to identify the mail result")
    } catch (err) {
      return false
    }
  }

  static async checkConnection() {
    try {
      return await new Promise((resolve, reject) => {
        Mailer.transporter.verify((error, success) => {
          if (error || !success) {
            debug("Error connecting to mail server")
            debug(error)
            return reject(error)
          } else Mailer.connected = true
          resolve(true)
        })
      })
    } catch (err) {
      Mailer.connected = false
      return false
    }
  }

  static checkConfig() {
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_SECURE &&
      process.env.SMTP_REQUIRE_TLS &&
      process.env.SMTP_AUTH &&
      process.env.SMTP_PSWD
    ) {
      return true
    } else {
      return false
    }
  }
}

module.exports = new Mailer()
