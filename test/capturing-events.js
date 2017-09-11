import {EventHub} from './helpers';

describe('Eventhub - Capturing mode', () => {
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

        eh.on('a', cbs.cb1, {phase: EventHub.PHASES.CAPTURING});
        eh.on('a.b', cbs.cb2, {phase: EventHub.PHASES.CAPTURING});
        eh.on('a.b.c', cbs.cb4, {phase: EventHub.PHASES.CAPTURING});
        eh.on('a.b', cbs.cb5);
        eh.on('a.b.c', cbs.cb6);
        eh.on('a.b', cbs.cb3, {phase: EventHub.PHASES.CAPTURING, prepend: true});
        eh.on('a.b.c.d', cbs.cb3, {phase: EventHub.PHASES.CAPTURING});

        count = eh.trigger('a.b.c', 1);
    });

    it('should count the trigger', () => {
        eh.countTriggers('a').should.equal(0);
        eh.countTriggers('a.b').should.equal(0);
        eh.countTriggers('a.b.c').should.equal(1);
        eh.countTriggers('a.b.c.d').should.equal(0);
    });


    it('should count callbacks without an event name', () => {
        eh.countCallbacks({phase: EventHub.PHASES.CAPTURING}).should.equal(0);
    });

    it('should count callbacks', () => {
        eh.countCallbacks('a', {phase: EventHub.PHASES.CAPTURING}).should.equal(0);
        eh.countCallbacks('a.b', {phase: EventHub.PHASES.CAPTURING}).should.equal(2);
        eh.countCallbacks('a.b.c', {phase: EventHub.PHASES.CAPTURING}).should.equal(4);
        eh.countCallbacks('a.b.c.d', {phase: EventHub.PHASES.CAPTURING}).should.equal(4);
    });

    it('should not trigger if event does not exist', () => {
        eh.countCallbacks('a.b.c.d.e', {phase: EventHub.PHASES.CAPTURING}).should.equal(0);
    });

    it('should count and traverse', () => {
        eh.countCallbacks('a.b', {
            phase: EventHub.PHASES.CAPTURING,
            traverse: true
        }).should.equal(3);
    });

    it('should have triggered the correct amount of callbacks', () => {
        count.should.equal(4);
    });

    it('should have called everything in the right order', () => {
        data[0].name.should.equal('cb1');
        data[1].name.should.equal('cb3');
        data[2].name.should.equal('cb2');
        data[3].name.should.equal('cb6');
    });

    it('should have passed `data` to all callbacks', () => {
        data[0].value.should.equal(1);
        data[1].value.should.equal(1);
        data[2].value.should.equal(1);
        data[3].value.should.equal(1);
    });
});