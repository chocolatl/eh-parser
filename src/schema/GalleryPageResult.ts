import {
  Number,
  String,
  Literal,
  Array,
  Union,
  Null,
  Record,
  Static
} from 'runtypes'

const GalleryMetaDataSchema = Record({
  ntitle: String,
  jtitle: String,
  cover: String,
  category: String,
  uploader: String,
  posted: String,
  parent: String.Or(Null),
  visible: String,
  language: String,
  fileSize: String,
  length: String,
  favorite: Record({
    dir: Number,
    name: String
  }).Or(Null),
  favorited: String,
  ratingCount: Number,
  rating: Number,
  myRating: Number.Or(Null),
  tags: Array(
    Record({
      namespace: String,
      tags: Array(
        Record({
          name: String,
          power: String,
          state: Union(
            Literal('normal'),
            Literal('upvoted'),
            Literal('downvoted'),
            Literal('other')
          )
        })
      )
    })
  )
})

const NormalModeThumbListSchema = Record({
  mode: Literal('normal'),
  list: Array(
    Record({
      sprites: String,
      w: String,
      h: String,
      x: String,
      y: String,
      url: String,
      fileName: String
    })
  )
})

const LargeModeThumbListSchema = Record({
  mode: Literal('large'),
  list: Array(
    Record({
      url: String,
      thumb: String,
      fileName: String
    })
  )
})

export const GalleryPageResultSchema = Record({
  curPage: Number,
  maxPage: Number,
  metaData: GalleryMetaDataSchema,
  newerVersions: Array(
    Record({
      url: String,
      title: String,
      posted: String
    })
  ),
  uploaderComment: Record({
    posted: String,
    author: String,
    content: String
  }).Or(Null),
  comments: Array(
    Record({
      posted: String,
      author: String,
      content: String,
      score: String
    })
  ),
  imageList: Union(NormalModeThumbListSchema, LargeModeThumbListSchema),
  apiInfo: Record({
    url: String,
    gid: Number,
    token: String,
    apiuid: Number,
    apikey: String
  })
})

export type GalleryPageResult = Static<typeof GalleryPageResultSchema>
