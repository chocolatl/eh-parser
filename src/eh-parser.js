class EHParser {
  /**
   * 解析搜索结果页面数据
   * @param {object} document 搜索结果页面的document对象
   * @return {object}
   */
  static parseSearchPage(document, noPaging = false) {
    const messages = ['No hits found', 'No unfiltered results in this page range. You either requested an invalid page or used too aggressive filters'];

    for (const msg of messages) {
      if (document.body.textContent.includes(msg)) {
        throw new Error(msg);
      }
    }

    const getPageNum = href => {
      const r = /(?:\?|&)?page=(\d+)/.exec(href);
      return r ? +r[1] : 0;   // 搜索结果第一页可能没有page参数，r为null
    };

    function getDisplayMode() {
      const modes = ['Minimal', 'Minimal+', 'Compact', 'Extended', 'Thumbnail'];
      const mode = document.querySelector('#dms [selected]').textContent;
      if(modes.indexOf(mode) == -1) throw new Error('Unknown display mode');
      return mode;
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

    // 根据星星图片获取大致的评分
    function getRating(el) {
        const pos = el.style.backgroundPosition;
        const [, left, top] = /(\-?\d+)px (\-?\d+)px/.exec(pos);
        const rating = 5 + left / 16 - (top === '-21' ? 0.5 : 0);
        return rating;
    }

    function getListModeCover(el) {
      const thumb = el.querySelector('.glthumb > div:first-of-type > img');
      return thumb.getAttribute('data-src') || thumb.getAttribute('src')
    }

    // 获取Minimal、Minimal+、Compact模式下的搜索结果
    function getListModeResults() {
      const items = [].slice.call(document.querySelectorAll('.itg tr')).slice(1);

      return items.map(el => {
        const url   = el.querySelector('.glname > a').href;
        const title = el.querySelector('.glname > a > div:first-of-type').textContent;
        const cover = getListModeCover(el);
        const category = el.querySelector('td:nth-of-type(1) > div').textContent;
        const posted = el.querySelector('td:nth-of-type(2) > div:last-of-type').textContent;
        const rating = getRating(el.querySelector('.ir'));
        const uploader = el.querySelector('td:last-of-type > div:first-of-type').textContent;

        return {title, posted, url, cover, category, rating, uploader};
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

        return {title, posted, url, cover, category, rating, uploader};
      });
    }

    // 获取Thumbnail模式下的搜索结果
    function getThumbnailModeResults() {
      const items = [].slice.call(document.querySelectorAll('.itg > div'));

      return items.map(el => {
        const url   = el.children[0].href;
        const title = el.children[0].textContent;
        const cover = el.querySelector('.gl3t img').src;
        const category = el.querySelector('.gl5t .cs').textContent;
        const posted   = el.querySelector('.gl5t .cs').nextElementSibling.textContent;
        const rating   = getRating(el.querySelector('.gl5t .ir'));
        const uploader = '';    // Thumbnail模式下没有uploader信息

        return {title, posted, url, cover, category, rating, uploader};
      });
    }

    function getResults() {
      switch(getDisplayMode()) {
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

    if (noPaging) {
      return {
        mode: getDisplayMode(),
        results: getResults()
      };
    }

    return {
      mode: getDisplayMode(),
      curPage: getCurPage(),  // 当前页码，页码从0开始
      maxPage: getMaxPage(),  // 最大页码，页码从0开始
      ...getPrevNextLink(),   // prev, next
      results: getResults()   // 当前页面搜索结果
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
          favorited : getText(els[6]),
        };
      }
  
      function getRating() {
        return {
          ratingCount: +document.getElementById('rating_count').textContent,
          rating: +document.getElementById('rating_label').textContent.replace('Average: ', '')
        }
      }
  
      function getTags() {
        const els = [].slice.call(document.querySelectorAll('#taglist tr'));
        return els.map(el => {
          const namespace = el.children[0].textContent.slice(0, -1);
          const tagEls = [].slice.call(el.children[1].querySelectorAll('a'));
          const tags = tagEls.map(e => e.textContent);
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
      let list = [];
      const nosels = document.querySelectorAll('#gdo4 > .nosel');
      const mode = nosels[0].classList.contains('ths') ? 'normal' : 'large';
      
      // normal模式下没有thumb
      if(mode === 'normal') {
        const els = [].slice.call(document.querySelectorAll('.gdtm a'));
        list = els.map(e => ({url: e.href}));
      } else {
        const els = [].slice.call(document.querySelectorAll('.gdtl a'));
        list = els.map(e => ({
          url: e.href,
          thumb: e.children[0].src
        }));
      }
      
      return {mode, list};
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
      imageList: getImageList()
    }
  }

  /**
   * 解析图片页面数据
   * @param {object} document 图片页面的document对象
   * @return {object}
   */
  static parsePicturePage(document) {
    const imageEl  = document.getElementById('img');
    const image = imageEl.src;
    const next  = imageEl.parentElement.href;

    const originalEl  = document.querySelector('#i7 a');
    const original = originalEl && originalEl.href;    // originalURL可能不存在，这时值为null

    const spans = document.querySelector('.sn > div').querySelectorAll('span');
    const curPage = +spans[0].textContent;
    const maxPage = +spans[1].textContent;
    const reloadCode = /onclick=\"return nl\('(.*)'\)\"/.exec(document.getElementById('loadfail').outerHTML)[1];

    const imageInfoStr = document.querySelectorAll('#i2 > div')[1].textContent;
    const fileName = imageInfoStr.split(' :: ')[0];
    
    return {image, next, curPage, maxPage, reloadCode, original, fileName};
  }
}

if(typeof module !== 'undefined' && module.exports) {
  module.exports = EHParser;
} else {
  window.EHParser;
}