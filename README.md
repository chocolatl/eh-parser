解析e-hentai与exhentai各个页面的元数据

## 使用

在浏览器环境中`eh-parser.js`将导出全局变量`window.EHParser`，在Node.js中将导出为CommonJS模块

### 浏览器

EHParser通过解析DOM对象的文档节点获取数据，假设现在处于E站搜索结果页面，可以插入以下代码获取搜索数据：

```js
  const data = EHParser.parseSearchPage(document);
  console.log(data);
```

也可以通过[DOMParser API](https://developer.mozilla.org/zh-CN/docs/Web/API/DOMParser)来获取其它页面的DOM对象：

```js
  fetch('https://exhentai.org/g/1183625/18725a8da6', {
    credentials: 'same-origin'    // 发送cookie
  })
  .then(res => res.text())
  .then(html => {
    const document = new DOMParser().parseFromString(html, 'text/html');
    const data = EHParser.parseGalleryPage(document);
    console.log(data);
  });
```

### Node.js

在Node环境中，需要使用[jsdom](https://github.com/jsdom/jsdom)或类似的库获取DOM对象的文档节点

```js
  const JSDOM = require('jsdom').JSDOM;
  const EHParser = require('eh-parser');

  const document = new JSDOM(/* E站搜索结果页面的HTML文本 */).window.document;
  const data = EHParser.parseGalleryPage(document);
  console.log(data);
```

## API

### EHParser.parseSearchPage(document, noPaging?)

解析搜索结果页面数据，如：https://exhentai.org

返回结果示例：

```js
{
  "mode": "Minimal+",
  "curPage": 0,         // 当前页码，页码从0开始
  "maxPage": 25310,     // 最大页码，页码从0开始
  "prev": null,         // 搜索结果的上一页链接
  "next": "https://exhentai.org/?page=1",   // 搜索结果的下一页链接
  "results": [          // 当前页面的搜索结果
    {
      "title": "(C94) [あめうさぎ (飴玉コン)] CONFITURE (ご注文はうさぎですか?) [中国翻訳]",
      "posted": "2018-11-25 15:17",
      "url": "https://exhentai.org/g/1319745/713400a20b/",
      "cover": "https://exhentai.org/t/60/8f/608f41dd673776c1a47c0ca70275f98342c6884f-2697059-2116-3000-jpg_l.jpg",
      "category": "Doujinshi",
      "rating": 4.5,     // 评分精度为0.5
      "uploader": "BlossomPlus"     // 该字段在Thumbnail模式下为空字符串
    },
    // ...
  ]
}
```

解析`/favorites`页面会得到一个额外的`favoritesInfo`字段，包含以下内容：

```js
{
  "order": "favorited",      // 排序方式：favorited或posted
  "dirs": [
    {
      "num": 49,             // 收藏数
      "name": "Favorites 0"  // 收藏夹名
    },
    {
      "num": 0,
      "name": "Favorites 1"
    }
  ],
  "current": -1              // 当前显示的收藏夹，对应dirs数组的序号，-1表示Show All Favorites
}
```

如果`noPaing`参数传入`true`，那么返回对象中将仅包含`mode`和`results`字段。该选项用于获取无分页器的搜索页面，如`/popular`

注意：搜索结果为空（'No hits found', 'No unfiltered results in this page range. You either requested an invalid page or used too aggressive filters'...）时也会抛出异常

### EHParser.parseGalleryPage(document)

解析画廊页面数据，如：https://exhentai.org/g/1183625/18725a8da6

返回结果示例：

```js
{
  "curPage": 0,     // 当前页码，页码从0开始
  "maxPage": 9,     // 最大页码，页码从0开始
  "metaData": {
    "ntitle": "さざなみみぉ pixiv作品合集",
    "jtitle": "",
    "cover": "https://ehgt.org/t/05/1c/051cedd0089ebce224b14ccc98ba89d67ff3f284-954244-800-1119-jpg_250.jpg",
    "category": "Non-H",
    "uploader": "囧途末路",
    "posted": "2018-02-11 13:05",
    "parent": "https://exhentai.org/g/1161712/7d773196aa/",
    "visible": "No (Replaced)",
    "language": "Japanese",
    "fileSize": "182.2 MB",
    "length": "195 pages",
    "favorited": "368 times",
    "ratingCount": 76,      // 评分人数
    "rating": 4.53,         // 平均评分
    "tags": [
      {
        "namespace": "parody",
        "tags": ["touhou project"]
      },
      {
        "namespace": "character",
        "tags": ["youmu konpaku"]
      },
      // ...
    ]
  },
  "newerVersions": [
    {
      "url": "https://exhentai.org/g/1205262/5bc2e2c3a6/",
      "title": "さざなみみぉ pixiv作品合集（不定期更新）",
      "posted": "2018-03-31 04:49"
    },
    {
      "url": "https://exhentai.org/g/1230782/a41bc04e18/",
      "title": "さざなみみぉ pixiv作品合集（不定期更新）",
      "posted": "2018-05-27 05:09"
    },
    // ...
  ],
  "uploaderComment": {
    "posted": "11 February 2018, 13:05",
    "author": "囧途末路",
    "content": "P站著名妖梦控画师的P站作品合集,按从早到晚顺序排列"
  },
  "comments": [
    {
      "posted": "30 December 2017, 07:12",
      "author": "536753924",
      "content": "画师没有好坏之分，但是さざなみみぉ，你的妖梦最可爱啦！",
      "score": "+41"
    },
    {
      "posted": "30 December 2017, 07:42",
      "author": "HamburgerHelper",
      "content": "Youmu is love.",
      "score": "+11"
    },
    // ...
  ],
  "imageList": {
    "mode": "large",        // mode为"normal"或"large"，与账号设置有关
    "list": [
      {
        "url": "https://exhentai.org/s/051cedd008/1183625-1",
        "thumb": "https://ehgt.org/05/1c/051cedd0089ebce224b14ccc98ba89d67ff3f284-954244-800-1119-jpg_l.jpg",
        "fileName": "001.jpg"
      },
      {
        "url": "https://exhentai.org/s/11286cf784/1183625-2",
        "thumb": "https://ehgt.org/11/28/11286cf7840f1726cdda95f619aaacd7d5a1f9fex1190142-800-1125-jpg_l.jpg",
        "fileName": "002.jpg"
      },
      // ...
    ]
  },
  "apiInfo": {
    "url": "https://exhentai.org/api.php",
    "gid": "1183625",
    "token": "18725a8da6",
    "apiuid": "",
    "apikey": ""
  }
}
```

模式为`normal`时的`imageList`字段：

```js
{
  "mode": "normal",
  "list": [
    {
      "sprites": "https://exhentai.org/m/001183/1183625-00.jpg",   // CSS Sprites，通过w、h、x、y可以计算出缩略图位置
      "w": "100px",
      "h": "140px",
      "x": "0px",
      "y": "0px",
      "url": "https://exhentai.org/s/051cedd008/1183625-1",
      "fileName": "001.jpg"
    },
    // ...
  ]
```

文件大小等字段与网页显示结果一致，意味着不是一个精确的数值，如果需要精确的数值可以调用[官方API](https://ehwiki.org/wiki/API)获取

### EHParser.parsePicturePage(document)

解析图片页面数据，如：https://exhentai.org/s/594b7edc82/1183625-31

返回结果示例：

```js
{
  "image": "http://144.197.142.91:8484/h/647afa68f7a97d990f360262f0e3bab872fbd501-216944-900-900-jpg/keystamp=1543465500-a9c0673140;fileindex=24684240;xres=2400/Masterpiece.jpg",
  "original": "https://exhentai.org/fullimg.php?gid=1316052&page=3&key=0cz2qum96tg",    // 原图下载链接，不存在时为null
  "next": "https://exhentai.org/s/eeda3df9cf/1316052-4",                                // 下一张图片的页面
  "curPage": 4,     // 当前页码，页码从1开始
  "maxPage": 220,   // 最大页码，页码从1开始
  "reloadCode": "23626-428740",
  "fileName": "Masterpiece.jpg"
}
```

`reloadCode`字段用于生成页面中`Click here if the image fails loading`的链接：

```js
  const imagePageURL = 'https://exhentai.org/s/594b7edc82/1183625-31';
  const reloadURL    = imagePageURL + (imagePageURL.indexOf('?') > -1 ? '&' : '?') + 'nl=' + reloadCode;
```

## 许可证

```
GLWT（祝你好运）公共许可证
版权所有（C）每个人，除了作者

任何人都被允许复制、分发、修改、合并、销售、出版、再授权或
任何其它操作，但风险自负。

作者对这个项目中的代码一无所知。
代码处于可用或不可用状态，没有第三种情况。


                祝你好运公共许可证
            复制、分发和修改的条款和条件

0：在不导致作者被指责或承担责任的情况下，你可以做任何你想
要做的事情。

无论是在合同行为、侵权行为或其它因使用本软件产生的情形，作
者不对任何索赔、损害承担责任。

祝你好运及一帆风顺
```