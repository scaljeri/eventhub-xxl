import {EventHub, chai, should, sinon} from './helpers';

describe('Eventhub', () => {
    // globals
    let cbs, eh, mySpy1, mySpy2, mySpy3, mySpy4;
    beforeEach(() => {
        cbs = {
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

        mySpy1 = sinon.spy(cbs, 'cb1');
        mySpy2 = sinon.spy(cbs, 'cb2');
        mySpy3 = sinon.spy(cbs, 'cb3');
        mySpy4 = sinon.spy(cbs, 'cb4');

        let on = [
            { fn: mySpy1,   isOne: false }
            , { fn: mySpy1, isOne: true  }
            , { fn: mySpy2, isOne: false }
            , { fn: mySpy2, isOne: true  }
            , { fn: mySpy2, isOne: true,  eventMode: EventHub.EVENT_MODE.BOTH      }
            , { fn: mySpy3, isOne: false, eventMode: EventHub.EVENT_MODE.CAPTURING }
            , { fn: mySpy4, isOne: false, eventMode: EventHub.EVENT_MODE.BUBBLING  }
        ] ;

        eh = new EventHub();

        // create event 'bar'
        eh._rootStack.bar = {
            __stack: {
                on: on                              // callback stack
                , parent: eh._rootStack             // parent namespace/object
                , triggers: 0                       // count triggers
                , disabled: false                   // by default the namespace/event is enabled
            }
        } ;
    });

    it('should exist', () => {
        should.exist(eh);
    });

    it("should handle triggers for invalid event names", function() {
        eh.trigger('go').should.equal(0);
        eh.trigger('forum.go').should.equal(0) ;
        eh.trigger().should.equal(0) ;
    }) ;

    // events without a namespace
    describe("should register callbacks for simple events (not namespaced)", function() {
        describe("using 'on'", function(){
            it("without options", function() {
                eh.on("go", cbs.cb1) ;
                eh.on("go", cbs.cb2) ;
                eh._rootStack.go.__stack.on.length.should.equal(2) ;
                eh._rootStack.go.__stack.disabled.should.be.false;             // check if stack is created correctly
                eh._rootStack.go.__stack.on[0].fn.should.equals(cbs.cb1) ;        // check if callback is registered correctly
                should.not.exist(eh._rootStack.go.__stack.on[0].eventMode);
                eh._rootStack.go.__stack.on[0].isOne.should.be.false;
                eh._rootStack.go.__stack.on[1].fn.should.equal(cbs.cb2) ;
            }) ;
            it("with the 'eventMode' option", function(){
                eh.on("go", cbs.cb1) ;
                eh.on("go", cbs.cb2, { eventMode: EventHub.EVENT_MODE.BOTH}) ;
                eh.on("go", cbs.cb3, { eventMode: EventHub.EVENT_MODE.CAPTURING}) ;
                eh.on("go", cbs.cb4, { eventMode: EventHub.EVENT_MODE.BUBBLING}) ;

                eh._rootStack.go.__stack.on.length.should.equal(4) ;

                eh._rootStack.go.__stack.on[0].fn.should.equal(cbs.cb1) ;
                should.not.exist(eh._rootStack.go.__stack.on[0].eventMode);

                eh._rootStack.go.__stack.on[1].fn.should.equal(cbs.cb2);
                eh._rootStack.go.__stack.on[1].eventMode.should.equal(EventHub.EVENT_MODE.BOTH) ;

                eh._rootStack.go.__stack.on[2].fn.should.equal(cbs.cb3) ;
                eh._rootStack.go.__stack.on[2].eventMode.should.equal(EventHub.EVENT_MODE.CAPTURING) ;

                eh._rootStack.go.__stack.on[3].fn.should.equal(cbs.cb4) ;
                eh._rootStack.go.__stack.on[3].eventMode.should.equal(EventHub.EVENT_MODE.BUBBLING) ;
            }) ;
            it("with the 'prepend' option", function(){
                eh.on("go", cbs.cb1).should.be.true;
                eh.on("go", cbs.cb2, { prepend: false}).should.be.true;
                eh.on("go", cbs.cb3, { prepend: true }).should.be.true;
                eh.on("go", cbs.cb4, { prepend: true }).should.be.true;

                eh._rootStack.go.__stack.on.length.should.equal(4) ;
                eh._rootStack.go.__stack.on[0].fn.should.equal(cbs.cb4) ;
                eh._rootStack.go.__stack.on[1].fn.should.equal(cbs.cb3) ;
                eh._rootStack.go.__stack.on[2].fn.should.equal(cbs.cb1) ;
                eh._rootStack.go.__stack.on[3].fn.should.equal(cbs.cb2) ;
            }) ;
            it("with 'allowMultiple' set to TRUE", function(){
                eh.allowMultiple.should.be.true;
                eh.setAllowMultiple(true).should.equal(eh);                     // chainable
                eh.on( "go", cbs.cb1).should.be.true;
                eh.on( "go", cbs.cb1).should.be.true;                           // the same callback multiple times
                eh._rootStack.go.__stack.on.length.should.equal(2) ;                // check the internal stack
            }) ;
            it("with 'allowMultiple' set to FALSE", function(){
                eh.setAllowMultiple(false).should.equal(eh) ;                           // chainable
                eh.on( "go", cbs.cb2).should.be.true ;
                eh.on( "go", cbs.cb2).should.be.false;
                eh.on( "go", cbs.cb2, {}).should.be.false;                        // idem
                eh.on( "go", cbs.cb2, {eventMode: EventHub.EVENT_MODE.CAPTURING}).should.be.true;      // accepted, because it has an event-mode defined
                eh.on( "go", cbs.cb2, {eventMode: EventHub.EVENT_MODE.BOTH}).should.be.false;            // falsy, because 'BOTH' includes 'CAPTURING' too
                eh.on( "go", cbs.cb2, {eventMode: EventHub.EVENT_MODE.CAPTURING}).should.be.false;       // nope
                eh.on( "go", cbs.cb2, {eventMode: EventHub.EVENT_MODE.BUBBLING}).should.be.true;       // different event mode

                eh.on( "go", cbs.cb3, {eventMode: EventHub.EVENT_MODE.BOTH}).should.be.true;
                eh.on( "go", cbs.cb3, {eventMode: EventHub.EVENT_MODE.CAPTURING}).should.be.false;       // 'BOTH' includes 'CAPTURING'
                eh.on( "go", cbs.cb3, {eventMode: EventHub.EVENT_MODE.BUBBLING}).should.be.false;        // and 'BUBBLING'
                eh.on( "go", cbs.cb3).should.be.true;                                                       // true because no event mode is defined
            }) ;
        }) ;

        it("using 'one'", function(){
            eh.one("go", cbs.cb1) ;

            eh._rootStack.go.__stack.on.length.should.equal(1) ;
            eh._rootStack.go.__stack.on[0].fn.should.equal(cbs.cb1) ;
            eh._rootStack.go.__stack.on[0].isOne.should.be.true;
        }) ;

        it("with a correct callback count", function(){
            eh.countCallbacks('bar').should.equal(4) ;
            eh.countCallbacks('bar', { eventMode: EventHub.EVENT_MODE.BOTH }).should.equal(1) ;
            eh.countCallbacks('bar', { eventMode: EventHub.EVENT_MODE.CAPTURING }).should.equal(1) ;
            eh.countCallbacks('bar', { eventMode: EventHub.EVENT_MODE.BUBBLING }).should.equal(1) ;
        }) ;

        it("and be able to remove callbacks using 'off'", function() {
            const on = eh._rootStack.bar.__stack.on ;

            eh.off('bar', cbs.cb1).should.equal(2) ;
            on[0].fn.should.equal(cbs.cb2) ;
            eh.off('bar', cbs.cb2, { eventMode: EventHub.EVENT_MODE.BOTH }).should.equal(1) ;
            eh.off('bar', cbs.cb3, { isOne: false, eventMode: EventHub.EVENT_MODE.CAPTURING }).should.equal(1) ;
            eh.off('bar', cbs.cb4, { isOne: true, eventMode: EventHub.EVENT_MODE.BUBBLING }).should.equal(0) ;
            eh.off('bar', cbs.cb4, { isOne: false, eventMode: EventHub.EVENT_MODE.BUBBLING }).should.equal(1) ;
            on.length.should.equal(2) ;
            eh.off('bar').should.equal(2) ;

        }) ;
        it("and possible to disable/enable events", function(){
            eh._rootStack.bar.__stack.disabled.should.be.false;
            eh.isDisabled('bar').should.be.false;
            eh.disable('bar').should.equal(eh) ;
            eh._rootStack.bar.__stack.disabled.should.be.true;
            eh.isDisabled('bar').should.be.true;
            eh.enable('bar').should.equal(eh) ;
            eh._rootStack.bar.__stack.disabled.should.be.false;
            eh.isDisabled('bar').should.be.false;
        }) ;
        describe("and triggers them", function(){
            it("without an event mode", function(){
                eh.trigger('bar').should.equal(4) ;
                eh._rootStack.bar.__stack.on.length.should.equal(5) ; // 2 callbacks should have been removed
                eh.trigger('bar').should.equal(2) ;
            }) ;
            it("in the Capturing event mode", function(){
                eh.trigger('bar', {eventMode: EventHub.EVENT_MODE.CAPTURING }).should.equal(4) ;
                mySpy3.should.not.have.been.called;
            });
            it("in the Bubbling event mode", function(){
                eh.trigger('bar', {eventMode: EventHub.EVENT_MODE.BUBBLING }).should.equal(4);
                mySpy3.should.not.have.been.called;
            }) ;
            it("in the Capturing and Bubbling event mode (BOTH)", function(){
                eh.trigger('bar', {eventMode: EventHub.EVENT_MODE.BOTH }).should.equal(4);
                mySpy3.should.not.have.been.called;
            }) ;
            it("when the event is disabled", function(){
                eh.disable('bar') ;
                eh.trigger('bar').should.equal(0) ;
            }) ;

            it("and validate the trigger count", function(){
                eh.trigger('bar') ;
                eh.countTriggers().should.equal(1) ;
                eh.trigger('bar') ;
                eh.countTriggers().should.equal(2) ;
            });
        });
    });

    describe("should register callbacks for namespaced events", function() {
        beforeEach(function(){ // NOTE That the event 'bar' is already set by the first 'beforeEach'!
            const onFoo1 = [
                { fn: cbs.cb1,   isOne: false }
                , { fn: cbs.cb1,   isOne: true }
                , { fn: cbs.cb2, isOne: true, eventMode: EventHub.EVENT_MODE.BOTH }
                , { fn: cbs.cb3, isOne: false, eventMode: EventHub.EVENT_MODE.CAPTURING }
                , { fn: cbs.cb4, isOne: true, eventMode: EventHub.EVENT_MODE.BUBBLING }
            ]
                , onFoo2 = [
                { fn: cbs.cb1,   isOne: true }
                , { fn: cbs.cb1,   isOne: false }
                , { fn: cbs.cb2, isOne: true, eventMode: EventHub.EVENT_MODE.BOTH }
                , { fn: cbs.cb3, isOne: false, eventMode: EventHub.EVENT_MODE.CAPTURING }
                , { fn: cbs.cb4, isOne: true, eventMode: EventHub.EVENT_MODE.BUBBLING }
            ]
                , onFoo3 = [
                { fn: cbs.cb1,   isOne: true }
                , { fn: cbs.cb1,   isOne: false }
                , { fn: cbs.cb2, isOne: true, eventMode: EventHub.EVENT_MODE.BOTH }
                , { fn: cbs.cb3, isOne: false, eventMode: EventHub.EVENT_MODE.CAPTURING }
                , { fn: cbs.cb4, isOne: true, eventMode: EventHub.EVENT_MODE.BUBBLING }
            ] ;

            eh._rootStack.bar.foo1 = {
                __stack: {
                    on: onFoo1                          // callback stack
                    , parent: eh._rootStack.bar         // parent namespace/object
                    , triggers: 0                       // count triggers
                    , disabled: false                   // by default the namespace/event is enabled
                }
            } ;
            eh._rootStack.bar.foo = {
                __stack: {
                    on: onFoo2                          // callback stack
                    , parent: eh._rootStack.bar         // parent namespace/object
                    , triggers: 0                       // count triggers
                    , disabled: false                   // by default the namespace/event is enabled
                }
            } ;
            eh._rootStack.bar.foo.foo3 = {
                __stack: {
                    on: onFoo3
                    , parent: eh._rootStack.bar.foo         // parent namespace/object
                    , triggers: 0                       // count triggers
                    , disabled: false                   // by default the namespace/event is enabled
                }
            } ;
        });
        describe("using 'on'", function(){
            it("without options", function() {
                eh.on("bar.go", cbs.cb1) ;
                eh.on("bar.go", cbs.cb2) ;
                eh._rootStack.bar.go.should.exist;
                eh._rootStack.bar.go.__stack.on.length.should.equal(2) ;
                eh._rootStack.bar.go.__stack.on[0].fn.should.equal(cbs.cb1) ;
                eh._rootStack.bar.go.__stack.on[1].fn.should.equal(cbs.cb2) ;
            }) ;
            it("with the 'eventMode' option", function(){
                eh.on("bar.go", cbs.cb1) ;
                eh.on("bar.go", cbs.cb2, { eventMode: EventHub.EVENT_MODE.BOTH}) ;
                eh.on("bar.go", cbs.cb3, { eventMode: EventHub.EVENT_MODE.CAPTURING}) ;
                eh.on("bar.go", cbs.cb4, { eventMode: EventHub.EVENT_MODE.BUBBLING}) ;

                eh._rootStack.bar.go.__stack.on.length.should.equal(4) ;

                eh._rootStack.bar.go.__stack.on[0].fn.should.equal(cbs.cb1) ;
                should.not.exist(eh._rootStack.bar.go.__stack.on[0].eventMode);

                eh._rootStack.bar.go.__stack.on[1].fn.should.equal(cbs.cb2) ;
                eh._rootStack.bar.go.__stack.on[1].eventMode.should.equal(EventHub.EVENT_MODE.BOTH) ;

                eh._rootStack.bar.go.__stack.on[2].fn.should.equal(cbs.cb3) ;
                eh._rootStack.bar.go.__stack.on[2].eventMode.should.equal(EventHub.EVENT_MODE.CAPTURING) ;

                eh._rootStack.bar.go.__stack.on[3].fn.should.equal(cbs.cb4) ;
                eh._rootStack.bar.go.__stack.on[3].eventMode.should.equal(EventHub.EVENT_MODE.BUBBLING) ;
            }) ;

            it("with the 'prepend' option", function(){
                eh.on("bar.go", cbs.cb1).should.be.true;
                eh.on("bar.go", cbs.cb2, { prepend: false}).should.be.true;
                eh.on("bar.go", cbs.cb3, { prepend: true }).should.be.true;
                eh.on("bar.go", cbs.cb4, { prepend: true }).should.be.true;

                eh._rootStack.bar.go.__stack.on.length.should.equal(4) ;
                eh._rootStack.bar.go.__stack.on[0].fn.should.equal(cbs.cb4) ;
                eh._rootStack.bar.go.__stack.on[1].fn.should.equal(cbs.cb3) ;
                eh._rootStack.bar.go.__stack.on[2].fn.should.equal(cbs.cb1) ;
                eh._rootStack.bar.go.__stack.on[3].fn.should.equal(cbs.cb2) ;
            }) ;
            it("with 'allowMultiple' set to TRUE", function(){
                eh.allowMultiple.should.be.true;                                 // by default this value is set to TRUE
                eh.setAllowMultiple(true).should.equal(eh);                            // chainable
                eh.on( "bar.go", cbs.cb1).should.be.true;                        // default behavior is to accept
                eh.on( "bar.go", cbs.cb1).should.be.true;                        // the same callback multiple times
                eh._rootStack.bar.go.__stack.on.length.should.equal(2) ;             // check the internal stack
            }) ;
            it("with 'allowMultiple' set to FALSE", function(){
                eh.setAllowMultiple(false).should.equal(eh) ;                           // chainable
                eh.on( "bar.go", cbs.cb2).should.be.true;
                eh.on( "bar.go", cbs.cb2).should.be.false;                         // nope, its registered already
                eh.on( "bar.go", cbs.cb2, {}).should.be.false;                     // idem
                eh.on( "bar.go", cbs.cb2, {eventMode: EventHub.EVENT_MODE.CAPTURING}).should.be.true;      // accepted, because it has an event-mode defined
                eh.on( "bar.go", cbs.cb2, {eventMode: EventHub.EVENT_MODE.BOTH}).should.be.false;            // falsy, because 'BOTH' includes 'CAPTURING' too
                eh.on( "bar.go", cbs.cb2, {eventMode: EventHub.EVENT_MODE.CAPTURING}).should.be.false;       // nope
                eh.on( "bar.go", cbs.cb2, {eventMode: EventHub.EVENT_MODE.BUBBLING}).should.be.true;       // different event mode

                eh.on( "bar.go", cbs.cb3, {eventMode: EventHub.EVENT_MODE.BOTH}).should.be.true;
                eh.on( "bar.go", cbs.cb3, {eventMode: EventHub.EVENT_MODE.CAPTURING}).should.be.false ;       // 'BOTH' includes 'CAPTURING'
                eh.on( "bar.go", cbs.cb3, {eventMode: EventHub.EVENT_MODE.BUBBLING}).should.be.false ;        // and 'BUBBLING'
                eh.on( "bar.go", cbs.cb3).should.be.true;                                                       // true because no event mode is defined
            }) ;
        });

        it("using 'one'", function(){
            eh.one("bar.go", cbs.cb1) ;
            eh._rootStack.bar.go.__stack.on.length.should.equal(1) ;
            eh._rootStack.bar.go.__stack.on[0].fn.should.equal(cbs.cb1) ;
            eh._rootStack.bar.go.__stack.on[0].isOne.should.be.true;
        }) ;

        it("with a correct callback count", function(){
            eh.countCallbacks('bar.foo').should.equal(2) ;
            eh.countCallbacks('bar.foo', { eventMode: EventHub.EVENT_MODE.BOTH }).should.equal(1) ;
            eh.countCallbacks('bar.foo', { eventMode: EventHub.EVENT_MODE.CAPTURING }).should.equal(1) ;
            eh.countCallbacks('bar.foo', { eventMode: EventHub.EVENT_MODE.BUBBLING }).should.equal(1) ;

            eh.countCallbacks().should.equal(10) ;
            eh.countCallbacks('bar', { traverse: true}).should.equal(10) ;
            eh.countCallbacks('bar', { traverse: true, eventMode: EventHub.EVENT_MODE.BOTH }).should.equal(4) ;
            eh.countCallbacks('bar', { traverse: true, eventMode: EventHub.EVENT_MODE.CAPTURING }).should.equal(4) ;
            eh.countCallbacks('bar', { traverse: true, eventMode: EventHub.EVENT_MODE.BUBBLING }).should.equal(4) ;
        }) ;

        it("and be able to remove callbacks using 'off'", function() {
            const on = eh._rootStack.bar.foo.__stack.on ;

            eh.off('bar.foo', cbs.cb1, {isOne: true} ).should.equal(1) ;
            eh.off('bar.foo', cbs.cb1, {isOne: true} ).should.equal(0) ;
            eh.off('bar.foo', cbs.cb1).should.equal(1) ;
            eh.off('bar.foo', cbs.cb2).should.equal(0) ;
            eh.off('bar.foo', cbs.cb2, { eventMode: EventHub.EVENT_MODE.BOTH }).should.equal(1) ;
            eh.off('bar.foo', cbs.cb3, { isOne: false, eventMode: EventHub.EVENT_MODE.CAPTURING }).should.equal(1) ;
            eh.off('bar.foo', cbs.cb3, { isOne: false, eventMode: EventHub.EVENT_MODE.BUBBLING }).should.equal(0) ;
            eh.off('bar.foo', cbs.cb4, { isOne: true, eventMode: EventHub.EVENT_MODE.BUBBLING }).should.equal(1) ;
            on.length.should.equal(0) ;

            eh.off('bar', cbs.cb1, {traverse:true}).should.equal(6) ;
            eh.off('bar', {traverse:true}).should.equal(2) ;
            eh.off('bar', {traverse:true, eventMode: EventHub.EVENT_MODE.BUBBLING }).should.equal(3) ;
            eh.off('bar', cbs.cb3, {traverse:true, eventMode: EventHub.EVENT_MODE.CAPTURING }).should.equal(3) ;
        }) ;
        it("and possible to disable/enable events", function(){
            eh._rootStack.bar.foo.__stack.disabled.should.be.false;
            eh.isDisabled('bar.foo').should.be.false;
            eh.disable('bar.foo').should.equal(eh);
            eh._rootStack.bar.foo.__stack.disabled.should.be.true;
            eh.isDisabled('bar.foo').should.be.true ;
            eh.enable('bar.foo').should.equal(eh) ;
            eh._rootStack.bar.foo.__stack.disabled.should.be.false;
            eh.isDisabled('bar.foo').should.be.false;

            eh.disable('bar.foo', {traverse: true}).should.equal(eh) ;
            eh._rootStack.bar.__stack.disabled.should.be.false;
            eh._rootStack.bar.foo.__stack.disabled.should.be.true;
            eh._rootStack.bar.foo.foo3.__stack.disabled.should.be.true;
        }) ;

        describe("and triggers them", () => {
            it("without an event mode defined", () => {
                eh.trigger('bar.foo', []).should.equal(5) ;
                mySpy1.should.have.been.calledWith(['cb2', 'cb3', 'cb1', 'cb1', 'cb4']);
                eh._rootStack.bar.__stack.on.length.should.equal(6) ;
                eh.trigger('bar.foo').should.equal(3) ;
            }) ;
            it("in the Capturing event mode", () => {
                eh.trigger('bar.foo', [], {eventMode: EventHub.EVENT_MODE.CAPTURING }).should.equal(4) ;
                mySpy1.should.have.been.calledWith(['cb2', 'cb3', 'cb1', 'cb1']);
            });
            it("in the Bubbling event mode", function(){
                eh.trigger('bar.foo', [], {eventMode: EventHub.EVENT_MODE.BUBBLING }).should.equal(4) ;
                mySpy1.should.have.been.calledWith(['cb1', 'cb1', 'cb2', 'cb4']);
            }) ;
            it("in the Capturing and Bubbling event mode (BOTH)", function(){
                eh.trigger('bar.foo', [], {eventMode: EventHub.EVENT_MODE.BOTH }).should.equal(5) ;
                mySpy1.should.have.been.calledWith(['cb2', 'cb3', 'cb1', 'cb1', 'cb4']);
                eh.trigger('bar.foo', [], {eventMode: EventHub.EVENT_MODE.BOTH }).should.equal(3) ;
                mySpy1.should.have.been.calledWith(['cb3', 'cb1', 'cb4']);
            }) ;
            it("with the 'traverse' option", function(){
                eh.trigger('bar.foo', [], {traverse: true}).should.equal(7) ;
                mySpy1.should.have.been.calledWith(['cb2', 'cb3', 'cb1', 'cb1', 'cb1', 'cb1', 'cb4']);
            }) ;
            it("when the event is disabled", function(){
                eh.disable('bar.foo') ;
                eh.trigger('bar.foo').should.equal(0) ;
                eh.trigger('bar.foo', {traverse: true}).should.equal(0) ;
                eh.trigger('bar.foo.foo3', []).should.equal(5) ;
                mySpy1.should.have.been.calledWith(['cb2', 'cb3', 'cb1', 'cb1', 'cb4']);

            }) ;
            it("and validate the trigger count", function(){
                eh.trigger('bar.foo') ;
                eh.countTriggers().should.equal(1) ;
                eh.countTriggers('bar').should.equal(0) ;
                eh.countTriggers('bar', {traverse: true}).should.equal(1) ;
                eh.countTriggers('bar.foo').should.equal(1) ;
                eh.countTriggers('bar.foo', {traverse: true}).should.equal(1) ;

                eh.trigger('bar.foo.foo3') ;
                eh.countTriggers().should.equal(2) ;
                eh.countTriggers('bar').should.equal(0) ;
                eh.countTriggers('bar', {traverse: true}).should.equal(2) ;
                eh.countTriggers('bar.foo').should.equal(1) ;
                eh.countTriggers('bar.foo', {traverse: true}).should.equal(2) ;
                eh.countTriggers('bar.foo.foo3').should.equal(1) ;
                eh.countTriggers('bar.foo.foo3', {traverse: true}).should.equal(1) ;
            });
        });
    });
});
