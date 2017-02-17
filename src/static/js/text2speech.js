angular.module("App").factory("Text2Speech", function(
    $log, event
) {
  class Text2Speech {

    constructor() {
      this.lang = "en-US";
      this.voice = null;
      this._synthesis = window.speechSynthesis;
      this.onSynthesisStateChange = null;
    }

    getVoices() {
        return this._synthesis.getVoices();
    }

    getRightVoice() {
        const voices = this._synthesis.getVoices();
        return voices.filter(x => x.lang === this.lang)[0] || voices[0];
    }

    speak(text) {
      let msg = new SpeechSynthesisUtterance();
      msg.voice = this.voice || this.getRightVoice(); // Note: some voices don't support altering params
      msg.voiceURI = 'native';
      msg.volume = 1; // 0 to 1
      msg.rate = 1; // 0.1 to 10
      msg.pitch = 1; //0 to 2
      msg.lang = this.lang;
      msg.onend = e => $log.log('Finished in ' + event.elapsedTime + ' seconds.');

      msg.onerror = e => {
        $log.log(e);
        event.fireApply(this, "onSynthesisStateChange", false);
      };
      msg.onstart = e => {
        $log.log("SpeechSynthesisUtterance.onstart");
        event.fireApply(this, "onSynthesisStateChange", true);
      };
      msg.onend = e => {
        $log.log("SpeechSynthesisUtterance.onend");
        event.fireApply(this, "onSynthesisStateChange", false);
      };

      msg.text = text;
      this._synthesis.speak(msg);
      console.log("Speaking");
    }
  }

  return Text2Speech;
});

