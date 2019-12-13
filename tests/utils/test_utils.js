var assert = require('assert');
var should = require('chai').should();
var utils = require('../../utils/utils');


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
    })
});
