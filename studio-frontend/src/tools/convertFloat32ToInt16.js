export default function convertFloat32ToInt16(buffer) {
  let l = buffer.length
  const buf = new Int16Array(l)
  while (l--) {
    buf[l] = Math.min(1, buffer[l]) * 0x7fff
  }
  return buf.buffer
}
