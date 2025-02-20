const debug = require("debug")("linto:lib:Mailer:templates:builder:html")

const mailTitle = require("./title")
const mailBody = require("./body")

module.exports = function (Type, payload) {
  return `
  ${HEADER}
  ${mailTitle(Type)}
  ${mailBody(Type, payload)}
  ${FOOTER}
  `
}

const HEADER = `<head>
<meta charset="utf-8">
<meta http-equiv="x-ua-compatible" content="ie=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style type="text/css">
  body{
    background-color: #fbfbfb;
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
  }
  #mail-wrapper{
    width: 100%;
    background-color: #f2f2f2;
    text-align:center;
  }
  table{
    width: 100%;
    max-width: 960px;
    min-width: 320px;
    border: none;
    border-collapse: collapse !important;
    margin: 0 auto;
  }

  #mail-header{
    background-color: #f2f2f2;
  }
  .logo{
    display: inline-block;
    max-height: 100px;
    width: auto;
    margin: 0 10px;
  }

  #mail-body {
    padding: 20px;
    background-color: #ffffff;
  }
  #mail-body tbody tr{
    border-bottom: 1px solid #eeeeee;
  }
  #mail-body tbody tr td{
    padding: 10px;
    vertical-align: top;
  }
  .mail-title{
    font-size: 22px;
    font-weight: 600;
    color: #1daf92;
    text-align: center;
    padding: 40px 20px 20px 20px;
  }
  .list-conversation {
    text-align: left;
    margin-top: 20px;
  }
  td.mail-contact-label {
    font-size: 14px;
    width: 25%;
    text-align: right;
    vertical-align: top;
  }
  td.mail-content{
    font-size: 14px;
    line-height: 22px;
    text-align: left;
    vertical-align: top;
  }
  td.mail-link{
    text-align: center;
    padding: 20px 0;
  }
  a#reset-link {
    display: inline-block;
    padding: 20px 10px;
    background-color: #2da800;
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    text-transform: uppercase;
    color: #fff;
    text-decoration: none;
    -moz-box-shadow: 0px 2px 2px 0px rgba(0,0,0,0.2);
    -webkit-box-shadow: 0px 2px 2px 0px rgba(0,0,0,0.2);
    box-shadow: 0px 2px 2px 0px rgba(0,0,0,0.2);
    -webkit-border-radius: 5px;
    -moz-border-radius: 5px;
    border-radius: 5px;
  }
  a.link{
    color: #007bff;
    text-decoration: underline;
  }
  strong {
    font-weight: 700;
    color: #364954;
  }

  #mail-footer{
    background-color: #ffffff;
    border-top: 1px solid #ccc;

  }
  .logo-footer{
    display: inline-block;
    height: 60px;
    width: auto;
    padding: 20px 0;
  }
  .copyright{
    padding: 10px 0;
    background-color: #1daf92;
    text-align: center;
    color: #fff;
  }
</style>
</head>
<!DOCTYPE html>
<html>
  <body>
    <div id="mail-wrapper">

`

const FOOTER = `
      <table id="mail-footer" cellpadding="0" cellspacing="0" width="100%">
        <tbody>
          <tr>
            <td align="center" class="copyright">
              © COPYRIGHT LINAGORA 2022
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </body>
</html>`
