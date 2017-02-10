angular.module("App").factory("Speech2Text", function(
  $rootScope, $log,
  utils
) {
    class Speech2Text {
        constructor() {
            this.onResult = null;
            this.onInterim = null;

            this.listening = false;

            this._recognition = null;
            this._settledCount = 0;
            this._recognition = new webkitSpeechRecognition();
            this._recognition.continuous = true;
            this._recognition.interimResults = true;
            this._recognition.lang = "en-US";
            // this._recognition.lang = "hu-HU";
            this._recognition.onresult = e => this._handleResult(e);
            this._recognition.onstart = e => this._handleRecognitionStart(e);
            this._recognition.onend = e => this._handleRecognitionEnd(e);
            this._recognition.onaudiostart = e => $log.log("_recognition.onaudiostart");
            this._recognition.onaudioend = e => $log.log("_recognition.onaudioend");
            this._recognition.onerror = e => { $log.log("_recognition.onerror"); $log.log(e); };
            this._running = false;
        }

        _handleRecognitionStart(e) {
            $log.log("_recognition.onstart");
        }
        _handleRecognitionEnd(e) {
            $log.log("_recognition.onend");
            this._running = false;
            this._checkListeningLater();
        }
        _restart() {
            this._stop();
            this._checkListeningLater();
        }
        _checkListeningLater() {
            if (this.listening) {
                setTimeout(() => {
                    if (this.listening && !this._running) {
                        this._start();
                    }
                }, 500);
            }
        }

        _handleResult(evt) {
            console.log(evt);
            $rootScope.$apply(() => {
                for (;;) {
                    const item = evt.results[this._settledCount];
                    if (!item || !item.isFinal) {
                        break;
                    }
                    this._settledCount++;
                    this._fireResult(item);
                }

                const lastItem = utils.last(evt.results);
                if (lastItem && !lastItem.isFinal) {
                    this._fireInterim(lastItem);
                }
            });
        }

        _fireInterim(item) {
            this._fire("onInterim", this._recognitionResultToOutput(item));
        }
        _fireResult(item) {
            this._fire("onResult", this._recognitionResultToOutput(item));
        }

        _recognitionResultToOutput(item) {
            return {
                transcript: item[0].transcript,
                confidence: item[0].confidence,
                isFinal: item.isFinal
            };
        }

        _fire(evt/*, ...args*/) {
            var args = Array.prototype.slice.call(arguments, 1);
            var handler = this[evt];
            if (handler) {
                handler.apply(null, args);
            }
        }
        _start() {
            this._running = true;
            this._settledCount = 0;
            this._recognition.start();
        }
        _stop() {
            this._recognition.abort();
        }
        start() {
            this.listening = true;
            this._start();
        }
        stop() {
            this.listening = false;
            this._stop();
        }
    }

    Speech2Text.detect = function() {
        return !!self.webkitSpeechRecognition;
    };

    return Speech2Text;
});
