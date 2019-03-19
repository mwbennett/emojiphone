var Botkit = require('botkit');
const setupConversation = require('./conversations/setup');
const gameTurnConversation = require('./conversations/gameTurn');

// Twilio Botkit 
var TWILIO_ACCOUNT_SID = 'AC88232d86e93e7150e3db15f8871ccdc6';
var TWILIO_AUTH_TOKEN = '015c9250ac5b7257cc6f149af56c0666';
var TWILIO_PHONE_NUMBER = '+13132469144';
var controller = Botkit.twiliosmsbot({
  debug: true,
  account_sid: TWILIO_ACCOUNT_SID,
  auth_token: TWILIO_AUTH_TOKEN,
  twilio_number: TWILIO_PHONE_NUMBER,
});

const INITIAITE_GAME_KEYWORD = 'start';

var turn = {
  type: "words",
  current_user: {
    phone_number: "+19198684114"
  }
}

module.exports = {
  setup: function() {
    var bot = controller.spawn({});
    controller.setupWebserver(5000, function(err, server) {
      server.get('/', function(req, res) {
        res.send(':)');
      });

      controller.createWebhookEndpoints(server, bot);
    })
    controller.hears([INITIAITE_GAME_KEYWORD], 'message_received', setupConversation.initiateGameConversation);

    // Take a turn!
    // gameTurnConversation.takeTurn(turn, bot);
    
  }
}

