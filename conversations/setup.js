var fetch = require('node-fetch');
const vCard = require('vcard');

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
    /**
     * Create the converstaion thread where a user can start the game
     * @param  {object} bot  Botkit bot that can create conversations
     * @param  {object} message  The intial message that was passed into the listener, should be "beginner"
     */
    initiateGameConversation: (bot, message) => {
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
                const phoneNumber = await downloadVCard(response);
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