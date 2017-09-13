import {EventHub} from './helpers';

describe('#countTrigger', () => {
    let eh,
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

        eh.on('a', cbs.cb1);                        //
        eh.on('a.b', cbs.cb2);                      // 1
        eh.on('a.b.c', cbs.cb4);                    // 4
        eh.on('a.b', cbs.cb5);                      // 2
        eh.on('a.b.c', cbs.cb6);                    // 5
        eh.on('a.b.c', cbs.cb3);                    // 3
        eh.on('a.b.c.d', cbs.cb3);                  // 6
        eh.on('a.b.c.d.e', cbs.cb3);                // 7

        eh.trigger('a.b', 1, {traverse: true});
        eh.trigger('a.b.c', 1, {traverse: true});
    });

    it('should count triggers without a event name', () => {
        eh.getTriggersFor().should.equal(0);
    });

    it('should count without traverse', () => {
        eh.getTriggersFor('a').should.equal(0);
        eh.getTriggersFor('a.b').should.equal(1);
        eh.getTriggersFor('a.b.c').should.equal(1);
        eh.getTriggersFor('a.b.c.d').should.equal(0);
        eh.getTriggersFor('a.b.c.d.e').should.equal(0);
    });

    it('should count and traverse', () => {
        eh.getTriggersFor('a', {traverse: true}).should.equal(2);
        eh.getTriggersFor('a.b', {traverse: true}).should.equal(2);
        eh.getTriggersFor('a.b.c', {traverse: true}).should.equal(1);
        eh.getTriggersFor('a.b.c.d', {traverse: true}).should.equal(0);
        eh.getTriggersFor('a.b.c.d.e', {traverse: true}).should.equal(0);
    });
});