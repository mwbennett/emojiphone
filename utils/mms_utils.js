let fetch = require("node-fetch");
let linkRequest = {
  destination: "sms://open?addresses=+15552345678,+15552345679;?&body=Your%20game%20of%20Emojiphone%20has%20completed!%20Here%27s%20the%20full%20transcript%3A%0A%20%20%20%20%20%20%20%20%0ASam%20Rispaud%3A%20Social%20distancing%0AEllen%20Currin%3A%20%F0%9F%91%AD%E2%9D%8C%F0%9F%99%8D%F0%9F%93%8F%F0%9F%93%8F%F0%9F%93%8F%F0%9F%93%8F%F0%9F%93%8F%F0%9F%93%8F%F0%9F%99%8D%0AKay-Anne%20Reid%3A%20Two%20best%20friends%20cut%20their%20ties%0AEvan%20Snyder%3A%20%F0%9F%92%91%E2%9C%82%EF%B8%8F%F0%9F%91%94%F0%9F%91%94%0ABetsy%20Cooper%3A%20Love%20scissoring%20and%20ties",
  domain: { fullName: "rebrand.ly" }
}
const URL_DOMAIN = "https://api.rebrandly.com/v1/links"
// Move to method to avoid duplication
let requestParams = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": "8de3b0183c404fb7bb17e44d0259e27c",
      "workspace": "f0e59097426344b288c2c6f00a3a29e6"
    }
}

request(, (err, response, body) => {
  let link = JSON.parse(body);
  console.log(`Long URL was ${link.destination}, short URL is ${link.shortUrl}`);
});

module.exports = {
    makeMmsUrls: async (message, phoneNumbers) => {
        let phoneString = phoneNumbers.join(',');
        let iosUrl = `sms://open?addresses=${phoneString};?body=${encodeURI(message)}`;
        let androidUrl = `sms://${phoneString};?body=${encodeURI(message)}`;

        let iosParams = requestParams;
        iosParams["body"] = JSON.stringify({destination: iosUrl});

        let androidParams = requestParams;
        androidParams["body"] = JSON.stringify({destination: androidUrl})

        let shortIosUrl = await fetch(URL_DOMAIN, iosParams)

        console.log(shortIosUrl);

    }
}