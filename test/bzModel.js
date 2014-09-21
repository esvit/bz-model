describe('bz-model', function () {
    var $httpBackend;

    beforeEach(function() {
        module('bzModel', 'bzModelResource', 'bzModelElastic')
        module(function($provide) {
            $provide.factory('esClient', function(esFactory) {
                return esFactory({
                    host: 'http://localhost:9200',
                    //log: 'trace'
                });
            });
            $provide.factory('User', function(bzModel, bzModelResource, $resource) {
                var resource = $resource('/test/:id', {
                    'id': '@id'
                });

                return new bzModel({
                    $defaults: {
                        login: 'test'
                    },
                    $initialize: function() {
                        this.password = 'awdawd';
                    },
                    getLogin: function() {
                        return this.login;
                    }
                }, new bzModelResource(resource));
            });
            $provide.factory('ElasticModel', function(bzModel, bzModelElastic, esClient) {
                return new bzModel({
                    $defaults: {
                        login: 'test'
                    },
                    $initialize: function() {
                        this.password = 'awdawd';
                    },
                    getLogin: function() {
                        return this.login;
                    }
                }, new bzModelElastic(esClient,
                    'index',
                    'type'
                ));
            });
        });
        inject(function($injector) {
            $httpBackend = $injector.get('$httpBackend');

            $httpBackend.when('GET', '/test/1')
                .respond({
                    id: 1,
                    login: 'cool'
                });
            $httpBackend.when('POST', '/test/1')
                .respond(200, {
                    id: 1,
                    login: 'savedLogin'
                });
            $httpBackend.when('GET', '/test')
                .respond([
                    {
                        "id": 1,
                        "login": "cool"
                    },
                    {
                        "id": 2,
                        "login": "Joe"
                    },
                    {
                        "id": 3,
                        "login": "Piter",
                        "password": "1234"
                    }
                ]);

            $httpBackend.when('POST', 'http://localhost:9200/index/type/_search')
                .respond(200, {
                    hits: {
                        hits: [{
                            _source: {
                                id: 1,
                                login: 'test',
                                password: '1'
                            }
                        }]
                    }
                });
        })
    });

    afterEach(function() {
        $httpBackend.verifyNoOutstandingRequest();
        $httpBackend.verifyNoOutstandingExpectation();
    });

    it('initialize', inject(function (bzModel) {
        var Model = new bzModel({
            $initialize: function() {
                this.one = 1;
            }
        });
        var model = new Model();

        expect(model.one).toBe(1);
    }));

    /**
     * Test for default and init fields
     */
    it('defaults', inject(function (bzModel) {
        var Model = new bzModel({
            $initialize: function() {
                this.one = 1;
            },
            $defaults: {
                test: 1
            }
        });
        var model = new Model();

        expect(model.one).toBe(1);
        expect(model.test).toBe(1);
    }));

    /**
     * Test instance
     */
    it('factory', inject(function (User) {
        var user = new User();

        expect(user.login).toBe('test');
        expect(user.getLogin()).toBe('test');
        expect(user.password).toBe('awdawd');
    }));

    /**
     * Test resource provider (not instance calls)
     */
    it('can call resource method', inject(function (User) {
        // test array result
        $httpBackend.expectGET('/test');
        var expectedCheck = function(users) {
            expect(users[0] instanceof User).toBe(true);
            expect(users[0].login).toBe('cool');
            expect(users[0].password).toBe('awdawd');

            expect(users[1] instanceof User).toBe(true);
            expect(users[1].login).toBe('Joe');
            expect(users[1].password).toBe('awdawd');

            expect(users[2] instanceof User).toBe(true);
            expect(users[2].login).toBe('Piter');
            expect(users[2].password).toBe('1234');
        };
        var promise = User.query(expectedCheck);
            promise.then(expectedCheck);
        $httpBackend.flush();

        // test object result
        $httpBackend.expectGET('/test/1');
        User.get({ 'id': 1 }, function(user) {
            expect(user instanceof User).toBe(true);
            expect(user.login).toBe('cool');
            expect(user.password).toBe('awdawd');
        });
        $httpBackend.flush();
    }));

    /**
     * Test resource provider (instance calls)
     */
    it('can call resource instance method', inject(function (User) {
        $httpBackend.expectGET('/test/1');
        var user = new User();
        user.id = 1;

        user.$get(function(data) {
            expect(data instanceof User).toBe(true);
            expect(data.login).toBe('cool');
            expect(data.getLogin()).toBe('cool');
            expect(data.password).toBe('awdawd');

            expect(user instanceof User).toBe(true);
            expect(user.login).toBe('cool');
            expect(user.getLogin()).toBe('cool');
            expect(user.password).toBe('awdawd');
        });
        $httpBackend.flush();

        $httpBackend.expectPOST('/test/1', {
            id: 1,
            login: 'cool',
            password: 'awdawd'
        });
        user.$save(function(data) {
            expect(data instanceof User).toBe(true);
            expect(data.login).toBe('savedLogin');
            expect(data.getLogin()).toBe('savedLogin');
            expect(data.password).toBe('awdawd');

            expect(user instanceof User).toBe(true);
            expect(user.login).toBe('savedLogin');
            expect(user.getLogin()).toBe('savedLogin');
            expect(user.password).toBe('awdawd');
        });
        $httpBackend.flush();
    }));

    /**
     * Test ES provider (not instance calls)
     */
    it('test ES getById', inject(function (ElasticModel) {
        var flag = false;

        var expectedCheck = function(user) {
            expect(user instanceof ElasticModel).toBe(true);
            expect(user.login).toBe('test');
            expect(user.password).toBe('1');
        };

        // test array result
        runs(function() {
            $httpBackend.expectPOST('http://localhost:9200/index/type/_search', {
                "query":{"match":{"id":1}}
            });

            var result = ElasticModel.getById(1, expectedCheck);
            result.$promise.then(expectedCheck);
            setTimeout(function() {
                flag = true;

                $httpBackend.flush();
            }, 1);
        });
        waitsFor(function() {
            return flag;
        }, "ES complete request");
    }));

});
