import formatCollaborativeText from "../formatCollaborativeText.js"
import test from "ava"

// single line tests
test("single line no changes", (t) => {
  let content = document.createElement("div")
  let text = "should not change in any way"
  content.innerText = text
  t.deepEqual(formatCollaborativeText(content, 10, 0, false), {
    formatedText: text,
    lineIndex: 0,
    cursorPosition: 10,
  })
})

test("single line no changes cursor begin", (t) => {
  let content = document.createElement("div")
  let text = "should not change in any way"
  content.innerText = text
  t.deepEqual(formatCollaborativeText(content, 0, 0, false), {
    formatedText: text,
    lineIndex: 0,
    cursorPosition: 0,
  })
})

test("single line no changes cursor end", (t) => {
  let content = document.createElement("div")
  let text = "should not change in any way"
  content.innerText = text
  t.deepEqual(formatCollaborativeText(content, text.length, 0, false), {
    formatedText: text,
    lineIndex: 0,
    cursorPosition: text.length,
  })
})

test("single line remove double space", (t) => {
  let content = document.createElement("div")
  let text = "there   should  be no    spaces"
  let expected = "there should be no spaces"
  content.innerText = text
  t.deepEqual(formatCollaborativeText(content, 10, 0, false), {
    formatedText: expected,
    lineIndex: 0,
    cursorPosition: 8,
  })
})

test("single line remove new line", (t) => {
  let content = document.createElement("div")
  let text = "there should be no new \nlines"
  let expected = "there should be no new lines"
  content.innerText = text
  t.deepEqual(formatCollaborativeText(content, 8, 0, false), {
    formatedText: expected,
    lineIndex: 0,
    cursorPosition: 8,
  })
})

// multiline tests
test("multiline no changes", (t) => {
  let content = document.createElement("div")
  content.innerText = ""

  let line1 = document.createElement("div")
  line1.innerText = "this is the first line"
  content.innerText += line1.innerText + "\n"

  let line2 = document.createElement("div")
  line2.innerText = "this is the second line"
  content.innerText += line2.innerText + "\n"

  let line3 = document.createElement("div")
  line3.innerText = "this is the third line"
  content.innerText += line3.innerText

  content.append(line1)
  content.append(line2)
  content.append(line3)

  let expected =
    "this is the first line\nthis is the second line\nthis is the third line"
  t.deepEqual(formatCollaborativeText(content, 8, 1, true), {
    formatedText: expected,
    lineIndex: 1,
    cursorPosition: 8,
  })
})

test("multiline no changes cursor 1st line", (t) => {
  let content = document.createElement("div")
  content.innerText = ""

  let line1 = document.createElement("div")
  line1.innerText = "this is the first line"
  content.innerText += line1.innerText + "\n"

  let line2 = document.createElement("div")
  line2.innerText = "this is the second line"
  content.innerText += line2.innerText + "\n"

  let line3 = document.createElement("div")
  line3.innerText = "this is the third line"
  content.innerText += line3.innerText

  content.append(line1)
  content.append(line2)
  content.append(line3)

  let expected =
    "this is the first line\nthis is the second line\nthis is the third line"
  t.deepEqual(formatCollaborativeText(content, 8, 0, true), {
    formatedText: expected,
    lineIndex: 0,
    cursorPosition: 8,
  })
})

test("multiline no changes cursor last line", (t) => {
  let content = document.createElement("div")
  content.innerText = ""

  let line1 = document.createElement("div")
  line1.innerText = "this is the first line"
  content.innerText += line1.innerText + "\n"

  let line2 = document.createElement("div")
  line2.innerText = "this is the second line"
  content.innerText += line2.innerText + "\n"

  let line3 = document.createElement("div")
  line3.innerText = "this is the third line"
  content.innerText += line3.innerText

  content.append(line1)
  content.append(line2)
  content.append(line3)

  let expected =
    "this is the first line\nthis is the second line\nthis is the third line"
  t.deepEqual(formatCollaborativeText(content, 8, 2, true), {
    formatedText: expected,
    lineIndex: 2,
    cursorPosition: 8,
  })
})

