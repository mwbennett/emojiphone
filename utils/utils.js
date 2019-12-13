const vCard = require('vcard');
var fetch = require('node-fetch');

/**
 * Provided an MMS vCard text message, fetch the vCard data and return a "User" js object (fname, lname, phone number).
 * @param  {BotKit Response} message 
 */
module.exports = {
    downloadVCard: async (message) => {
        const url = message.MediaUrl0;
        var card = new vCard();

        const response = await fetch(url, { redirect: 'follow' });
        const textContent = await response.text();

        return new Promise((resolve, reject) => {
        card.readData(textContent, function(err, json) {
            names = json.N.split(',');
            resolve({
                firstName: names[1].trim(),
                lastName: names[0].trim(),
                phoneNumber: json.TEL.value
            });
        });
      });
    }
}