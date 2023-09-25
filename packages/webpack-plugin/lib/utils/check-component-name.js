module.exports = function (name) {
  const componentsNameList = ['button', 'checkbox', 'checkbox-group', 'form', 'icon', 'image', 'input', 'movable-are', 'movable-view',
    'navigator', 'picker', 'picker-view', 'picker-view-column', 'progress', 'radio', 'radio-group', 'rich-text', 'scroll-view',
    'slider', 'swiper', 'swiper-item', 'switch', 'text', 'textarea', 'video', 'view', 'web-view'
  ]
  return componentsNameList.includes(name)
}
