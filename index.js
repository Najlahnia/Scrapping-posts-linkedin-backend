require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const dataRoutes = require("./routes/dataRoutes");
const mysql = require("mysql2");
const bodyParser = require('body-parser');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect(err => {
  if (err) {
      console.error('Error connecting to MySQL:', err);
      return;
  }
});

app.use("/api/auth", authRoutes);  // Utilisation des routes d'authentification
app.use("/api/data", dataRoutes);

app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  console.log('Received data:', username, email, password);
  res.status(200).json({ message: 'User registered successfully!' });
});


// Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Serveur lancé sur http://localhost:${PORT}`);
});
