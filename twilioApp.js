var Botkit = require('botkit');
const setupConversation = require('./conversations/setup');
const utils = require('./utils/utils');

// Twilio Botkit 
var TWILIO_ACCOUNT_SID = 'ACa5c63ba2287d0c4b4b0ab7f62835eba0';
var TWILIO_AUTH_TOKEN = '34b8bf62be5aa7e766e139525363cf3a';
var TWILIO_PHONE_NUMBER = '+12015848173';
var controller = Botkit.twiliosmsbot({
  debug: true,
  account_sid: TWILIO_ACCOUNT_SID,
  auth_token: TWILIO_AUTH_TOKEN,
  twilio_number: TWILIO_PHONE_NUMBER,
});

module.exports = {
  setup: function() {
    var bot = controller.spawn({});
    controller.setupWebserver(5000, function(err, server) {
      server.get('/', function(req, res) {
        res.send(':)');
      });

      controller.createWebhookEndpoints(server, bot);
    })
    controller.hears([setupConversation.INITIATE_GAME_KEYWORD], 'message_received', setupConversation.initiateGameConversation);    
  }
}
