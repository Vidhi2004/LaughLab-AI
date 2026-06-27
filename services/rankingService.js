function rankMemes(memes, keywords) {

    if (!Array.isArray(memes) || memes.length === 0) {
        return [];
    }

    const ranked = memes.map(meme => {

        let score = 0;

        keywords.forEach(keyword => {

            if (
                meme.title &&
                meme.title.toLowerCase().includes(keyword.toLowerCase())
            ) {
                score += 10;
            }

        });

        return {
            ...meme,
            score
        };

    });

    ranked.sort((a, b) => {

        if (b.score === a.score) {
            return (b.ups || 0) - (a.ups || 0);
        }

        return b.score - a.score;

    });

    return ranked.slice(0, 5);

}

module.exports = {
    rankMemes
};