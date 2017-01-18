(function() {
    const url = {
        encode(x) {
            return encodeURIComponent(x);
        },
        decode(x) {
            return decodeURIComponent(x);
        }
    };

    function entries(obj) {
        const result = [];
        if (obj) {
            for (var key in obj) {
                result.push(key, obj[key]);
            }
        }
        return result;
    }

    class Akinator {
        constructor(callbacks) {
            this.url = 'http://api-en4.akinator.com/ws/';
            this.player = "Player";
            this.session = null;
            this.signature = null;
            this.step = 0;

            this.callbacks = callbacks;
        }

        hello() {
            return Promise.resolve().then(() => {
                return fetch(this.url + 'new_session?partner=1&player=' + url.encode(this.player));
            }).then(resp => {
                return resp.json();
            }).then(resp => {
                this.session = resp.parameters.identification.session;
                this.signature = resp.parameters.identification.signature;
                const question = this.extractQuestion(rs);
                this.callbacks.onAsk(question);
            }).catch(e => {
                this.callbacks.onError(e);
            });
        }

        extractQuestion(responseData) {
            var parameters = responseData.parameters;
            if (parameters.step_information) {
                parameters = parameters.step_information;
            }
            const question = {
                id: parameters.questionid,
                text: parameters.question
            };
            const answers = entries(parameters.answers)
                .map(([id, option]) => ({ id, text: option.answer }));
            const last = parameters.progression > 99.9999;
            return { question, answers, last };
        }

        sendAnswer(answerId) {
            return Promise.resolve().then(() => {
                return fetch(this.url + 'answer?'
                 + 'session=' + this.session
                 + '&signature=' + this.signature
                 + '&step=' + this.step
                 + '&answer=' + answerId);
            }).then(resp => {
                return resp.json();
            }).then(respBody => {
                const data = this.extractQuestion(respBody);
                if (data.last) {
                    this.getCharacters();
                } else {
                    this.callbacks.onAsk(data);
                }
            }).catch(e => {
                this.callbacks.onError(e);
            });
            this.step++;
        }

        getCharacters() {
            return Promise.resolve().then(() => {
                return fetch(this.url + 'list'
                    + '?session=' + this.session
                    + '&signature=' + this.signature
                    + '&step=' + this.step
                    + '&size=2&max_pic_width=246&max_pic_height=294&pref_photos=OK-FR&mode_question=0'
                );
            }).then(resp => {
                return resp.json();
            }).then(respBody => {
                var characters = entries(
                    respBody.parameters.elements
                ).map(([i, character]) => {
                    return {
                        id: character.element.id,
                        name: character.element.name,
                        probability: character.element.proba,
                        photo: character.element.picture_path
                    };
                });
                this.callbacks.onFound(characters);
            }).catch(e => {
                this.callbacks.onError(e);
            });
            this.step++;
        }
    }

    self.Akinator = Akinator;
})();
