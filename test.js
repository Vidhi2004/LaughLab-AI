require("dotenv").config();

const { analyzeMessage } = require("./services/geminiService");

(async () => {

    const result = await analyzeMessage(
        "I am hungry and I want pizza"
    );

    console.log(result);

})();