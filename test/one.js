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

        eh.one('a.b.c', cbs.cb4);                                   // 6
        eh.on('a.b.c', cbs.cb3);                                    // 5
        eh.one('a.b', cbs.cb9, {phase: EventHub.PHASES.BUBBLING});  // 7
        eh.one('a.b', cbs.cb8, {phase: EventHub.PHASES.BOTH});      // 4
        eh.one('a.b', cbs.cb2, {phase: EventHub.PHASES.CAPTURING}); // 3
        eh.one('a', cbs.cb7, {phase: EventHub.PHASES.BOTH});        // 2
        eh.one('a', cbs.cb6, {phase: EventHub.PHASES.BUBBLING});    // 8
        eh.one('a', cbs.cb1, {phase: EventHub.PHASES.CAPTURING});   // 1

        count = eh.trigger('a.b.c', 1);
    });

    it('should have a correct trigger count', () => {
        count.should.equal(10);
    });

    it('should have removed the callbacks', () => {
       eh.trigger('a.b.c', 2).should.equal(1);
    });
});