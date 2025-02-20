const TITLE_NAME = "LinTO Studio"

module.exports = Object.freeze({
  TITLE_NAME: TITLE_NAME,
  ACCOUNT_CREATED: {
    type: `send_account_created`,
    title: `${TITLE_NAME} - Validation de votre compte`,
    subject: `Validation de votre compte`,
  },
  RESET_PASSWORD: {
    type: `send_reset_link`,
    title: `${TITLE_NAME} - Lien de connexion unique`,
    subject: `Lien de connexion unique`,
  },
  ACCOUNT_CREATE_INVITE_ORGANIZATION: {
    type: `send_account_create_invite_organization`,
    title: `${TITLE_NAME} - Invitation dans une organisation`,
    subject: `Invitation dans une organisation`,
  },
  INVITE_ORGANIZATION: {
    type: `send_invite_organization`,
    title: `${TITLE_NAME} - Invitation dans une organisation`,
    subject: `Invitation dans une organisation`,
  },
  UPDATE_ORGANIZATION_RIGHT: {
    type: `send_update_organization_right`,
    title: `${TITLE_NAME} - Modification de vos droits dans une organisation`,
    subject: `Modification de vos droits dans une organisation`,
  },
  DELETE_ORGANIZATION_RIGHT: {
    type: `send_delete_organization_right`,
    title: `${TITLE_NAME} - Révocation de vos droits dans une organisation`,
    subject: `Révocation de vos droits dans une organisation`,
  },
  SHARE_CONVERSATION: {
    type: `send_share_conversation`,
    title: `${TITLE_NAME} - Partage de conversation`,
    subject: `Partage d'une conversation`,
  },
  SHARE_CONVERSATION_EXTERNAL: {
    type: `send_share_external_link`,
    title: `${TITLE_NAME} - Partage de conversation`,
    subject: `Partage d'une conversation`,
  },
  SHARE_CONVERSATION_RIGHT_UPDATE: {
    type: `send_share_conversation_right_update`,
    title: `${TITLE_NAME} - Modification de vos droits sur une conversation`,
    subject: `Modification de vos droits sur une conversation`,
  },
  UNSHARE_CONVERSATION: {
    type: `send_unshare_conversation`,
    title: `${TITLE_NAME} - Révocation de vos droits sur une conversation`,
    subject: `Révocation de vos droit sur une conversation`,
  },
  VERIFY_ADDRESS_EMAIL: {
    type: `send_verify_email`,
    title: `${TITLE_NAME} - Vérification de votre adresse email`,
    subject: `Vérification de votre adresse email`,
  },
  SHARE_MULTIPLE_CONVERSATION_RIGHT: {
    type: `send_share_multiple_conversation_right`,
    title: `${TITLE_NAME} - Modification de vos droits sur plusieurs conversations`,
    subject: `Modification de vos droits sur plusieurs conversations`,
  },
  checkType: (TYPE, strType) => TYPE.type === strType,
})
