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
    TextClassifier,
    utils
) {
    const RECOGNITION_DELAY_AFTER_SYNTHESIS = 100;
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

    $scope.listening = false;
    $scope.synthesizing = false;



    var _akinator = null;
    var _speaker = null;
    var _listener = null;

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
        $scope.addMessage("Welcome! Would you like to play a game?");
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
        $log.log("handleHeardAnswer: " + text);

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

            _speaker.onSynthesisStateChange = speaking => { $scope.synthesizing = speaking; };
            _listener = new Speech2Text();
            _listener.onResult = _handleRecognitionResultEvent;
            _listener.onInterim = _handleRecognitionInterimEvent;

            _setupDelayedListenerActivation();

            $timeout(() => {
                $scope.listening = true;
                startGameAskToStart();
            }, 1000);
        } catch(e) {
            $scope.supportLevel = SUPPORT_LEVEL.NotSupported;
            $log.error(e);
        }
    }

    function _setHeardInterim(interim) {
        $scope.heardInterim = interim;
        _updateShownHeardList();
    }

    function _handleRecognitionResultEvent(e) {
        $log.log("_handleRecognitionResultEvent");
        const item = $scope.heardInterim || new ShownHeardItem();
        item.transcript = e.transcript;
        item.confidence = e.confidence;
        item.isFinal = e.isFinal;
        _setHeardInterim(null);
        addToHeardList(item);
        handleHeardAnswer(item);
    }

    function addToHeardList(item) {
        $scope.heardList.push(item);
        utils.retainLast($scope.heardList, 5);
        _updateShownHeardList();
    }

    function _handleRecognitionInterimEvent(e) {
        $log.log("_handleRecognitionInterimEvent");
        if (e) {
            const item = $scope.heardInterim || new ShownHeardItem();
            item.transcript = e.transcript;
            item.confidence = e.confidence;
            item.isFinal = e.isFinal;
            _setHeardInterim(item);
        } else {
            _setHeardInterim(null);
        }
    }

    $scope.hasSpeech = function() {
        return !!(_listener && _listener.hasSpeech);
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

    function _setupDelayedListenerActivation() {
        var listenerActiveObservable = new Rx.Subject();
        $scope.$watchGroup(["listening", "synthesizing"], () => {
            listenerActiveObservable.next($scope.listening && !$scope.synthesizing);
        });
        listenerActiveObservable
          .switchMap(x => Rx.Observable.of(x).delay(x ? 0 : RECOGNITION_DELAY_AFTER_SYNTHESIS))
          .subscribe(setListenerActive);
    }

    function setListenerActive(isActive) {
        $log.log("setListenerActive("+isActive+")");
        if (_listener) {
            _listener.setListening(isActive);
        }
    }

    $scope.toggleMic = function() {
        $scope.listening = !$scope.listening;
    };

    $timeout(init, 200);
});
