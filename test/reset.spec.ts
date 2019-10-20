import {EventHub, it, describe, beforeEach, sinon} from './helpers';

describe('#reset', () => {
    let eh, cb;

    beforeEach(() => {
        eh = new EventHub();
        cb = sinon.spy();

        eh.on('a', cb);
    });

    it('should trigger the callback', () => {
        eh.fake.trigger('a').should.equal(1);
        eh.trigger('a', 'yolo');
        cb.should.have.been.calledOnce;
    })

    it('should not trigger any callback', () => {
        eh.reset();
        eh.fake.trigger('a').should.equal(0);
        eh.trigger('a').should.equal(0);
        cb.should.not.have.been.called;
    });
});