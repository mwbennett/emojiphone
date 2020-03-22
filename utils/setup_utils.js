const _ = require("underscore");

const MessageType = require('../types/message_type');
const models = require('../models');

// TODO: async/awaitify this page

module.exports = {
    MINIMUM_PLAYER_COUNT: 3,
    /**
    * Setup the game by instantiating users and turns
    * @param  {Object[]} newUsers  List of "User" objects to create in the database and then include in the game.
    * @param  {Object[]} existingUsers  List of users (each contained within it's own list of one item) already existing in the database to include in the game.
    */
    setupGame: (newUsers, existingUsers) => {
        if (!existingUsers) {
            existingUsers = [];
        }
        let promises = [];
        for(let user of newUsers) {
            promises.push(models.user.upsert(user, {returning: true}).catch(err => {
                console.log(err);
                throw err;
            }));
        }
        return Promise.all(promises).then((dbUsers) => {
            return module.exports.makeTurns(dbUsers.concat(existingUsers));
        });
    },

    /**
    * Create game turns given the players involved. Order should be random!
    * @param  {Object[]} dbUsers  List of users (each contained within it's own list of one item) from the database in the Sequelize format
    */
    makeTurns: async (dbUsers) => {
        dbUsers = _.shuffle(dbUsers);
        let isCurrent = true;
        let messageType = MessageType.text;
        let newGame;
        try {
            newGame = await models.game.create();
        } catch(e) {
            console.log(e);
            return new Promise((resolve, reject) => {
                reject("Could not create new game");
            })
        };
        let turnPromises = [];
        for (var i = 0; i < dbUsers.length; i++) {
            nextUserId = null;
            if (i < dbUsers.length - 1) {
                nextUserId = dbUsers[i + 1][0].id;
            }
            turnPromises.push(module.exports.makeTurn(dbUsers[i][0], nextUserId, isCurrent, newGame.id, messageType));
            isCurrent = false;
            messageType = null;
        }
        return Promise.all(turnPromises);
    },
    /**
    * Make a single turn in the game
    * @param  {Object} user  User who's turn it is
    * @param  {integer} nextUserId  Id of user who will go after the current user
    * @param  {boolean} isCurrent  Whether this user is first or not (isCurrent = true)
    * @param  {integer} gameId  Identifier for this round of the game
    * @param  {string} messageType  Type of message (emoji, text, or null)
    */
    makeTurn: (user, nextUserId, isCurrent, gameId, messageType) => {
        let turn = {
            userId: user.id,
            isCurrent: isCurrent,
            gameId: gameId,
            nextUserId: nextUserId,
            messageType: messageType
        }
        return models.turn.create(turn);
    },

    /**
     * Validate that we are ready to start the game!
     * @param  {Object[]} users  List of "User" objects to include in the game.
     */
    isGameReady: (users) => {
        return Array.isArray(users) && users.length >= module.exports.MINIMUM_PLAYER_COUNT - 1;
    },

    /**
     * Check if a set of users contrains an entry with the given phone number
     * @param  {Object[]} users  List of "User" objects.
     * @param  {String} phoneNumber  Phone number to check
     */
    containsPhoneNumber: (users, phoneNumber) => {
        return users.filter(user => user.phoneNumber == phoneNumber).length > 0
    }
}
