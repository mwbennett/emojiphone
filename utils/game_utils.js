const models = require('../models');
const { Op } = require('sequelize');

module.exports = {
    getLastPlayedGameByPhoneNumber: async (phoneNumber) => {
        let lastPlayedTurn = await models.turn.findOne({
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

        return await models.game.findByPk(lastPlayedTurn.gameId);
    },
    isGameStillInProgress: async (gameId) => {
        let count = await models.turn.count({
            where: {
                gameId: gameId,
                isCurrent: true
            }
        })

        return count != 0
    }
}