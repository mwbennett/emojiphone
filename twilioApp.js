const setupConversation = require('./conversations/setup');
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
        utils.controller.setupWebserver(5000, function(err, server) {
            server.get('/', function(req, res) {
                res.send(':)');
            });
            server.get('/mmsLink/:platform/:gameId', async function(req, res) {
                let platform = req.params.platform.toLowerCase();
                if (acceptablePlatforms.indexOf(platform) == -1) {
                    return res.status(400).send("Platform must be 'ios' or 'android'");
                }
                let url = await mmsUtils.makeMmsUrl(req.params.gameId, platform);
                res.set('location', url);
                res.status(301).send()
            })
            utils.controller.createWebhookEndpoints(server, utils.bot);
        })
        utils.controller.hears([setupConversation.INITIATE_GAME_KEYWORD], 'message_received', (bot, message) => {setupConversation.initiateGameConversation(message)});    

        // Initiate a turn on app start:
        // models.turn.findByPk(46, {include: [{model: models.user, as: "user"}, {model: models.user, as: "nextUser"}]}).then(currentTurn => {
        //     turnConversation.initiateTurnConversation(currentTurn, "text", "Take yer turn, nerd");
        // })
    }
}
