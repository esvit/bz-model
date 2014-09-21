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
