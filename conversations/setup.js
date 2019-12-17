// Minimum player count (including the "initiator" of the game)
const MINIMUM_PLAYER_COUNT = 3;
const DONE_ADDING_CONTACTS_KEYWORD = 'done';
const QUIT_ADDING_CONTACTS_KEYWORD = 'quit game';
const START_GAME_THREAD = 'startGame';
const NOT_READY_YET_THREAD = 'notReadyYet';
const QUIT_GAME_THREAD = 'quitGame';
const ADD_CONTACTS_THREAD = 'addContacts';
const INVALID_INPUT_THREAD = 'invalidInput';
const ADDED_PHONE_NUMBER_THREAD = 'addedPhone';

const models = require('../models');

// EOD so TODO: Share between this and twilioApp.js
const INITIATE_GAME_KEYWORD = "start";


module.exports = {
    /**
     * Create the converstaion thread where a user can start the game
     * @param  {object} bot  Botkit bot that can create conversations
     * @param  {object} message  The intial message that was passed into the listener, should be INITIATE_GAME_KEYWORD
     */
    initiateGameConversation: (bot, message) => {
      bot.createConversation(message, function(err, convo) {
        const users = [];
        convo.addMessage({
            text: 'Welcome to Emojiphone! Thanks for starting a new game!', 
            action: ADD_CONTACTS_THREAD
        });

        addContactsQuestion(convo, users);

        convo.addMessage({
            text: 'Successfully added your contact!',
            action: ADD_CONTACTS_THREAD
        }, ADDED_PHONE_NUMBER_THREAD);

        convo.addMessage({
            text: "Sorry, I couldn't understand you. Please send a contact, or say 'DONE'.",
            action: ADD_CONTACTS_THREAD
        }, INVALID_INPUT_THREAD);
        
        convo.addMessage(`Ok, you will not start the game. Text "${INITIATE_GAME_KEYWORD}" to begin a new game!`, QUIT_GAME_THREAD);
        convo.addMessage('Ok, we will begin the game!', START_GAME_THREAD);

        convo.addMessage({
            text: `Oops! You don't have enough other players. Please add at least ${MINIMUM_PLAYER_COUNT - users.length - 1} total contacts.`,
            action: ADD_CONTACTS_THREAD,
        }, 'notReadyYet');

        convo.activate();
      }); 
    },
    setupGameForTesting: (users) => {
        return setupGame(users);
    }
}

const addContactsQuestion = (convo, users) => {
    convo.addQuestion(`Time to set up your game! Text me at least ${MINIMUM_PLAYER_COUNT - users.length - 1} total contacts to be able to start your game.

    Text "${DONE_ADDING_CONTACTS_KEYWORD}" when you want to start the game or "${QUIT_ADDING_CONTACTS_KEYWORD}" if you don't want to play.`, [
        {
            pattern: DONE_ADDING_CONTACTS_KEYWORD,
            callback: function(response, convo) {
                if (isGameReady(users)) {
                    setupGame(users);
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
                    const user = await utils.downloadVCard(response);
                    users.push(user);
                    convo.gotoThread(ADDED_PHONE_NUMBER_THREAD);
                } else {
                    convo.gotoThread(INVALID_INPUT_THREAD);
                }
            },
        }
    ], {}, ADD_CONTACTS_THREAD);
}

/**
* Setup the game by instantiating users and turns
* @param  {Object[]} users  List of "User" objects to include in the game.
*/
const setupGame = (users) => {
    let promises = [];
    for(let user of users) {
        promises.push(models.user.upsert(user).catch(err => {
            console.log(err);
            throw err;
        }));
    }
    return Promise.all(promises).then(() => {
        console.log("Done");
    })
}

/**
 * Validate that we are ready to start the game!
 * @param  {Object[]} users  List of "User" objects to include in the game.
 */
const isGameReady = (users) => {
  console.log(`VALIDATING GAME: ${users.length} numbers`);
  return Array.isArray(users) && users.length >= MINIMUM_PLAYER_COUNT - 1;
}