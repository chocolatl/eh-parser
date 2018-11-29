class EHParser {
  /**
   * 解析搜索结果页面数据
   * @param {string} document 搜索结果页面的document对象
   * @return {object}
   */
  static parseSearchPage(document) {
    const last = arr => arr[arr.length - 1];

    const getPageNum = href => {
      const r = /(?:\?|&)?page=(\d+)/.exec(href);
      return r ? +r[1] : 0;   // 搜索结果第一页可能没有page参数，r为null
    };

    // 搜索结果为空时返回-1
    function getCurPage() {
      const link = document.querySelector('.ptt .ptds > a');
      return link ? getPageNum(link.href) : -1;
    }

    // 搜索结果为空时返回-1
    function getMaxPage() {
      const links = document.querySelectorAll('.ptt a');
      const len = links.length;
      const isLast = !document.querySelector('.ptt td:last-child > a');   // 根据下一页的td中有没有a元素判断
  
      if (len === 0) return -1;

      if (isLast) return getPageNum(links[len - 1].href);
      else return getPageNum(links[len - 2].href);
    }

    function getListModeCover(el) {
      // 提取缩略图地址参照E站主页show_image_pane和load_pane_image函数的代码
      const linkHTML = el.querySelector('.it5 > a').outerHTML;
      const id = /onmouseover="show_image_pane\((\d+)\)"/.exec(linkHTML)[1];
      const parts = document.getElementById('i' + id).textContent.split('~');
  
      if (parts.length >= 4) {
        return parts[0].replace('init', 'http') + '://' + parts[1] + '/' + parts[2];
      } else {
        // 搜索结果首张缩略图是已经加载出来的，这时parts.length < 4，document.getElementById('i' + id)获得的是包裹缩略图的元素
        return document.getElementById('i' + id).querySelector('img').src;
      }
    }

    // 显示模式与账号设置有关，默认为列表模式，当账号设置为略缩图模式时该方法无法正常工作
    // 搜索结果为空时返回空数组
    function getListModeResults() {
      const items = [].slice.call(document.querySelectorAll('.gtr0, .gtr1'));

      return items.map(el => {
        const url   = el.querySelector('.it5 > a').href;
        const title = el.querySelector('.it5 > a').textContent;
        const cover = getListModeCover(el);
        const category = last(el.querySelector('.itdc > a').href.split('/'));
        const posted = el.querySelector('.itd').textContent;

        // 根据星星图片获取大致的评分
        const pos = el.querySelector('.it4r').style.backgroundPosition;
        const [, left, top] = /(\-?\d+)px (\-?\d+)px/.exec(pos);
        const rating = 5 + left / 16 - (top === '-21' ? 0.5 : 0);

        return {title, posted, url, cover, category, rating};
      });
    }

    return {
      curPage: getCurPage(),          // 当前页码，页码从0开始
      maxPage: getMaxPage(),          // 最大页码，页码从0开始
      results: getListModeResults()   // 当前页面搜索结果
    };
  }

  /**
   * 解析画廊页面数据
   * @param {string} document 画廊页面的document对象
   * @return {object}
   */
  static parseGalleryPage(document) {
    const last = arr => arr[arr.length - 1];

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
          language  : getText(els[3]),
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
          const subclass = el.children[0].textContent.slice(0, -1);
          const tagEls = [].slice.call(el.children[1].querySelectorAll('a'));
          const tags = tagEls.map(e => e.textContent);
          return {subclass, tags};
        });
      }

      const getCSSUrl = html => /url\((.*?)\)/.exec(html)[1];

      return {
        ntitle: document.getElementById('gn').textContent,
        jtitle: document.getElementById('gj').textContent,
        cover: getCSSUrl(document.querySelector('#gd1 > div').outerHTML),
        category: last(document.querySelector('#gdc > a').href.split('/')),
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
   * @param {string} document 图片页面的document对象
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