import {EventHub} from './helpers';

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

        eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BUBBLING});
        eh.on('a.b', cbs.cb2);
        eh.on('a.b', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BUBBLING});
        eh.one('a.b.c', cbs.cb2);
    });

    it('should not remove of eventMode does not match', () => {
        eh.off('a', cbs.cb1);
        eh.countCallbacks('a.b', {eventMode: EventHub.EVENT_MODE.BUBBLING}).should.equal(1);
    });

    it('should not remove of callback does not match', () => {
        eh.off('a', cbs.cb2, {eventMode: EventHub.EVENT_MODE.BUBBLING});
        eh.countCallbacks('a.b', {eventMode: EventHub.EVENT_MODE.BUBBLING}).should.equal(1);
    });

    it('should remove of eventMode does match', () => {
        eh.off('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BUBBLING});
        eh.countCallbacks('a.b', {eventMode: EventHub.EVENT_MODE.BUBBLING}).should.equal(0);
        eh.countCallbacks('a.b.c', {eventMode: EventHub.EVENT_MODE.BUBBLING}).should.equal(1);
    });

    it('should recursively remove callbacks', () => {
        eh.off('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BUBBLING, traverse: true});
        eh.countCallbacks('a.b', {eventMode: EventHub.EVENT_MODE.BUBBLING}).should.equal(0);
        eh.countCallbacks('a.b.c', {eventMode: EventHub.EVENT_MODE.BUBBLING}).should.equal(0);
    });

    it('should only remove a `isOne` callback', () => {
        eh.off('a', cbs.cb2, { isOne: true, traverse: true});
        eh.countCallbacks('a.b', {traverse: true}).should.equal(1);
        eh.countCallbacks('a.b.c').should.equal(0);
    });

    it('should remove without a callback given', () => {
        eh.off('a', {traverse: true});

        eh.countCallbacks('a.b', {traverse: true}).should.equal(0);
    });

});