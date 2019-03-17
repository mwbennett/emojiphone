var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var Botkit = require('botkit');
var fetch = require('node-fetch');
const vCard = require('vcard');
const Sequelize = require('sequelize');

require('dotenv').config()

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// DB setup
const sequelize = new Sequelize(
  process.env.DATABASE,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD, 
  { host: 'localhost', dialect: 'postgres' }
);

sequelize
  .authenticate()
  .then(() => {
    console.log('🎉 Connection has been established successfully.');
  })
  .catch(err => {
    console.error('🙁 Unable to connect to the database:', err);
  });

const User = sequelize.define('user', {
  firstName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  lastName: {
    type: Sequelize.STRING
    // allowNull defaults to true
  },
  phoneNumber: {
    type: Sequelize.STRING,
    unique: true,
  },
});

const Turn = sequelize.define('turn', {
  user_id: {
    type: Sequelize.INTEGER,
    references: {
      model: User,
      key: 'id',
      deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE,
    },
    unique: 'userGameComposite',
  },
  messageType: {
    type: Sequelize.STRING,
    validate: {
      isIn: [['emoji', 'text']],
    },
  },
  message: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  receivedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  nextUser_id: {
    type: Sequelize.INTEGER,
    references: {
      model: User,
      key: 'id',
      deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE,
    },
  },
  isCurrent: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  gameId: {
    type: Sequelize.INTEGER,
    unique: 'userGameComposite',
  },
});

User.sync().then(() => {
  User.findOrCreate({ where: { phoneNumber: '5109151444' }, defaults: {
    firstName: 'Mark',
    lastName: 'Bennett',
  }}).then((mark) => console.log('Mark', mark));
});
Turn.sync();




// Twilio Botkit 
var TWILIO_ACCOUNT_SID = 'AC88232d86e93e7150e3db15f8871ccdc6';
var TWILIO_AUTH_TOKEN = '015c9250ac5b7257cc6f149af56c0666';
var TWILIO_PHONE_NUMBER = '+13132469144';
var controller = Botkit.twiliosmsbot({
  debug: true,
  account_sid: TWILIO_ACCOUNT_SID,
  auth_token: TWILIO_AUTH_TOKEN,
  twilio_number: TWILIO_PHONE_NUMBER,
});

var bot = controller.spawn({});
controller.setupWebserver(5000, function(err, server) {
  server.get('/', function(req, res) {
    res.send(':)');
  });

  controller.createWebhookEndpoints(server, bot);
})

// Minimum player count (including the "initiator" of the game)
const MINIMUM_PLAYER_COUNT = 3;

/**
 * Provided an MMS vCard text message, fetch the vCard data and return the phoone number.
 * @param  {string} message 
 */
const downloadVCard = async (message) => {
  const url = message.MediaUrl0;
  var card = new vCard();

  const response = await fetch(url, { redirect: 'follow' });
  const textContent = await response.text();

  return new Promise((resolve, reject) => {
    card.readData(textContent, function(err, json) {
      resolve(json.TEL.value);
    });
  });
};

/**
 * Validate that we are ready to start the game!
 * @param  {string[]} phoneNumbers  List of phone numbers to include in the game.
 */
const isGameReady = (phoneNumbers) => {
  console.log(`VALIDATING GAME: ${phoneNumbers.length} numbers`);
  return Array.isArray(phoneNumbers) && phoneNumbers.length >= MINIMUM_PLAYER_COUNT - 1;
}

controller.hears(['beginner'], 'message_received', function(bot, message) {
  bot.createConversation(message, function(err, convo) {
    const phoneNumbers = [];
    convo.addQuestion('Thanks for starting a new game! Are you ready to start adding contacts?', [
      {
        pattern: bot.utterances.yes,
        callback: function(response, convo) {
          convo.gotoThread('addContacts');
        },
      },
    ], {}, 'default');

    convo.addQuestion('Add as many contacts as you like. Text DONE when you want to start the game.', [
      {
        pattern: 'done',
        callback: function(response, convo) {
          console.log('done', response.Body);
          if (isGameReady(phoneNumbers)) {
            convo.gotoThread('startGame');
          } else {
            convo.gotoThread('notReadyYet');
            // TODO: Different thread? Try again -- keep adding;
          }
        },
      },
      {
        pattern: 'outtie',
        callback: function(response, convo) {
          console.log('donezo', response.Body);
          convo.gotoThread('finishedGame');
        },
      },
      {
        default: true,
        callback: async function(response, convo) {
          console.log('Response', response);
          if (response.MediaContentType0 === 'text/x-vcard') {
            const phoneNumber = await downloadVCard(response);
            console.log('New phone number added: ', phoneNumber);

            phoneNumbers.push(phoneNumber);

            // TODO do something with the number.

            // TODO: WHY ISN"T THIS WORKING??
            convo.addMessage('Got it!', 'addContacts');
            // convo.say('Got it!');
          } else {
            // TODO: WHY ISN"T THIS WORKING??
            convo.addMessage("Sorry, I couldn't understand you. Please send a contact, or say 'DONE'.", 'addContacts')
            // convo.say("Sorry, I couldn't understand you. Please send a contact, or say 'DONE'.");
          }
          convo.repeat();
          convo.next();
        },
      }
    ], {}, 'addContacts');

    convo.addMessage('Ok, you are done with the game', 'finishedGame');
    convo.addMessage('Ok, we will begin the game!', 'startGame');

    convo.addMessage({
      text: `Oops! You only have ${phoneNumbers.length} other players. Please add ${MINIMUM_PLAYER_COUNT - phoneNumbers.length - 1} more contacts.`,
      action: 'addContacts',
    }, 'notReadyYet');

    convo.activate();
  }); 
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
