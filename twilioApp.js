var Botkit = require('botkit');
var fetch = require('node-fetch');
const vCard = require('vcard');

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

// Minimum player count (including the "initiator" of the game)
const MINIMUM_PLAYER_COUNT = 3;

module.exports = {
  setup: function() {
    var bot = controller.spawn({});
    controller.setupWebserver(5000, function(err, server) {
      server.get('/', function(req, res) {
        res.send(':)');
      });

      controller.createWebhookEndpoints(server, bot);
    })

    controller.hears(['beginner'], 'message_received', initializeGame);
    
  }
}


/**
 * Provided an MMS vCard text message, fetch the vCard data and return the phoone number.
 * @param  {string} message 
 */
const downloadVCard = async (message) => {
  const url = message.MediaUrl0;
  var card = new vCard();

  const response = await fetch(url, { redirect: 'follow' });
  const textContent = await response.text();

  return new Promise((resolve, reject) => {
    card.readData(textContent, function(err, json) {
      resolve(json.TEL.value);
    });
  });
};

/**
 * Validate that we are ready to start the game!
 * @param  {string[]} phoneNumbers  List of phone numbers to include in the game.
 */
const isGameReady = (phoneNumbers) => {
  console.log(`VALIDATING GAME: ${phoneNumbers.length} numbers`);
  return Array.isArray(phoneNumbers) && phoneNumbers.length >= MINIMUM_PLAYER_COUNT - 1;
}

const initializeGame = (bot, message) => {
  bot.createConversation(message, function(err, convo) {
    const phoneNumbers = [];
    convo.addQuestion('Thanks for starting a new game! Are you ready to start adding contacts?', [
      {
        pattern: bot.utterances.yes,
        callback: function(response, convo) {
          convo.gotoThread('addContacts');
        },
      },
    ], {}, 'default');

    convo.addQuestion('Add as many contacts as you like. Text DONE when you want to start the game.', [
      {
        pattern: 'done',
        callback: function(response, convo) {
          console.log('done', response.Body);
          if (isGameReady(phoneNumbers)) {
            convo.gotoThread('startGame');
          } else {
            convo.gotoThread('notReadyYet');
            // TODO: Different thread? Try again -- keep adding;
          }
        },
      },
      {
        pattern: 'outtie',
        callback: function(response, convo) {
          console.log('donezo', response.Body);
          convo.gotoThread('finishedGame');
        },
      },
      {
        default: true,
        callback: async function(response, convo) {
          console.log('Response', response);
          if (response.MediaContentType0 === 'text/x-vcard') {
            const phoneNumber = await downloadVCard(response);
            console.log('New phone number added: ', phoneNumber);

            phoneNumbers.push(phoneNumber);

            // TODO do something with the number.

            // TODO: WHY ISN"T THIS WORKING??
            convo.addMessage('Got it!', 'addContacts');
            // convo.say('Got it!');
          } else {
            // TODO: WHY ISN"T THIS WORKING??
            convo.addMessage("Sorry, I couldn't understand you. Please send a contact, or say 'DONE'.", 'addContacts')
            // convo.say("Sorry, I couldn't understand you. Please send a contact, or say 'DONE'.");
          }
          convo.repeat();
          convo.next();
        },
      }
    ], {}, 'addContacts');

    convo.addMessage('Ok, you are done with the game', 'finishedGame');
    convo.addMessage('Ok, we will begin the game!', 'startGame');

    convo.addMessage({
      text: `Oops! You only have ${phoneNumbers.length} other players. Please add ${MINIMUM_PLAYER_COUNT - phoneNumbers.length - 1} more contacts.`,
      action: 'addContacts',
    }, 'notReadyYet');

    convo.activate();
  }); 
};