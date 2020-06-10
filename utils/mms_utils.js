const turnUtils = require("./turn_utils");

module.exports = {
    makeMmsUrl: async (gameId, platform) => {
        let isGroupMessage = true;

        let messageAndUsers = await turnUtils.getEndGameMessageWithUsers(gameId, isGroupMessage);
        let phoneString = messageAndUsers.users.map(u => u.phoneNumber).join(',');

        let url = "sms://"

        if (platform == "ios") {
            url += `open?addresses=${phoneString};&`
        } else if (platform == "android") {
            url += `${phoneString};?`
        }

        url += `body=${encodeURI(messageAndUsers.message)}`;

        return url;

    },
}