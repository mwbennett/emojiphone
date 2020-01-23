require('dotenv').config();
var Botkit = require('botkit');
const setupConversation = require('./conversations/setup');
const turnConversation = require('./conversations/turn');
const utils = require('./utils/utils');
const models = require('./models');
const User = require('./models/user');

// Twilio Botkit 
var controller = Botkit.twiliosmsbot({
    debug: true,
    account_sid: process.env.TWILIO_ACCOUNT_SID,
    auth_token: process.env.TWILIO_AUTH_TOKEN,
    twilio_number: process.env.TWILIO_PHONE_NUMBER,
});

module.exports = {
    setup: function() {
        var bot = controller.spawn({});
        controller.setupWebserver(5000, function(err, server) {
            server.get('/', function(req, res) {
                res.send(':)');
            });1
            controller.createWebhookEndpoints(server, bot);
        })
        // controller.hears([setupConversation.INITIATE_GAME_KEYWORD], 'message_received', setupConversation.initiateGameConversation);    
        controller.hears([setupConversation.INITIATE_GAME_KEYWORD], 'message_received', (bot, message) => {
            // Just to get a sample turn in place
            models.turn.findByPk(16, {include: [{model: models.user, as: "user"}, {model: models.user, as: "nextUser"}]}).then(turn => {
                turnConversation.initiateTurnConversation(bot, message, turn);
            })
        });    
    }
}
