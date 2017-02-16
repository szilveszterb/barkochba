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
    TextClassifier, Timer,
    utils
) {
    const SPEAKER_HISTORY_LENGTH = 2;
    const LISTENER_HISTORY_LENGTH = 2;
    const IDS = "ABCDEFGHIJKL";

    const WELCOME_EXPECTED_ANSWERS = [
        { text: "Yes", alts: ["yes", "start", "ok"], action: "tutorialFirst", param: 0 },
        { text: "No", alts: ["no"], action: "bye", param: 0 },
    ];

    const TUTORIAL_EXPECTED_ANSWERS = [
        { text: "Ok / done", alts: ["done", "start", "yes", "ok"], action: "startGame", param: 0 },
    ];

    const ENDGAME_EXPECTED_ANSWERS = [
        { text: "Yes", alts: ["yes", "start", "restart", "ok"], action: "restartGame", param: 0 },
        { text: "No", alts: ["no"], action: "bye", param: 0 },
    ];

    const ALTERNATIVE_REPEAT = { text:"Repeat question", alts: ["repeat", "didn't understand"], action: "repeatQuestion", param: 0 };

    const MENU_ADDITIONAL_ANSWERS = [
        ALTERNATIVE_REPEAT
    ];
    const QUESTION_ADDITIONAL_ANSWERS = [
        ALTERNATIVE_REPEAT,
        { text:"Restart game", alts: ["restart"], action: "restartGame", param: 0 }
    ];

    $scope.spokeList = []; // {text: string}[]

    $scope.heardList = []; // {transcript: string, confidence: number, isFinal: boolean, id: number}[]
    $scope.heardInterim = null;
    $scope.shownHeardList = [];


    $scope.guess = null; // {text:string, imageUrl:string}

    $scope.expectedAnswers = [];

    $scope.supportLevel = BrowserChecker.get_support();

    $scope.lastQuestion = null;

    var _akinator = null;
    var _speaker = null;
    var _listener = null;

    const interimTimer = new Timer();
    interimTimer.onTimer = () => {
        $log.log("interim timeout");
        $scope.heardInterim = null;
    };

    const ACTIONS = {
        startGame() {
            clearAnswers();
            clearGuess();
            startGuessing();
        },
        tutorialFirst() {
            clearAnswers();
            askToThinkFirst();
        },
        answerQuestion(akiAns) {
            clearAnswers();
            _akinator.sendAnswer(akiAns.id);
        },
        restartGame() {
            clearAnswers();
            clearGuess();
            askToThinkNext();
        },
        repeatQuestion() {
            $scope.repeatQuestion();
        },
        bye() {
            $scope.addMessage("Okay, bye!");
        }
    };

    function _executeAnswerAction(answer) {
        ACTIONS[answer.action](answer.param);
    }

    function clearGuess() {
        $scope.guess = null;
    }

    $scope.$watch("heardList", _updateShownHeardList);
    $scope.$watch("heardInterim", _updateShownHeardList);

    function _updateShownHeardList() {
        $scope.shownHeardList = $scope.heardList.slice(-2);
        if ($scope.heardInterim) {
            $scope.shownHeardList.push($scope.heardInterim);
        }
        utils.retainLast($scope.shownHeardList, 2);
    }

    function showExpectedAnswers(answers, kind) {
        if (kind === "menu") {
            answers = answers.concat(MENU_ADDITIONAL_ANSWERS);
        }
        if (kind === "game") {
            answers = answers.concat(QUESTION_ADDITIONAL_ANSWERS);
        }
        $scope.expectedAnswers = answers.map((answer, index) => {
            return angular.extend({
                id: IDS.charAt(index)
            }, answer);
        });
    }

    function startGameAskToStart() {
        $scope.addMessage("Welcome Sir! Would you like to play a game?");
        showExpectedAnswers(WELCOME_EXPECTED_ANSWERS, "welcome");
    }

    function askToRestartGame() {
        $scope.addMessage("Would you like to play one more?");
        showExpectedAnswers(ENDGAME_EXPECTED_ANSWERS, "menu");
    }

    function _askQuestionWithAnswers(ask) {
        $scope.addMessage(ask.question.text);
        var newExpectedAnswers = ask.answers.map(akiAns => {
            return {
                text: akiAns.text,
                alts: [akiAns.text],
                action: "answerQuestion",
                param: akiAns,
            };
        });
        showExpectedAnswers(newExpectedAnswers, "game");
    }

    $scope.repeatQuestion = function() {
        if ($scope.lastQuestion) {
            $scope.addMessage($scope.lastQuestion, true);
        }
    };

    function createAkinator() {
        var akinator = new Akinator({
            onAsk(ask) {
                if (ask.last) {
                    // TODO
                    showExpectedAnswers([], "final");
                } else {
                    _askQuestionWithAnswers(ask);
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
                    askToRestartGame();
                }, 2500);
            }
        });
        return akinator;
    }

    function startGuessing() {
        _akinator = createAkinator();
        _akinator.hello();
    }
    function askToThinkFirst() {
        $scope.addMessage("Think of a famous person or character, and I will attempt to guess it! Tell me when you are done.");
        showExpectedAnswers(TUTORIAL_EXPECTED_ANSWERS, "menu");
    }
    function askToThinkNext() {
        $scope.addMessage("Think of another character! Tell me when you are done.");
        showExpectedAnswers(TUTORIAL_EXPECTED_ANSWERS, "menu");
    }

    function handleHeardAnswer(heard) {
        const text = TextClassifier.canonize(heard.transcript);
        $log.log(text);


        function answerAlternatives(answer) {
            return [answer.id].concat(answer.alts);
        }
        const bestRatedAnswer = TextClassifier.clusterMatch(text, $scope.expectedAnswers, answerAlternatives);
        if (bestRatedAnswer) {
            heard.interpretation = bestRatedAnswer.text;
            $scope.selectAnswer(bestRatedAnswer);
        } else {
            heard.interpretation = "?";
            $scope.askUnrecognized();
        }
    }

    function clearAnswers() {
        $scope.expectedAnswers = [];
    }
    $scope.selectAnswer = answer => {
        _executeAnswerAction(answer);
    };


    function ShownHeardItem() {
        this.transcript = null;
        this.confidence = null;
        this.interpretation = null;
        this.isFinal = null;
    }

    function init() {
        try {
            _speaker = new Text2Speech();
            _listener = new Speech2Text();
            _listener.onResult = _handleRecognitionResultEvent;
            _listener.onInterim = _handleRecognitionInterimEvent;

            $timeout(() => {
                _listener.start();
                startGameAskToStart();
            }, 1000);
        } catch(e) {
            $scope.supportLevel = SUPPORT_LEVEL.NotSupported;
        }
    }

    function setTimedInterim(interim) {
        if (interim) {
            interimTimer.start();
        } else {
            interimTimer.stop();
        }
        $scope.heardInterim = interim;
    }
    function _handleRecognitionResultEvent(e) {
        const item = $scope.heardInterim || new ShownHeardItem();
        item.transcript = e.transcript;
        item.confidence = e.confidence;
        item.isFinal = e.isFinal;
        setTimedInterim(null);
        $scope.heardList.push(item);
        handleHeardAnswer(item);
    }

    function _handleRecognitionInterimEvent(e) {
        if (e) {
            const item = $scope.heardInterim || new ShownHeardItem();
            item.transcript = e.transcript;
            item.confidence = e.confidence;
            item.isFinal = e.isFinal;
            setTimedInterim(item);
        } else {
            setTimedInterim(null);
        }
    }


    $scope.isListening = function() {
        return !!(_listener && _listener.listening);
    };

    $scope.repeatMessage = function(msg) {
        _speaker.speak(msg.text);
    };

    $scope.askUnrecognized = function() {
        $scope.addMessage("Sorry, I didn't understand. Could you please rephrase?", true);
    };

    $scope.addMessage = function(text, notRepeatable) {
        if (!notRepeatable) {
            $scope.lastQuestion = text;
        }
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
