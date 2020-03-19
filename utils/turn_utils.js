const MessageType = require('../types/message_type');
const { Op } = require('sequelize');
const models = require('../models');
const utils = require('../utils/utils');
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
    sendEndGameMessage: async (gameId) => {
        let messageAndPhoneNumbers = await module.exports.getEndGameMessageWithPhoneNumbers(gameId);
        console.log(messageAndPhoneNumbers);

        for (let phoneNumber of messageAndPhoneNumbers.phoneNumbers) {
            console.log(phoneNumber);
            utils.bot.say({text: messageAndPhoneNumbers.message, channel: phoneNumber}, (err, response) => {
                if (err) {
                    console.log(err);
                }
            });
        }
    },
    getEndGameMessageWithPhoneNumbers: async (gameId) => {
        let usersAndMessages = await module.exports.getUsersAndMessagesFromGameId(gameId);

        let message = `Your game of Emojiphone has completed! Here's the full transcript:
        `

        let phoneNumbers = [];

        for (let userMessage of usersAndMessages) {
            let user = userMessage.user;
            phoneNumbers.push(user.phoneNumber);
            let name = user.firstName;
            name += (user.lastName) ? " " + user.lastName : "";
            message += `
${name}: ${userMessage.message}`
        }

        let groupMessage = message + `

This is a group text with all members of the game where you can discuss your results!`;

        let mmsUrls = mmsUtils.makeMmsUrls(message, phoneNumbers);

        message += `

If you'd like to start a group message to discuss your game, just click one of the following links!
Android: ${mmsUrls.android}
iOS: ${mmsUrls.ios}`

        return {
            phoneNumbers: phoneNumbers,
            message: message
        };

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
                        attributes: ['firstName', 'lastName', 'phoneNumber']
                    }
                ],
                order: [
                    ['receivedAt', 'ASC']
                ]
            }
        )
    }
}