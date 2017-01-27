(function(){

    function clearChildren(node) {
        var last;
        while (last = node.lastChild) {
            node.removeChild(last);
        }
    }

    function showUnknownError() {
        showError("An unknown error occured");
    }

    function showError(text, optStrongText) {
        _showAlert(text, optStrongText, "danger");
    }
    function showWarning(text, optStrongText) {
        _showAlert(text, optStrongText, "warning");
    }

    function _showAlert(text, optStrongText, clazz) {
        const alert = document.createElement("div");
        alert.className = "alert alert-" + clazz;
        alert.role = "alert";
        if (optStrongText) {
            const strong = document.createElement("strong");
            strong.appendChild(document.createTextNode(optStrongText));
            alert.appendChild(strong);
        }
        alert.appendChild(document.createTextNode(text));
        const container = document.getElementById("ui-alerts");
        container.appendChild(alert);
    }

    function clearAlerts() {
        clearChildren(document.getElementById("ui-alerts"));
    }

    function showAnswers(answers) {
        const answersNode = document.getElementById("io-answers");
        clearChildren(answersNode);
        answers.forEach(ans => {
            const node = document.createElement("li");
            node.innerText = `${ans.text} (${ans.id})`;
            answersNode.appendChild(node)
            node.addEventListener("click", () => {
                _fire(UI.onAnswerClicked, ans.id);
            });
        });
    }

    function showQuestion(text) {
        document.getElementById("io-question").innerText = text;
    }

    function showFoundAnswer(text, imgUrl) {
        document.getElementById("io-question").innerText = text;
        document.getElementById("io-answer-img").src = imgUrl;
    }

    function showWebspeechResult(text) {
        document.getElementById("stt-output").value = text;
    }

    function _init() {
        document.getElementById("stt-start").addEventListener("click", () => {
            _fire(UI.onWebspeechStartListeningClicked);
        });
        document.getElementById("stt-stop").addEventListener("click", () => {
            _fire(UI.onWebspeechStopListeningClicked);
        });
    }

    function _fire(cb, ...args) {
        try {
            if (cb) {
                cb(...args);
            }
        } catch(e) {
            showUnknownError();
            throw e;
        }
    }

    setTimeout(_init, 1);

    const UI = self.UI = {
        // utils
        clearChildren,
        // general ui
        showError, showWarning, showUnknownError, clearAlerts,
        // akinator
        showAnswers, showQuestion, showFoundAnswer,
        onAnswerClicked: null,
        //webkit stt
        showWebspeechResult,
        onWebspeechStartListeningClicked: null,
        onWebspeechStopListeningClicked: null,

    };
})();