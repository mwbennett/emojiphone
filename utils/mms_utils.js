const turnUtils = require("./turn_utils");

module.exports = {
    makeMmsUrl: async (gameId, platform) => {
        let messageAndPhoneNumbers = await turnUtils.getEndGameMessageWithPhoneNumbers(gameId, true);
        let phoneString = messageAndPhoneNumbers.phoneNumbers.join(',');

        let url = "sms://"

        if (platform == "ios") {
            url += `open?addresses=${phoneString};&`
        } else if (platform == "android") {
            url += `${phoneString};?`
        }

        url += `body=${encodeURI(messageAndPhoneNumbers.message)}`;

        return url;

    },
}