import {
  Number,
  String,
  Literal,
  Array,
  Union,
  Null,
  Undefined,
  Record,
  Static
} from 'runtypes'

const SearchResultItemSchema = Record({
  title: String,
  posted: String,
  url: String,
  cover: String,
  category: String,
  rating: Number,
  uploader: String,
  favorite: Record({
    dir: Number,
    name: String
  }).Or(Null)
})

const DisplayModeSchema = Union(
  Literal('Minimal'),
  Literal('Minimal+'),
  Literal('Compact'),
  Literal('Extended'),
  Literal('Thumbnail'),
  Literal('Unknown')
)

export const SearchPageResultCommonSchema = Record({
  mode: DisplayModeSchema,
  curPage: Number,
  maxPage: Number,
  prev: String.Or(Null),
  next: String.Or(Null),
  results: Array(SearchResultItemSchema),
  favoritesInfo: Record({
    order: Union(Literal('favorited'), Literal('posted')),
    dirs: Array(
      Record({
        num: Number,
        name: String
      })
    ),
    current: Number
  }).Or(Undefined)
})

export const SearchPageResultNoPageSchema = Record({
  mode: DisplayModeSchema,
  results: Array(SearchResultItemSchema)
})

export type SearchPageCommonResult = Static<typeof SearchPageResultCommonSchema>
export type SearchPageNoPageResult = Static<typeof SearchPageResultNoPageSchema>
