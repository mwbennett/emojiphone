const MessageType = require('../types/message_type');
const models = require('../models');

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
    },
    getCurrentTurn: async (gameId) => {
        return await models.turn.findOne({where: {gameId: gameId, isCurrent: true}, include: [{model: models.user, as: "user"}]})
    }
}