var bzModelApp = angular.module('bzModel', []);
var bzModelResourceApp = angular.module('bzModelResource', ['bzModel', 'ngResource']);
var bzModelElasticApp = angular.module('bzModelElastic', ['bzModel', 'elasticsearch']);