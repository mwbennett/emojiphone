const MessageType = require('../types/message_type');
const models = require('../models');
const emojiRegex = require('emoji-regex');
const emojiReg = emojiRegex();
const textRegex = /[a-zA-Z0-9\.\!\+\$\#\@\_\&\-\+\(\)\/\*\"\'\:\;\!\?\~\`\|\•\√\π\÷\×\¶\∆\£\¢\€\¥\^\°\=\{\}\\\]\[\✓\%\<\>\%\/\*\-\+\ç\ß\à\á\â\ä\æ\ã\å\ā\è\é\ē\ê\ë\û\ú\ù\ü\ū\î\ì\ï\í\ī\ó\ø\œ\ō\ô\ö\õ\ò\ñ]+/

module.exports = {
    isValidResponse: (response, messageType) => {
        response = response.replace(/\s+/g, '');
        if (messageType == MessageType.text) {
            return !emojiReg.test(response);
        }
        else if (messageType == MessageType.emoji) {
            return !textRegex.test(response);
        }
        return false;
    },
    oppositeMessageType: (messageType) => {
        if (messageType == MessageType.text) {
            return MessageType.emoji;
        } else {
            return MessageType.text;
        }
    },
    getCurrentTurn: async (gameId) => {
        return await models.turn.findOne({where: {gameId: gameId, isCurrent: true}, include: [{model: models.user, as: "user"}]})
    }
}