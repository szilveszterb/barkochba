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
                result.push([key, obj[key]]);
            }
        }
        return result;
    }

    function promised(fn) {
        return new Promise(resolve => {
            resolve(fn());
        });
    }

    class Akinator {
        constructor(callbacks) {
            this.url = '/api/aki/';
            this.player = "Player";
            this.session = null;
            this.signature = null;
            this.step = 0;

            this.callbacks = callbacks;
        }

        hello() {
            return promised(() => {
                return fetch(this.url + 'ws/new_session?partner=1&player=' + url.encode(this.player));
            }).then(resp => {
                return resp.json();
            }).then(resp => {
                this.session = resp.parameters.identification.session;
                this.signature = resp.parameters.identification.signature;
                const question = this.extractQuestion(resp);
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
                .map(([id, option]) => ({ id, text: option.answer }))
            // Heuristics to end the game sometime
            const last = parameters.progression > 100 - this.step / 4;
            return { question, answers, last };
        }

        sendAnswer(answerId) {
            return promised(() => {
                const step = this.step++;
                return fetch(this.url + 'ws/answer?'
                 + 'session=' + this.session
                 + '&signature=' + this.signature
                 + '&step=' + step
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
        }

        _pictureUrl(character) {
            return this.url + "photo0/" + character.element.picture_path;
        }

        getCharacters() {
            return promised(() => {
                return fetch(this.url + 'ws/list'
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
                        photo: this._pictureUrl(character)
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
