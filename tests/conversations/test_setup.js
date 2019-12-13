var assert = require('assert');
var should = require('chai').should();
let setupConversation = require('../../conversations/setup');

const users = [
    {
        firstName: "One",
        lastName: "Person",
        phoneNumber: "9198462735"
    },
    {
        firstName: "Two",
        lastName: "People",
        phoneNumber: "9198684114"
    }
]

describe('Setup conversation', () => {
    describe('setupGame', () => {
        beforeEach(done => {
            // Drop database somehow
        })

        it.only('it should be able to set up a game given a list of users', (done) => {
            setupConversation.setupGameForTesting(users).then(users => {
                console.log("Testing", users);
                done();
            }).catch(err => {
                done(err)
            });
        });
    })
})
