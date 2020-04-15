const phone = require("phone");
const { BotkitConversation } = require('botkit');

const utils = require('../utils/utils');
const setupUtils = require('../utils/setup_utils');
const turnConversation = require('./turn');

const DONE_ADDING_CONTACTS_KEYWORD = 'done';
const QUIT_SETUP_KEYWORD = 'exit';
const START_GAME_THREAD = 'startGame';
const NOT_READY_YET_THREAD = 'notReadyYet';
const QUIT_GAME_THREAD = 'quitGame';
const ADD_CONTACTS_THREAD = 'addContacts';
const INVALID_INPUT_THREAD = 'invalidInput';
const ADDED_PHONE_NUMBER_THREAD = 'addedPhone';
const ERROR_THREAD = 'errorThread';
const DUPLICATE_NUMBER_THREAD = 'duplicateThread';
const INVALID_NUMBER_THREAD = 'invalidNumber';
const ADD_USER_THREAD = 'addUser';
const ADDED_USER_THREAD = 'addedUser';
const CONTACT_ERROR_THREAD = 'contactError';
const NAME_PATTERN = /^[a-zA-Z][a-zA-Z\-\s]+$/;
const GAME_READY_VARIABLE = "gameReady";
const GAME_USERS_VARIABLE = "gameUsers";
const ERROR_RESPONSE = "Sorry, we encountered an error processing your request. Please try again or contact our support team at TODO.";

let quitGameResponse = {
    pattern: QUIT_SETUP_KEYWORD,
    handler: async function(response, convo) {
        await convo.gotoThread(QUIT_GAME_THREAD);
    },
}

