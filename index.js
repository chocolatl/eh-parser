class Helper {
  // 根据显示评分的元素背景图片偏移获取大致的评分
  static getRatingByRatingElement(el) {
    const pos = el.style.backgroundPosition;
    const [, left, top] = /(\-?\d+)px (\-?\d+)px/.exec(pos);
    const rating = 5 + left / 16 - (top === '-21' ? 0.5 : 0);
    return rating;
  }
}

class EHParser {
  /**
   * 解析搜索结果页面数据
   * @param {object} document 搜索结果页面的document对象
   * @param {boolean} noPaging 为true时不解析分页相关信息
   * @return {object}
   */
  static parseSearchPage(document, noPaging = false) {
    const messages = ['No hits found', 'No unfiltered results in this page range. You either requested an invalid page or used too aggressive filters'];
    const isEmpty = messages.some(msg => document.body.textContent.includes(msg));
    const displayMode = getDisplayMode();
    const isFavorites = !!document.querySelector('.fp.fps');

    const getRating = Helper.getRatingByRatingElement

    const getPageNum = href => {
      const r = /(?:\?|&)?page=(\d+)/.exec(href);
      return r ? +r[1] : 0;   // 搜索结果第一页可能没有page参数，r为null
    };

    function getDisplayMode() {
      try {
        const modes = ['Minimal', 'Minimal+', 'Compact', 'Extended', 'Thumbnail'];
        const mode = document.querySelector('#dms [selected]').textContent;
        if(modes.indexOf(mode) == -1) throw new Error('Unknown display mode');
        return mode;
      } catch (err) {
        return 'Unknown';
      }
    }

    // 页码从0开始
    function getCurPage() {
      const link = document.querySelector('.ptt .ptds > a');
      const page = link ? getPageNum(link.href) : -1;

      if (page === -1) throw new Error('Can not get current page number');
      return page;
    }

    // 页码从0开始
    function getMaxPage() {
      const links = document.querySelectorAll('.ptt a');
      const len = links.length;
      const isLast = !document.querySelector('.ptt td:last-child > a');   // 根据下一页的td中有没有a元素判断
  
      if (len === 0) throw new Error('Can not get maximum page number');
      if (isLast) return getPageNum(links[len - 1].href);
      else return getPageNum(links[len - 2].href);
    }

    function getPrevNextLink() {
      const prevEl = document.querySelector('.ptt td:first-child > a');
      const nextEl = document.querySelector('.ptt td:last-child > a');
      return {
        prev: prevEl ? prevEl.href : null,
        next: nextEl ? nextEl.href : null
      };
    }

    function getListModeCover(el) {
      const thumb = el.querySelector('.glthumb > div:first-of-type > img');
      return thumb.getAttribute('data-src') || thumb.getAttribute('src')
    }

    function getFavoriteInfo(el) {
      const style = el.getAttribute('style');
      if (!style) return null;
      const result = /border-color:(.*?);/.exec(style);
      if (!result) return null;
      const color = result[1];
      const dirsColor = ['#000','#f00','#fa0','#dd0','#080','#9f4','#4bf','#00f','#508','#e8e'];
      const dir = dirsColor.findIndex(e => e === color);
      const name = el.getAttribute('title');
      return {dir, name};
    }

    // 获取Minimal、Minimal+、Compact模式下的搜索结果
    function getListModeResults() {
      const items = [].slice.call(document.querySelectorAll('.itg tr')).slice(1);

      return items.map(el => {
        const url   = el.querySelector('.glname > a').href;
        const title = el.querySelector('.glname > a > div:first-of-type').textContent;
        const cover = getListModeCover(el);
        const category = el.querySelector('td:nth-of-type(1) > div').textContent;
        const postedEl = displayMode !== 'Compact'
          ? el.querySelector('td:nth-of-type(2) > div:last-of-type')
          : el.querySelector('td:nth-of-type(2) > div:last-of-type').children[0]
        ;
        const posted = postedEl.textContent;
        const rating = getRating(el.querySelector('.ir'));
        const uploader = isFavorites ? '' : el.querySelector('td:last-of-type > div:first-of-type').textContent;   // 这三种模式下的收藏页面没有uploader信息
        const favorite = getFavoriteInfo(postedEl);
        return {title, posted, url, cover, category, rating, uploader, favorite};
      });
    }

    // 获取Extended模式下的搜索结果
    function getExtendedModeResults() {
      const items = [].slice.call(document.querySelectorAll('.itg > tbody > tr'));

      return items.map(el => {
        const td1 = el.querySelector('td:nth-of-type(1)');
        const td2 = el.querySelector('td:nth-of-type(2)');
        const gl3es = td2.querySelectorAll('.gl3e > div');

        const url   = td1.querySelector('a').href;
        const title = td1.querySelector('a > img').title;
        const cover = td1.querySelector('a > img').src;
        const category = gl3es[0].textContent;
        const posted   = gl3es[1].textContent;
        const rating   = getRating(gl3es[2]);
        const uploader = gl3es[3].textContent;
        const favorite = getFavoriteInfo(gl3es[1]);

        return {title, posted, url, cover, category, rating, uploader, favorite};
      });
    }

    // 获取Thumbnail模式下的搜索结果
    function getThumbnailModeResults() {
      const items = [].slice.call(document.querySelectorAll('.itg > div'));

      return items.map(el => {
        const url   = el.querySelector('.gl3t > a').href;
        const title = el.children[0].textContent;
        const cover = el.querySelector('.gl3t img').src;
        const category = el.querySelector('.gl5t .cs').textContent;
        const postedEl = el.querySelector('.gl5t .cs').nextElementSibling;
        const posted   = postedEl.textContent;
        const rating   = getRating(el.querySelector('.gl5t .ir'));
        const uploader = '';    // Thumbnail模式下没有uploader信息
        const favorite = getFavoriteInfo(postedEl);

        return {title, posted, url, cover, category, rating, uploader, favorite};
      });
    }

    // 获取收藏页面的排序方式和收藏夹信息
    function getFavoritesPageInfo() {
      const dirEls = [].slice.call(document.querySelectorAll('.fp:not(:last-child)'));   // 最后一个.fp是Show All Favorites
      const current = dirEls.findIndex(e => e.classList.contains('fps'));    // 返回当前目录序号，-1表示当前目录是Show All Favorites
      const dirs = dirEls.map(e => {
        const num = +e.children[0].textContent;
        const name = e.children[e.children.length - 1].textContent;
        return {num, name}
      });
      const linkEls = [].slice.call(document.querySelectorAll('a'));
      const order = linkEls.find(e => e.href.includes('inline_set=fs_f')) ? 'posted' : 'favorited';
      return {order, dirs, current};
    }

    function getResults() {
      switch(displayMode) {
        case 'Minimal':
        case 'Minimal+':
        case 'Compact':
          return getListModeResults();
        case 'Extended':
          return getExtendedModeResults();
        case 'Thumbnail':
          return getThumbnailModeResults();
        default:
          throw new Error('Unknown display mode')
      }
    }

    if (noPaging) {
      return {
        mode: displayMode,
        results: isEmpty ? [] : getResults()
      };
    }

    return {
      mode: displayMode,
      curPage: isEmpty ? 0 : getCurPage(),    // 当前页码，页码从0开始
      maxPage: isEmpty ? 0 : getMaxPage(),    // 最大页码，页码从0开始
      results: isEmpty ? [] : getResults(),   // 当前页面搜索结果
      ...(isEmpty ? {prev: null, next: null} : getPrevNextLink()),   // prev, next
      ...(isFavorites && {favoritesInfo: getFavoritesPageInfo()})
    };
  }

