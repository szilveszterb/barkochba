
(function(){
    self.RTAD = {};
    RTAD.speaker = null;
    RTAD.listener  = null;
    RTAD.akinator = null;

    function toArray(arrayLike) {
        return Array.prototype.slice.call(arrayLike, 0);
    }
    try {
        RTAD.listener = new Speech2Text();
        RTAD.listener.onResult = e => {
            const jsonResult = toArray(e.results).map(result => ({
                alternatives: toArray(result).map(alt => ({
                    transcript: alt.transcript,
                    confidence: alt.confidence
                })),
                isFinal: result.isFinal
            }));
            UI.showWebspeechResult(JSON.stringify(jsonResult));
        };
    } catch (e) {
        UI.showError("Your browser does not support WebSpeechRecognition API");
        console.error(e);
    }

    try {
        RTAD.speaker = new Text2Speech();
    } catch (e) {
        UI.showError("Your browser does not support WebSpeechSynthesis API");
        console.error(e);
    }


    UI.onWebspeechStartListeningClicked = () => {
        RTAD.listener.start();
    };
    UI.onWebspeechStopListeningClicked = () => {
        RTAD.listener.stop();
    };

    UI.onAnswerClicked = id => {
        RTAD.akinator.sendAnswer(id);
    };

    try {
        RTAD.akinator = new Akinator({
            onAsk(x) {
                UI.showQuestion(x.question.text);
                UI.showAnswers(x.answers);
            },
            onFound(x) {
                console.log("Akinator.onFound");
                console.log(x);
                console.log(JSON.stringify(x));
                UI.showFoundAnswer(x[0].name, x[0].photo);
            },
            onError(e) {
                UI.showError("An unknown error occured");
                console.error(e);
            }
        });
        RTAD.akinator.hello();
    } catch (e) {
        UI.showError("Couldn't initialize akinator engine");
        console.error(e);
    }

})();
