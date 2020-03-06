const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const Sequelize = require('sequelize');
const sequelize = new Sequelize(config.database, config.username, config.password, config);
const models = require('../models');
const MessageType = require('../types/message_type')

const variables = {
    phoneNumbers: ["9191462735", "2198684114", "9198684336"],
    userIdOne: 1,userIdTwo: 2,userIdThree: 3,
    gameId: 1,
    completedGameId: 2,
    firstMessage: "I'm a fruit",
    thirdMessage: "I went to the store",
    secondMessage: "😁🍎🍐🥝",
};

const users = [
    {
        id: variables.userIdOne,
        firstName: "Blerp",
        lastName: "Person",
        phoneNumber: variables.phoneNumbers[0]
    },
    {
        id: variables.userIdTwo,
        firstName: "Two",
        lastName: "Cool",
        phoneNumber: variables.phoneNumbers[1]
    },
    {
        id: variables.userIdThree,
        firstName: "New",
        lastName: "doo",
        phoneNumber: variables.phoneNumbers[2]
    }
];

const turns = [
    {
        userId: variables.userIdOne,
        messageType: MessageType.text,
        nextUserId: variables.userIdTwo,
        isCurrent: true,
        gameId: variables.gameId
    },
    {
        userId: variables.userIdTwo,
        nextUserId: variables.userIdThree,
        isCurrent: false,
        gameId: variables.gameId
    },
    {
        userId: variables.userIdThree,
        isCurrent: false,
        gameId: variables.gameId
    }
];

const liveGameTurns = [

    {
        userId: variables.userIdThree,
        messageType: MessageType.text,
        isCurrent: false,
        message: variables.thirdMessage,
        receivedAt: new Date("4/13/2020"),
        nextUserId: variables.userIdFour,
        gameId: variables.completedGameId
    },
    {
        userId: variables.userIdFour,
        messageType: MessageType.text,
        isCurrent: false,
        gameId: variables.completedGameId
    },
    {
        userId: variables.userIdOne,
        messageType: MessageType.text,
        nextUserId: variables.userIdTwo,
        isCurrent: false,
        message: variables.firstMessage,
        receivedAt: new Date("4/10/2020"),
        gameId: variables.completedGameId
    },
    {
        userId: variables.userIdTwo,
        messageType: MessageType.emoji,
        nextUserId: variables.userIdThree,
        isCurrent: false,
        message: variables.secondMessage,
        receivedAt: new Date("4/11/2020"),
        gameId: variables.completedGameId
    }
]

variables["liveGameTurns"] = liveGameTurns;

module.exports = {
    variables: variables,
    truncateDatabase: () => {
        let promises = [];
        Object.values(models).map(function(model) {
            if (model.destroy) {
                promises.push(model.destroy({ truncate: {cascade: true} }));
            }
        });
        return Promise.all(promises);
    },
    seedDatabase: async () => {
        await module.exports.truncateDatabase();
        await models.user.bulkCreate(users);
        await models.turn.bulkCreate(turns.concat(liveGameTurns));
    }
}