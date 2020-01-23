const MessageType = require('../types/message_type');

module.exports = {
    isValidResponse: (response, messageType) => {
        if (response != "BAD") {
            return true;
        }
        return false;
    },
    oppositeMessageType: (messageType) => {
        if (messageType == MessageType.text) {
            return MessageType.emoji;
        } else {
            return MessageType.text;
        }
    }
}