// routes/authRoutes.js
const express = require("express");
const { loginToFlask } = require("../services/flaskService");
const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await loginToFlask(username, password);
    res.json(result);  // Renvoie la réponse de Flask ou un message d'erreur
  } catch (error) {
    res.status(500).json({ message: "Erreur de connexion", error: error.message });
  }
});

module.exports = router;
