(function(angular, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['angular'], function(angular) {
            return factory(angular);
        });
    } else {
        return factory(angular);
    }
}(angular || null, function(angular) {
var app = angular.module('bzModel', []);
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

    return app;
}));