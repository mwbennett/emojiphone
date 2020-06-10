const setupConversation = require('./conversations/setup');
const setupUtils = require('./utils/setup_utils');
const turnUtils = require('./utils/turn_utils');
const turnConversation = require('./conversations/turn');
const restartConversation = require('./conversations/restart');
const utils = require('./utils/utils');
const models = require('./models');
const User = require('./models/user');
const mmsUtils = require('./utils/mms_utils');
const ios = 'ios';
const android = 'android';
const acceptablePlatforms = [android, ios];

module.exports = {
    setup: async function() {
        await utils.createBot();

        utils.controller.webserver.get('/mmsLink/:platform/:gameId', async(req, res) => {
            let platform = req.params.platform.toLowerCase();
            if (acceptablePlatforms.indexOf(platform) == -1) {
                return res.status(400).send("Platform must be 'ios' or 'android'");
            }
            let url = await mmsUtils.makeMmsUrl(req.params.gameId, platform);
            res.set('location', url);
            res.status(301).send()
            
        })

        await setupConversation.setupSetupConversation();
        await turnConversation.setupTurnConversation();
        await restartConversation.setupRestartConversation();

        utils.controller.hears([setupConversation.INITIATE_GAME_KEYWORD], 'message', async (bot, message) => {
            try {
                await bot.beginDialog(setupConversation.SETUP_CONVERSATION);
            } catch(e) {
                console.log(e);
            }
        });

        utils.controller.hears([turnUtils.RESTART_KEYWORD], 'message', async (bot, message) => {
            try {
                await bot.beginDialog(restartConversation.RESTART_CONVERSATION);
            } catch(e) {
                console.log(e);
            }
        });
    }
}
