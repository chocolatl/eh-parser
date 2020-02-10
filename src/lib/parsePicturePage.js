function parsePicturePage(document) {
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

export default parsePicturePage;