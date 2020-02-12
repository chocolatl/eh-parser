import Helper from './helper';

/**
 * @param {*} document 
 * @return {*}
 */
function parseGalleryPage(document) {
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

export default parseGalleryPage;