const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const saveToCSV = (posts) => {
    if (posts.length === 0) {
        console.log(" Aucun post à sauvegarder en CSV.");
        return null;
    }

    const csvFilePath = path.join(__dirname, '../exports/posts.csv');

    // Vérifier que le dossier "exports" existe, sinon le créer
    const exportDir = path.dirname(csvFilePath);
    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
    }

    const csv = Papa.unparse(posts, {
        header: true,
        delimiter: ";",
    });

    fs.writeFileSync(csvFilePath, csv, 'utf8');
    console.log(`Fichier CSV sauvegardé: ${csvFilePath}`);

    return csvFilePath;
};

module.exports = { saveToCSV };
