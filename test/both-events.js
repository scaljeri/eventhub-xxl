import {EventHub} from './helpers';

describe('Eventmode: Both', () => {
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

        eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BOTH});                     // 1 7
        eh.on('a.b', cbs.cb2, {eventMode: EventHub.EVENT_MODE.BOTH});                   // 3 6
        eh.on('a.b.c', cbs.cb4, {eventMode: EventHub.EVENT_MODE.BOTH});                 //
        eh.on('a.b', cbs.cb5);                                                          //
        eh.on('a.b.c', cbs.cb6);                                                        // 4
        eh.on('a.b', cbs.cb3, {eventMode: EventHub.EVENT_MODE.BOTH, prepend: true});    // 2 5
        eh.on('a.b.c.d', cbs.cb3, {eventMode: EventHub.EVENT_MODE.BOTH});               //
        eh.on('a.b.c.d.e', cbs.cb3);                                                    //

        count = eh.trigger('a.b.c', 1);
    });

    it('should count the trigger', () => {
        eh.countTriggers('a').should.equal(0);
        eh.countTriggers('a.b').should.equal(0);
        eh.countTriggers('a.b.c').should.equal(1);
        eh.countTriggers('a.b.c.d').should.equal(0);
    });

    it('should count callbacks', () => {
        eh.countCallbacks('a', {eventMode: EventHub.EVENT_MODE.BOTH}).should.equal(0);
        eh.countCallbacks('a.b', {eventMode: EventHub.EVENT_MODE.BOTH}).should.equal(2);
        eh.countCallbacks('a.b.c', {eventMode: EventHub.EVENT_MODE.BOTH}).should.equal(6);
        eh.countCallbacks('a.b.c.d', {eventMode: EventHub.EVENT_MODE.BOTH}).should.equal(8);
        eh.countCallbacks('a.b.c.d.e', {eventMode: EventHub.EVENT_MODE.BOTH}).should.equal(10);
    });

    it('should count but not traverse', () => {
        eh.countCallbacks('a.b', {
            eventMode: EventHub.EVENT_MODE.BOTH,
            traverse: true
        }).should.equal(2);
    });

    it('should have triggered the correct amount of callbacks', () => {
        count.should.equal(7);
    });

    it('should have called everything in the right order', () => {
        data[0].name.should.equal('cb1'); // Capturing
        data[1].name.should.equal('cb3'); // Capturing
        data[2].name.should.equal('cb2'); // Capturing
        data[3].name.should.equal('cb6'); // Target
        data[4].name.should.equal('cb3'); // Bubbling
        data[5].name.should.equal('cb2'); // Bubbling
        data[6].name.should.equal('cb1'); // Bubbling
    });

    it('should have passed `data` to all callbacks', () => {
        data[0].value.should.equal(1);
        data[1].value.should.equal(1);
        data[2].value.should.equal(1);
        data[3].value.should.equal(1);
        data[4].value.should.equal(1);
        data[5].value.should.equal(1);
        data[6].value.should.equal(1);
    });
});