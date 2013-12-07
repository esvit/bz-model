describe('bz-model', function () {
    var $httpBackend;
    
    
    beforeEach(function() {
        module('bzModel')
        module(function($provide) {
            $provide.factory('User', function(bzModel) {
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
                });
            });
        });
        inject(function($injector) {
            $httpBackend = $injector.get('$httpBackend');
        })
    });

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
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

    it('factory', inject(function (User) {
        var user = new User();

        expect(user.login).toBe('test');
        expect(user.getLogin()).toBe('test');
        expect(user.password).toBe('awdawd');
    }));

});
