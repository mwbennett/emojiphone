const turnUtils = require("./turn_utils");

module.exports = {
    makeMmsUrl: async (gameId, platform) => {
        let isGroupMessage = true;

        let messageAndPhoneNumbers = await turnUtils.getEndGameMessageWithPhoneNumbers(gameId, isGroupMessage);
        let phoneString = messageAndPhoneNumbers.phoneNumbers.join(',');

        let url = module.exports.makeBasicMmsUrl(platform, phoneString);

        url += `${encodeURI(messageAndPhoneNumbers.message)}`;

        return url;

    },
    makeBasicMmsUrl: async (platform, phoneString) => {
        let url = "sms://"

        if (platform == "ios") {
            url += `open?addresses=${phoneString};&body=`
        } else if (platform == "android") {
            url += `${phoneString};?body=`
        }
        return url;
    }
}