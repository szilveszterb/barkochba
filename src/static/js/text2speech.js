(function() {
  class Text2Speech {

    constructor() {
      document.getElementById ("talk").addEventListener("click", e => this.speak(), false);
      this.voice = null;

      this._synthesis = window.speechSynthesis;
    }

    getVoices() {
        return this._synthesis.getVoices();
    }

    speak() {
      let text = document.getElementById("text2speech").value;
      let msg = new SpeechSynthesisUtterance();
      msg.voice = this.voice || this.getVoices()[10]; // Note: some voices don't support altering params
      msg.voiceURI = 'native';
      msg.volume = 1; // 0 to 1
      msg.rate = 1; // 0.1 to 10
      msg.pitch = 1; //0 to 2
      msg.lang = 'en-US';
      msg.onend = e => console.log('Finished in ' + event.elapsedTime + ' seconds.');
      msg.onerror = e => console.log(e);
      msg.onstart = e => console.log("SpeechSynthesisUtterance.onstart");
      msg.text = text;
      this._synthesis.speak(msg);
      console.log("Speaking");
    }
  }

  self.Text2Speech = Text2Speech;
})();


