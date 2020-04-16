const phone = require("phone");
const { BotkitConversation } = require('botkit');

const turnUtils = require('../utils/turn_utils');
const setupUtils = require('../utils/setup_utils');
const gameUtils = require('../utils/game_utils');
const utils = require('../utils/utils');

const ALREADY_RESTARTED_THREAD = "alreadyRestarted";
const ANOTHER_USER_RESTARTED_THREAD = "anotherRestarted";
const WONT_RESTART_THREAD = "wontRestart";
const RESTART_CONVERSATION = 'endGame';
const GAME_RESTARTED_THREAD = "restarted";

module.exports = {
    RESTART_KEYWORD: "again",

    initiateRestartConversation: async (message, bot) => {
        try {
            let phoneNumber = phone(message.channel)[0];
            let game = await gameUtils.getLastPlayedGameByPhoneNumber(phoneNumber);

            let dialogId = RESTART_CONVERSATION + game.id + phoneNumber;
            let convo = new BotkitConversation(dialogId, utils.controller);
            await utils.bot.startConversationWithUser(phoneNumber);

            convo.addMessage({text: `Someone else already restarted your game! Just sit back and relax until it's your turn.`}, ALREADY_RESTARTED_THREAD);
            convo.addMessage({text: `Great, we've restarted your game! Just sit back and relax until it's your turn.`}, GAME_RESTARTED_THREAD);
            convo.addMessage({text: `Ok, your game won't be restarted.`}, WONT_RESTART_THREAD);
            await module.exports.addRestartQuestion(convo, game);

            await utils.controller.addDialog(convo);
            await utils.bot.beginDialog(dialogId);
        } catch (err) {
            console.log("ERROR", err);
        }
    },
    addRestartQuestion: async (convo, game) => {
        let turns = await turnUtils.getUsersAndMessagesFromGameId(game.id);
        let firstNames = turns.map(turn => turn.user.firstName);

        let restartPrompt = `You're about to start a game with ${firstNames.join(', ')}. Respond with YES to continue.`
        convo.addQuestion(restartPrompt, 
            [{
                pattern: 'yes',
                handler: async function(response, convo, bot, full_message) {
                    if (!game.restarted) {
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
            }], {}, 'default'
        );


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