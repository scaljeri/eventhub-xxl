import {EventHub} from './helpers';

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
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BUBBLING});
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BUBBLING});
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.CAPTURING});
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.CAPTURING});
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BOTH});
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BOTH});
            eh.on('a.b', cbs.cb1); // not used
        });

        it('should have registered cb1 without an eventMode', () => {
            eh.countCallbacks('a').should.equal(2);
        });

        it('should have registered cb1 with bubbling', () => {
            eh.countCallbacks('a.b', {eventMode: EventHub.EVENT_MODE.BUBBLING}).should.equal(4);
        });

        it('should have registered cb1 with both event modes', () => {
            eh.countCallbacks('a.b', {eventMode: EventHub.EVENT_MODE.BOTH}).should.equal(8);
        });
    });

    describe('Disabled', () => {
        beforeEach(() => {
            eh = new EventHub({allowMultiple: false});
            eh.on('a', cbs.cb1);
            eh.on('a', cbs.cb1);
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BUBBLING});
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BUBBLING});
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.CAPTURING});
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.CAPTURING});
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BOTH});
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BOTH});
            eh.on('a.b', cbs.cb1); // not used
        });

        it('should have registered cb1 only once for each event mode', () => {
            eh.countCallbacks('a').should.equal(1);
            eh.countCallbacks('a.b', {eventMode: EventHub.EVENT_MODE.BOTH}).should.equal(4);
        });
    });

    describe('Single#setAllowMultiple', () => {
        beforeEach(() => {
            eh = new EventHub();
            eh.setAllowMultiple(false);

            eh.on('a', cbs.cb1);
            eh.on('a', cbs.cb1);
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BUBBLING});
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BUBBLING});
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.CAPTURING});
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.CAPTURING});
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BOTH});
            eh.on('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.BOTH});
            eh.on('a.b', cbs.cb1); // not used
        });

        it('should have registered cb1 only once for each event mode', () => {
            eh.countCallbacks('a').should.equal(1);
            eh.countCallbacks('a.b', {eventMode: EventHub.EVENT_MODE.BOTH}).should.equal(4);
        });
    });
});