// Random Number Generator - JavaScript equivalent
class RNG {
    static random() {
        return Math.random();
    }

    static proba(probability) {
        return Math.random() < probability;
    }

    static getFullRange(range) {
        return (Math.random() - 0.5) * 2 * range;
    }

    static getUnder(max) {
        return Math.random() * max;
    }

    static getRandIndex(size) {
        return Math.floor(Math.random() * size);
    }

    static pickRandom(array) {
        const index = Math.floor(Math.random() * array.length);
        return array[index];
    }
}

const RNGf = RNG;