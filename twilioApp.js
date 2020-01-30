const setupConversation = require('./conversations/setup');
const turnConversation = require('./conversations/turn');
const utils = require('./utils/utils');
const models = require('./models');
const User = require('./models/user');

module.exports = {
    setup: function() {
        utils.createBot();
        utils.controller.setupWebserver(5000, function(err, server) {
            server.get('/', function(req, res) {
                res.send(':)');
            });
            utils.controller.createWebhookEndpoints(server, utils.bot);
        })
        utils.controller.hears([setupConversation.INITIATE_GAME_KEYWORD], 'message_received', (bot, message) => {setupConversation.initiateGameConversation(message)});    

        // Initiate a turn on app start:
        // models.turn.findByPk(17, {include: [{model: models.user, as: "user"}, {model: models.user, as: "nextUser"}]}).then(currentTurn => {
        //     turnConversation.initiateTurnConversation(currentTurn, "emoji", "Take yer turn, nerd");
        // })
    }
}
