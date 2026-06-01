const fs = require('fs');
const https = require('https');
const file = fs.createWriteStream("C:/Users/Admin/.gemini/antigravity/brain/b4904348-3c67-480f-a399-274a3805d76b/qrcode.png");
https.get("https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=https://dreameraeker.github.io/TCT/", function(response) {
  response.pipe(file);
});
