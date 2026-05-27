const https = require('https');

const urls = [
  'https://phi-scrubber-13754652105.us-central1.run.app/apple-video-bg.mp4',
  'https://phi-scrubber-13754652105.us-central1.run.app/hero-demo.mp4',
  'https://phi-scrubber-13754652105.us-central1.run.app/video-placeholder.png'
];

urls.forEach(url => {
  https.get(url, (res) => {
    console.log(`URL: ${url}`);
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
    console.log(`Headers:`, res.headers);
    console.log('--------------------------------------------------');
  }).on('error', (e) => {
    console.error(`Error for ${url}:`, e.message);
  });
});
