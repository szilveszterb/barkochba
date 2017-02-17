angular.module("App").factory("utils", function() {

    function contains(big, part) {
    /*
        console.log("Contains");
        console.log(big);
        console.log(part);
        console.log((""+big).indexOf(part) >= 0);
        */
        return (""+big).indexOf(part) >= 0;
    }

    function compare(a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    }

    function sortedBy(arrLike, selector, reversed) {
        return toArray(arrLike).sort((a, b) => (reversed ? -1 : 1) * compare(selector(a), selector(b)));
    }

    function toArray(arrayLike) {
        return Array.prototype.slice.call(arrayLike, 0);
    }

    function listAssign(arr, oldArr) {
        arr.length = oldArr.length;
        for (var i = 0; i < arr.length; i++) {
            arr[i] = oldArr[i];
        }
    }

    function toMapBy(arr, byFn) {
        const result = new Map();
        for (let i = 0; i < arr.length; i++) {
            result.set(byFn(arr[i]), arr[i]);
        }
        return result;
    }
    function mergeListBy(into, from, byFn, ctor) {
        const intoMap = toMapBy(into, byFn);
        const result = map(from, fromItem => {
            const fromId = byFn(fromItem);
            const item = intoMap.get(fromId) || (ctor ? new ctor() : {});
            angular.extend(item, fromItem);
            return item;
        });
        listAssign(into, result);
        return into;
    }


    function last(arr, optDefault) {
        return arr && arr.length > 0 ? arr[arr.length - 1] : optDefault;
    }

    function map(arr, fn) {
        return Array.prototype.map.call(arr, fn);
    }


    function containsWord(text, part) {
        return contains(" " + text + " ", " " + part + " ");
    }

    function retainLast(arr, cnt) {
        while (arr.length > cnt) {
            arr.shift();
        }
    }

    function maxBy(arr, selector, def) {
        var bestItem = null;
        var bestScore = null;
        var bestFound = false;
        arr.forEach(currentItem => {
            var currentScore = selector(currentItem);
            if (!bestFound || currentScore > bestScore) {
                bestFound = true;
                bestScore = currentScore;
                bestItem = currentItem;
            }
        });
        return bestFound ? bestItem : def;
    }


    return {
        contains, containsWord, compare, sortedBy,
        listAssign, toMapBy, mergeListBy,
        toArray, last, map, retainLast,
        maxBy
    };
}).factory("event", function(
    $rootScope
) {
    function fireApply(owner, event/*, ...params*/) {
        const params = Array.prototype.slice.call(arguments, 2);
        const evt = owner[event];
        if (evt) {
            $rootScope.$apply(() => {
                evt.apply(null, params);
            });
        }
    }

    function fire(owner, event/*, ...params*/) {
        const params = Array.prototype.slice.call(arguments, 2);
        const evt = owner[event];
        if (evt) {
            evt.apply(null, params);
        }
    }

    return {
        fireApply, fire
    };
});
