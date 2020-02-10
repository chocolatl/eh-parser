import Helper from './helper';

/**
 * 解析搜索结果页面数据
 * @param {object} document 搜索结果页面的document对象
 * @param {boolean} noPaging 为true时不解析分页相关信息
 * @return {object}
 */
function parseSearchPage(document, noPaging = false) {
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
      if (modes.indexOf(mode) == -1) throw new Error('Unknown display mode');
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

export default parseSearchPage;