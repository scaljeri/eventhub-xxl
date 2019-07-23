import { EventHub, it, describe, beforeEach, should } from './helpers';
import { PHASES } from '../src/eventhub';

describe('Bubbling phase', () => {
    let eh,
        count,
        data,
        cbs = {
            cb1: (value, context) => data.push({ name: 'cb1', value, context }),
            cb2: (value, context) => data.push({ name: 'cb2', value, context }),
            cb3: (value, context) => data.push({ name: 'cb3', value, context }),
            cb4: (value, context) => data.push({ name: 'cb4', value, context }),
            cb5: (value, context) => data.push({ name: 'cb5', value, context }),
            cb6: (value, context) => data.push({ name: 'cb6', value, context })
        };

    beforeEach(() => {
        eh = new EventHub();
        data = [];

        eh.on('a', cbs.cb1, { phase: EventHub.PHASES.BUBBLING });
        eh.on('a.b', cbs.cb2, { phase: EventHub.PHASES.BUBBLING });
        eh.on('a.b.c', cbs.cb4, { phase: EventHub.PHASES.BUBBLING });
        eh.on('a.b', cbs.cb5);
        eh.on('a.b.c', cbs.cb6);
        eh.on('a.b', cbs.cb3, { phase: EventHub.PHASES.BUBBLING, prepend: true });
        eh.on('a.b.c.d', cbs.cb3, { phase: EventHub.PHASES.BUBBLING });
        eh.on('a.b.c.d.e', cbs.cb3);

        count = eh.trigger('a.b.c', 1);
    });

    it('should count the trigger', () => {
        eh.getTriggersFor('a').should.equal(0);
        eh.getTriggersFor('a.b').should.equal(0);
        eh.getTriggersFor('a.b.c').should.equal(1);
        eh.getTriggersFor('a.b.c.d').should.equal(0);
    });

    it('should count callbacks without an evena tname', () => {
        eh.fake.trigger(null, { phase: EventHub.PHASES.BUBBLING }).should.equal(0);
        eh.fake.trigger('', { phase: EventHub.PHASES.BUBBLING }).should.equal(0);
    });

    it('should count callbacks', () => {
        eh.fake.trigger('a', { phase: EventHub.PHASES.BUBBLING }).should.equal(0);
        eh.fake.trigger('a.b', { phase: EventHub.PHASES.BUBBLING }).should.equal(2);
        eh.fake.trigger('a.b.c', { phase: EventHub.PHASES.BUBBLING }).should.equal(4);
        eh.fake.trigger('a.b.c.d', { phase: EventHub.PHASES.BUBBLING }).should.equal(4);
        eh.fake.trigger('a.b.c.d.e', { phase: EventHub.PHASES.BUBBLING }).should.equal(6);
    });

    it('should count and traverse', () => {
        eh.fake.trigger('a.b', {
            phase: EventHub.PHASES.BUBBLING,
            traverse: true
        }).should.equal(4);
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

    describe('Call with context', () => {
        it('should not have a phase for target event', () => {
            should.exist(data[0].context);
            data[0].context.event.should.equal('a.b.c');
            data[0].context.trigger.should.equal('a.b.c');
            should.not.exist(data[0].context.phase);
        });

        it('should call each event with bubble phase', () => {
            data[1].context.phase.should.equal(PHASES.BUBBLING);
            data[1].context.event.should.equal('a.b');
            data[1].context.trigger.should.equal('a.b.c');

            data[2].context.phase.should.equal(PHASES.BUBBLING);
            data[2].context.event.should.equal('a.b');
            data[2].context.trigger.should.equal('a.b.c');

            data[3].context.phase.should.equal(PHASES.BUBBLING);
            data[3].context.event.should.equal('a');
            data[3].context.trigger.should.equal('a.b.c');
        });
    });
});