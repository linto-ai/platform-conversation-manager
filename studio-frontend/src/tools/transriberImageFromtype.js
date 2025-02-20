export default function transriberImageFromtype(type) {
  switch (type) {
    case "microsoft":
      return "/img/microsoft.png"
    case "linto":
      return "/img/linto.svg"
    default:
      return "/img/question.svg"
  }
}
