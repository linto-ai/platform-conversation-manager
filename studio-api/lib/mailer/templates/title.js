const debug = require("debug")("linto:lib:Mailer:templates:builder:title")

module.exports = function (Type) {
  return `
  ${TITLE_OPEN}
  <td colspan="2" class="mail-title">${Type.title}</td>
  ${TITLE_CLOSE}
  `
}

const TITLE_OPEN = `
<!-- Header -->
<table id="mail-header" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tbody>
    <tr>`

const TITLE_CLOSE = `
    </tr>
  </tbody>
</table>`
