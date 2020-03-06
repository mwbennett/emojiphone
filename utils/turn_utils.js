const MessageType = require('../types/message_type');
const { Op } = require('sequelize');
const models = require('../models');
const emojiRegex = require('emoji-regex');
const emojiReg = emojiRegex();
const textReg = /[a-zA-Z0-9\.\!\+\$\#\@\_\&\-\+\(\)\/\*\"\'\:\;\!\?\~\`\|\•\√\π\÷\×\¶\∆\£\¢\€\¥\^\°\=\{\}\\\]\[\✓\%\<\>\%\/\*\-\+\ç\ß\à\á\â\ä\æ\ã\å\ā\è\é\ē\ê\ë\û\ú\ù\ü\ū\î\ì\ï\í\ī\ó\ø\œ\ō\ô\ö\õ\ò\ñ]+/

module.exports = {
    isValidResponse: (response, messageType) => {
        response = response.replace(/\s+/g, '');
        if (messageType == MessageType.text) {
            return !emojiReg.test(response);
        }
        else if (messageType == MessageType.emoji) {
            return !textReg.test(response);
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
    },
    getUsersAndMessagesFromGameId: async (gameId) => {
        return await models.turn.findAll(
            {
                attributes: ['message'],
                where: {
                    gameId: gameId,
                    message: {[Op.not]: null}
                }, 
                include: [
                    {
                        model: models.user, as: "user",
                        attributes: ['firstName', 'lastName']
                    }
                ],
                order: [
                    ['receivedAt', 'ASC']
                ]
            }
        )
    },
    getEndGameMessage: async (gameId) => {
        let usersAndMessages = await module.exports.getUsersAndMessagesFromGameId(gameId);

        let message = `Round completed! Here's the full transcript:
        `

        for (let userMessage of usersAndMessages) {
            let user = userMessage.user;
            let name = user.firstName;
            name += (user.lastName) ? " " + user.lastName : "";
            message += `
${name}: ${userMessage.message}`
        }

        return message;

    }
}