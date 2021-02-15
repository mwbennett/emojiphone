const phone = require("phone");
const { BotkitConversation } = require('botkit');

const models = require('../models');
const turnUtils = require('../utils/turn_utils');
const setupUtils = require('../utils/setup_utils');
const gameUtils = require('../utils/game_utils');
const utils = require('../utils/utils');
const turnConversation = require('../conversations/turn');
const setupConversation = require('../conversations/setup');

const DEFAULT_THREAD = 'default'
const WONT_CANCEL_THREAD = 'wontCancel'
const NO_ACTIVE_GAMES_THREAD = 'noGames'
const ALREADY_CANCELED_THREAD = 'alreadyCancelled'
const COMPLETE_ACTION = 'complete';

const CANCELLED_MESSAGE = `Your game was cancelled! Feel free to start a new game by testing me the word "${setupConversation.INITIATE_GAME_KEYWORD}".`

module.exports = {
    CANCEL_CONVERSATION: 'cancel',
    CANCEL_KEYWORD: 'finish',
    setupCancelConversation: async () => {
        let convo = new BotkitConversation(module.exports.CANCEL_CONVERSATION, utils.controller);
        convo.before(DEFAULT_THREAD, async(convo, bot) => {
            await module.exports.setConversationVariables(convo);
        })

        module.exports.addCancelQuestion(convo);
        
        convo.addMessage({
            text: `Ok, your game won't be cancelled.`, 
            action: COMPLETE_ACTION
        }, WONT_CANCEL_THREAD);

        convo.addMessage({
            text: CANCELLED_MESSAGE, 
            action: COMPLETE_ACTION
        }, ALREADY_CANCELED_THREAD);
        
        convo.addMessage({
            text: `You're not in any active games that you can cancel. Text me the word "${setupConversation.INITIATE_GAME_KEYWORD}" to begin your first game!`, 
            action: COMPLETE_ACTION
        }, NO_ACTIVE_GAMES_THREAD);
        
        await utils.controller.addDialog(convo);
    },
    setConversationVariables: async (convo) => {
        try {
            let phoneNumber = phone(convo.vars.channel)[0];
            let game = await gameUtils.getCurrentGameByPhoneNumber(phoneNumber);
            if (!game) {
                return await convo.gotoThread(NO_GAMES_THREAD)
            }

            if (await gameUtils.isGameStillInProgress(game.id)) {
                return await convo.gotoThread(NOT_FINISHED_THREAD)
            }
            await convo.setVar("gameId", game.id);
            let turns = await turnUtils.getUsersAndMessagesFromGameId(game.id);
            let firstNames = turns.map(turn => turn.user.firstName);
            await convo.setVar("firstNames", firstNames.join(', '));
        } catch (e) {
            console.log("ERR", e);
        }
    },
    addCancelQuestion: (convo) => {
        let cancelPrompt = "You're about to cancel your game with the following people: {{vars.firstNames}}. Are you sure you want to do this? Respond with YES to continue."
        convo.addQuestion(cancelPrompt, 
            [{
                pattern: 'yes',
                handler: async function(response, inConvo, bot, full_message) {
                    let game = await models.game.findByPk(inConvo.vars.gameId);
                    if (!game.completed) {
                        await convo.addAction('complete');
                        await module.exports.cancelGame(game);
                    } else {
                        await inConvo.gotoThread(ALREADY_CANCELED_THREAD);
                    }
                }
            },
            {
                default: true,
                handler: async function(response, inConvo, bot, full_message) {
                    await inConvo.gotoThread(WONT_CANCEL_THREAD);
                }
            }], 'none', DEFAULT_THREAD
        );


    },
    cancelGame: async (game) => {
        if (!game.completed) {
            await game.update({completed: true});
            // Cancel current user's conversation
            const currentTurn = await models.turn.findOne({
                gameId: game.id,
                isCurrent: true
            })


            const turnsMaybe = await models.turn.bulkUpdate({
                isCurrent: false
            }, {
                where: {
                    gameId: game.id
                }
            })

            await utils.bot.startConversationWithUser(turn.user.phoneNumber);
            await utils.bot.say(CANCELLED_MESSAGE)
        }
    },
}