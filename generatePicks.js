#!/usr/bin/env node
// Run this directly with './generatePicks.js' or 'node generatePicks.js'

// --- CONFIGURATIONS ---

// BLACK_LIST_MODELS - Models you don't like/trust and want to exclude from the calculations
const BLACK_LIST_MODELS = [];

// THESE_ARE_NOT_MODELS - Fields from ThePredictionTracker to ignore because they are not actual models
const THESE_ARE_NOT_MODELS = ["home", "road", "line", "neutral", "linemidweek", "phcover", "phwin", "lineca", "lineopen", "homeTeam", "awayTeam", "actualLine"].concat(BLACK_LIST_MODELS);

// ENABLE_WHITE_LIST - Enable a whitelist. Only models listed on the whitelist will be used for the calculation
const ENABLE_WHITE_LIST = false;

// WHITE_LIST_MODELS - The list of models to use when ENABLE_WHITE_LIST is set to true
const WHITE_LIST_MODELS = ["linesagr", "linepaynep", "lineloud", "linecurry", "linepig", "linepiratings", "lineca", "linekeep", "linesagr", "linel2"];

// --- Import Dependencies ---
const csv = require('csv-parser');
const fs = require('fs');
const { std, mean, abs } = require('mathjs');
const axios = require('axios');
const { Readable } = require('stream');
const { getZPercent } = require('./getZPercent');

// Parse input parameter to determine the sport we are assessing
const myArgs = process.argv.slice(2);
let TPTurl = "http://www.thepredictiontracker.com/";
if (myArgs[0]) {
    TPTurl += myArgs[0] + ".csv";
} else {
    throw new Error("A sport was not provided. Please provide one of the following as an argument:\nnbapreds\nncaabbpreds\nnfltotals\nnflpredictions\nncaapredictions");
}

// Arrays to store game data
let inputArray = [];
let allGames = [];
let allModelDiffs = {};

// Fetch CSV data using axios and process it with csv-parser
axios.get(TPTurl)
    .then(response => {
        const dataStream = Readable.from(response.data);

        dataStream.pipe(csv())
            .on('data', (data) => inputArray.push(data))
            .on('end', processGames);
    })
    .catch(error => {
        console.error("Error fetching data:", error.message);
    });

// Function to process games after fetching data
function processGames() {
    let numGames = inputArray.length;
    console.log(`\nAnalyzing ${numGames.toString()} games...\n\n\n`);

    inputArray.forEach((game) => {
        if (!game.home || !game.road || !game.line || isNaN(game.line)) {
            return;
        }

        let actualLine = parseFloat(game.line);
        let allGamesEntry = { homeTeam: game.home, awayTeam: game.road, actualLine: actualLine };

        Object.entries(game).forEach(([key, value]) => {
            if (!key || THESE_ARE_NOT_MODELS.includes(key) || value == null || value === "" || isNaN(value)) {
                return;
            }

            if (ENABLE_WHITE_LIST && !WHITE_LIST_MODELS.includes(key)) {
                return;
            }

            let modelLineNum = parseFloat(value);
            let modelLineDiff = modelLineNum - actualLine;

            allGamesEntry[key] = modelLineDiff;

            if (!allModelDiffs[key]) {
                allModelDiffs[key] = [modelLineDiff];
            } else {
                allModelDiffs[key].push(modelLineDiff);
            }
        });

        allGames.push(allGamesEntry);
    });

    allGames.forEach((game) => {
        Object.entries(game).forEach(([key, value]) => {
            if (!key || THESE_ARE_NOT_MODELS.includes(key) || value == null || value === "" || isNaN(value)) {
                return;
            }
            if (ENABLE_WHITE_LIST && !WHITE_LIST_MODELS.includes(key)) {
                return;
            }

            let modelLineDiff = value;
            let allPredictionsForThisModel = allModelDiffs[key];

            // Exclude models with data on less than half the games
            if (!allPredictionsForThisModel || !allPredictionsForThisModel.length || allPredictionsForThisModel.length < numGames / 2) {
                return;
            }

            let zScore = (modelLineDiff - mean(allPredictionsForThisModel)) / std(allPredictionsForThisModel);

            if (!game.zScores) {
                game.zScores = [zScore];
            } else {
                game.zScores.push(zScore);
            }
        });

        game.avgZScore = game.zScores && game.zScores.length ? mean(game.zScores) : 0;
    });

    // Sort games by absolute Z-score
    allGames.sort((a, b) => {
        return abs(b.avgZScore) - abs(a.avgZScore);
    });

    // Display top picks
    console.log("Top Picks:");
    allGames.slice(0, 3).forEach((pick) => {
        let confidenceNum = getZPercent(abs(pick.avgZScore));
        let confidenceString = parseFloat(confidenceNum).toFixed(2);

        let pickTeam = pick.avgZScore >= 0 ? pick.homeTeam : pick.awayTeam;
        let pickOpponent = pick.avgZScore >= 0 ? pick.awayTeam : pick.homeTeam;
        let pickSpread = pick.avgZScore >= 0 ? -1 * pick.actualLine : pick.actualLine;
        let pickSpreadString = (pickSpread < 0 ? "" : "+") + pickSpread.toString();

        if (confidenceNum > 75) {
            console.log(`\x1b[1m${pickTeam} ${pickSpreadString}\x1b[22m\t\t(vs: ${pickOpponent}, confidence score: ${confidenceString})`);
        }
    });

    console.log("\nAll Picks:");
    allGames.forEach((pick) => {
        let confidenceNum = getZPercent(abs(pick.avgZScore));
        let confidenceString = parseFloat(confidenceNum).toFixed(2);

        let pickTeam = pick.avgZScore >= 0 ? pick.homeTeam : pick.awayTeam;
        let pickOpponent = pick.avgZScore >= 0 ? pick.awayTeam : pick.homeTeam;
        let pickSpread = pick.avgZScore >= 0 ? -1 * pick.actualLine : pick.actualLine;
        let pickSpreadString = (pickSpread < 0 ? "" : "+") + pickSpread.toString();

        console.log(`\x1b[1m${pickTeam} ${pickSpreadString}\x1b[22m\t\t(vs: ${pickOpponent}, confidence score: ${confidenceString})`);
    });

    console.log("\n");
}