  /**
   * 解析画廊页面数据
   * @param {object} document 画廊页面的document对象
   * @return {object}
   */
  static parseGalleryPage(document) {
    const getPageNum = href => {
      const r = /(?:\?|&)?p=(\d+)/.exec(href);
      return r ? +r[1] : 0;   // 搜索结果第一页可能没有p参数，r为null
    };

    function getCurPage() {
      const link = document.querySelector('.ptt .ptds > a');
      return getPageNum(link.href);
    }

    function getMaxPage() {
      const links = document.querySelectorAll('.ptt a');
      const isLast = !document.querySelector('.ptt td:last-child > a');   // 根据下一页的td中有没有a元素判断

      if (isLast) return getPageNum(links[links.length - 1].href);
      else return getPageNum(links[links.length - 2].href);
    }

    function getMetaData() {

      function getBaseInfo() {
        const els = document.querySelectorAll('#gdd tr');
        const getText = el => el.querySelector('.gdt2').textContent;
        const hasHref = el => !!el.querySelector('.gdt2 > a');
        const getHref = el => el.querySelector('.gdt2 > a').href;
        return {
          posted    : getText(els[0]),
          parent    : hasHref(els[1]) ? getHref(els[1]) : null,
          visible   : getText(els[2]),
          language  : getText(els[3]).trim(),
          fileSize  : getText(els[4]),
          length    : getText(els[5]),
          favorited : getText(els[6])
        };
      }
  
      function getRating() {
        const ratingImage = document.getElementById('rating_image')
        const getMyRating = () => Helper.getRatingByRatingElement(ratingImage)
        return {
          ratingCount: +document.getElementById('rating_count').textContent || 0,
          myRating: /ir[rgb]/.test(ratingImage.className) ? getMyRating() : null,
          rating: +document.getElementById('rating_label').textContent.replace('Average: ', '') || 0
        }
      }
  
      function getFavoriteInfo() {
        const el = document.querySelector('#fav .i');
        if (!el) return null;
        const style = el.getAttribute('style');
        const [, y] = /background-position:0px -(\d*?)px;/.exec(style);
        const dir = (y - 2) / 19;
        const name = el.title;
        return {dir, name};
      }

      function getTags() {
        const els = [].slice.call(document.querySelectorAll('#taglist tr'));

        const getTagState = e => {
          if (!e.className) return 'normal';
          if (e.className === 'tup') return 'upvoted';
          if (e.className === 'tdn') return 'downvoted';
          return 'other';
        };
        
        return els.map(el => {
          const namespace = el.children[0].textContent.slice(0, -1);
          const tagEls = [].slice.call(el.children[1].querySelectorAll('a'));
          const tags = tagEls.map(e => {
            const tagWrapCls = e.parentElement.classList;
            const name = e.textContent;
            const power = tagWrapCls.contains('gt') ? '100+' : (tagWrapCls.contains('gtl') ? '10+' : '1+');
            const state = getTagState(e);
            return {name, power, state};
          });
          return {namespace, tags};
        });
      }

      const getCSSUrl = html => /url\((.*?)\)/.exec(html)[1];

      return {
        ntitle: document.getElementById('gn').textContent,
        jtitle: document.getElementById('gj').textContent,
        cover: getCSSUrl(document.querySelector('#gd1 > div').outerHTML),
        category: document.querySelector('#gdc > div').textContent,
        uploader: document.querySelector('#gdn > a').textContent,
        ...getBaseInfo(),
        ...getRating(),
        favorite: getFavoriteInfo(),
        tags: getTags()
      }
    }

    function getNewerVersions() {
      const getVers = el => {
        const els = [].slice.call(el.querySelectorAll('a'));
        return els.map(e => ({
          url   : e.href,
          title : e.textContent,
          posted: e.nextSibling.nodeValue.replace(', added ', '')
        }));
      }
      const el = document.getElementById('gnd');
      return el ? getVers(el) : [];
    }

    function getcomments() {
      let uploaderComment = null;
      let comments = [];
      const c1s = [].slice.call(document.querySelectorAll('.c1'));

      function getInfo(c1) {
        const text = c1.querySelector('.c3').textContent;
        const posted = /Posted on (.*?) UTC/.exec(text)[1];
        const author = c1.querySelector('.c3 > a').textContent;
        const content = c1.querySelector('.c6').innerHTML;
        return {posted, author, content};
      }

      const getScore = c1 => c1.querySelector('.c5 > span').textContent;

      if(c1s.length === 0) return {uploaderComment, comments};

      if(!c1s[0].querySelector('.c5')) {    // 上传者评论如果存在则位于第一，而且没有.c5元素
        const el = c1s.shift();
        uploaderComment = getInfo(el);
      }

      comments = c1s.map(
        e => ({
          ...getInfo(e),
          score: getScore(e)
        })
      );

      return {uploaderComment, comments};
    }

    function getImageList() {
      const nosels = document.querySelectorAll('#gdo4 > .nosel');
      const mode = nosels[0].classList.contains('ths') ? 'normal' : 'large';
      const getFileName = img => /^Page \d+: (.*)$/.exec(img.title)[1];

      const getNormalModeList = () => {
        const els = [].slice.call(document.querySelectorAll('.gdtm > div'));
        const getURL = (s) => /url\((.*)\)/.exec(s)[1].replace(/(^'|^")|('$|"$)/g, '');
        return els.map(e => {
          const a = e.children[0];
          const img = a.children[0];
          
          return {
            sprites: getURL(e.style.backgroundImage),
            w: e.style.width,
            h: e.style.height,
            x: e.style.backgroundPositionX,
            y: e.style.backgroundPositionY,
            url: a.href,
            fileName: getFileName(img)
          }
        });
      };

      const getLargeModeList = () => {
        const els = [].slice.call(document.querySelectorAll('.gdtl a'));
        return els.map(e => ({
          url: e.href,
          thumb: e.children[0].src,
          fileName: getFileName(e.children[0])
        }));
      };
      
      const list = mode === 'normal' ? getNormalModeList() : getLargeModeList();
      
      return {mode, list};
    }

    function getApiInfo() {
      const els = [].slice.call(document.querySelectorAll('script'));
      const info = {};
      for (const el of els) {
        let result = null;
        const regex = /var (api_url|gid|token|apiuid|apikey) = "?(.*?)"?;/g;
        while (result = regex.exec(el.textContent)) {
          const [, key, value] = result;
          key === 'api_url' ? 
            info.url = value : 
            info[key] = value
          ;
        }
      }
      info.gid = +info.gid;
      info.apiuid = +info.apiuid;
      return info;
    }

    return {
      curPage: getCurPage(),   // 当前页码，页码从0开始
      maxPage: getMaxPage(),   // 最大页码，页码从0开始

      metaData: getMetaData(),

      // 该画廊更新的版本，示例：https://exhentai.org/g/1183625/18725a8da6
      newerVersions: getNewerVersions(),

      // 评论列表，仅包含页面内可见评论，可能不是该画廊所有评论
      ...getcomments(),

      // 本页的图片列表
      imageList: getImageList(),

      apiInfo: getApiInfo()
    }
  }

  /**
   * 解析图片页面数据
   * @param {object} document 图片页面的document对象
   * @return {object}
   */
  static parsePicturePage(document) {
    const originalEl  = document.querySelector('#i7 a');
    const original = originalEl && originalEl.href;    // originalURL可能不存在，这时值为null

    const spans = document.querySelector('.sn > div').querySelectorAll('span');
    const curPage = +spans[0].textContent;
    const maxPage = +spans[1].textContent;
    const reloadCode = /onclick=\"return nl\('(.*)'\)\"/.exec(document.getElementById('loadfail').outerHTML)[1];

    const imageInfoStr = document.querySelectorAll('#i2 > div')[1].textContent;
    const fileName = imageInfoStr.split(' :: ')[0];

    const imageEl  = document.getElementById('img');
    const image = imageEl.src;
    const next  = curPage === maxPage ? null : imageEl.parentElement.href;

    return {image, next, curPage, maxPage, reloadCode, original, fileName};
  }
}

if(typeof module !== 'undefined' && module.exports) {
  module.exports = EHParser;
} else {
  window.EHParser;
}