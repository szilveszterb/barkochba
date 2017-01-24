
const speaker = new Text2Speech();

const akinator = new Akinator({
    onAsk(x) {
        document.getElementById("io-question").innerText = x.question;
        document.getElementById("io-answers").innerText = JSON.stringify(x.answers);
    },
    onFound(x) {
        document.getElementById("io-question").innerText = JSON.stringify(x);
    },
    onError(e) {
        console.error(e);
    }
});
akinator.hello();