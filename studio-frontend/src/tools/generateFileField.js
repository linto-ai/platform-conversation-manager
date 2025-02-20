import EMPTY_FIELD from "@/const/emptyField"
import { testFile } from "@/tools/fields/testFile"

export function generateFileField(name, file, uploadType = "file") {
  return {
    ...EMPTY_FIELD,
    value: name,
    file: file,
    testField: testFile,
    id: Math.random().toString(36).substring(2),
    progress: 0,
    uploadType,
  }
}
