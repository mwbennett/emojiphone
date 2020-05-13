const models = require('../models');
const { Op, QueryTypes } = require('sequelize');


module.exports = {
    isUserInConversation: async(user) => {
        if (!user || !user.phoneNumber) {
            return false;
        }
        const convoCount = await models.sequelize.query(
            `SELECT COUNT(*) FROM state 
            WHERE jsonb_array_length(data->'dialogState'->'dialogStack') > 0
            AND id LIKE :phoneNumber;`, 
            {
                type: QueryTypes.SELECT,
                replacements: {phoneNumber: `%${user.phoneNumber}%`}
            }
        )

        return parseInt(convoCount[0].count) > 0;
    }
}