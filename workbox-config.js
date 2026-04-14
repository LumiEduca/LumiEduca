module.exports = {
  globDirectory: 'build/',
  globPatterns: [
    '**/*.{json,ico,html,js,css,png,jpg,svg}'
  ],
  swDest: 'build/service-worker.js',
  clientsClaim: true,
  skipWaiting: true,
};