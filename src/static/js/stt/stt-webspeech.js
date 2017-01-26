(function() {
    class Speech2Text {
        constructor() {
            this._recognition = null;
            this.onResult = null;

            this._recognition = new webkitSpeechRecognition();
            this._recognition.onresult = function(event) {
                console.log(event)
            };
            this._recognition.continuous = true;
            this._recognition.interimResults = true;
            this._recognition.lang = "en-US";
            this._recognition.onresult = e => this._handleResult(e);
        }
        _handleResult(e) {
            console.log(e);
            if (this.onResult) {
                this.onResult(e);
            }
        }
        start() {
            this._recognition.start();
        }
        stop() {
            this._recognition.stop();
        }
    }


    Speech2Text.detect = function() {
        return !!self.webkitSpeechRecognition;
    };

    self.Speech2Text = Speech2Text;
})();


