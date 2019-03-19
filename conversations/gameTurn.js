

module.exports = {
    takeTurn: (turn, bot) => {
      const phoneNumbers = [];
      bot.say({
        text: `Welcome to Emojiphone, the game of communication and emojis! You're up for your group; take your turn in the next 24 hours or you will be skipped!

Please respond with a description of the following sentence using ONLY ${turn.type}:`,
        channel: turn.current_user.phone_number
      }, (err, msg) => {
        if (err) {
          console.log("Error sending turn-starting message: " + err);
        }
      });
    },

    respondToMessage: (turn, message, bot) => {

//       bot.createConversation(message, function(err, convo) {

//         convo.addQuestion(`Time to set up your game! Text me at least ${MINIMUM_PLAYER_COUNT - phoneNumbers.length - 1} total contacts to be able to start your game.

// Text "${DONE_ADDING_CONTACTS_KEYWORD}" when you want to start the game or "${QUIT_ADDING_CONTACTS_KEYWORD}" if you don't want to play.`, [
//           {
//             pattern: DONE_ADDING_CONTACTS_KEYWORD,
//             callback: function(response, convo) {
//               if (isGameReady(phoneNumbers)) {
//                 convo.gotoThread(START_GAME_THREAD);
//               } else {
//                 convo.gotoThread(NOT_READY_YET_THREAD);
//               }
//             },
//           },
//           {
//             pattern: QUIT_ADDING_CONTACTS_KEYWORD,
//             callback: function(response, convo) {
//               convo.gotoThread(QUIT_GAME_THREAD);
//             },
//           },
//           {
//             default: true,
//             callback: async function(response, convo) {
//               if (response.MediaContentType0 === 'text/x-vcard') {
//                 const phoneNumber = await downloadVCard(response);
//                 phoneNumbers.push(phoneNumber);
//                 convo.gotoThread(ADDED_PHONE_NUMBER_THREAD);

//               } else {
//                 convo.gotoThread(INVALID_INPUT_THREAD);
//               }
//             },
//           }
//         ], {}, ADD_CONTACTS_THREAD);

//       })
    }
}