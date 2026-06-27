const { fetchMemes } = require("./services/memeService");

(async () => {
    try {
        const memes = await fetchMemes();

        console.log("Total Memes:", memes.length);
        console.log(memes[0]);
    } catch (err) {
        console.error(err);
    }
})();