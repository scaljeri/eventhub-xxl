import {EventHub, sinon} from './helpers';

describe('#trigger', () => {
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
        eh.on('a.b', cbs.cb2);                      //
        eh.on('a.b.c', cbs.cb4);                    // 2
        eh.on('a.b', cbs.cb5);                      //
        eh.on('a.b.c', cbs.cb6);                    // 3
        eh.on('a.b.c', cbs.cb3, {prepend: true});   // 1
        eh.on('a.b.c.d', cbs.cb3);                  // 4
        eh.on('a.b.c.d.e', cbs.cb3);                // 5

        count = eh.trigger('a.b.c', 1);
    });

    it('should not register a non-function as a callback', () => {
        sinon.stub(console, 'warn');
        eh.on('a.b', {});

        console.warn.should.have.been.calledWithMatch(/Cannot.*eventName=a.b/);

        console.warn.restore();
    });

    it('should count the trigger', () => {
        eh.getTriggersFor('a').should.equal(0);
        eh.getTriggersFor('a.b').should.equal(0);
        eh.getTriggersFor('a.b.c').should.equal(1);
        eh.getTriggersFor('a.b.c.d').should.equal(0);
    });

    it('should count callbacks', () => {
        eh.fake.trigger('a').should.equal(1);
        eh.fake.trigger('a.b').should.equal(2);
        eh.fake.trigger('a.b.c').should.equal(3);
        eh.fake.trigger('a.b.c.d').should.equal(1);
        eh.fake.trigger('a.b.c.d.e').should.equal(1);
    });

    it('should have triggered the correct amount of callbacks', () => {
        count.should.equal(3);
    });

    it('should have called everything in the right order', () => {
        data[0].name.should.equal('cb3');
        data[1].name.should.equal('cb4');
        data[2].name.should.equal('cb6');
    });

    it('should have passed `data` to all callbacks', () => {
        data.forEach(item => {
            item.value.should.equal(1);
        });
    });

    describe('Without eventname', () => {
        beforeEach(() => {
            data = [];
        });

        it('should trigger nothing', () => {
            eh.trigger(undefined, 1).should.equal(0);
            data.length.should.equal(0);
        });

        describe('Traverse', () => {
            beforeEach(() => {
                count = eh.trigger(null, 1, {traverse: true});

            });

            it('should traverse from the rootNode', () => {
                count.should.equal(8);
            });

            it('should have called everything in the right order', () => {
                data[0].name.should.equal('cb1');
                data[1].name.should.equal('cb2');
                data[2].name.should.equal('cb5');
                data.length.should.equal(8);
            });
        })
    })
});