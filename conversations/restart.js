const phone = require("phone");
const { BotkitConversation } = require('botkit');

const turnUtils = require('../utils/turn_utils');
const setupUtils = require('../utils/setup_utils');

const RESTART_KEYWORD = "again";
const ALREADY_RESTARTED_THREAD = "alreadyRestarted";
const END_GAME_THREAD = "endGame";
const ANOTHER_USER_RESTARTED_THREAD = "anotherRestarted";
const WONT_RESTART_THREAD = "wontRestart";
const RESTART_PROMPT = `To restart your game, simply respond with "${RESTART_KEYWORD}" in the next six hours.`;

module.exports = {

    initiateRestartConversation: async (message, bot) => {
        let phoneNumber = phone(message.channel)[0];
        let game = await getLastPlayedByPhoneNumber(phoneNumber);

        let dialogId = END_GAME_CONVERSATION + game.id + phoneNumber;
        let convo = new BotkitConversation(dialogId, utils.controller);
        await utils.bot.startConversationWithUser(phoneNumber);

        convo.addMessage({text: `Someone else already restarted your game! Just sit back and relax until it's your turn.`}, ALREADY_RESTARTED_THREAD);
        await addRestartQuestion();

        await utils.controller.addDialog(convo);
        await utils.bot.beginDialog(dialogId);
    },
    addRestartQuestion: async (convo, phoneNumber, phoneNumbers,  gameId) => {
        let firstNames = await getFirstNamesByGameId(gameId);
        let restartPrompt = `You're about to start a game with ${firstNames.join(', ')}. Respond with YES to continue.`
        convo.addQuestion(RESTART_PROMPT, 
            [{
                pattern: utils.bot.utternaces.yes,
                handler: async function(response, convo, bot, full_message) {
                    if (!game.restarted) {
                        phoneNumbers.splice(phoneNumbers.indexOf(phoneNumber), 1);
                        module.exports.finishEndGameConversations(phoneNumbers);
                        await convo.gotoThread(GAME_RESTARTED_THREAD);
                    } else {
                        await convo.gotoThread(ALREADY_RESTARTED_THREAD);
                    }
                }
            },
            {
                default: true,
                handler: async function(response, convo, bot, full_message) {
                    await convo.gotoThread(WONT_RESTART_THREAD);
                }
            }], {}, END_GAME_THREAD
        );
        convo.addMessage({text: `Great, we've restarted your game! Just sit back and relax until it's your turn.`}, GAME_RESTARTED_THREAD);
        convo.addMessage({text: `Ok, your game won't be restarted.`}, WONT_RESTART_THREAD);


    },
    restartGame: async (game) => {
        if (!game.restarted) {
            game.update({restarted: true});
            let newGameTurns = await setupUtils.setupPreviouslyPlayedGame(game.id);
            if (Array.isArray(newGameTurns) && newGameTurns.length > 0) {
                module.exports.takeFirstTurn(newGameTurns[0].gameId);
            } else {
                console.log("New game not successfully created");
            }
        }
    },
}