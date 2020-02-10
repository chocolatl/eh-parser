import { Number, String, Null, Record, Static } from 'runtypes'

export const PicturePageResultSchema = Record({
  image: String,
  original: String.Or(Null),
  next: String.Or(Null),
  curPage: Number,
  maxPage: Number,
  reloadCode: String,
  fileName: String
})

export type PicturePageResult = Static<typeof PicturePageResultSchema>
