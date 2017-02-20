angular.module("App").factory("TextClassifier", function(
    utils
) {
    const ALTERNATIVE_CLUSTERS = [
        ["ok", "okay"],
        ["done", "i'm done"],
        ["yes", "yeah", "sure", "of course", "why not"],
        ["no", "not", "no no", "no way", "nope", "i don't think so"],
        ["probably", "maybe"],
        ["probably not", "maybe not"],
        ["don't know", "i don't know", "i have no idea"],
        ["repeat", "what", "could you please repeat", "repeat question"],
        ["restart", "play again", "start over", "restart game"],
        ["start", "start game", "start the game"],
        ["didn't understand", "i didn't understand"]
    ];

    const ALTERNATIVE_MAP = new Map();
    ALTERNATIVE_CLUSTERS.forEach(cluster => {
        cluster.forEach(phrase => {
            ALTERNATIVE_MAP.set(phrase, cluster);
        });
    });


    function canonize(text) {
        return text.toLowerCase().replace(/[^a-z' ]/g, "").replace(/  +/g, " ").trim();
    }

    function like(a, b) {
        return canonize(a) == canonize(b);
    }

    function rateAnswerMatch(answer, text) {
        if (like(answer.text, text)) return 1;
        if (like(answer.id, text)) return 0.9;
        if (answer.alts.some(alt => like(alt, text))) return 0.7;
        if (utils.containsWord(text, answer.text)) return 0.2;
        if (answer.alts.some(alt => utils.containsWord(text, alt))) return 0.1;
        return -1;
    }

    function distanceHeuristics(answer, text) {
        if (like(answer, text)) return 1;
        if (utils.containsWord(text, answer)) return 0.5;
        return -1;
    }

    function handleHeardAnswer(heard) {
        const text = canonize(heard.transcript);
        $log.log(text);
        var rated = $scope.expectedAnswers.map(answer => ({
            rating: rateAnswerMatch(answer, text),
            answer: answer
        }));
        rated = rated.filter(x => x.rating >= 0);
        rated = utils.sortedBy(rated, x => x.rating);

        const bestRatedAnswer = rated[0];
        if (bestRatedAnswer) {
            heard.interpretation = bestRatedAnswer.answer.text;
            $scope.selectAnswer(bestRatedAnswer.answer);
        } else {
            heard.interpretation = "?";
            $scope.askUnrecognized();
        }
    }

    function clusterMatch(text, alternatives, pivotSelector) {
        var interesting = [];
        alternatives.forEach(alternative => {
            const pivots = pivotSelector(alternative);
            pivots.forEach(pivot => {
                pivot = canonize(pivot);
                if (ALTERNATIVE_MAP.has(pivot)) {
                    ALTERNATIVE_MAP.get(pivot).forEach(option => {
                        interesting.push({option, alternative});
                    });
                } else {
                    interesting.push({option: pivot, alternative});
                }
            });
        });

        var rated = interesting.map(x => ({
            alternative: x.alternative,
            rating: distanceHeuristics(x.option, text)
        }));

        var bestMatching = utils.maxBy(rated.filter(x => x.rating > 0), x => x.rating);

        if (!bestMatching) {
            return null;
        }

        return bestMatching.alternative;
    }

    return {
        clusterMatch, canonize, like
    };
});