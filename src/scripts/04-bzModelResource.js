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
