var Botkit = require('botkit');
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

// Minimum player count (including the "initiator" of the game)
const MINIMUM_PLAYER_COUNT = 3;

const INITIAITE_GAME_KEYWORD = 'start';
const DONE_ADDING_CONTACTS_KEYWORD = 'done';
const QUIT_ADDING_CONTACTS_KEYWORD = 'quit game';
const START_GAME_THREAD = 'startGame';
const NOT_READY_YET_THREAD = 'notReadyYet';
const QUIT_GAME_THREAD = 'quitGame';
const ADD_CONTACTS_THREAD = 'addContacts';
const INVALID_INPUT_THREAD = 'invalidInput';
const ADDED_PHONE_NUMBER_THREAD = 'addedPhone';

module.exports = {
  setup: function() {
    var bot = controller.spawn({});
    controller.setupWebserver(5000, function(err, server) {
      server.get('/', function(req, res) {
        res.send(':)');
      });

      controller.createWebhookEndpoints(server, bot);
    })
    controller.hears([INITIAITE_GAME_KEYWORD], 'message_received', initiateGameConversation);
    
  }
}

/**
 * Create the converstaion thread where a user can start the game
 * @param  {object} bot  Botkit bot that can create conversations
 * @param  {object} message  The intial message that was passed into the listener, should be "beginner"
 */
const initiateGameConversation = (bot, message) => {
  bot.createConversation(message, function(err, convo) {
    const phoneNumbers = [];
    convo.addMessage({
      text: 'Welcome to Emojiphone! Thanks for starting a new game!', 
      action: ADD_CONTACTS_THREAD
    });

    convo.addQuestion(`Time to set up your game! Text me at least ${MINIMUM_PLAYER_COUNT - phoneNumbers.length - 1} total contacts to be able to start your game.

Text "${DONE_ADDING_CONTACTS_KEYWORD}" when you want to start the game or "${QUIT_ADDING_CONTACTS_KEYWORD}" if you don't want to play.`, [
      {
        pattern: DONE_ADDING_CONTACTS_KEYWORD,
        callback: function(response, convo) {
          if (isGameReady(phoneNumbers)) {
            convo.gotoThread(START_GAME_THREAD);
          } else {
            convo.gotoThread(NOT_READY_YET_THREAD);
          }
        },
      },
      {
        pattern: QUIT_ADDING_CONTACTS_KEYWORD,
        callback: function(response, convo) {
          convo.gotoThread(QUIT_GAME_THREAD);
        },
      },
      {
        default: true,
        callback: async function(response, convo) {
          if (response.MediaContentType0 === 'text/x-vcard') {
            console.log("VCARD RESPONSE");
            console.log(response);
            const phoneNumber = await utils.downloadVCard(response);
            phoneNumbers.push(phoneNumber);
            convo.gotoThread(ADDED_PHONE_NUMBER_THREAD);

          } else {
            convo.gotoThread(INVALID_INPUT_THREAD);
          }
        },
      }
    ], {}, ADD_CONTACTS_THREAD);

    convo.addMessage({
      text: 'Successfully added your contact!',
      action: ADD_CONTACTS_THREAD
    }, ADDED_PHONE_NUMBER_THREAD);

    convo.addMessage({
      text: "Sorry, I couldn't understand you. Please send a contact, or say 'DONE'.",
      action: ADD_CONTACTS_THREAD
    }, INVALID_INPUT_THREAD);
    
    convo.addMessage(`Ok, you will not start the game. Text "${INITIAITE_GAME_KEYWORD}" to begin a new game!`, QUIT_GAME_THREAD);
    convo.addMessage('Ok, we will begin the game!', START_GAME_THREAD);

    convo.addMessage({
      text: `Oops! You don't have enough other players. Please add at least ${MINIMUM_PLAYER_COUNT - phoneNumbers.length - 1} total contacts.`,
      action: ADD_CONTACTS_THREAD,
    }, 'notReadyYet');

    convo.activate();
  }); 
};

/**
 * Validate that we are ready to start the game!
 * @param  {Object[]} phoneNumbers  List of "User" objects to include in the game.
 */
const isGameReady = (phoneNumbers) => {
  console.log(`VALIDATING GAME: ${phoneNumbers.length} numbers`);
  return Array.isArray(phoneNumbers) && phoneNumbers.length >= MINIMUM_PLAYER_COUNT - 1;
}