import {EventHub, it, describe, beforeEach} from './helpers';

describe('Traverse', () => {
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

        eh.on('a', cbs.cb1);                        //
        eh.on('a.b', cbs.cb2);                      // 1
        eh.on('a.b.c', cbs.cb4);                    // 4
        eh.on('a.b', cbs.cb5);                      // 2
        eh.on('a.b.c', cbs.cb6);                    // 5
        eh.on('a.b.c', cbs.cb3, {prepend: true});   // 3
        eh.on('a.b.c.d', cbs.cb3);                  // 6
        eh.on('a.b.c.d.e', cbs.cb3);                // 7

        count = eh.trigger('a.b', 1, {traverse: true});
    });

    it('should count callbacks without an eventName', () => {
        eh.fake.trigger(null, {traverse: true}).should.equal(8);
        eh.fake.trigger('', {traverse: true}).should.equal(8);
    });

    it('should count callbacks unil namespace is invalid', () => {
        eh.fake.trigger('a.b.x', {traverse: true}).should.equal(0);
        eh.fake.trigger('a.b.x', {traverse: true, phase: EventHub.PHASES.CAPTURING}).should.equal(0);
    });

    it('should count callbacks', () => {
        eh.fake.trigger('a', {traverse: true}).should.equal(8);
        eh.fake.trigger('a.b', {traverse: true}).should.equal(7);
        eh.fake.trigger('a.b.c', {traverse: true}).should.equal(5);
        eh.fake.trigger('a.b.c.d', {traverse: true}).should.equal(2);
        eh.fake.trigger('a.b.c.d.e', {traverse: true}).should.equal(1);
    });

    it('should have triggered the correct amount of callbacks', () => {
        count.should.equal(7);
    });

    it('should have called everything in the right order', () => {
        data[0].name.should.equal('cb2');
        data[1].name.should.equal('cb5');
        data[2].name.should.equal('cb3');
        data[3].name.should.equal('cb4');
        data[4].name.should.equal('cb6');
        data[5].name.should.equal('cb3');
        data[6].name.should.equal('cb3');
    });

    it('should have passed `data` to all callbacks', () => {
        data.forEach(item => {
            item.value.should.equal(1);
        });
    });
});