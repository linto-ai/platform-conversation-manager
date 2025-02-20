const debug = require("debug")("linto:lib:Mailer:templates:builder:body")

const TYPE = require("./../dao/type")

module.exports = function (Type, payload) {
  switch (Type.type) {
    case TYPE.ACCOUNT_CREATED.type:
      return accountCreated(payload)
    case TYPE.RESET_PASSWORD.type:
      return passwordReset(payload)
    case TYPE.SHARE_CONVERSATION.type:
      return shareConversation(payload)
    case TYPE.SHARE_CONVERSATION_EXTERNAL.type:
      return shareExternalLink(payload)
    case TYPE.SHARE_CONVERSATION_RIGHT_UPDATE.type:
      return shareConversationRightUpdate(payload)
    case TYPE.UNSHARE_CONVERSATION.type:
      return unshareConversation(payload)
    case TYPE.VERIFY_ADDRESS_EMAIL.type:
      return verifyEmailAddress(payload)
    case TYPE.INVITE_ORGANIZATION.type:
      return shareMemberOrga(payload)
    case TYPE.ACCOUNT_CREATE_INVITE_ORGANIZATION.type:
      return accountInviteMemberOrga(payload)
    case TYPE.DELETE_ORGANIZATION_RIGHT.type:
      return deleteMemberOrga(payload)
    case TYPE.UPDATE_ORGANIZATION_RIGHT.type:
      return updateMemberOrga(payload)
    case TYPE.SHARE_MULTIPLE_CONVERSATION_RIGHT.type:
      return shareMultipleConversation(payload)
    default:
      throw new Error("Unknown mail type")
  }
}

function accountCreated(payload) {
  return `
  <p>Félicitations, vous venez de créer un compte sur ${payload.origin}! Votre adresse e-mail est liée à votre compte et l’identifie. Pour finaliser la création de votre compte, veuillez cliquer sur le lien de vérification ci-dessous. Cela nous permettra de nous assurer que vous êtes bien propriétaire de cette adresse e-mail.</p>
 
  <div style="margin: 0 auto 20px auto; padding:20px; background-color: #fff; max-width: 960px; min-width: 320px;"><p style="margin:0;"><a href="${payload.origin}/magiclink-auth/${payload.magicId}?type=account_create" target="_blank">${payload.origin}/magiclink-auth/${payload.magicId}</a></p></div>
  `
}

function passwordReset(payload) {
  return `
  <p>Il y a eu une demande de réinitialisation de mot de passe pour votre compte avec l'adresse e-mail associée "${payload.email}. Pour vous connecter immédiatement, utilisez le lien unique ci-après, valable pendant 30 minutes. 
  Cliquez sur ce lien pour continuer: </p>
  <div style="margin: 0 auto 20px auto; padding:20px; background-color: #fff; max-width: 960px; min-width: 320px;"><p style="margin:0;"><a href="${payload.origin}/magiclink-auth/${payload.magicId}?type=password_reset" target="_blank">${payload.origin}/magiclink-auth/${payload.magicId}</a></p></div>
  
  <p style="color: #777; font-style: italic;">Si vous n’avez plus accès à votre mot de passe, pensez à le mettre à jour “Mon Compte” > “Modifier le mot de passe”</p>
  <p style="color: #777; font-style: italic;">Si vous n’avez pas fait de demande de mot de passe oublié, vous pouvez ignorer cet email.</p>
  `
}

function shareConversation(payload) {
  return `
  <p>Vous avez reçu une transcription de média sur la plateforme LinTO Studio de la part de <strong>${payload.sharedByEmail}</strong>.</p>
  <p>Cliquez sur le lien pour accéder à la transcription partagée : </p>

  <div style="margin: 0 auto 20px auto; padding:20px; background-color: #fff; max-width: 960px; min-width: 320px;"><p style="margin:0;"><a href="${payload.origin}/interface/conversations/${payload.conversationId}" target="_blank">${payload.origin}/interface/conversations/${payload.conversationId}</a></p></div>
  `
}

function shareConversationRightUpdate(payload) {
  return `
  <p>Vous avez reçu une mise à jour de droits sur une transcription de média sur la plateforme LinTO Studio de la part de <strong>${payload.sharedByEmail}</strong>.</p>
  <p>Cliquez sur le lien pour accéder à la transcription partagée : </p>
  
  <div style="margin: 0 auto 20px auto; padding:20px; background-color: #fff; max-width: 960px; min-width: 320px;"><p style="margin:0;"><a href="${payload.origin}/interface/conversations/${payload.conversationId}" target="_blank">${payload.origin}/interface/conversations/${payload.conversationId}</a></p></div>
  `
}

