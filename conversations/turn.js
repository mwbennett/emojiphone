const utils = require('../utils/utils');
const turnUtils = require('../utils/turn_utils');
const models = require('../models');

const TURN_SUCCESS_THREAD = "success";
const TURN_FAIL_THREAD = "fail";
const TURN_THREAD = "turn";
const TURN_ERROR_THREAD = "error";

module.exports = {
    /**
     * Create the converstaion thread where a user can take their turn
     * @param  {object} bot  Botkit bot that can create conversations
     * @param  {object} phoneNumber  Phone number that initial prompt should be sent to.
     */
    initiateTurn: (bot, phoneNumber) => {
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
     * @param  {object} message  The intial message that was passed into the listener, should be INITIATE_GAME_KEYWORD
     * @param  {object} turn  Database Turn that was just taken.
     */
    initiateTurnConversation: (bot, previousTurn) => {
        let currentMessageType = turnUtils.oppositeMessageType(previousTurn.messageType);
        models.turn.findOne({where: {userId: previousTurn.nextUserId, gameId: previousTurn.gameId}, include: [{model: models.user, as: "user"}]}).then(currentTurn => {
            currentTurn.update({isCurrent: true});
            let phoneNumber = currentTurn.user.phoneNumber
            module.exports.initiateTurn(bot, phoneNumber);
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

                module.exports.addTurnQuestion(convo, currentTurn, previousTurn, currentMessageType, bot);


                convo.activate();

                convo.gotoThread(TURN_THREAD);
            })
        })
    },

    /**
     * Create the "question" that a user interacts with to take their turn
     * @param  {object} convo  Botkit conversation that can ask questions
     * @param  {object} currentTurn   Database Turn that is being taken.
     * @param  {object} previousTurn  Database Turn that was just taken.
     * @param  {object} currentMessageType  What the MessageType of the incoming text SHOULD be.
     * @param  {object} bot  Botkit bot that can create conversations
     */
    addTurnQuestion: (convo, currentTurn, previousTurn, currentMessageType, bot) => {
        convo.addQuestion(`Text your response to the following prompt using ONLY ${currentMessageType}:
${previousTurn.message}`, 
            [{
                default: true,
                callback: async (response, convo) => {
                    if (turnUtils.isValidResponse(response.Body, currentMessageType)) {
                        try {
                            let turn = await currentTurn.update({message: response.Body, messageType: currentMessageType, receivedAt: new Date(), isCurrent: false});
                            convo.gotoThread(TURN_SUCCESS_THREAD);
                            if (currentTurn.nextUserId != null) {
                                module.exports.initiateTurnConversation(bot, currentTurn);
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
        
    }
}
