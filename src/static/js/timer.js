angular.module("App").factory("Timer", function($timeout) {
    class Timer {
        constructor() {
            this.token = null;
            this.timeout = 3500;
            this.onTimer = null;
        }
        start() {
          this._stop();
          this.token = $timeout(() => this.onTimer(), this.timeout);
        }
        _stop() {
          if (this.token) {
              $timeout.cancel(this.token);
          }
        }
        stop() {
            this._stop();
            this.token = null;
        }
    }
    return Timer;
});

