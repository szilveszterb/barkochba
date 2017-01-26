
                <button id="stt-start">Start listening</button>



try {
    const listener = new Speech2Text();
} catch (e) {
}

const speaker = new Text2Speech();

const akinator = new Akinator({
    onAsk(x) {
        document.getElementById("io-question").innerText = x.question.text;
        const answersNode = document.getElementById("io-answers");
        showAnswers(x.answers);

        function clearChildren(node) {
            var last;
            while (last = node.lastChild) {
                node.removeChild(last);
            }
        }
        function showAnswers(answers) {
            clearChildren(answersNode);
            answers.forEach(ans => {
                const node = document.createElement("li");
                node.innerText = `${ans.text} (${ans.id})`;
                answersNode.appendChild(node)
                node.addEventListener("click", () => {
                    akinator.sendAnswer(ans.id);
                });
            });
        }
    },
    onFound(x) {
        console.log("Akinator.onFound");
        console.log(x);
        console.log(JSON.stringify(x));
        document.getElementById("io-question").innerText = x[0].name;
        document.getElementById("io-answer-img").src = x[0].photo;
    },
    onError(e) {
        console.error(e);
    }
});

akinator.hello();