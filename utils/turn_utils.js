

module.exports = {
    isValidResponse: (response, messageType) => {
        if (response != "BAD") {
            return true;
        }
        return false;
    }
}