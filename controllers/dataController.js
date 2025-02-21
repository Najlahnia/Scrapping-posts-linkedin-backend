const axios = require('axios');  // Importation manquante
const { generateHash } = require('../services/hashService');
const db = require('../db');

// Fonction pour enregistrer les données
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

            return existingPost[0];  // Renvoie l'existant si déjà en BD
        }));

        res.status(201).json({ message: 'Data saved successfully', savedPosts });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des données :', error);
        res.status(500).json({ error: error.message });
    }
};

const fetchAndSaveData = async (req, res) => {
    console.log("📡 Début de fetchAndSaveData...");

    try {
        console.log("🚀 Envoi de la requête à l'API Flask...");
        const flaskResponse = await axios.post('http://127.0.0.1:5000/html_scrape_home_posts');

        if (!flaskResponse.data.posts || !Array.isArray(flaskResponse.data.posts)) {
            console.warn("⚠️ Réponse inattendue de Flask :", flaskResponse.data);
            return res.status(400).json({ error: "Réponse invalide reçue de Flask" });
        }

        const posts = flaskResponse.data.posts;

        if (posts.length === 0) {
            console.warn("⚠️ Aucun post reçu de Flask.");
            return res.status(404).json({ error: "Aucun post trouvé" });
        }

        console.log(`📩 ${posts.length} posts reçus. Enregistrement en cours...`);
        const savedPosts = [];

        for (const post of posts) {
            const htmlContent = post.HTML || ""; 
            const postText = post.Texte || "Texte non disponible";
            const postAuthor = post.Auteur || "Auteur inconnu";
            
            // ✅ Correction de la date pour éviter "Unknown"
            const postDate = post.Date && post.Date !== "Unknown" 
                ? post.Date 
                : new Date().toISOString().slice(0, 19).replace("T", " "); // Formate en "YYYY-MM-DD HH:MM:SS"

            const postHash = generateHash(htmlContent);
            console.log(`🔍 Vérification du post avec hash: ${postHash}`);

            const [existingPost] = await db.query('SELECT * FROM posts WHERE post_hash = ?', [postHash]);

            if (existingPost.length === 0) {
                console.log("🆕 Nouveau post détecté, insertion en base de données...");

                try {
                    const [result] = await db.query(
                        'INSERT INTO posts (author, date, text, html_content, post_hash) VALUES (?, ?, ?, ?, ?)',
                        [postAuthor, postDate, postText, htmlContent, postHash]
                    );

                    console.log(`✅ Post ajouté avec ID: ${result.insertId}`);
                    savedPosts.push({ id: result.insertId, Auteur: postAuthor, Date: postDate, Texte: postText, html_content: htmlContent });

                } catch (sqlError) {
                    console.error("❌ Erreur SQL lors de l'insertion:", sqlError.sqlMessage);
                }
            } else {
                console.log("ℹ️ Post déjà existant, aucune insertion.");
                savedPosts.push(existingPost[0]);
            }
        }

        console.log("🎉 Tous les posts ont été traités avec succès.");
        res.status(201).json({ message: "Données enregistrées avec succès", savedPosts });

    } catch (error) {
        console.error("❌ Erreur dans fetchAndSaveData:", error.message);
        res.status(500).json({ error: error.message });
    }
};


// Récupérer tous les posts depuis la base de données
const getAllPosts = async (req, res) => {
    try {
        const [posts] = await db.query('SELECT * FROM posts ORDER BY date DESC'); // Trie les posts du plus récent au plus ancien
        res.status(200).json(posts);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des posts:", error.message);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des posts" });
    }
};

// Exportation des fonctions
module.exports = {
    saveData,
    fetchAndSaveData,
    getAllPosts
};








