import {EventHub, it, describe, beforeEach} from './helpers';

describe('Multiple', () => {
    let eh,
        data,
        cbs = {
            cb1: (value) => data.push({name: 'cb1', value}),
            cb2: (value) => data.push({name: 'cb2', value}),
            cb3: (value) => data.push({name: 'cb3', value}),
            cb4: (value) => data.push({name: 'cb4', value}),
            cb5: (value) => data.push({name: 'cb5', value}),
            cb6: (value) => data.push({name: 'cb6', value}),
            cb7: (value) => data.push({name: 'cb7', value}),
            cb8: (value) => data.push({name: 'cb8', value}),
            cb9: (value) => data.push({name: 'cb8', value})
        };

    beforeEach(() => {
        eh = new EventHub();
        data = [];
    });

    describe('Enabled', () => {
        beforeEach(() => {
            eh.on('a', cbs.cb1);
            eh.on('a', cbs.cb1);
            eh.on('a', cbs.cb1, {phase: EventHub.PHASES.BUBBLING});
            eh.on('a', cbs.cb1, {phase: EventHub.PHASES.BUBBLING});
            eh.on('a', cbs.cb1, {phase: EventHub.PHASES.CAPTURING});
            eh.on('a', cbs.cb1, {phase: EventHub.PHASES.CAPTURING});
            eh.on('a', cbs.cb1, {phase: EventHub.PHASES.BOTH});
            eh.on('a', cbs.cb1, {phase: EventHub.PHASES.BOTH});
            eh.on('a.b', cbs.cb1); // not used
        });

        it('should have registered cb1 without an phase', () => {
            eh.fake.trigger('a').should.equal(2);
        });

        it('should have registered cb1 with bubbling', () => {
            eh.fake.trigger('a.b', {phase: EventHub.PHASES.BUBBLING}).should.equal(5);
        });

        it('should have registered cb1 with both event modes', () => {
            eh.fake.trigger('a.b', {phase: EventHub.PHASES.BOTH}).should.equal(9);
            eh.fake.trigger('a.b').should.equal(9);
        });
    });

    describe('Disabled', () => {
        const isAdded = [];

        beforeEach(() => {
            eh = new EventHub({allowMultiple: false});
            isAdded.push(eh.on('a', cbs.cb1));
            isAdded.push(eh.on('a', cbs.cb1));
            isAdded.push(eh.on('a', cbs.cb1, {phase: EventHub.PHASES.BUBBLING}));
            isAdded.push(eh.one('a', cbs.cb1, {phase: EventHub.PHASES.BUBBLING}));
            isAdded.push(eh.on('a', cbs.cb1, {phase: EventHub.PHASES.CAPTURING}));
            isAdded.push(eh.on('a', cbs.cb1, {phase: EventHub.PHASES.CAPTURING}));
            isAdded.push(eh.on('a', cbs.cb1, {phase: EventHub.PHASES.BOTH}));
            isAdded.push(eh.on('a', cbs.cb1, {phase: EventHub.PHASES.BOTH}));
            isAdded.push(eh.on('a.b', cbs.cb1)); // not used
        });

        it('should have added only unique callbacks', () => {
           isAdded['should'].eql([true, false, true, false, true, false, false, false, true]);
        });

        it('should have registered cb1 only once for each event mode', () => {
            eh.fake.trigger('a').should.equal(1);
            eh.fake.trigger('a.b', {phase: EventHub.PHASES.BOTH}).should.equal(3);
            eh.fake.trigger('a.b').should.equal(3);
        });
    });

    describe('Single#setAllowMultiple', () => {
        beforeEach(() => {
            eh = new EventHub();
            eh.setAllowMultiple(false);

            eh.on('a', cbs.cb1);
            eh.on('a', cbs.cb1);  // not added
            eh.on('a', cbs.cb1, {phase: EventHub.PHASES.BUBBLING});
            eh.on('a', cbs.cb1, {phase: EventHub.PHASES.BUBBLING});  // not added
            eh.on('a', cbs.cb1, {phase: EventHub.PHASES.CAPTURING});
            eh.on('a', cbs.cb1, {phase: EventHub.PHASES.CAPTURING});  // not added
            eh.on('a', cbs.cb1, {phase: EventHub.PHASES.BOTH});  // not added
            eh.on('a', cbs.cb1, {phase: EventHub.PHASES.BOTH});  // not added
            eh.on('a.b', cbs.cb1); // not used
        });

        it('should have registered cb1 only once for each event mode', () => {
            eh.fake.trigger('a').should.equal(1);
            eh.fake.trigger('a.b', {phase: EventHub.PHASES.BOTH}).should.equal(3);
            eh.fake.trigger('a.b').should.equal(3);
        });
    });
});