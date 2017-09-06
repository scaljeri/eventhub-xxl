import {EventHub} from './helpers';

describe('#one', () => {
    let eh,
        count,
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

        eh.one('a', cbs.cb1, {eventMode: EventHub.EVENT_MODE.CAPTURING});   // 1
        eh.one('a', cbs.cb6, {eventMode: EventHub.EVENT_MODE.BUBBLING});    // 8
        eh.one('a', cbs.cb7, {eventMode: EventHub.EVENT_MODE.BOTH});        // 2
        eh.one('a.b', cbs.cb2, {eventMode: EventHub.EVENT_MODE.CAPTURING}); // 3
        eh.one('a.b', cbs.cb8, {eventMode: EventHub.EVENT_MODE.BOTH});      // 4
        eh.one('a.b', cbs.cb9, {eventMode: EventHub.EVENT_MODE.BUBBLING});  // 7
        eh.on('a.b.c', cbs.cb3);                                            // 5
        eh.one('a.b.c', cbs.cb4);                                           // 6

        count = eh.trigger('a.b.c', 1);
    });

    it('should have a correct trigger count', () => {
        count.should.equal(8);
    });

    it('should have removed the callbacks', () => {
       eh.trigger('a.b.c', 2).should.equal(1);
    });
});