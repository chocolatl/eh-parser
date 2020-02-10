import parseSearchPageInner from './lib/parseSearchPage'
import parseGalleryPageInner from './lib/parseGalleryPage'
import parsePicturePageInner from './lib/parsePicturePage'
import {
  SearchPageResultNoPageSchema,
  SearchPageResultCommonSchema,
  SearchPageNoPageResult,
  SearchPageCommonResult
} from './schema/SearchPageRusult'
import {
  GalleryPageResultSchema,
  GalleryPageResult
} from './schema/GalleryPageResult'
import {
  PicturePageResultSchema,
  PicturePageResult
} from './schema/PicturePageResult'

/**
 * 解析搜索结果页面数据
 * @param document 搜索结果页面的document对象
 * @param noPaging 为true时不解析分页相关信息
 */
function parseSearchPage(
  document: Document,
  noPaging: true
): SearchPageNoPageResult
function parseSearchPage(
  document: Document,
  noPaging?: boolean
): SearchPageCommonResult
function parseSearchPage(
  document: Document,
  noPaging: boolean = false
): any {
  if (noPaging) {
    const result = parseSearchPageInner(document, noPaging)
    return SearchPageResultNoPageSchema.check(result)
  } else {
    const result = parseSearchPageInner(document, noPaging)
    return SearchPageResultCommonSchema.check(result)
  }
}

/**
 * 解析画廊页面数据
 * @param document 画廊页面的document对象
 */
function parseGalleryPage(document: Document) {
  const result = parseGalleryPageInner(document)
  return GalleryPageResultSchema.check(result)
}

/**
 * 解析图片页面数据
 * @param document 图片页面的document对象
 */
function parsePicturePage(document: Document) {
  const result = parsePicturePageInner(document)
  return PicturePageResultSchema.check(result)
}

export {
  parseSearchPage,
  parseGalleryPage,
  parsePicturePage,
  SearchPageNoPageResult,
  SearchPageCommonResult,
  GalleryPageResult,
  PicturePageResult
}

export default {
  parseSearchPage,
  parseGalleryPage,
  parsePicturePage
}
