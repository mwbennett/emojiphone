const setupConversation = require('./conversations/setup');
// const turnConversation = require('./conversations/turn');
const utils = require('./utils/utils');
const models = require('./models');
const User = require('./models/user');

module.exports = {
    setup: function() {
        utils.createBot();
        utils.controller.setupWebserver(5000, function(err, server) {
            server.get('/', function(req, res) {
                res.send(':)');
            });1
            utils.controller.createWebhookEndpoints(server, utils.bot);
        })
        // models.turn.findByPk(17, {include: [{model: models.user, as: "user"}, {model: models.user, as: "nextUser"}]}).then(currentTurn => {
            // turnConversation.initiateTurnConversation(utils.bot, currentTurn, "emoji", "Take yer turn, nerd");
            // models.turn.findOne({where: {userId: previousTurn.nextUserId, gameId: previousTurn.gameId}, include: [{model: models.user, as: "nextUser"}]}).then(currentTurn => {
            //     console.log(currentTurn);
            // })
        // })
        // setupConversation.roundabout(utils.bot);
        utils.controller.hears([setupConversation.INITIATE_GAME_KEYWORD], 'message_received', (bot, message) => {setupConversation.initiateGameConversation(message)});    
        // controller.hears([setupConversation.INITIATE_GAME_KEYWORD], 'message_received', (utils.bot, message) => {
            // Just to get a sample turn in place
            // models.turn.findByPk(16, {include: [{model: models.user, as: "user"}, {model: models.user, as: "nextUser"}]}).then(turn => {
                // turnConversation.initiateTurnConversation(utils.bot, message, turn);
            // })
        // });    
    }
}
