const assert = require('assert');
const should = require('chai').should();
const utils = require('../../utils/utils');
const testUtils = require('../../utils/testing_utils');


let sampleMessage = {
    MediaUrl0: "https://api.twilio.com/2010-04-01/Accounts/ACa5c63ba2287d0c4b4b0ab7f62835eba0/Messages/MM5b46b8a5dc97f6bfbd9fb2ca08f3d694/Media/MEed762fe18fec700e4b3c6c582cb4c41c"
}

/* Url points to the following json:
{ 
    FN: 'Aaatest Tes',
    VERSION: '2.1',
    TEL: { type: [ 'CELL' ], value: '919-868-4114' },
    N: 'Tes, Aaatest' 
}
*/

const FIRST_NAME = "Aaatest";
const LAST_NAME = "Tes";
const PHONE_NUMBER = "919-868-4114";


describe('utils', () => {
    describe('downloadVcard', () => {
        it('should be able to create users from phone numbers', async function () {
            const user = await utils.downloadVCard(sampleMessage);
            user.should.be.a('object');
            user.should.have.property('firstName');
            user.should.have.property('lastName');
            user.should.have.property('phoneNumber');
            user.firstName.should.equal(FIRST_NAME);
            user.lastName.should.equal(LAST_NAME);
            user.phoneNumber.should.equal(PHONE_NUMBER);
        });
    });

    describe('getUserByPhoneNumber', () => {
        beforeEach(done => {
            testUtils.seedDatabase().then(() => {
                done()
            });
        })

        it('it should be able to get a user by their phone number', async () => {
            let user = await utils.getUserByPhoneNumber(testUtils.variables.phoneNumbers[0]);
            console.log(user);

            user.should.have.property("id");
            user.id.should.equal(testUtils.variables.userIdOne);
        });

        it('it should return empty if no user exists with that phone number', async () => {
            let user = await utils.getUserByPhoneNumber("invalid phone number");

            should.not.exist(user);
        });

        it('it should fail when a string is not input', async () => {
            let error;
            try {
                await utils.getUserByPhoneNumber([{"obj": "invalid phone number"}]);
            } catch (e) {
                error = e;
            }
            should.exist(error);
            error.should.be.an("Error");
        });
    })
});
