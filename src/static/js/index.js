(function(){
    var speaker = null, listener = null, akinator = null;

    try {
        listener = new Speech2Text();
        listener.onResult = e => {
            UI.showWebspeechResult(JSON.stringify(e.results));
        };
    } catch (e) {
        UI.showError("Your browser does not support WebSpeechRecognition API");
        console.error(e);
    }

    try {
        speaker = new Text2Speech();
    } catch (e) {
        UI.showError("Your browser does not support WebSpeechSynthesis API");
        console.error(e);
    }


    UI.onWebspeechStartListeningClicked = () => {
        listener.start();
    };
    UI.onWebspeechStopListeningClicked = () => {
        listener.stop();
    };

    UI.onAnswerClicked = id => {
        akinator.sendAnswer(id);
    };

    try {
        akinator = new Akinator({
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
        akinator.hello();
    } catch (e) {
        UI.showError("Couldn't initialize akinator engine");
        console.error(e);
    }

})();
