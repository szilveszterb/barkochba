angular.module("App").factory("Speech2Text", function(
  $rootScope, $log,
  utils, event
) {
    class Speech2Text {
        constructor() {
            this.onResult = null;
            this.onInterim = null;

            this.listening = false;
            this.hasAudio = false;
            this.hasSound = false;
            this.hasSpeech = false;

            this._recognition = null;
            this._settledCount = 0;
            this._recognition = new webkitSpeechRecognition();
            this._recognition.continuous = false;
            this._recognition.interimResults = true;
            this._recognition.lang = "en-US";
            // this._recognition.lang = "hu-HU";

            this._recognition.onresult = e => this._handleResult(e);
            this._recognition.onstart = e => this._handleRecognitionStart(e);
            this._recognition.onend = e => this._handleRecognitionEnd(e);
            this._recognition.onerror = e => { $log.log("_recognition.onerror"); $log.log(e); };
            this._running = false;

            this._subscribeStatusEvents();
        }

        _subscribeStatusEvents() {
            this._subscribeStatusEvent("onaudiostart", "hasAudio", true);
            this._subscribeStatusEvent("onaudioend", "hasAudio", false);
            this._subscribeStatusEvent("onsoundstart", "hasSound", true);
            this._subscribeStatusEvent("onsoundend", "hasSound", false);
            this._subscribeStatusEvent("onspeechstart", "hasSpeech", true);
            this._subscribeStatusEvent("onspeechend", "hasSpeech", false);
        }

        _subscribeStatusEvent(eventName, fieldName, value) {
            this._recognition[eventName] = e => {
                $log.log("_recognition." + eventName);
                $rootScope.$apply(() => {
                    this[fieldName] = value;
                });
            };
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
            $log.log("_recognition.onresult");
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
                } else {
                    this._fireInterim(null);

                    // Restart recognition sometime, trying to workaround unknown hangs
                    if (evt.results.length >= 10) {
                        $log.log("scheduled recognition restart");
                        setTimeout(() => { this._restart(); }, 100);
                    }
                }
            });
        }

        _fireInterim(item) {
            event.fire(this, "onInterim", this._recognitionResultToOutput(item));
        }
        _fireResult(item) {
            event.fire(this, "onResult", this._recognitionResultToOutput(item));
        }

        _recognitionResultToOutput(item) {
            if (!item) {
                return null;
            }
            return {
                transcript: item[0].transcript,
                confidence: item[0].confidence,
                isFinal: item.isFinal
            };
        }

        _start() {
            this._recognition.start();
            this._running = true;
            this._settledCount = 0;
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

        setListening(newListening) {
            newListening = !!newListening;
            if (this.listening !== newListening) {
                if (newListening) {
                    this.start();
                } else {
                    this.stop();
                }
            }
        }
    }

    Speech2Text.detect = function() {
        return !!self.webkitSpeechRecognition;
    };

    return Speech2Text;
});
