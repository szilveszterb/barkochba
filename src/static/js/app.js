angular.module("App", [
    "ngAnimate"
])
.constant("SUPPORT_LEVEL", {
    Supported: "Supported",
    NotTested: "NotTested",
    NotSupported: "NotSupported"
})
.controller("AppController", function(
    $scope, $log, $timeout,
    SUPPORT_LEVEL,
    BrowserChecker,
    Text2Speech, Speech2Text, Akinator,
    utils
) {
    const SPEAKER_HISTORY_LENGTH = 2;
    const LISTENER_HISTORY_LENGTH = 2;
    const IDS = "ABCDEFGHIJ";

    $scope.spokeList = [
        "Lorem ipsum dolor sit amet",
        "Lorem ipsum dolor sit amet",
    ].map(text=>({text}));

    $scope.heardList = [
        "Lorem ipsum dolor sit amet",
        "Lorem ipsum dolor sit amet",
    ].map((transcript, i)=>({transcript, confidence:0.99, isFinal: i<1, id:i}));
    $scope.heardInterim = null;
    $scope.shownHeardList = [];


    $scope.guess /* :{text:string, imageUrl:string} */ = null;

    $scope.expectedAnswers = [];

    $scope.supportLevel = BrowserChecker.get_support();

    function answer_yes(action) {
        return { id:"A", text:"Yes", alts: ["yes", "sure", "of course", "why not", "start"], action };
    }
    const INITIAL_EXPECTED_ANSWER = answer_yes(startGuessing);

    var _akinator = null;
    var _speaker = null;
    var _listener = null;

    $scope.$watch("heardList", _updateShownHeardList);
    $scope.$watch("heardInterim", _updateShownHeardList);

    function _updateShownHeardList() {
        $scope.shownHeardList = $scope.heardList.slice(-2);
        if ($scope.heardInterim) {
            $scope.shownHeardList.push($scope.heardInterim);
        }
        utils.retainLast($scope.shownHeardList, 2);
    }

    function startGameAskToStart() {
        $scope.addMessage("Welcome Sir! Would you like to play a game?");
        $scope.expectedAnswers = [INITIAL_EXPECTED_ANSWER];
    }

    function createAkinator() {
        var akinator = new Akinator({
            onAsk(ask) {
                if (ask.last) {
                    // TODO
                } else {
                    $scope.addMessage(ask.question.text);
                    $scope.expectedAnswers = ask.answers.map((akiAns, i) => {
                        const myId = IDS.charAt(i);
                        return {
                            id: myId,
                            text: akiAns.text,
                            alts: [akiAns.text],
                            action: () => {
                                akinator.sendAnswer(akiAns.id);
                            },
                            _akinatorAnswer: akiAns
                        };
                    });
                }
            },

            onError(x) {
                // TODO
                $log.error(x);
            },
            onFound(x) {
                const found = x[0];
                $scope.addMessage("I think of " + found.name + ".");

                $scope.guess = {
                    text: found.name,
                    imageUrl: found.photo
                };

                // TODO
                $scope.expectedAnswers = [];
                $timeout(() => {
                    startGameAskToStart();
                }, 1500);
            }
        });
        return akinator;
    }

    function startGuessing() {
        _akinator = createAkinator();
        _akinator.hello();
    }

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
        }
    }

    $scope.selectAnswer = answer => {
        answer.action();
    };


    function ShownHeardItem() {
        this.transcript = null;
        this.confidence = null;
        this.interpretation = null;
        this.isFinal = null;
    }

    function init() {
        _speaker = new Text2Speech();
        _listener = new Speech2Text();
        _listener.onResult = _handleRecognitionResultEvent;
        _listener.onInterim = _handleRecognitionInterimEvent;

        $timeout(() => {
            _listener.start();
            startGameAskToStart();
        }, 1000);
    }

    function _handleRecognitionResultEvent(e) {
        const item = $scope.heardInterim || new ShownHeardItem();
        item.transcript = e.transcript;
        item.confidence = e.confidence;
        item.isFinal = e.isFinal;
        $scope.heardInterim = null;
        $scope.heardList.push(item);
        handleHeardAnswer(item);
    }

    function _handleRecognitionInterimEvent(e) {
        const item = $scope.heardInterim || new ShownHeardItem();
        item.transcript = e.transcript;
        item.confidence = e.confidence;
        item.isFinal = e.isFinal;
        $scope.heardInterim = item;
    }


    $scope.isListening = function() {
        return !!(_listener && _listener.listening);
    };

    $scope.repeatMessage = function(msg) {
        _speaker.speak(msg.text);
    };

    $scope.addMessage = function(text) {
        $scope.spokeList.push({text});
        while ($scope.spokeList.length > SPEAKER_HISTORY_LENGTH) {
            $scope.spokeList.shift();
        }
        _speaker.speak(text);
    };

    $scope.toggleMic = function() {
        if (_listener.listening) {
            _listener.stop();
        } else {
            _listener.start();
        }
    };

    $timeout(init, 200);
});
