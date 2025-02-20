import test from "ava"
import splitPartialSubtitles from "../splitPartialSubtitles.js"
import { getIndexesWhereToCutText } from "../splitPartialSubtitles.js"

function computeIfTextIsTooLong(text) {
  return text.length > 12
}

test("divide word on first line", (t) => {
  const state1 = { previousText: "", previousIndexes: [] }
  t.deepEqual(splitPartialSubtitles(state1, "lorem", computeIfTextIsTooLong), {
    previousText: "lorem",
    previousIndexes: [],
  })
  const state2 = { previousText: "lorem", previousIndexes: [] }
  t.deepEqual(
    splitPartialSubtitles(state2, "lorem ipsum", computeIfTextIsTooLong),
    {
      previousText: "lorem ipsum",
      previousIndexes: [],
    },
  )
  const state3 = { previousText: "lorem ipsum", previousIndexes: [] }
  t.deepEqual(
    splitPartialSubtitles(state3, "lorem ipsum dolor", computeIfTextIsTooLong),
    {
      previousText: "lorem ipsum dolor",
      previousIndexes: [2],
    },
  )
  const state4 = { previousText: "lorem ipsum dolor", previousIndexes: [2] }
  t.deepEqual(
    splitPartialSubtitles(
      state4,
      "lorem hip soume dolor sit",
      computeIfTextIsTooLong,
    ),
    {
      previousText: "lorem hip soume dolor sit",
      previousIndexes: [3],
    },
  )
  const state5 = {
    previousText: "lorem hip soume dolor sit",
    previousIndexes: [3],
  }
  t.deepEqual(
    splitPartialSubtitles(
      state5,
      "lorem hip soume dolor sit amet",
      computeIfTextIsTooLong,
    ),
    {
      previousText: "lorem hip soume dolor sit amet",
      previousIndexes: [3, 5],
    },
  )
})

test("change last word of line", (t) => {
  // const state = {
  //   previousText: "lorem ipsum",
  //   previousIndexes: [],
  // }

  // t.deepEqual(
  //   splitPartialSubtitles(state, "lorem ipsom dolor", computeIfTextIsTooLong),
  //   {
  //     previousText: "lorem ipsom dolor",
  //     previousIndexes: [2],
  //   },
  // )

  // const state2 = {
  //   previousText: "lorem ipsum",
  //   previousIndexes: [],
  // }

  // t.deepEqual(
  //   splitPartialSubtitles(
  //     state2,
  //     "lorem ipsumomomo dolor",
  //     computeIfTextIsTooLong,
  //   ),
  //   {
  //     previousText: "lorem ipsumomomo dolor",
  //     previousIndexes: [2],
  //   },
  // )

  // const state3 = {
  //   previousText: "lorem ipsum",
  //   previousIndexes: [],
  // }

  // t.deepEqual(
  //   splitPartialSubtitles(state3, "lorem ipsumomomo", computeIfTextIsTooLong),
  //   {
  //     previousText: "lorem ipsumomomo",
  //     previousIndexes: [2],
  //   },
  // )

  const state4 = { previousText: "lorem ipsum dolor", previousIndexes: [2] }

  t.deepEqual(
    splitPartialSubtitles(
      state4,
      "lorem ipsumomomo dolor",
      computeIfTextIsTooLong,
    ),
    {
      previousText: "lorem ipsumomomo dolor",
      previousIndexes: [2],
    },
  )
})

test("cut long text two times", (t) => {
  t.deepEqual(
    getIndexesWhereToCutText(
      "lorem ipsum dolor sit amet",
      computeIfTextIsTooLong,
    ),
    [2, 4],
  )
})

test("don't cut short text", (t) => {
  t.deepEqual(
    getIndexesWhereToCutText("lorem ipsum", computeIfTextIsTooLong),
    [],
  )
})

test("keep first modified word of line in his own line", (t) => {
  t.deepEqual(
    splitPartialSubtitles(
      { previousText: "lorem ipsum do", previousIndexes: [2] },
      "lorem ipsum dolor",
      computeIfTextIsTooLong,
    ),
    {
      previousText: "lorem ipsum dolor",
      previousIndexes: [2],
    },
  )
})
