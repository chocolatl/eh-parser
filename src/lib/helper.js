class Helper {
  // 根据显示评分的元素背景图片偏移获取大致的评分
  static getRatingByRatingElement(el) {
    const pos = el.style.backgroundPosition;
    const [, left, top] = /(\-?\d+)px (\-?\d+)px/.exec(pos);
    const rating = 5 + left / 16 - (top === '-21' ? 0.5 : 0);
    return rating;
  }
}

export default Helper;