
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Error: NEXT_PUBLIC_GEMINI_API_KEY not found in .env.local");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        const modelResponse = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init to get client
        // Actually, the SDK doesn't expose listModels directly on the main class easily in all versions.
        // Let's use the API directly to be sure, or try the model manager if available.

        // Using direct fetch for reliability as SDK structure varies
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("\nAvailable Models:");
            console.log("=================");
            data.models.forEach(model => {
                if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${model.name.replace('models/', '')}`);
                    console.log(`  Description: ${model.description}`);
                    console.log(`  Methods: ${model.supportedGenerationMethods.join(', ')}`);
                    console.log("-----------------");
                }
            });
        } else {
            console.error("No models found or error:", data);
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
