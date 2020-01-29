const utils = require('../utils/utils');
const turnUtils = require('../utils/turn_utils');
const models = require('../models');

const TURN_SUCCESS_THREAD = "success";
const TURN_FAIL_THREAD = "fail";
const TURN_THREAD = "turn";
const TURN_ERROR_THREAD = "error";

module.exports = {
    /**
     * Send the first message to a user to inform them that their turn has begun
     * @param  {object} bot  Botkit bot that can create conversations
     * @param  {object} phoneNumber  Phone number that initial prompt should be sent to.
     */
    sendInitialPrompt: (bot, phoneNumber) => {
        bot.say({text: "Time to take your turn in your game of Emojiphone", channel: phoneNumber}, (err, response) => {
                if (!err) {
                    // Mark next turn as current
                }
            }
        );
    },

    /**
     * Create the converstaion thread where a user can take their turn
     * @param  {object} bot  Botkit bot that can create conversations
     * @param  {object} currentTurn  Database Turn that is about to be taken.
     * @param  {MessageType} previousMessageType  The MessageType of the previous turn (left blank in case people drop out)
     * @param  {String} turnPrompt  What to tell the user in order for them to take their turn (could vary whether it's the first player or any other)
     */
    initiateTurnConversation: (bot, currentTurn, previousMessageType, turnPrompt) => {
        let currentMessageType = turnUtils.oppositeMessageType(previousMessageType);

        currentTurn.update({isCurrent: true});
        let phoneNumber = currentTurn.user.phoneNumber;
        module.exports.sendInitialPrompt(bot, phoneNumber);
        bot.createConversation({channel: phoneNumber}, function(err, convo) {

            convo.addMessage('Thanks, your turn has been recorded! You will be notified when the game completes.', TURN_SUCCESS_THREAD);
            
            convo.addMessage({
                text: `Sorry your response was not written in ONLY ${currentMessageType}. Please try again!`,
                action: TURN_THREAD
            }, TURN_FAIL_THREAD);

            convo.addMessage({
                text: "Sorry, we encountered an error processing your turn. Please try again or contact our support team at TODO.",
                action: TURN_THREAD
            }, TURN_ERROR_THREAD)


            module.exports.addTurnQuestion(convo, currentTurn, turnPrompt, currentMessageType, bot);


            convo.activate();

            convo.gotoThread(TURN_THREAD);
        })
    },



    /**
     * Create the "question" that a user interacts with to take their turn
     * @param  {object} convo  Botkit conversation that can ask questions
     * @param  {object} currentTurn   Database Turn that is being taken.
     * @param  {String} turnPrompt  What to tell the user in order for them to take their turn
     * @param  {object} currentMessageType  What the MessageType of the incoming text SHOULD be.
     * @param  {object} bot  Botkit bot that can create conversations
     */
    addTurnQuestion: (convo, currentTurn, turnPrompt, currentMessageType, bot) => {
        convo.addQuestion(turnPrompt, 
            [{
                default: true,
                callback: async (response, convo) => {
                    if (turnUtils.isValidResponse(response.Body, currentMessageType)) {
                        try {
                            let turn = await currentTurn.update({message: response.Body, messageType: currentMessageType, receivedAt: new Date(), isCurrent: false});
                            convo.gotoThread(TURN_SUCCESS_THREAD);
                            if (currentTurn.nextUserId != null) {
                                module.exports.beginNextTurn(bot, currentTurn, currentMessageType);
                            } else {
                                console.log("No next user, game over!!");
                            }
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

    /**
     * Given the turn that was just completed, begin the next turn
     * @param  {object} bot  Botkit bot that can create conversations
     * @param  {object} completedTurn   Database Turn that was just completed.
     * @param  {object} currentMessageType  What the MessageType of the incoming text SHOULD be.
     */
    beginNextTurn: async (bot, completedTurn, currentMessageType) => {
        let turnPrompt = `Text your response to the following prompt using ONLY ${currentMessageType}:
${completedTurn.message}`
        let nextTurn = await models.turn.findOne({where: {userId: completedTurn.nextUserId, gameId: completedTurn.gameId}, include: [{model: models.user, as: "user"}]});
        module.exports.initiateTurnConversation(bot, nextTurn, currentMessageType, turnPrompt);
    }
}
