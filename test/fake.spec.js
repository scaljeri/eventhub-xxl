import {EventHub} from './helpers';

describe.only('#Fake', () => {
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

        eh.on('a', cbs.cb1);
        eh.on('a.b', cbs.cb2);
    });


    it('should fake a trigger', () => {
        eh.fake.trigger('a').should.equal(1);
        eh.fake.trigger('a', {traverse: true}).should.equal(2);
        eh.getTriggersFor('a').should.equal(2);
    });

    it('should fake `on`', () => {
        eh.fake.on('a.b', cbs.cb2).should.be.true;
        eh.fake.trigger('a.b').should.equal(1);
    });

    it('should fake `one`', () => {
        eh.fake.one('a.b', cbs.cb2).should.be.true;
        eh.fake.trigger('a.b').should.equal(1);
    });

    it('should fake `off`', () => {
        eh.fake.off('a', cbs.cb1).should.equal(1);
        eh.fake.trigger('a').should.equal(1);
    });
});

