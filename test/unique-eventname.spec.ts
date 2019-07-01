import {EventHub, it, describe} from './helpers';

describe('Eventmode: Both', () => {
    let eh1, eh2;

    beforeEach(() => {
        eh1 = new EventHub();
        eh2 = new EventHub();
    });

    it('should create unique event names', () => {
        eh1.generateUniqueEventName().should.not.equal(eh1.generateUniqueEventName());
    });

    it('should create identical event names per instance', () => {
        eh1.generateUniqueEventName().should.equal(eh2.generateUniqueEventName());
    });
});