module.exports = {
    INITIATE_GAME_KEYWORD: "start",
    /**
     * Create the converstaion thread where a user can start the game.
     * @param  {object} message  The intial BotKit message that was passed into the listener
     */
    initiateGameConversation: async (message, bot) => {
        let convo = new BotkitConversation('setup', utils.controller);
        let phoneNumber = phone(message.channel)[0];
        let user;
        try {
            user = await utils.getUserByPhoneNumber(phoneNumber);
        } catch (err) {
            console.log(err);
        }
        await bot.changeContext(message.reference);
        if (!user) {
            convo.addMessage({
                text: 'Welcome to Emojiphone! Thanks for starting a new game!', 
                action: ADD_USER_THREAD
            });    
        } else {
            convo.addMessage({
                text: `Welcome back to Emojiphone, ${user.firstName}! Thanks for starting a new game!`, 
                action: ADD_CONTACTS_THREAD
            });
        }

        module.exports.addCreatorAsUserQuestion(convo, phoneNumber);

        module.exports.addContactsQuestion(convo);

        convo.addMessage({
            text: "Great, now let's get started setting up your first game!",
            action: ADD_CONTACTS_THREAD
        }, ADDED_USER_THREAD);

        convo.addMessage({
            text: 'Please provide us with your name; no numbers or special characters!',
            action: ADD_USER_THREAD
        }, CONTACT_ERROR_THREAD);

        convo.addMessage({
            text: 'Successfully added your contact!',
            action: ADD_CONTACTS_THREAD
        }, ADDED_PHONE_NUMBER_THREAD);

        convo.addMessage({
            text: `Sorry, I couldn't understand you. Please send a contact, or say "${DONE_ADDING_CONTACTS_KEYWORD}" or "${QUIT_SETUP_KEYWORD}".`,
            action: ADD_CONTACTS_THREAD
        }, INVALID_INPUT_THREAD);

        convo.addMessage({
            text: ERROR_RESPONSE,
            action: ADD_CONTACTS_THREAD
        }, ERROR_THREAD);

        convo.addMessage({
            text: "Sorry, you've already added someone with that phone number. Please choose a contact with a phone number different from any you've added so far",
            action: ADD_CONTACTS_THREAD
        }, DUPLICATE_NUMBER_THREAD);

        convo.addMessage({
            text: "Sorry, the phone number for that contact is invalid. Please try another contact with a valid US-based phone number.",
            action: ADD_CONTACTS_THREAD
        }, INVALID_NUMBER_THREAD);
        
        convo.addMessage(`Ok, you will not start the game. Text "${module.exports.INITIATE_GAME_KEYWORD}" to begin a new game!`, QUIT_GAME_THREAD);
        convo.addMessage('Ok, we will begin the game!', START_GAME_THREAD);

        convo.addMessage({
            text: `Oops! You don't have enough other players. Please add at least ${setupUtils.MINIMUM_PLAYER_COUNT - 1} total contacts.`,
            action: ADD_CONTACTS_THREAD,
        }, NOT_READY_YET_THREAD);

        convo.after(async(results, bot) => {
            module.exports.onConversationEnd(results, user, phoneNumber);
        })

        utils.controller.addDialog(convo);
        await bot.beginDialog('setup');
    },
    addCreatorAsUserQuestion: (convo, phoneNumber) => {
        let firstName; let lastName;
        convo.addQuestion(`Since this is your first time playing, we'll need a way to identify you. What's your name (you may enter first and last)?

Text "${QUIT_SETUP_KEYWORD}" at any time to quit the setup process.`, [
            quitGameResponse,
            {
                default: true,
                handler: async (response, convo) => {
                    if (NAME_PATTERN.test(response.Body)) {
                        try {
                            await utils.addUser(response.Body, phoneNumber);
                            await convo.gotoThread(ADDED_USER_THREAD);
                        } catch (err) {
                            console.log(err);
                            await convo.gotoThread(ERROR_THREAD);
                        }
                    } else {
                        await convo.gotoThread(CONTACT_ERROR_THREAD);
                    }
                }
            }
        ], {}, ADD_USER_THREAD);
    },
    // TODO: Pull out callbacks as separate functions
    addContactsQuestion: async (convo) => {
        let users = [];

        convo.addQuestion(`Time to set up your game! Text me at least ${setupUtils.MINIMUM_PLAYER_COUNT - 1} total contacts to be able to start your game.

        Text "${DONE_ADDING_CONTACTS_KEYWORD}" when you want to start the game or "${QUIT_SETUP_KEYWORD}" if you don't want to play.`, [
            {
                pattern: DONE_ADDING_CONTACTS_KEYWORD,
                handler: async (response, convo) => {
                    if (setupUtils.isGameReady(users)) {
                        convo.setVar(GAME_READY_VARIABLE, true);
                        convo.setVar(GAME_USERS_VARIABLE, users);
                        await convo.gotoThread(START_GAME_THREAD);
                    } else {
                        await convo.gotoThread(NOT_READY_YET_THREAD);
                    }
                },
            }, quitGameResponse,
            {
                default: true,
                handler: async function(response, convo, bot, full_message) {
                    if (full_message.MediaContentType0 === 'text/x-vcard') {
                        try {
                            let user = await utils.downloadVCard(full_message);
                            let validatedNumber = phone(user.phoneNumber, "USA");
                            if (validatedNumber.length == 0 ){
                                return await convo.gotoThread(INVALID_NUMBER_THREAD);
                            }
                            user.phoneNumber = validatedNumber[0];
                            if (setupUtils.containsPhoneNumber(users, user.phoneNumber)) {
                                await convo.gotoThread(DUPLICATE_NUMBER_THREAD);
                            } else {
                                users.push(user);
                                await convo.gotoThread(ADDED_PHONE_NUMBER_THREAD);
                            }
                        } catch (err) {
                            console.log("Error downloading vcard", err);
                            return await convo.gotoThread(ERROR_THREAD);
                        }
                    } else {
                        await convo.gotoThread(INVALID_INPUT_THREAD);
                    }
                },
            }
        ], {}, ADD_CONTACTS_THREAD);
    },
    onConversationEnd: async (results, currentUser, phoneNumber) => {
        if (results[GAME_READY_VARIABLE] && results[GAME_READY_VARIABLE] == true) {
            try {
                if (!currentUser) {
                    currentUser = await utils.getUserByPhoneNumber(phoneNumber);
                }

                let turns = await setupUtils.setupGame(results[GAME_USERS_VARIABLE], [[currentUser]]);
                if (Array.isArray(turns) && turns.length > 0) {
                    turnConversation.takeFirstTurn(turns[0].gameId);
                } else {
                    module.exports.sendGameFailedToSetupText(phoneNumber, ERROR_RESPONSE);
                }
            } catch (err) {
                console.log(err);
                module.exports.sendGameFailedToSetupText(phoneNumber, ERROR_RESPONSE);
            }
        }
    },
    sendGameFailedToSetupText: (phoneNumber, message) => {
        utils.bot.say({text: message, channel: phoneNumber}, (err, response) => {});
    }
}