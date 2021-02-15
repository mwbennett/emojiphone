const models = require('../models');
const { Op } = require('sequelize');

module.exports = {
    getLastPlayedGameByPhoneNumber: async (phoneNumber) => {
        const lastPlayedTurn = await module.exports.getLastPlayedTurnByPhoneNumber(phoneNumber)

        if (lastPlayedTurn) {
            return await models.game.findByPk(lastPlayedTurn.gameId);
        }
    },
    getCurrentGameByPhoneNumber: async (phoneNumber) => {
        const lastPlayedTurn = await module.exports.getLastPlayedTurnByPhoneNumber(phoneNumber)

        const lastPlayedGame = await models.game.findOne({
            where: {
                id: lastPlayedTurn.gameId
            }
        })

        if (lastPlayedGame && !lastPlayedGame.completed) {
            return lastPlayedGame
        } // what if else?!
    },
    isGameStillInProgress: async (gameId) => {
        let count = await models.turn.count({
            where: {
                gameId: gameId,
                isCurrent: true
            }
        })

        return count != 0
    }, 
    getLastPlayedTurnByPhoneNumber: async (phoneNumber) => {
        return await models.turn.findOne({
            where: {
                '$user.phoneNumber$': phoneNumber,
                receivedAt: {[Op.not]: null}
            },
            include: [
                {
                    model: models.user, as: "user",
                    attributes: ['phoneNumber']
                }
            ],
            order: [
                ['receivedAt', 'DESC']
            ]
        })
    }
}