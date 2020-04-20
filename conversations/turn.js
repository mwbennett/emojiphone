const { BotkitConversation } = require('botkit');
const utils = require('../utils/utils');
const turnUtils = require('../utils/turn_utils');
const models = require('../models');
const MessageType = require('../types/message_type');

const TURN_CONVERSATION = 'turn';
const TURN_SUCCESS_THREAD = "success";
const TURN_FAIL_THREAD = "fail";
const TURN_THREAD = "turn";
const TURN_ERROR_THREAD = "error";
const DEFAULT_THREAD = 'default';

const INITIAL_TURN_PROMPT = "Welcome to Emojiphone! You're the first player, so all you need to do is respond with a phrase or sentence that is easy to describe with emojis!";

const SIX_HOURS_IN_MS = 6*60*60*1000;


module.exports = {
    /**
     * Create the converstaion thread where a user can take their turn
     * @param  {object} currentTurn  Database Turn that is about to be taken.
     * @param  {MessageType} currentMessageType  The MessageType of the current type (left blank in case people drop out)
     * @param  {String} turnPrompt  What to tell the user in order for them to take their turn (could vary whether it's the first player or any other)
     */
    setupTurnConversation: async () => {
        // currentTurn.update({isCurrent: true});
        // let phoneNumber = currentTurn.user.phoneNumber;
        // let dialogId = TURN_CONVERSATION + currentTurn.id;
        let convo = new BotkitConversation(TURN_CONVERSATION, utils.controller);

        convo.addMessage({text: "Time to take your turn in your game of Emojiphone", action: TURN_THREAD}, DEFAULT_THREAD);

        convo.addMessage('Thanks, your turn has been recorded! You will be notified when the game completes.', TURN_SUCCESS_THREAD);
        
        convo.addMessage({
            text: `Sorry your response was not written in ONLY {{vars.currentMessageType}}. Please try again!`,
            action: TURN_THREAD
        }, TURN_FAIL_THREAD);

        convo.addMessage({
            text: "Sorry, we encountered an error processing your turn. Please try again or contact our support team at TODO.",
            action: TURN_THREAD
        }, TURN_ERROR_THREAD)


        // module.exports.addTurnQuestion(convo, currentTurn, turnPrompt, currentMessageType);
        convo.before(DEFAULT_THREAD, async (inConvo, bot) => {
            console.log(inConvo.vars.channel);
            console.log("Let's get that turn!!");
        });
        // convo.after(async (results, bot) => {
        //     if (currentTurn.nextUserId != null) {
        //         module.exports.beginNextTurn(currentTurn, currentMessageType);
        //     } else {
        //         module.exports.createEndGameConversations(currentTurn.gameId);
        //     }
        // })

        await utils.controller.addDialog(convo);
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
                handler: async function(response, convo, bot, full_message) {
                    if (turnUtils.isValidResponse(full_message.Body, currentMessageType)) {
                        try {
                            await currentTurn.update({message: full_message.Body, messageType: currentMessageType, receivedAt: new Date(), isCurrent: false});
                            await convo.gotoThread(TURN_SUCCESS_THREAD);
                        } catch(err){
                            console.log(err);
                            await convo.gotoThread(TURN_ERROR_THREAD);
                        }

                    } else {
                        await convo.gotoThread(TURN_FAIL_THREAD);
                    }
                }
            }], {}, TURN_THREAD
        );
        
    },
    createEndGameConversations: async (gameId) => {
        let messageAndPhoneNumbers = await turnUtils.getEndGameMessageWithPhoneNumbers(gameId);
        let game = await models.game.findByPk(gameId);
        for (let phoneNumber of messageAndPhoneNumbers.phoneNumbers) {
            await utils.bot.startConversationWithUser(phoneNumber);
            await utils.bot.say(messageAndPhoneNumbers.message);
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