test("multiline changes", (t) => {
  let content = document.createElement("div")
  content.innerText = ""

  let line1 = document.createElement("div")
  line1.innerText = "this     is   the   first line"
  content.innerText += line1.innerText + "\n"

  let line2 = document.createElement("div")
  line2.innerText = "this   is the  second line"
  content.innerText += line2.innerText + "\n"

  let line3 = document.createElement("div")
  line3.innerText = "this is the   third line"
  content.innerText += line3.innerText

  content.append(line1)
  content.append(line2)
  content.append(line3)

  let expected =
    "this is the first line\nthis is the second line\nthis is the third line"
  t.deepEqual(formatCollaborativeText(content, 7, 1, true), {
    formatedText: expected,
    lineIndex: 1,
    cursorPosition: 5,
  })
})

test("multiline remove empty lines", (t) => {
  let content = document.createElement("div")
  content.innerText = ""

  let line1 = document.createElement("div")
  line1.innerText = "this     is   the   first line"
  let line2 = document.createElement("div")
  line2.innerText = "this   is the  second line"
  let line3 = document.createElement("div")
  line3.innerText = "this is the   third line"

  content.append(line1)
  content.innerText += line1.innerText + "\n"
  for (let i = 0; i < 3; i++) {
    let emptyLine = document.createElement("div")
    emptyLine.innerHTML = "<br>"
    emptyLine.innerText = "\n"
    content.append(emptyLine)
    content.innerText += "\n\n"
  }
  content.append(line2)
  content.innerText += line2.innerText + "\n"
  content.append(line3)
  content.innerText += line3.innerText

  let expected =
    "this is the first line\nthis is the second line\nthis is the third line"
  t.deepEqual(formatCollaborativeText(content, 7, 4, true), {
    formatedText: expected,
    lineIndex: 1,
    cursorPosition: 5,
  })
})

test("multiline remove empty lines cursor on empty line", (t) => {
  let content = document.createElement("div")
  content.innerText = ""

  let line1 = document.createElement("div")
  line1.innerText = "this     is   the   first line"
  let line2 = document.createElement("div")
  line2.innerText = "this   is the  second line"
  let line3 = document.createElement("div")
  line3.innerText = "this is the   third line"

  content.append(line1)
  content.innerText += line1.innerText + "\n"
  for (let i = 0; i < 3; i++) {
    let emptyLine = document.createElement("div")
    emptyLine.innerHTML = "<br>"
    emptyLine.innerText = "\n"
    content.append(emptyLine)
    content.innerText += "\n\n"
  }
  content.append(line2)
  content.innerText += line2.innerText + "\n"
  content.append(line3)
  content.innerText += line3.innerText

  let expected =
    "this is the first line\n\nthis is the second line\nthis is the third line"
  t.deepEqual(formatCollaborativeText(content, 0, 3, true), {
    formatedText: expected,
    lineIndex: 1,
    cursorPosition: 0,
  })
})

test("multiline remove empty lines in begining cursor on first non empty line", (t) => {
  let content = document.createElement("div")
  content.innerText = ""

  let line1 = document.createElement("div")
  line1.innerText = "this     is   the   first line"
  let line2 = document.createElement("div")
  line2.innerText = "this   is the  second line"
  let line3 = document.createElement("div")
  line3.innerText = "this is the   third line"

  for (let i = 0; i < 3; i++) {
    let emptyLine = document.createElement("div")
    emptyLine.innerHTML = "<br>"
    emptyLine.innerText = "\n"
    content.append(emptyLine)
    content.innerText += "\n\n"
  }
  content.append(line1)
  content.innerText += line1.innerText + "\n"
  content.append(line2)
  content.innerText += line2.innerText + "\n"
  content.append(line3)
  content.innerText += line3.innerText

  let expected =
    "this is the first line\nthis is the second line\nthis is the third line"
  t.deepEqual(formatCollaborativeText(content, 0, 3, true), {
    formatedText: expected,
    lineIndex: 0,
    cursorPosition: 0,
  })
})
