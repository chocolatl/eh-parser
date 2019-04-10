"use strict";

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var EHParser =
/*#__PURE__*/
function () {
  function EHParser() {
    _classCallCheck(this, EHParser);
  }

  _createClass(EHParser, null, [{
    key: "parseSearchPage",

    /**
     * 解析搜索结果页面数据
     * @param {object} document 搜索结果页面的document对象
     * @return {object}
     */
    value: function parseSearchPage(document) {
      var getPageNum = function getPageNum(href) {
        var r = /(?:\?|&)?page=(\d+)/.exec(href);
        return r ? +r[1] : 0; // 搜索结果第一页可能没有page参数，r为null
      };

      function getDisplayMode() {
        var modes = ['Minimal', 'Minimal+', 'Compact', 'Extended', 'Thumbnail'];
        var mode = document.querySelector('#dms [selected]').textContent;
        if (modes.indexOf(mode) == -1) throw new Error('Unknown display mode');
        return mode;
      } // 搜索结果为空时返回-1


      function getCurPage() {
        var link = document.querySelector('.ptt .ptds > a');
        return link ? getPageNum(link.href) : -1;
      } // 搜索结果为空时返回-1


      function getMaxPage() {
        var links = document.querySelectorAll('.ptt a');
        var len = links.length;
        var isLast = !document.querySelector('.ptt td:last-child > a'); // 根据下一页的td中有没有a元素判断

        if (len === 0) return -1;
        if (isLast) return getPageNum(links[len - 1].href);else return getPageNum(links[len - 2].href);
      } // 根据星星图片获取大致的评分


      function getRating(el) {
        var pos = el.style.backgroundPosition;

        var _$exec = /(\-?\d+)px (\-?\d+)px/.exec(pos),
            _$exec2 = _slicedToArray(_$exec, 3),
            left = _$exec2[1],
            top = _$exec2[2];

        var rating = 5 + left / 16 - (top === '-21' ? 0.5 : 0);
        return rating;
      }

      function getListModeCover(el) {
        var thumb = el.querySelector('.glthumb > div:first-of-type > img');
        return thumb.getAttribute('data-src') || thumb.getAttribute('src');
      } // 获取Minimal、Minimal+、Compact模式下的搜索结果


      function getListModeResults() {
        var items = [].slice.call(document.querySelectorAll('.itg tr')).slice(1);
        return items.map(function (el) {
          var url = el.querySelector('.glname > a').href;
          var title = el.querySelector('.glname > a > div:first-of-type').textContent;
          var cover = getListModeCover(el);
          var category = el.querySelector('td:nth-of-type(1) > div').textContent;
          var posted = el.querySelector('td:nth-of-type(2) > div:last-of-type').textContent;
          var rating = getRating(el.querySelector('.ir'));
          var uploader = el.querySelector('td:last-of-type > div:first-of-type').textContent;
          return {
            title: title,
            posted: posted,
            url: url,
            cover: cover,
            category: category,
            rating: rating,
            uploader: uploader
          };
        });
      } // 获取Extended模式下的搜索结果


      function getExtendedModeResults() {
        var items = [].slice.call(document.querySelectorAll('.itg > tbody > tr'));
        return items.map(function (el) {
          var td1 = el.querySelector('td:nth-of-type(1)');
          var td2 = el.querySelector('td:nth-of-type(2)');
          var gl3es = td2.querySelectorAll('.gl3e > div');
          var url = td1.querySelector('a').href;
          var title = td1.querySelector('a > img').title;
          var cover = td1.querySelector('a > img').src;
          var category = gl3es[0].textContent;
          var posted = gl3es[1].textContent;
          var rating = getRating(gl3es[2]);
          var uploader = gl3es[3].textContent;
          return {
            title: title,
            posted: posted,
            url: url,
            cover: cover,
            category: category,
            rating: rating,
            uploader: uploader
          };
        });
      } // 获取Thumbnail模式下的搜索结果


      function getThumbnailModeResults() {
        var items = [].slice.call(document.querySelectorAll('.itg > div'));
        return items.map(function (el) {
          var url = el.children[0].href;
          var title = el.children[0].textContent;
          var cover = el.querySelector('.gl3t img').src;
          var category = el.querySelector('.gl5t .cs').textContent;
          var posted = el.querySelector('.gl5t .cs').nextElementSibling.textContent;
          var rating = getRating(el.querySelector('.gl5t .ir'));
          var uploader = ''; // Thumbnail模式下没有uploader信息

          return {
            title: title,
            posted: posted,
            url: url,
            cover: cover,
            category: category,
            rating: rating,
            uploader: uploader
          };
        });
      }

      function getResults() {
        switch (getDisplayMode()) {
          case 'Minimal':
          case 'Minimal+':
          case 'Compact':
            return getListModeResults();

          case 'Extended':
            return getExtendedModeResults();

          case 'Thumbnail':
            return getThumbnailModeResults();
        }
      }

      return {
        mode: getDisplayMode(),
        curPage: getCurPage(),
        // 当前页码，页码从0开始
        maxPage: getMaxPage(),
        // 最大页码，页码从0开始
        results: getResults() // 当前页面搜索结果

      };
    }
    /**
     * 解析画廊页面数据
     * @param {object} document 画廊页面的document对象
     * @return {object}
     */

  }, {
    key: "parseGalleryPage",
    value: function parseGalleryPage(document) {
      var getPageNum = function getPageNum(href) {
        var r = /(?:\?|&)?p=(\d+)/.exec(href);
        return r ? +r[1] : 0; // 搜索结果第一页可能没有p参数，r为null
      };

      function getCurPage() {
        var link = document.querySelector('.ptt .ptds > a');
        return getPageNum(link.href);
      }

      function getMaxPage() {
        var links = document.querySelectorAll('.ptt a');
        var isLast = !document.querySelector('.ptt td:last-child > a'); // 根据下一页的td中有没有a元素判断

        if (isLast) return getPageNum(links[links.length - 1].href);else return getPageNum(links[links.length - 2].href);
      }

      function getMetaData() {
        function getBaseInfo() {
          var els = document.querySelectorAll('#gdd tr');

          var getText = function getText(el) {
            return el.querySelector('.gdt2').textContent;
          };

          var hasHref = function hasHref(el) {
            return !!el.querySelector('.gdt2 > a');
          };

          var getHref = function getHref(el) {
            return el.querySelector('.gdt2 > a').href;
          };

          return {
            posted: getText(els[0]),
            parent: hasHref(els[1]) ? getHref(els[1]) : null,
            visible: getText(els[2]),
            language: getText(els[3]),
            fileSize: getText(els[4]),
            length: getText(els[5]),
            favorited: getText(els[6])
          };
        }

        function getRating() {
          return {
            ratingCount: +document.getElementById('rating_count').textContent,
            rating: +document.getElementById('rating_label').textContent.replace('Average: ', '')
          };
        }

        function getTags() {
          var els = [].slice.call(document.querySelectorAll('#taglist tr'));
          return els.map(function (el) {
            var subclass = el.children[0].textContent.slice(0, -1);
            var tagEls = [].slice.call(el.children[1].querySelectorAll('a'));
            var tags = tagEls.map(function (e) {
              return e.textContent;
            });
            return {
              subclass: subclass,
              tags: tags
            };
          });
        }

        var getCSSUrl = function getCSSUrl(html) {
          return /url\((.*?)\)/.exec(html)[1];
        };

        return _objectSpread({
          ntitle: document.getElementById('gn').textContent,
          jtitle: document.getElementById('gj').textContent,
          cover: getCSSUrl(document.querySelector('#gd1 > div').outerHTML),
          category: document.querySelector('#gdc > div').textContent,
          uploader: document.querySelector('#gdn > a').textContent
        }, getBaseInfo(), getRating(), {
          tags: getTags()
        });
      }

      function getNewerVersions() {
        var getVers = function getVers(el) {
          var els = [].slice.call(el.querySelectorAll('a'));
          return els.map(function (e) {
            return {
              url: e.href,
              title: e.textContent,
              posted: e.nextSibling.nodeValue.replace(', added ', '')
            };
          });
        };

        var el = document.getElementById('gnd');
        return el ? getVers(el) : [];
      }

      function getcomments() {
        var uploaderComment = null;
        var comments = [];
        var c1s = [].slice.call(document.querySelectorAll('.c1'));

        function getInfo(c1) {
          var text = c1.querySelector('.c3').textContent;
          var posted = /Posted on (.*?) UTC/.exec(text)[1];
          var author = c1.querySelector('.c3 > a').textContent;
          var content = c1.querySelector('.c6').innerHTML;
          return {
            posted: posted,
            author: author,
            content: content
          };
        }

        var getScore = function getScore(c1) {
          return c1.querySelector('.c5 > span').textContent;
        };

        if (c1s.length === 0) return {
          uploaderComment: uploaderComment,
          comments: comments
        };

        if (!c1s[0].querySelector('.c5')) {
          // 上传者评论如果存在则位于第一，而且没有.c5元素
          var el = c1s.shift();
          uploaderComment = getInfo(el);
        }

        comments = c1s.map(function (e) {
          return _objectSpread({}, getInfo(e), {
            score: getScore(e)
          });
        });
        return {
          uploaderComment: uploaderComment,
          comments: comments
        };
      }

      function getImageList() {
        var list = [];
        var nosels = document.querySelectorAll('#gdo4 > .nosel');
        var mode = nosels[0].classList.contains('ths') ? 'normal' : 'large'; // normal模式下没有thumb

        if (mode === 'normal') {
          var els = [].slice.call(document.querySelectorAll('.gdtm a'));
          list = els.map(function (e) {
            return {
              url: e.href
            };
          });
        } else {
          var _els = [].slice.call(document.querySelectorAll('.gdtl a'));

          list = _els.map(function (e) {
            return {
              url: e.href,
              thumb: e.children[0].src
            };
          });
        }

        return {
          mode: mode,
          list: list
        };
      }

      return _objectSpread({
        curPage: getCurPage(),
        // 当前页码，页码从0开始
        maxPage: getMaxPage(),
        // 最大页码，页码从0开始
        metaData: getMetaData(),
        // 该画廊更新的版本，示例：https://exhentai.org/g/1183625/18725a8da6
        newerVersions: getNewerVersions()
      }, getcomments(), {
        // 本页的图片列表
        imageList: getImageList()
      });
    }
    /**
     * 解析图片页面数据
     * @param {object} document 图片页面的document对象
     * @return {object}
     */

  }, {
    key: "parsePicturePage",
    value: function parsePicturePage(document) {
      var imageEl = document.getElementById('img');
      var image = imageEl.src;
      var next = imageEl.parentElement.href;
      var originalEl = document.querySelector('#i7 a');
      var original = originalEl && originalEl.href; // originalURL可能不存在，这时值为null

      var spans = document.querySelector('.sn > div').querySelectorAll('span');
      var curPage = +spans[0].textContent;
      var maxPage = +spans[1].textContent;
      var reloadCode = /onclick=\"return nl\('(.*)'\)\"/.exec(document.getElementById('loadfail').outerHTML)[1];
      var imageInfoStr = document.querySelectorAll('#i2 > div')[1].textContent;
      var fileName = imageInfoStr.split(' :: ')[0];
      return {
        image: image,
        next: next,
        curPage: curPage,
        maxPage: maxPage,
        reloadCode: reloadCode,
        original: original,
        fileName: fileName
      };
    }
  }]);

  return EHParser;
}();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EHParser;
} else {
  window.EHParser;
}
