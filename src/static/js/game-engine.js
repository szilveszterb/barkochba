angular.module("App").factory("Akinator", function($rootScope) {
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

    function qFinally(promise, fn) {
        return promise.then(fn, fn).then(() => promise);
    }

    class Akinator {
        constructor(callbacks) {
            this.url = '/api/aki/';
            this.player = "Player";
            this.session = null;
            this.signature = null;
            this.step = 0;

            this.callbacks = callbacks;

            this._working = 0;
        }

        _track(fn) {
            return promised(() => {
                this.working++;
                return qFinally(promised(fn), () => this.working--);
            });
        }

        isWorking() {
            return this.working > 0;
        }

        _fire(cbName, param) {
            $rootScope.$apply(() => {
                if (this.callbacks[cbName]) {
                    this.callbacks[cbName](param);
                }
            });

        }

        hello() {
            return this._track(() => {
                return promised(() => {
                    return fetch(this.url + 'ws/new_session?partner=1&player=' + url.encode(this.player));
                }).then(resp => {
                    return resp.json();
                }).then(resp => {
                    this.session = resp.parameters.identification.session;
                    this.signature = resp.parameters.identification.signature;
                    const question = this.extractQuestion(resp);
                    this._fire("onAsk", question);
                }).catch(e => {
                    this._fire("onError", e);
                });
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
            const last = parameters.progression > 100 - this.step / 3;
            return { question, answers, last };
        }

        sendAnswer(answerId) {
            return this._track(() => {
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
                        this._fire("onAsk", data);
                    }
                }).catch(e => {
                    this._fire("onError", e);
                });
            });
        }

        _pictureUrl(character) {
            return this.url + "photo0/" + character.element.picture_path;
        }

        getCharacters() {
            return this._track(() => {
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
                    this._fire("onFound", characters);
                }).catch(e => {
                    this._fire("onError", e);
                });
                this.step++;
            });
        }
    }

    return Akinator;
});
