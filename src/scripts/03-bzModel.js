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
