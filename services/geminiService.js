const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=${GEMINI_API_KEY}`;

function buildPrompt(texte) {
    return `
Tu es un assistant intelligent qui détecte si un texte contient une **opportunité de travail**.

Critères :
- Expressions comme : "nous recrutons", "je cherche un développeur", "poste à pourvoir", "freelance recherché", "CDI", "stage", "mission", "expérience 2 ans", "profil junior", etc.
- Mots-clés : développeur, backend, IA, ingénieur, freelance, etc.

Ignore les textes qui ne cherchent pas à recruter.

Réponds uniquement au format JSON :

{
  "is_opportunity": true/false,
  "confidence_score": 0 à 1,
  "clean_text": "texte nettoyé",
  "token_count": nombre de tokens utilisés
}

Texte à analyser :
"""
${texte}
"""
`;
}

async function analyzeTextWithGemini(originalText) {
    const prompt = buildPrompt(originalText);
    const headers = { "Content-Type": "application/json" };
    const payload = {
        contents: [{ parts: [{ text: prompt }] }]
    };

    const response = await axios.post(GEMINI_ENDPOINT, payload, { headers });
    const reply = response.data.candidates[0].content.parts[0].text;

    const parsed = JSON.parse(reply);
    return {
        original_text: originalText,
        clean_text: parsed.clean_text,
        is_opportunity: parsed.is_opportunity,
        confidence_score: parsed.confidence_score,
        token_count: parsed.token_count,
        detection_date: new Date()
    };
}

module.exports = { analyzeTextWithGemini };
