angular.module("App").factory("Speech2Text", function($rootScope, $log) {
    class Speech2Text {
        constructor() {
            this._recognition = null;
            this.onResult = null;

            this.listening = false;
            this._recognition = new webkitSpeechRecognition();
            this._recognition.continuous = true;
            this._recognition.interimResults = true;
            this._recognition.lang = "en-US";
            // this._recognition.lang = "hu-HU";
            this._recognition.onresult = e => this._handleResult(e);
        }
        _handleResult(e) {
            $rootScope.$apply(() => {
                if (this.onResult) {
                    this.onResult(e);
                }
            });
        }
        start() {
            this.listening = true;
            this._recognition.start();
        }
        stop() {
            this.listening = false;
            this._recognition.stop();
        }
    }

    Speech2Text.detect = function() {
        return !!self.webkitSpeechRecognition;
    };

    return Speech2Text;
});
