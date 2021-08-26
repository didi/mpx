module.exports = {
  extend: '@vuepress/theme-default',
  plugins: [
    ['@vuepress/search', {
      searchMaxSuggestions: 10
    }],
    ['@vuepress/back-to-top']
  ]
}