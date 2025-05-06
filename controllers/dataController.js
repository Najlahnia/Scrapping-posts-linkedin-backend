const axios = require('axios');
const db = require('../db');
const { generateHash } = require('../services/hashService');
const { saveToCSV } = require('../services/csvService'); 
const { analyzeTextWithGemini } = require('../services/geminiService');
const fs = require('fs');

const saveData = async (req, res) => {
    const { posts } = req.body;

    try {
        const savedPosts = await Promise.all(posts.map(async (post) => {
            const post_hash = generateHash(post.html_content);
            const [existingPost] = await db.query('SELECT * FROM posts WHERE post_hash = ?', [post_hash]);

            if (existingPost.length === 0) {
                const [result] = await db.query(
                    'INSERT INTO posts (postNumber, author, date, text, html_content, post_hash) VALUES (?, ?, ?, ?, ?, ?)',
                    [post.post_number, post.Auteur, post.Date, post.Texte, post.html_content, post_hash]
                );
                return { id: result.insertId, ...post };
            }

            return existingPost[0];
        }));

        res.status(201).json({ message: 'Data saved successfully', savedPosts });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des données :', error);
        res.status(500).json({ error: error.message });
    }
};

const fetchAndSaveData = async (req, res) => {
    console.log(" Début de fetchAndSaveData...");

    try {
        const flaskResponse = await axios.post('http://127.0.0.1:5000/html_scrape_home_posts');

        if (!flaskResponse.data.posts || !Array.isArray(flaskResponse.data.posts)) {
            return res.status(400).json({ error: "Réponse invalide reçue de Flask" });
        }

        const posts = flaskResponse.data.posts;
        if (posts.length === 0) {
            return res.status(404).json({ error: "Aucun post trouvé" });
        }

        console.log(` ${posts.length} posts reçus. Enregistrement en cours...`);
        const savedPosts = [];

        for (const post of posts) {
            const postHash = generateHash(post.HTML);
            const [existingPost] = await db.query('SELECT * FROM posts WHERE post_hash = ?', [postHash]);

            if (existingPost.length === 0) {
                const [result] = await db.query(
                    'INSERT INTO posts (author, date, text, html_content, post_hash) VALUES (?, ?, ?, ?, ?)',
                    [post.Auteur, post.Date, post.Texte, post.HTML, postHash]
                );

                savedPosts.push({ id: result.insertId, Auteur: post.Auteur, Date: post.Date, Texte: post.Texte, html_content: post.HTML });
            } else {
                savedPosts.push(existingPost[0]);
            }
        }

        res.status(201).json({ message: "Données enregistrées avec succès", savedPosts });

    } catch (error) {
        console.error(" Erreur dans fetchAndSaveData:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const getAllPosts = async (req, res) => {
    try {
        const [posts] = await db.query('SELECT * FROM posts ORDER BY date DESC');
        res.status(200).json(posts);
    } catch (error) {
        console.error("Erreur lors de la récupération des posts:", error.message);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des posts" });
    }
};

// Nouvelle fonction pour exporter les posts en CSV
const exportToCSV = async (req, res) => {
    try {
        const [posts] = await db.query('SELECT * FROM posts ORDER BY date DESC');

        if (posts.length === 0) {
            return res.status(404).json({ error: "Aucun post à exporter en CSV." });
        }

        const csvFilePath = saveToCSV(posts);
        if (!fs.existsSync(csvFilePath)) {
            return res.status(500).json({ error: "Erreur lors de la génération du fichier CSV." });
        }

        res.download(csvFilePath, 'posts.csv', (err) => {
            if (err) {
                res.status(500).json({ error: "Erreur serveur" });
            }
        });

    } catch (error) {
        console.error(" Erreur lors de l'exportation CSV :", error.message);
        res.status(500).json({ error: "Erreur serveur" });
    }
};


///////////////////////////////////////////////////////////////////



const analyzeAndSaveOpportunities = async (req, res) => {
    try {
        const [posts] = await db.query('SELECT id, text FROM posts');

        const results = [];

        for (const post of posts) {
            const analysis = await analyzeTextWithGemini(post.text);

            const [insertResult] = await db.query(`
                INSERT INTO business_opportunities (original_text, clean_text, is_opportunity, confidence_score, detection_date, token_count)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                analysis.original_text,
                analysis.clean_text,
                analysis.is_opportunity,
                analysis.confidence_score,
                analysis.detection_date,
                analysis.token_count
            ]);

            results.push({ id: insertResult.insertId, ...analysis });
        }

        res.status(201).json({ message: "Analyse et sauvegarde terminées", results });
    } catch (error) {
        console.error("Erreur analyse/sauvegarde :", error.message);
        res.status(500).json({ error: "Erreur serveur" });
    }
};




module.exports = { saveData, fetchAndSaveData, getAllPosts, exportToCSV , analyzeAndSaveOpportunities};
