app.factory('bzModel', ['$q', '$log', function ($q, $log) {

    return function(args) {

        var obj = function() {

            obj.$initialize();

        };

        obj = angular.extend(obj, args);
        obj.$initialize = obj.$initialize || angular.noop;

        return obj;
    }
}]);
