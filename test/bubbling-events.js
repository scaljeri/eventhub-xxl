import {EventHub} from './helpers';

describe('Eventhub - Bubbling mode', () => {
    let eh,
        count,
        data,
        cbs = {
            cb1: (value) => data.push({name: 'cb1', value}),
            cb2: (value) => data.push({name: 'cb2', value}),
            cb3: (value) => data.push({name: 'cb3', value}),
            cb4: (value) => data.push({name: 'cb4', value}),
            cb5: (value) => data.push({name: 'cb5', value}),
            cb6: (value) => data.push({name: 'cb6', value})
        };

    beforeEach(() => {
        eh = new EventHub();
        data = [];

        eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BUBBLING});
        eh.on('a.b', cbs.cb2, {eventMode: EventHub.EVENT_MODE.BUBBLING});
        eh.on('a.b.c', cbs.cb4, {eventMode: EventHub.EVENT_MODE.BUBBLING});
        eh.on('a.b', cbs.cb5);
        eh.on('a.b.c', cbs.cb6);
        eh.on('a.b', cbs.cb3, {eventMode: EventHub.EVENT_MODE.BUBBLING, prepend: true});
        eh.on('a.b.c.d', cbs.cb3, {eventMode: EventHub.EVENT_MODE.BUBBLING});
        eh.on('a.b.c.d.e', cbs.cb3);

        count = eh.trigger('a.b.c', 1);
    });

    it('should count the trigger', () => {
        eh.countTriggers('a').should.equal(0);
        eh.countTriggers('a.b').should.equal(0);
        eh.countTriggers('a.b.c').should.equal(1);
        eh.countTriggers('a.b.c.d').should.equal(0);
    });

    it('should count callbacks', () => {
        eh.countCallbacks('a', {eventMode: EventHub.EVENT_MODE.BUBBLING}).should.equal(0);
        eh.countCallbacks('a.b', {eventMode: EventHub.EVENT_MODE.BUBBLING}).should.equal(1);
        eh.countCallbacks('a.b.c', {eventMode: EventHub.EVENT_MODE.BUBBLING}).should.equal(3);
        eh.countCallbacks('a.b.c.d', {eventMode: EventHub.EVENT_MODE.BUBBLING}).should.equal(4);
        eh.countCallbacks('a.b.c.d.e', {eventMode: EventHub.EVENT_MODE.BUBBLING}).should.equal(5);
    });

    it('should count but not traverse', () => {
        eh.countCallbacks('a.b', {
            eventMode: EventHub.EVENT_MODE.BUBBLING,
            traverse: true
        }).should.equal(1);
    });

    it('should have triggered the correct amount of callbacks', () => {
        count.should.equal(4);
    });

    it('should have called everything in the right order', () => {
        data[0].name.should.equal('cb6');
        data[1].name.should.equal('cb3');
        data[2].name.should.equal('cb2');
        data[3].name.should.equal('cb1');
    });

    it('should have passed `data` to all callbacks', () => {
        data[0].value.should.equal(1);
        data[1].value.should.equal(1);
        data[2].value.should.equal(1);
        data[3].value.should.equal(1);
    });
});