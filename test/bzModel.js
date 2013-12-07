describe('bz-model', function () {
    beforeEach(module('bzModel'));

    var $httpBackend;

    beforeEach(inject(function($injector) {
        $httpBackend = $injector.get('$httpBackend');
    }));

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
        console.info(model);

        expect(model.one).toBe(1);
    }));

});
