const utils = require('../utils/utils');
const turnUtils = require('../utils/turn_utils');
const setupUtils = require('../utils/setup_utils');
const models = require('../models');
const MessageType = require('../types/message_type');

const RESTART_KEYWORD = "again";

const TURN_SUCCESS_THREAD = "success";
const TURN_FAIL_THREAD = "fail";
const TURN_THREAD = "turn";
const TURN_ERROR_THREAD = "error";
const GAME_RESTARTED_THREAD = "restart";
const INVALID_INPUT_THREAD = "invalid";
const ALREADY_RESTARTED_THREAD = "alreadyRestarted";
const END_GAME_THREAD = "endGame";
const ANOTHER_USER_RESTARTED_THREAD = "anotherRestarted";
const END_GAME_PROMPT = `To restart your game, simply respond with "${RESTART_KEYWORD}" in the next six hours.`;

const INITIAL_TURN_PROMPT = "Welcome to Emojiphone! You're the first player, so all you need to do is respond with a phrase or sentence that is easy to describe with emojis!";

const SIX_HOURS_IN_MS = 6*60*60*1000;


module.exports = {
    /**
     * Create the converstaion thread where a user can take their turn
     * @param  {object} currentTurn  Database Turn that is about to be taken.
     * @param  {MessageType} currentMessageType  The MessageType of the current type (left blank in case people drop out)
     * @param  {String} turnPrompt  What to tell the user in order for them to take their turn (could vary whether it's the first player or any other)
     */
    initiateTurnConversation: async (currentTurn, currentMessageType, turnPrompt) => {

        currentTurn.update({isCurrent: true});
        let phoneNumber = currentTurn.user.phoneNumber;
        utils.bot.say({text: "Time to take your turn in your game of Emojiphone", channel: phoneNumber}, (err, response) => {
            utils.bot.createConversation({channel: phoneNumber}, function(err, convo) {

                convo.addMessage('Thanks, your turn has been recorded! You will be notified when the game completes.', TURN_SUCCESS_THREAD);
                
                convo.addMessage({
                    text: `Sorry your response was not written in ONLY ${currentMessageType}. Please try again!`,
                    action: TURN_THREAD
                }, TURN_FAIL_THREAD);

                convo.addMessage({
                    text: "Sorry, we encountered an error processing your turn. Please try again or contact our support team at TODO.",
                    action: TURN_THREAD
                }, TURN_ERROR_THREAD)


                module.exports.addTurnQuestion(convo, currentTurn, turnPrompt, currentMessageType);


                convo.activate();

                convo.gotoThread(TURN_THREAD);

                convo.on('end', async (convo) => {
                    if (currentTurn.nextUserId != null) {
                        module.exports.beginNextTurn(currentTurn, currentMessageType);
                    } else {
                        module.exports.createEndGameConversations(currentTurn.gameId);
                    }
                })
            })
        });
    },


    /**
     * Create the "question" that a user interacts with to take their turn
     * @param  {object} convo  Botkit conversation that can ask questions
     * @param  {object} currentTurn   Database Turn that is being taken.
     * @param  {String} turnPrompt  What to tell the user in order for them to take their turn
     * @param  {object} currentMessageType  What the MessageType of the incoming text SHOULD be.
     */
    addTurnQuestion: (convo, currentTurn, turnPrompt, currentMessageType) => {
        convo.addQuestion(turnPrompt, 
            [{
                default: true,
                callback: async (response, convo) => {
                    if (turnUtils.isValidResponse(response.Body, currentMessageType)) {
                        try {
                            await currentTurn.update({message: response.Body, messageType: currentMessageType, receivedAt: new Date(), isCurrent: false});
                            convo.gotoThread(TURN_SUCCESS_THREAD);
                        } catch(err){
                            console.log(err);
                            convo.gotoThread(TURN_ERROR_THREAD);
                        }

                    } else {
                        convo.gotoThread(TURN_FAIL_THREAD);
                    }
                }
            }], {}, TURN_THREAD
        );
        
    },
    createEndGameConversations: async (gameId) => {
        let messageAndPhoneNumbers = await turnUtils.getEndGameMessageWithPhoneNumbers(gameId);
        for (let phoneNumber of messageAndPhoneNumbers.phoneNumbers) {
            module.exports.createEndGameConversation(messageAndPhoneNumbers.message, phoneNumber, messageAndPhoneNumbers.phoneNumbers, gameId);
        }
    },
    createEndGameConversation: async (message, phoneNumber, phoneNumbers,  gameId) => {
        let game = await models.game.findByPk(gameId);
        utils.bot.createConversation({channel: phoneNumber}, function(err, convo) {
            convo.addMessage({
                text: message,
                action: END_GAME_THREAD
            })
            
            convo.addQuestion(END_GAME_PROMPT, 
                [{
                    pattern: RESTART_KEYWORD,
                    callback: async (response, convo) => {
                        if (!game.restarted) {
                            phoneNumbers.splice(phoneNumbers.indexOf(phoneNumber), 1);
                            module.exports.finishEndGameConversations(phoneNumbers);
                            convo.gotoThread(GAME_RESTARTED_THREAD);
                        } else {
                            convo.gotoThread(ALREADY_RESTARTED_THREAD);
                        }
                    }
                },
                {
                    default: true,
                    callback: async (response, convo) => {
                        convo.gotoThread(INVALID_INPUT_THREAD);
                    }
                }], {}, END_GAME_THREAD
            );
            convo.addMessage({text: `Great, we've restarted your game! Just sit back and relax until it's your turn.`}, GAME_RESTARTED_THREAD);
            convo.addMessage({text: `Another user just restarted your game! Just sit back and relax until it's your turn.`}, ANOTHER_USER_RESTARTED_THREAD);
            convo.addMessage({text: `Someone else already restarted your game! Just sit back and relax until it's your turn.`}, ALREADY_RESTARTED_THREAD);
            convo.addMessage({
                text: `Sorry, I couldn't understand you.`,
                action: END_GAME_THREAD
            }, INVALID_INPUT_THREAD);
            convo.on('end', async(convo) => {
                let responses = convo.extractResponses();
                if (responses[END_GAME_PROMPT] && responses[END_GAME_PROMPT].toLowerCase() == RESTART_KEYWORD) {
                    await module.exports.restartGame(game);
                }
            })
            convo.setTimeout(SIX_HOURS_IN_MS);
            convo.activate();
        })
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
    finishEndGameConversations: (phoneNumbers) => {
        let tasks = utils.controller.tasks.filter(task => phoneNumbers.indexOf(task.convos[0].context.channel) != -1)
        for(let task of tasks) {
            task.convos[0].gotoThread(ANOTHER_USER_RESTARTED_THREAD);
        }
    },

    /**
     * Given the turn that was just completed, begin the next turn
     * @param  {object} completedTurn   Database Turn that was just completed.
     */
    beginNextTurn: async (completedTurn) => {
        let nextMessageType = turnUtils.oppositeMessageType(completedTurn.messageType);
        let turnPrompt = `Text your response to the following prompt using ONLY ${nextMessageType}:
${completedTurn.message}`
        let nextTurn = await models.turn.findOne({where: {userId: completedTurn.nextUserId, gameId: completedTurn.gameId}, include: [{model: models.user, as: "user"}]});
        module.exports.initiateTurnConversation(nextTurn, nextMessageType, turnPrompt);
    },

    /**
     * Given the game identifier, start the first turn of the game!
     * @param  {integer} gameId   gameId of game that needs to begin
     */
    takeFirstTurn: async (gameId) => {
        let currentTurn = await turnUtils.getCurrentTurn(gameId);
        module.exports.initiateTurnConversation(currentTurn, MessageType.text, INITIAL_TURN_PROMPT);
    }
}
