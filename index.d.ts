interface SearchResultItem {
  title: string
  posted: string
  url: string
  cover: string
  category: string
  rating: number
  uploader: string
  favorite: {
    dir: number
    name: string
  } | null
}

export interface SearchPageResult {
  mode:
    | 'Minimal'
    | 'Minimal+'
    | 'Compact'
    | 'Extended'
    | 'Thumbnail'
    | 'Unknown'
  curPage: number
  maxPage: number
  prev: string | null
  next: string | null
  results: SearchResultItem[]
}

interface GalleryMetaData {
  ntitle: string
  jtitle: string
  cover: string
  category: string
  uploader: string
  posted: string
  parent: string
  visible: string
  language: string
  fileSize: string
  length: string
  favorite: {
    dir: number
    name: string
  }
  favorited: string
  ratingCount: number
  rating: number
  myRating: number | null
  tags: {
    namespace: string
    tags: {
      name: string
      power: string
      state: 'normal' | 'upvoted' | 'downvoted' | 'other'
    }[]
  }[]
}

export interface GalleryPageResult {
  curPage: number
  maxPage: number
  metaData: GalleryMetaData
  newerVersions: {
    url: string
    title: string
    posted: string
  }[]
  uploaderComment: {
    posted: string
    author: string
    content: string
  }
  comments: {
    posted: string
    author: string
    content: string
    score: string
  }[]
  imageList: {
    mode: 'normal' | 'large'
    list: {
      url: string
      thumb: string
      fileName: string
    }[]
  }
  apiInfo: {
    url: string
    gid: number
    token: string
    apiuid: number
    apikey: string
  }
}

export interface PicturePageResult {
  image: string
  original: string | null
  next: string | null
  curPage: number
  maxPage: number
  reloadCode: string
  fileName: string
}

namespace EHParser {
  export function parseSearchPage(
    document: Document,
    noPaging?: boolean
  ): SearchPageResult
  export function parseGalleryPage(document: Document): GalleryPageResult
  export function parsePicturePage(document: Document): PicturePageResult
}

export default EHParser
