import {EventHub, it, describe, beforeEach} from './helpers';

describe('#off', () => {
    let eh,
        data,
        cbs = {
            cb1: (value) => data.push({name: 'cb1', value}),
            cb2: (value) => data.push({name: 'cb2', value}),
            cb3: (value) => data.push({name: 'cb3', value}),
        };

    beforeEach(() => {
        eh = new EventHub();
        data = [];

        eh.on('a', cbs.cb1, {phase: EventHub.PHASES.BUBBLING});
        eh.on('a.b', cbs.cb2);
        eh.on('a.b', cbs.cb1, {phase: EventHub.PHASES.BUBBLING});
        eh.one('a.b.c', cbs.cb2);
    });

    it('should not remove of phase does not match', () => {
        eh.off('a', cbs.cb1);
        eh.fake.trigger('a.b', {phase: EventHub.PHASES.BUBBLING}).should.equal(2);
    });

    it('should not remove if callback does not match', () => {
        eh.off('a', cbs.cb2, {phase: EventHub.PHASES.BUBBLING});
        eh.fake.trigger('a.b', {phase: EventHub.PHASES.BUBBLING}).should.equal(2);
    });

    it('should remove if phase does match', () => {
        eh.off('a', cbs.cb1, {phase: EventHub.PHASES.BUBBLING});
        eh.fake.trigger('a.b', {phase: EventHub.PHASES.BUBBLING}).should.equal(1);
        eh.fake.trigger('a.b.c', {phase: EventHub.PHASES.BUBBLING}).should.equal(2);
    });

    it('should recursively remove callbacks', () => {
        eh.off('a', cbs.cb1, {phase: EventHub.PHASES.BUBBLING, traverse: true});
        eh.fake.trigger('a.b', {phase: EventHub.PHASES.BUBBLING}).should.equal(1);
        eh.fake.trigger('a.b.c', {phase: EventHub.PHASES.BUBBLING}).should.equal(1);
    })

    it('should only remove a `isOne` callback', () => {
        eh.off('a', cbs.cb2, { isOne: true, traverse: true});
        eh.fake.trigger('a.b', {traverse: true}).should.equal(2);
        eh.fake.trigger('a.b.c').should.equal(2);
    });

    it('should remove without a callback given (bubbling)', () => {
        eh.fake.trigger('a.b.c', {traverse: true}).should.equal(3);
        eh.off('a', {traverse: true, phase: EventHub.PHASES.BUBBLING});
        eh.fake.trigger('a.b.c', {traverse: true}).should.equal(0);
    });

    it('should remove without a callback given', () => {
        eh.fake.trigger('a', {traverse: true}).should.equal(2);
        eh.off('a', {traverse: true});
        eh.fake.trigger('a', {traverse: true}).should.equal(0);
    });

});