import {EventHub, chai, should, sinon} from './helpers';

describe('Eventhub', () => {
    // globals
    let mySpy, hub;
    beforeEach(() => {
        var eh
            , cbs = {
            cb1: function (data) {
                if (data && Array.isArray(data))
                    data.push('cb1');
            }
            , cb2: function (data) {
                if (data && Array.isArray(data))
                    data.push('cb2');
            }
            , cb3: function (data) {
                if (data && Array.isArray(data))
                    data.push('cb3');
            }
            , cb4: function (data) {
                if (data && Array.isArray(data))
                    data.push('cb4');
            }
        };

        hub = new EventHub();

        // Mocking
        mySpy = sinon.spy(cbs, 'cb1');

    });

    it('should exist', () => {
        should.exist(hub);
    });

    it('shou;d have called the spy', () => {
        mySpy(2);
        mySpy.should.have.been.calledWith(2);
    });
});
