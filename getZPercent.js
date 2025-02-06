// This function calculates the percentile for a given z-score (standardized value)
function getZPercent(z) {
    // If z is too extreme, return 0% or 100% to avoid precision errors
    if (z < -6.5) return 0;
    if (z > 6.5) return 100;

    let factK = 1;
    let sum = 0;
    let term = 1;
    let k = 0;
    const loopStop = Math.exp(-23); // Threshold for stopping loop due to insignificant changes

    while (Math.abs(term) > loopStop) {
        term =
            0.3989422804 *
            Math.pow(-1, k) *
            Math.pow(z, k) /
            (2 * k + 1) /
            Math.pow(2, k) *
            Math.pow(z, k + 1) /
            factK;

        sum += term;
        k++;
        factK *= k;
    }

    sum += 0.5; // Adjust for cumulative probability
    return sum * 100;
}

// Export the function as a module
module.exports = { getZPercent };
