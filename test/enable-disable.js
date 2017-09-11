import {EventHub} from './helpers';

describe('Disable/Enable', () => {
    let eh,
        data,
        cbs = {
            cb1: (value) => data.push({name: 'cb1', value}),
            cb2: (value) => data.push({name: 'cb2', value}),
            cb3: (value) => data.push({name: 'cb3', value}),
            cb4: (value) => data.push({name: 'cb4', value}),
            cb5: (value) => data.push({name: 'cb5', value}),
        };

    beforeEach(() => {
        eh = new EventHub();
        data = [];

        eh.on('a', cbs.cb1, {phase: EventHub.PHASES.BUBBLING});
        eh.on('a.b', cbs.cb2);
        eh.on('a.b', cbs.cb3, {phase: EventHub.PHASES.BUBBLING});
        eh.on('a.b.c', cbs.cb4, {phase: EventHub.PHASES.BUBBLING});
        eh.on('a.b.c', cbs.cb4, {phase: EventHub.PHASES.BUBBLING});
        eh.on('a.b.c.d', cbs.cb5);

        eh.disable('a.b');
    });

    it('should not be possible to have a non-existing disabled namespace', () => {
       eh.isDisabled('x.y.z').should.be.false;
    });

    it('should have a disabled namespace', () => {
       eh.isDisabled('a').should.be.false
       eh.isDisabled('a.b').should.be.true
       eh.isDisabled('a.b.c').should.be.false
       eh.isDisabled('a.b.c.d').should.be.false
    });

    it('should skip if disabled namespace is triggered', () => {
        eh.trigger('a.b').should.equal(0);
    });

    it('should skip namespace if traversed', () => {
        eh.trigger('a.b.c.d').should.equal(5);
    });

    describe('#enable', () => {
        beforeEach(() => {
            eh.enable('a.b');
        });

        it('should skip if disabled namespace is triggered', () => {
            eh.trigger('a.b').should.equal(2);
        });

        it('should skip namespace if traversed', () => {
            eh.trigger('a.b.c.d').should.equal(5);
        });
    });

    describe('With traverse', () => {
        beforeEach(() => {
            eh.disable('a.b', {traverse: true});
        });

        it('should have disabled the namespace and it children', () => {
            eh.isDisabled('a').should.be.false;
            eh.isDisabled('a.b').should.be.true;
            eh.isDisabled('a.b.c').should.be.true;
            eh.isDisabled('a.b.c.d').should.be.true;
        });

        it('should skip if disabled namespace is triggered', () => {
            eh.trigger('a.b').should.equal(0);
            eh.trigger('a.b.c').should.equal(0);
            eh.trigger('a.b.c.d').should.equal(0);
        });

        describe('#enable', () => {
            beforeEach(() => {
                eh.enable('a.b.c', {traverse: true});
            });


            it('should have disabled the namespace and it children', () => {
                eh.isDisabled('a').should.be.false;
                eh.isDisabled('a.b').should.be.true;
                eh.isDisabled('a.b.c').should.be.false;
                eh.isDisabled('a.b.c.d').should.be.false;
            });

            it('should skip namespace if traversed', () => {
                eh.trigger('a.b.c.d').should.equal(5);
            });
        });
    });
});