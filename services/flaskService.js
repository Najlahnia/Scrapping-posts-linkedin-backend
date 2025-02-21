const axios = require("axios");

async function loginToFlask(username, password) {
  const url = "http://127.0.0.1:5000/login";
  const data = { username, password };

  try {
    const response = await axios.post(url, data);
    return response.data;
  } catch (error) {
    console.error("Erreur de connexion à Flask :", error);
    throw new Error("Erreur d'authentification");
  }
}

module.exports = { loginToFlask };
