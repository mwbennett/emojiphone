const { Botkit } = require('botkit');
const { TwilioAdapter } = require('botbuilder-adapter-twilio-sms');
const { PostgresStorage } = require('botbuilder-storage-postgres');
const vCard = require('vcard');


process.env.NODE_ENV = (process.env.NODE_ENV) ? process.env.NODE_ENV :  "development";
require('custom-env').env(true);


var fetch = require('node-fetch');
const models = require('../models');

module.exports = {
    bot: {},
    controller: {},
    /**
     * Provided an MMS vCard text message, fetch the vCard data and return a "User" js object (fname, lname, phone number).
     * @param  {BotKit Response} message 
     */
    vCardMessageToUser: async (message) => {
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
    createBot: async () => {
        const postgresStorage = new PostgresStorage({
            uri : process.env.DATABASE_URI
        });
        let adapter = new TwilioAdapter({
            debug: true,
            account_sid: process.env.TWILIO_ACCOUNT_SID,
            auth_token: process.env.TWILIO_AUTH_TOKEN,
            twilio_number: process.env.TWILIO_PHONE_NUMBER,
        });

        module.exports.controller = new Botkit({
            adapter: adapter,
            storage: postgresStorage
        })

        module.exports.bot = await module.exports.controller.spawn({});
    },
    getUserByPhoneNumber: async (phoneNumber) => {
        let user = await models.user.findOne({where: {phoneNumber: phoneNumber}});        
        return user;
    },
    /**
     * Create a new user in the database
     * @param  {String} nameString String containing at least a first name, and potentially a last name
     * @param  {String phoneNumber} phoneNumber User's phone number.

    */
    addUser: async (nameString, phoneNumber) => {
        let nameStrings = nameString.split(' ');
        let user = {
            firstName: nameStrings[0],
            phoneNumber: phoneNumber            
        }
        if (nameStrings.length > 1) {
            user["lastName"] = nameString.substring(nameString.indexOf(' ') + 1);
        }
        let dbUser = await models.user.create(user)
        return dbUser;
    }
}