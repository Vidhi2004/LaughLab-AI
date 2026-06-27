const axios = require("axios");

async function fetchMemes() {

    try {

        const response = await axios.get(
            "https://meme-api.com/gimme/100"
        );

        return response.data.memes;

    } catch (err) {

        console.error("Meme API Error:", err);

        throw err;
    }

}

module.exports = {
    fetchMemes
};