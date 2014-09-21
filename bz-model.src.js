(function(angular, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['angular'], function(angular) {
            return factory(angular);
        });
    } else {
        return factory(angular);
    }
}(angular || null, function(angular) {
var bzModelApp = angular.module('bzModel', []);
var bzModelResourceApp = angular.module('bzModelResource', ['bzModel', 'ngResource']);
var bzModelElasticApp = angular.module('bzModelElastic', ['bzModel', 'elasticsearch']);
var wrapByModel = function(data, bzModel) {
    if (angular.isArray(data)) {
        var returnArr = [];
        angular.forEach(data, function(item) {
            returnArr.push(new bzModel(item));
        });
        return returnArr;
    } else if (angular.isObject(data)) {
        return new bzModel(data);
    }
    return data;
};

bzModelApp.provider('bzModel', [function () {
    var self = this;

    this.$get = ['$q', '$log', function ($q, $log) {
        return function () {
            var args = Array.prototype.slice.call(arguments || []),
                options = args[0] || {},
                resources = args.splice(1),
                bzModel = function (fields) {
                    angular.extend(this, options || {});
                    angular.extend(this, options.$defaults || {});
                    this.$initialize();
                    angular.extend(this, fields || {});
                };

            angular.forEach(resources, function(resource) {
                if (angular.isFunction(resource.attachToModel)) {
                    resource.attachToModel(bzModel, $q);
                }
            });

            bzModel.prototype.$initialize = options.$initialize || bzModel.prototype.$initialize || angular.noop;

            bzModel.prototype.toJSON = function() {
                var data = angular.extend({}, this);
                delete data.$promise;
                delete data.$resolved;

                delete data.$defaults;
                delete data.$initialize;
                return data;
            };

            return bzModel;
        }
    }];
}]);

var bzModelResource = function($resource) {
    this.$wrap = wrapByModel;

    this.attachToModel = function(model, $q) {

        // attach resource functions
        angular.forEach($resource, function(func, name) {
            if (!$resource.hasOwnProperty(name)) {
                return;
            }
            model[name] = function(a1, a2, a3, a4) {
                var defer = $q.defer(),
                    args = Array.prototype.slice.call(arguments || []),
                    successCallback = null,
                    newSuccessCallback = function(data) {
                        data = wrapByModel(data, model);
                        successCallback(data);
                        defer.resolve(data);
                    };
                /* jshint -W086 */ /* (purposefully fall through case statements) */
                switch (args.length) {
                    case 4:
                        // success
                        successCallback = a3;
                        args[2] = newSuccessCallback;
                    case 3:
                    case 2:
                        if (angular.isFunction(a2)) {
                            if (angular.isFunction(a1)) {
                                successCallback = a1;
                                args[0] = newSuccessCallback;
                                break;
                            }
                            successCallback = a2;
                            args[1] = newSuccessCallback;
                            //fallthrough
                        } else {
                            successCallback = a3;
                            args[2] = newSuccessCallback;
                            break;
                        }
                    case 1:
                        if (angular.isFunction(a1)) {
                            successCallback = a1;
                            args[0] = newSuccessCallback;
                        }
                }
                /* jshint +W086 */ /* (purposefully fall through case statements) */

                var res = $resource[name].apply(this, args);
                res.$promise.catch(function(e) {
                    defer.reject(e)
                });
                return defer.promise;
            };
        });

        // attach instance functions
        angular.forEach($resource.prototype, function(func, name) {
            if (!$resource.prototype.hasOwnProperty(name)) {
                return;
            }
            model.prototype[name] = function(params, success, error) {
                var defer = $q.defer(),
                    instance = this,
                    args = Array.prototype.slice.call(arguments || []),
                    successCallback = angular.isFunction(args[0]) ? args[0] : args[1],
                    newSuccessCallback = function(data) {
                        angular.extend(instance, data.toJSON());
                        instance.$resolved = true;
                        (successCallback || angular.noop)(instance);
                        defer.resolve(instance);
                    };

                if (angular.isFunction(args[0])) {
                    args[0] = newSuccessCallback;
                } else {
                    args[1] = newSuccessCallback;
                }
                var res = $resource.prototype[name].apply(instance, args);
                res.catch(function(e) {
                    defer.reject(e)
                });
                return defer.promise;
            };
        });
    };
};

bzModelResourceApp.factory('bzModelResource', function() {
    return bzModelResource;
});

var bzModelElastic = function(elasticConfig, index, type) {
    this.$wrap = wrapByModel;

    this.attachToModel = function(model, $q) {
        var $parseResponse = this.$parseResponse = function(response, result) {
            angular.forEach(response.hits.hits, function(item) {
                result.push(wrapByModel(item._source, model));
            });
            return result;
        };

        /**
         * Make request to ES server
         * @type {Function}
         */
        model.search = model.prototype.$search = function(query) {
            var defer = $q.defer(),
                result = [];
            result.$promise = defer.promise;
            result.$resolved = false;
            angular.extend(query, {
                index: index,
                type:  type
            });

            elasticConfig.search(query).then(function (body) {
                $parseResponse(body, result);
                result.$resolved = true;
                defer.resolve(result);
            }, function (error) {
                console.trace(error.message);
            });
            return result;
        };

        model.getById = model.prototype.$getById = function(id, success) {
            var defer = $q.defer(),
                result = new model({});
            result.$promise = defer.promise;
            result.$resolved = false;

            this.search({
                body: {
                    query: {
                        match: { id: id }
                    }
                }
            }).$promise.then(function (body) {
                if (body.length > 0) {
                    angular.extend(result, body[0]);
                }
                (success || angular.noop)(result);
                defer.resolve(result);
            }, function (error) {
                console.trace(error.message);
            });
            return result;
        };
    };
};

bzModelElasticApp.factory('bzModelElastic', function() {
    return bzModelElastic;
});

    return app;
}));