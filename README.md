# WagerLab Betting Model Aggregator (Forked Version)

[![stability](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

[WagerLab's](https://www.wagerlab.app/) Model Aggregator is a sports betting predictor that takes predicted spreads from 50+ unique models found on [ThePredictionTracker](http://www.thepredictiontracker.com/) and converts them into an ordered list of value picks by standardizing and combining the distributions of each pick's predicted value over the current spread.

## Fork Information
This is a **forked version** of the original [WagerLab Model Aggregator](https://github.com/wagerlab/model-aggregator) maintained at [lleveto/model-aggregator](https://github.com/lleveto/model-aggregator). This fork introduces updates and improvements to enhance performance and maintainability.

### Updates & Enhancements
✅ **Replaced `request` with `axios`** for fetching data more efficiently.
✅ **Improved error handling** for cases where data retrieval fails.
✅ **Refactored code** for improved maintainability and readability.
✅ **Updated dependencies** to ensure compatibility with modern Node.js versions.
✅ **Removed deprecated packages** to prevent security vulnerabilities.

## Examples

```js
var extend = require("xtend")

// extend returns a new object. Does not mutate arguments
var combination = extend({
    a: "a",
    b: "c"
}, {
    b: "b"
})
// { a: "a", b: "b" }
```

## Methodology
### Theory
There's value in analyzing trends among many independent prediction models because a collection of models will interpret considerably more data and will consider such data in an exponentially greater number of ways compared to any single model. ThePredictionTracker is an extremely valuable source of data aggregation in this regard. However, their aggregated model simply takes an average of all the predicted spreads and compares that average to the actual spread. The problem with this is that each model has its own normal distribution with considerably different variances compared to the line. For example, 3 points of value over the spread in Model A might mean a lot if Model A has low variance from the spread but would mean very little for Model B with a high variance from the spread.

The goal of this model is to first normalize each model's predicted value over the spread for each pick. This creates a superior basis for combining the models' projections by game. For each game, we can take the mean of these standardized values from the line. We'll then rank these values to identify the top picks within the listed games.

### Implementation
1. Iterate through all games and all models. For each game-model pair, save the difference between the away team's predicted spread and the actual spread. Add an additional copy of these values to a distribution list for each model.
2. Iterate through all game-model pairs again and calculate the z-score of each projected spread difference using the previously saved value as well as the mean and std deviation of the distribution list of the given model.
3. For each game, calculate the mean of the z-scores previously calculated for that game.
4. Order the games by the absolute value of these mean z-scores and return the ordered picks. (For the non-absolute value, negative means the away team is the value pick and positive means the home team is.)

## Usage
Feel free to copy this for your own purposes or contribute. If you have questions, reach out to william@wagerlab.app.
### Commands

`npm run nfl` Runs the NFL point spread model 

`npm run ncaaf` Runs the NCAA Football point spread model 

`npm run nba` Runs the NBA point spread model 

`npm run ncaab` Runs the NCAA Basketball point spread model 

### Walkthrough

1. **Pull down this package**
   - You can also do this manually using the green "Clone or download" button above or on the command line by running `git clone https://github.com/lleveto/model-aggregator.git` 
   - Once you have this package, navigate to it on the command line.
2. **Ensure you have the proper dependencies and permissions**
   - You will need to have node and npm installed. Check if node is installed by running `node -v`. Check if npm is installed by running `npm -v`. If you see a version number, the software is installed, but if you get nothing back, you need to install it.  [Here is info about how to install node and/or npm](https://www.npmjs.com/get-npm).
   - Set read/write permissions on main script by running `sudo chmod -R 777 generatePicks.js`
3. **Run the model**
   - See the 'Commands' section above for the specific commands to run depending on which data you want to view.

## Stability status: Stable

## Consideration
Without ThePredictionTracker.com, building this would be considerably more complicated. We rely on them heavily for data. A big thanks to them!

## License
MIT Licensed

