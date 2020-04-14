const setupConversation = require('./conversations/setup');
const setupUtils = require('./utils/setup_utils');
const turnConversation = require('./conversations/turn');
const utils = require('./utils/utils');
const models = require('./models');
const User = require('./models/user');
const mmsUtils = require('./utils/mms_utils');
const ios = 'ios';
const android = 'android';
const acceptablePlatforms = [android, ios];

module.exports = {
    setup: function() {
        utils.createBot();
        // utils.controller.setupWebserver(5000, function(err, server) {
        //     server.get('/', function(req, res) {
        //         res.send(':)');
        //     });
        //     server.get('/mmsLink/:platform/:gameId', async function(req, res) {
        //         let platform = req.params.platform.toLowerCase();
        //         if (acceptablePlatforms.indexOf(platform) == -1) {
        //             return res.status(400).send("Platform must be 'ios' or 'android'");
        //         }
        //         let url = await mmsUtils.makeMmsUrl(req.params.gameId, platform);
        //         console.log(url);
        //         res.set('location', url);
        //         res.status(301).send()
        //     })
        //     utils.controller.createWebhookEndpoints(server, utils.bot);
        // })
        utils.controller.hears([setupConversation.INITIATE_GAME_KEYWORD], 'message', async (bot, message) => {setupConversation.initiateGameConversation(message, bot)});    

        // setupUtils.setupGame([
        //     {
        //         firstName: "Google",
        //         lastName: "Voice",
        //         phoneNumber: "+19193781540"
        //     },{
        //         firstName: "Evan",
        //         lastName: "Snyder",
        //         phoneNumber: "+19198684114"
        //     },{
        //         firstName: "Mom",
        //         phoneNumber: "+19193956116"
        //     }
        // ]);

        // setupUtils.restartGameById(14);
        // turnConversation.createEndGameConversations(47);
        // turnConversation.restartGame(35, ["+19196183270", "+19198684114"]);
        // turnConversation.takeFirstTurn(74);
        // Initiate a turn on app start:
        // models.turn.findByPk(111, {include: [{model: models.user, as: "user"}, {model: models.user, as: "nextUser"}]}).then(currentTurn => {
        //     turnConversation.initiateTurnConversation(currentTurn, "text", "Take yer turn, nerd");
        // })
    }
}
