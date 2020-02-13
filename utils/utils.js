const vCard = require('vcard');
var Botkit = require('botkit');
require('dotenv').config();
var fetch = require('node-fetch');
const models = require('../models');

module.exports = {
    bot: {},
    controller: {},
    /**
     * Provided an MMS vCard text message, fetch the vCard data and return a "User" js object (fname, lname, phone number).
     * @param  {BotKit Response} message 
     */
    downloadVCard: async (message) => {
        const url = message.MediaUrl0;
        var card = new vCard();

        const response = await fetch(url, { redirect: 'follow' });
        const textContent = await response.text();

        return new Promise((resolve, reject) => {
            card.readData(textContent, function(err, json) {
                names = json.N.split(',');
                resolve({
                    firstName: names[1].trim(),
                    lastName: names[0].trim(),
                    phoneNumber: json.TEL.value
                });
            });
        });
    },
    createBot: () => {
        module.exports.controller = Botkit.twiliosmsbot({
            debug: true,
            account_sid: process.env.TWILIO_ACCOUNT_SID,
            auth_token: process.env.TWILIO_AUTH_TOKEN,
            twilio_number: process.env.TWILIO_PHONE_NUMBER,
        });

        module.exports.bot = module.exports.controller.spawn({});
    },
    getUserByPhoneNumber: async (phoneNumber) => {
        let user = await models.user.findOne({where: {phoneNumber: phoneNumber}});        
        return user;
    }
}