(function() {
  class Text2Speech {

    constructor() {
      document.getElementById ("talk").addEventListener ("click", this.speak, false);
    }

    speak(e) {
      let text = document.getElementById("text2speech").value;
      let msg = new SpeechSynthesisUtterance();
      let voices = window.speechSynthesis.getVoices();
      msg.voice = voices[10]; // Note: some voices don't support altering params
      msg.voiceURI = 'native';
      msg.volume = 1; // 0 to 1
      msg.rate = 1; // 0.1 to 10
      msg.pitch = 1; //0 to 2
      msg.lang = 'en-US';
      msg.onend = function(e) {
        console.log('Finished in ' + event.elapsedTime + ' seconds.');
      };
      msg.text = text;
      console.log("Speaking");
      speechSynthesis.speak(msg);
    }
  }

  self.Text2Speech = Text2Speech;
})();


