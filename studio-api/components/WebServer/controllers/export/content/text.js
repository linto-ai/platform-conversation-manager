const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:controllers:export:content:text`,
)

const docx = require("docx")
const {
  AlignmentType,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,
  TableLayoutType,
} = docx

const { createTextRun } = require("./documentComponents.js")
const { format, parseISO, addSeconds } = require("date-fns")

const { en } = require("date-fns/locale")
const { DateTime } = require("luxon")

const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

function processTurn(paragraphs_content, data) {
  const conversation = data.text
  const lines = conversation.data.split("\n")

  //TODO: WIP to clean
  // metadata.speakers = metadata.speakers.map(speaker => speaker.charAt(0).toUpperCase() + speaker.slice(1))
  data.speakers = data.speakers.flatMap((speaker) => [
    speaker,
    speaker.charAt(0).toUpperCase() + speaker.slice(1),
    speaker.replace(" :", ":"),
    (speaker.charAt(0).toUpperCase() + speaker.slice(1)).replace(" :", ":"),
  ])

  let last_spk = ""
  lines
    .filter((turn) => turn !== "")
    .map((turn) => {
      let children = []

      if (turn.startsWith("- ")) {
        turn = turn.substring(2)
      } else if (turn.startsWith(" - ")) {
        turn = turn.substring(3)
      }

      if (data.speakers.length === 0) {
        children.push(new TextRun(turn))
      } else {
        // const phrasePattern = new RegExp(`\\b(${metadata.speakers.join('|')})\\b`, 'ig')
        const phrasePattern = new RegExp(`(${data.speakers.join("|")})`, "ig")
        const segments = turn.split(phrasePattern)

        for (const segment of segments) {
          if (segments.length === 1)
            // No speaker name found
            children.push(new TextRun("\t" + segment))
          else if (data.speakers.some((phrase) => segment.includes(phrase))) {
            if (last_spk !== segment) {
              children.push(createTextRun("\t" + segment, true))
              last_spk = segment
            } else {
              children.push(createTextRun("\t"))
            }
          } else children.push(new TextRun(segment))
        }
      }

      paragraphs_content.push(
        new Paragraph({
          tabStops: [
            {
              type: TabStopType.LEFT,
              position: 300,
            },
          ],
          children,
          rightToLeft: true,
          alignment: AlignmentType.JUSTIFIED,
        }),
      )
      paragraphs_content.push(new Paragraph({}))
    })

  return paragraphs_content
}

function processTurnTable(paragraphs_content, conversation, data, query) {
  let TZ,
    offsetMinutes,
    startTime = -1
  if (conversation?.metadata?.channel?.channel_start_time) {
    startTime = conversation.metadata.channel.channel_start_time
    TZ = query.timezone || systemTimezone
    const dt = DateTime.now().setZone(TZ)
    if (!dt.isValid) TZ = systemTimezone

    offsetMinutes = DateTime.now().setZone(systemTimezone).offset
  }

  let lang = conversation.locale
  const lines = []
  for (const text of conversation.text) {
    let datetime
    if (startTime !== -1) {
      const startDatetime = addSeconds(
        parseISO(startTime),
        text.stime + offsetMinutes * 60,
      )
      datetime = format(startDatetime, "HH:mm", { locale: en })
    } else {
      if (text.stime === undefined || text.etime === undefined) {
        datetime =
          text.words[0].stime + " - " + text.words[text.words.length - 1].etime
      } else datetime = text.stime + " - " + text.etime

      datetime = (Math.trunc(parseFloat(datetime) * 100) / 100).toString() // Trunc time to 2 decimals
    }

    let displayLang = lang
    if (text.lang) lang = text.lang
    if (Array.isArray(lang)) {
      displayLang = lang.join(" - ")
    } else {
      if (lang === "*") lang = "en" // We force the language to be English on multi language models
      displayLang = new Intl.DisplayNames(["en"], { type: "language" }).of(lang)
    }

    lines.push({
      datetime: datetime,
      language: displayLang,
      speaker: conversation.speakers.find(
        (speaker) => speaker.speaker_id === text.speaker_id,
      ).speaker_name,
      text: text.segment,
    })
  }

  const rows = []
  for (const line of lines) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: line.datetime,
                    size: 18,
                  }),
                  new TextRun({
                    text: line.language,
                    break: 1,
                    size: 18,
                  }),
                  new TextRun({
                    text: line.speaker,
                    break: 1,
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.LEFT,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: line.text,
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.LEFT,
              }),
            ],
          }),
        ],
      }),
    )
  }

  paragraphs_content.push(
    new Table({
      rows: rows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      layout: TableLayoutType.FIXED,
      columnWidths: [33, 66],
      alignment: AlignmentType.LEFT,
    }),
  )

  return paragraphs_content
}

module.exports = {
  processTurn,
  processTurnTable,
}
