const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:session:conversation`,
)

const axios = require(`${process.cwd()}/lib/utility/axios`)

const { v4: uuidv4 } = require("uuid")

const model = require(`${process.cwd()}/lib/mongodb/models`)
const DEFAULT_MEMBER_RIGHTS = 3
const DEFAULT_SPEAKER_NAME = "Unknown speaker"
const DEFAULT_TRANSLATION_NAME = "Automatic Translation"
const TYPES = require(`${process.cwd()}/lib/dao/conversation/types`)

const { SessionError } = require(
  `${process.cwd()}/components/WebServer/error/exception/session`,
)

function initConversationMultiChannel(
  session,
  name = undefined,
  type = TYPES.CANONICAL,
) {
  return {
    name: name || session.name,
    owner: session.owner,
    locale: "",
    organization: {
      organizationId: session.organizationId,
      membersRight: DEFAULT_MEMBER_RIGHTS,
      customRights: [],
    },
    sharedWithUsers: [],
    type: {
      mode: type,
      from_session_id: session.id,
      child_conversations: [],
    },
    tags: [],
    metadata: {
      channel: {
        channel_count: session.channels.length,
        channel_start_time: session.startTime,
        channel_end_time: session.endTime,
      },
    },
    jobs: {
      transcription: { state: "done" },
      keyword: {},
    },
  }
}

function initCaptionsForConversation(sessionData, name = undefined) {
  try {
    let session = JSON.parse(JSON.stringify(sessionData))
    let captions = []

    for (let channel of session.channels) {
      if (!channel.closedCaptions) {
        continue
      }

      if (name === undefined) {
        name = session.name || ""
      }

      let caption = initializeCaption(session, channel, name)
      processChannelCaptions(channel, caption, true)

      if (channel.translations.length !== 0) {
        for (let translation of channel.translations) {
          let tlCaption = initializeCaption(session, channel, name, translation)
          processChannelCaptions(channel, tlCaption, false)

          tlCaption.parentName = caption.name
          captions.push(tlCaption)
        }
      }

      if (channel.keepAudio === true) {
        let audioId = `${session.id}-${channel.id}`
        const audioData = {
          filename: audioId + ".mp3",
          duration: 0, // We generate duration when the conversation is fetch, audio don't exist now
          mimetype: "audio/mpeg",
          filepath: `${process.env.VOLUME_AUDIO_SESSION_PATH}/${audioId}.mp3`,
        }
        caption.metadata.audio = { ...audioData }
      }

      captions.push(caption)
    }
    return captions
  } catch (err) {
    throw err
  }
}

function initializeCaption(session, channel, name, translation) {
  let caption = {
    name: `${name} - ${channel.name}`,
    owner: session.owner,
    locale: channel.languages,
    organization: {
      organizationId: session.organizationId,
      membersRight: DEFAULT_MEMBER_RIGHTS,
      customRights: [],
    },
    type: {
      mode: TYPES.CHILD,
      from_session_id: session.id,
      child_conversations: [],
    },
    speakers: [],
    text: [],
    tags: [],
    jobs: {
      transcription: { state: "done" },
      keyword: {},
    },
    metadata: {
      channel: {
        channel_count: session.channels.length,
        channel_start_time: session.startTime,
        channel_end_time: session.endTime,
      },
    },
    sharedWithUsers: [],
    description: "",
  }

  if (translation) {
    caption.name = `${name} - ${channel.name} - ${translation}`
    caption.locale = translation
    caption.type.mode = TYPES.TRANSLATION
  }

  return caption
}

function processChannelCaptions(channel, caption, main = true) {
  let closedCaptions = channel.closedCaptions

  for (const channel_caption of closedCaptions) {
    let spk_id = ensureSpeaker(caption, channel_caption)

    let turn = createTurn(
      channel_caption,
      spk_id,
      main,
      channel.diarization,
      caption,
    )
    if (!turn) continue
    caption.text.push(turn)
  }
}

function ensureSpeaker(caption, channel_caption) {
  let speakerName
  if (caption.type.mode === TYPES.TRANSLATION)
    speakerName = DEFAULT_TRANSLATION_NAME
  else if (channel_caption.locutor) speakerName = channel_caption.locutor
  else speakerName = DEFAULT_SPEAKER_NAME

  let existingSpeaker = caption.speakers.find(
    (speaker) => speaker.speaker_name === speakerName,
  )

  if (!existingSpeaker) {
    const newSpeaker = {
      speaker_id: uuidv4(),
      speaker_name: speakerName,
      stime: channel_caption.start,
      etime: channel_caption.end,
    }
    caption.speakers.push(newSpeaker)
    return newSpeaker.speaker_id
  }

  return existingSpeaker.speaker_id
}

function createTurn(
  channel_caption,
  spk_id,
  main,
  diarization = false,
  caption,
) {
  if (main && diarization && !channel_caption.locutor) {
    return
  }
  let turn = {
    speaker_id: spk_id,
    turn_id: uuidv4(),
    raw_segment: channel_caption.text,
    segment: channel_caption.text,
    stime: channel_caption.start,
    etime: channel_caption.end,
    lang: channel_caption.lang,
    words: [],
  }
  if (
    caption.type.mode === TYPES.TRANSLATION &&
    channel_caption.translations[caption.locale]
  ) {
    turn.segment = channel_caption.translations[caption.locale] // || channel_caption.text
    turn.raw_segment = channel_caption.translations[caption.locale] //|| channel_caption.text
  } else if (
    caption.type.mode === TYPES.TRANSLATION &&
    !channel_caption.translations[caption.locale]
  )
    return

  turn.raw_segment.split(" ").forEach((word) => {
    turn.words.push({
      wid: uuidv4(),
      word: word,
    })
  })

  return turn
}

async function storeSession(session, name = undefined) {
  try {
    const captions = initCaptionsForConversation(session, name)
    let conversationMemory = []
    const { canonicalCount, translationCount } = countCaptions(captions)

    if (canonicalCount === 0) return

    const result =
      canonicalCount === 1
        ? await storeSingleConversation(captions, conversationMemory)
        : await storeMultiChannelConversation(
            captions,
            session,
            name,
            conversationMemory,
          )

    if (translationCount > 0) {
      await storeTranslations(captions, conversationMemory, result)
    }

    return result
  } catch (err) {
    throw err
  }
}

function countCaptions(captions) {
  let canonicalCount = 0
  let translationCount = 0
  for (let caption of captions) {
    if (caption.type.mode !== TYPES.TRANSLATION) {
      canonicalCount++ // count canonical & child
    } else {
      translationCount++ // count translations
    }
  }

  return { canonicalCount, translationCount }
}

async function storeSingleConversation(captions, conversationMemory) {
  let result
  for (let caption of captions) {
    if (caption.type.mode !== TYPES.TRANSLATION) {
      caption.type.mode = TYPES.CANONICAL
      result = await model.conversations.create(caption)
      conversationMemory.push({
        convId: result.insertedId.toString(),
        name: caption.name,
      })
    }
  }
  return result
}

async function storeMultiChannelConversation(
  captions,
  session,
  name,
  conversationMemory,
) {
  const main_conversation = initConversationMultiChannel(session, name)

  for (let caption of captions) {
    if (caption.type.mode === TYPES.TRANSLATION) continue
    let caption_result = await model.conversations.create(caption)
    main_conversation.type.child_conversations.push(
      caption_result.insertedId.toString(),
    )
    await model.categories.createDefaultCategories(
      "keyword",
      caption_result.insertedId.toString(),
    )
    conversationMemory.push({
      convId: caption_result.insertedId.toString(),
      name: caption.name,
    })
  }

  let result = await model.conversations.create(main_conversation)
  await model.categories.createDefaultCategories(
    "keyword",
    result.insertedId.toString(),
  )

  await updateChildConversations(
    main_conversation.type.child_conversations,
    result.insertedId.toString(),
  )

  return result
}

async function updateChildConversations(childConversations, parentId) {
  for (let childId of childConversations) {
    await model.conversations.update({
      _id: childId,
      "type.from_canonical_id": parentId,
      "type.from_parent_id": parentId,
    })
  }
}

async function storeTranslations(captions, conversationMemory, result) {
  for (let caption of captions) {
    if (caption.type.mode !== TYPES.TRANSLATION) continue

    const parent = conversationMemory.find(
      (conv) => conv.name === caption.parentName,
    )
    caption.type = {
      ...caption.type,
      from_parent_id: parent.convId,
      from_canonical_id: result.insertedId.toString(),
    }

    const result_translation = await model.conversations.create(caption)

    const parentConv = await model.conversations.getById(parent.convId)
    parentConv[0].type.child_conversations.push(
      result_translation.insertedId.toString(),
    )
    await model.conversations.update(parentConv[0])
  }
}

async function storeProxyResponse(session) {
  try {
    if (typeof session === "string") {
      session = JSON.parse(session)
    }
    const conversation = await storeSession(session)

    return JSON.stringify({
      ...session,
      conversationId: conversation.insertedId.toString(),
    })
  } catch (err) {
    return session
  }
}

async function storeSessionFromStop(req, next) {
  try {
    const session = await axios.get(
      process.env.SESSION_API_ENDPOINT + `/sessions/${req.params.id}`,
    )

    await storeSession(session, req.query.name)
    next()
  } catch (err) {
    next(err)
  }
}

async function storeQuickMeetingFromStop(req, next) {
  try {
    if (req.query.trash === "true") {
      next()
    } else {
      const session = await axios.get(
        process.env.SESSION_API_ENDPOINT + `/sessions/${req.params.id}`,
      )
      if (session.owner === req.payload.data.userId) {
        await storeSession(session, req.query.name)
        next()
      } else {
        throw new SessionError(
          "Quick meeting require to be the owner of the session",
        )
      }
    }
  } catch (err) {
    next(err)
  }
}

module.exports = {
  storeProxyResponse,
  storeSessionFromStop,
  storeQuickMeetingFromStop,
}