function shareExternalLink(payload) {
  return `
  <p>Vous avez reçu une transcription de média sur la plateforme LinTO Studio de la part de <strong>${payload.sharedByEmail}</strong>.</p>
  <p>Utilisez le lien unique ci-après pour accéder à cette ressource et lier un compte à votre adresse e-mail qui l’identifie. N'oubliez pas de définir un mot de passe pour les connexions futures en allant dans "Mon Compte" > "Modifier le mot de passe". </p>
  <p>Ce lien a une validité de 48h.</p>
  <p> Cliquez sur le lien pour accéder à votre compte ainsi qu'à la transcription partagée : </p>
  <div style="margin: 0 auto 20px auto; padding:20px; background-color: #fff; max-width: 960px; min-width: 320px;"><p style="margin:0;"><a href="${payload.origin}/magiclink-auth/${payload.magicId}?type=share_conversation&conversationId=${payload.conversationId}" target="_blank">${payload.origin}/magiclink-auth/${payload.magicId}</a></p></div>
  `
}

function shareMemberOrga(payload) {
  return `
  <p>Vous avez reçu une invitation à l'organization ${payload.orgaName} de la part de <strong>${payload.sharedByEmail}</strong>.</p>  `
}

function accountInviteMemberOrga(payload) {
  return `
  <p>Vous avez reçu une invitation a l'organization ${payload.orgaName} sur la plateforme LinTO Studio de la part de <strong>${payload.sharedByEmail}</strong>.</p>
  <p>Utilisez le lien unique ci-après pour accéder à cette ressource et lier un compte à votre adresse e-mail qui l’identifie. N'oubliez pas de définir un mot de passe pour les connexions futures en allant dans "Mon Compte" > "Modifier le mot de passe". </p>
  <p>Ce lien a une validité de 48h.</p>
  <p> Cliquez sur le lien pour accéder à votre compte: </p>
  <div style="margin: 0 auto 20px auto; padding:20px; background-color: #fff; max-width: 960px; min-width: 320px;"><p style="margin:0;"><a href="${payload.origin}/magiclink-auth/${payload.magicId}?type=invite_organization&organizationId=${payload.organizationId}" target="_blank">${payload.origin}/magiclink-auth/${payload.magicId}</a></p></div>
  `
}

function deleteMemberOrga(payload) {
  return `
  <p>Vous avez été supprimé de l'organization ${payload.orgaName} sur la plateforme LinTO Studio.</p>
  `
}

function updateMemberOrga(payload) {
  return `
  <p>Vos droit avez été mis à jour dans l'organization ${payload.orgaName} sur la plateforme LinTO Studio </strong>.</p>
  `
}

function unshareConversation(payload) {
  return `
  <p>Révocation de vos droit sur le média "${payload.name}.</p>
 `
}
function verifyEmailAddress(payload) {
  return `
  <p>Vous avez récemment modifié votre adresse email sur la plateforme LinTO Studio</p>
  <p>Cliquez sur ce lien ci-dessous pour vérifier que vous êtes bien le propriétaire de l'adresse email que vous avez renseigné.</p>
  <p>Ce lien a une validité de 30 minutes.</p>
  <div style="margin: 0 auto 20px auto; padding:20px; background-color: #fff; max-width: 960px; min-width: 320px;"><p style="margin:0;"><a href="${payload.origin}/magiclink-auth/${payload.magicId}?type=verify_mail" target="_blank">${payload.origin}/magiclink-auth/${payload.magicId}</a></p></div>
  `
}

function shareMultipleConversation(payload) {
  let conv_link = '<ul class="list-conversation">'
  for (let conv_id of payload.conversationsList) {
    conv_link += `<li><p style="margin:0;"><a href="${payload.origin}/interface/conversations/${conv_id}" target="_blank">${payload.origin}/interface/conversations/${conv_id}</a></p></li>`
  }
  conv_link += "</ul>"

  return `
  <p>Vous avez reçu une transcription de média sur la plateforme LinTO Studio de la part de <strong>${payload.sharedByEmail}</strong>.</p>
  <p>Cliquez sur les liens pour accéder aux transcriptions partagées : </p>

  ${conv_link}
  `
}
