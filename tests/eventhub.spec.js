describe("window.EventHub", function() {

    // globals
    var eh
            , cbs = {
                cb1: function(data) {
                    if ( data && Array.isArray(data)  )
                        data.push('cb1') ;
                }
                , cb2: function(data) {
                    if ( data && Array.isArray(data)  )
                        data.push('cb2') ;
                }
                , cb3: function(data) {
                    if ( data && Array.isArray(data)  )
                        data.push('cb3') ;
                }
                , cb4: function(data) {
                    if ( data && Array.isArray(data)  )
                        data.push('cb4') ;
                }
            } ;


    // mock some functions
    beforeEach(function() {
        // create DI
        eh = new window.EventHub() ;

        // Mocking
        spyOn(cbs, 'cb1').andCallThrough() ;
        spyOn(cbs, 'cb2').andCallThrough() ;
        spyOn(cbs, 'cb3').andCallThrough() ;
        spyOn(cbs, 'cb4').andCallThrough() ;

        var on = [
            { fn: cbs.cb1,   isOne: false }
            , { fn: cbs.cb1, isOne: true  }
            , { fn: cbs.cb2, isOne: false }
            , { fn: cbs.cb2, isOne: true  }
            , { fn: cbs.cb2, isOne: true,  eventMode: window.EventHub.EVENT_MODE.BOTH      }
            , { fn: cbs.cb3, isOne: false, eventMode: window.EventHub.EVENT_MODE.CAPTURING }
            , { fn: cbs.cb4, isOne: false, eventMode: window.EventHub.EVENT_MODE.BUBBLING  }
        ] ;

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

    // javascript should work (syntax check)
    it("should exist", function() {
        expect(window.EventHub).toBeDefined() ;   // the class
        expect(eh).toBeDefined() ;              // the instance
    });
    it("should handle triggers for invalid event names", function() {
        expect(eh.trigger("go")).toEqual(0) ;
        expect(eh.trigger("forum.go")).toEqual(0) ;
        expect(eh.trigger()).toEqual(0) ;
    }) ;
    it("should generate unique event names", function() {
        expect(eh.generateUniqueEventName()).toEqual('--eh--0') ;
        expect(eh.generateUniqueEventName()).toEqual('--eh--1') ;
        expect(eh.generateUniqueEventName()).toEqual('--eh--2') ;
    }) ;

    // events without a namespace
    describe("should register callbacks for simple events (not namespaced)", function() {
        describe("using 'on'", function(){
            it("without options", function() {
                eh.on("go", cbs.cb1) ;
                eh.on("go", cbs.cb2) ;
                expect(eh._rootStack.go.__stack.on.length).toEqual(2) ;
                expect(eh._rootStack.go.__stack.disabled).toBeFalsy() ;             // check if stack is created correctly
                expect(eh._rootStack.go.__stack.on[0].fn).toEqual(cbs.cb1) ;        // check if callback is registered correctly
                expect(eh._rootStack.go.__stack.on[0].eventMode).toBeUndefined() ;
                expect(eh._rootStack.go.__stack.on[0].isOne).toBeFalsy() ;
                expect(eh._rootStack.go.__stack.on[1].fn).toEqual(cbs.cb2) ;
            }) ;
            it("with the 'eventMode' option", function(){
                eh.on("go", cbs.cb1) ;
                eh.on("go", cbs.cb2, { eventMode: window.EventHub.EVENT_MODE.BOTH}) ;
                eh.on("go", cbs.cb3, { eventMode: window.EventHub.EVENT_MODE.CAPTURING}) ;
                eh.on("go", cbs.cb4, { eventMode: window.EventHub.EVENT_MODE.BUBBLING}) ;

                expect(eh._rootStack.go.__stack.on.length).toEqual(4) ;

                expect(eh._rootStack.go.__stack.on[0].fn).toEqual(cbs.cb1) ;
                expect(eh._rootStack.go.__stack.on[0].eventMode).toBeUndefined() ;

                expect(eh._rootStack.go.__stack.on[1].fn).toEqual(cbs.cb2) ;
                expect(eh._rootStack.go.__stack.on[1].eventMode).toEqual(window.EventHub.EVENT_MODE.BOTH) ;

                expect(eh._rootStack.go.__stack.on[2].fn).toEqual(cbs.cb3) ;
                expect(eh._rootStack.go.__stack.on[2].eventMode).toEqual(window.EventHub.EVENT_MODE.CAPTURING) ;

                expect(eh._rootStack.go.__stack.on[3].fn).toEqual(cbs.cb4) ;
                expect(eh._rootStack.go.__stack.on[3].eventMode).toEqual(window.EventHub.EVENT_MODE.BUBBLING) ;
            }) ;
            it("with the 'prepend' option", function(){
                expect(eh.on("go", cbs.cb1)).toBeTruthy() ;
                expect(eh.on("go", cbs.cb2, { prepend: false})).toBeTruthy() ;
                expect(eh.on("go", cbs.cb3, { prepend: true })).toBeTruthy() ;
                expect(eh.on("go", cbs.cb4, { prepend: true })).toBeTruthy() ;

                expect(eh._rootStack.go.__stack.on.length).toEqual(4) ;
                expect(eh._rootStack.go.__stack.on[0].fn).toEqual(cbs.cb4) ;
                expect(eh._rootStack.go.__stack.on[1].fn).toEqual(cbs.cb3) ;
                expect(eh._rootStack.go.__stack.on[2].fn).toEqual(cbs.cb1) ;
                expect(eh._rootStack.go.__stack.on[3].fn).toEqual(cbs.cb2) ;
            }) ;
            it("with 'allowMultiple' set to TRUE", function(){
                expect(eh.allowMultiple).toBeTruthy() ;                                 // by default this value is set to TRUE
                expect(eh.setAllowMultiple(true)).toBe(eh) ;                            // chainable
                expect(eh.on( "go", cbs.cb1)).toBeTruthy() ;                           // default behavior is to accept
                expect(eh.on( "go", cbs.cb1)).toBeTruthy() ;                           // the same callback multiple times
                expect(eh._rootStack.go.__stack.on.length).toEqual(2) ;                // check the internal stack
            }) ;
            it("with 'allowMultiple' set to FALSE", function(){
                expect(eh.setAllowMultiple(false)).toBe(eh) ;                           // chainable
                expect(eh.on( "go", cbs.cb2)).toBeTruthy() ;
                expect(eh.on( "go", cbs.cb2)).toBeFalsy() ;                            // nope, its registered already
                expect(eh.on( "go", cbs.cb2, {})).toBeFalsy() ;                        // idem
                expect(eh.on( "go", cbs.cb2, {eventMode: window.EventHub.EVENT_MODE.CAPTURING})).toBeTruthy() ;      // accepted, because it has an event-mode defined
                expect(eh.on( "go", cbs.cb2, {eventMode: window.EventHub.EVENT_MODE.BOTH})).toBeFalsy() ;            // falsy, because 'BOTH' includes 'CAPTURING' too
                expect(eh.on( "go", cbs.cb2, {eventMode: window.EventHub.EVENT_MODE.CAPTURING})).toBeFalsy() ;       // nope
                expect(eh.on( "go", cbs.cb2, {eventMode: window.EventHub.EVENT_MODE.BUBBLING})).toBeTruthy() ;       // different event mode

                expect(eh.on( "go", cbs.cb3, {eventMode: window.EventHub.EVENT_MODE.BOTH})).toBeTruthy() ;
                expect(eh.on( "go", cbs.cb3, {eventMode: window.EventHub.EVENT_MODE.CAPTURING})).toBeFalsy() ;       // 'BOTH' includes 'CAPTURING'
                expect(eh.on( "go", cbs.cb3, {eventMode: window.EventHub.EVENT_MODE.BUBBLING})).toBeFalsy() ;        // and 'BUBBLING'
                expect(eh.on( "go", cbs.cb3)).toBeTruthy() ;                                                       // true because no event mode is defined
            }) ;
        }) ;
        it("using 'one'", function(){
            eh.one("go", cbs.cb1) ;
            expect(eh._rootStack.go.__stack.on.length).toEqual(1) ;
            expect(eh._rootStack.go.__stack.on[0].fn).toEqual(cbs.cb1) ;
            expect(eh._rootStack.go.__stack.on[0].isOne).toBeTruthy() ;
        }) ;
        it("with a correct callback count", function(){
            expect(eh.countCallbacks('bar')).toEqual(4) ;
            expect(eh.countCallbacks('bar', { eventMode: window.EventHub.EVENT_MODE.BOTH })).toEqual(1) ;
            expect(eh.countCallbacks('bar', { eventMode: window.EventHub.EVENT_MODE.CAPTURING })).toEqual(1) ;
            expect(eh.countCallbacks('bar', { eventMode: window.EventHub.EVENT_MODE.BUBBLING })).toEqual(1) ;
        }) ;
        it("and be able to remove callbacks using 'off'", function() {
            var on = eh._rootStack.bar.__stack.on ;

            expect(eh.off('bar', cbs.cb1)).toEqual(2) ;
            expect(on[0].fn).toBe(cbs.cb2) ;
            //expect(eh.off('bar', cbs.cb2)).toEqual(2) ;
            //expect(on[0].fn).toBe(cbs.cb2) ;
            expect(eh.off('bar', cbs.cb2, { eventMode: window.EventHub.EVENT_MODE.BOTH })).toEqual(1) ;
            expect(eh.off('bar', cbs.cb3, { isOne: false, eventMode: window.EventHub.EVENT_MODE.CAPTURING })).toEqual(1) ;
            expect(eh.off('bar', cbs.cb4, { isOne: true, eventMode: window.EventHub.EVENT_MODE.BUBBLING })).toEqual(0) ;
            expect(eh.off('bar', cbs.cb4, { isOne: false, eventMode: window.EventHub.EVENT_MODE.BUBBLING })).toEqual(1) ;
            expect(on.length).toEqual(2) ;
            expect(eh.off('bar')).toEqual(2) ;

        }) ;
        it("and possible to disable/enable events", function(){
            expect(eh._rootStack.bar.__stack.disabled).toBeFalsy() ;
            expect(eh.isDisabled('bar')).toBeFalsy() ;
            expect(eh.disable('bar')).toBe(eh) ;
            expect(eh._rootStack.bar.__stack.disabled).toBeTruthy() ;
            expect(eh.isDisabled('bar')).toBeTruthy() ;
            expect(eh.enable('bar')).toBe(eh) ;
            expect(eh._rootStack.bar.__stack.disabled).toBeFalsy() ;
            expect(eh.isDisabled('bar')).toBeFalsy() ;
        }) ;
        describe("and triggers them", function(){
            it("without an event mode", function(){
                expect(eh.trigger('bar')).toEqual(4) ;
                expect(eh._rootStack.bar.__stack.on.length).toEqual(5) ; // 2 callbacks should have been removed
                expect(eh.trigger('bar')).toEqual(2) ;
            }) ;
            it("in the Capturing event mode", function(){
                expect(eh.trigger('bar', {eventMode: window.EventHub.EVENT_MODE.CAPTURING })).toEqual(4) ;
                expect(cbs.cb3).not.toHaveBeenCalled() ;
            });
            it("in the Bubbling event mode", function(){
                expect(eh.trigger('bar', {eventMode: window.EventHub.EVENT_MODE.BUBBLING })).toEqual(4) ;
                expect(cbs.cb3).not.toHaveBeenCalled() ;
            }) ;
            it("in the Capturing and Bubbling event mode (BOTH)", function(){
                expect(eh.trigger('bar', {eventMode: window.EventHub.EVENT_MODE.BOTH })).toEqual(4) ;
                expect(cbs.cb3).not.toHaveBeenCalled() ;
            }) ;
            it("when the event is disabled", function(){
                eh.disable('bar') ;
                expect(eh.trigger('bar')).toEqual(0) ;
            }) ;

            it("and validate the trigger count", function(){
                eh.trigger('bar') ;
                expect(eh.countTriggers()).toEqual(1) ;
                eh.trigger('bar') ;
                expect(eh.countTriggers()).toEqual(2) ;
            });
        });
    });

    // events without a namespace
    describe("should register callbacks for namespaced events", function() {
        beforeEach(function(){ // NOTE That the event 'bar' is already set by the first 'beforeEach'!
            var onFoo1 = [
                        { fn: cbs.cb1,   isOne: false }
                        , { fn: cbs.cb1,   isOne: true }
                        , { fn: cbs.cb2, isOne: true, eventMode: window.EventHub.EVENT_MODE.BOTH }
                        , { fn: cbs.cb3, isOne: false, eventMode: window.EventHub.EVENT_MODE.CAPTURING }
                        , { fn: cbs.cb4, isOne: true, eventMode: window.EventHub.EVENT_MODE.BUBBLING }
                    ]
                    , onFoo2 = [
                        { fn: cbs.cb1,   isOne: true }
                        , { fn: cbs.cb1,   isOne: false }
                        , { fn: cbs.cb2, isOne: true, eventMode: window.EventHub.EVENT_MODE.BOTH }
                        , { fn: cbs.cb3, isOne: false, eventMode: window.EventHub.EVENT_MODE.CAPTURING }
                        , { fn: cbs.cb4, isOne: true, eventMode: window.EventHub.EVENT_MODE.BUBBLING }
                    ]
                    , onFoo3 = [
                        { fn: cbs.cb1,   isOne: true }
                        , { fn: cbs.cb1,   isOne: false }
                        , { fn: cbs.cb2, isOne: true, eventMode: window.EventHub.EVENT_MODE.BOTH }
                        , { fn: cbs.cb3, isOne: false, eventMode: window.EventHub.EVENT_MODE.CAPTURING }
                        , { fn: cbs.cb4, isOne: true, eventMode: window.EventHub.EVENT_MODE.BUBBLING }
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
                expect(eh._rootStack.bar.go).toBeDefined() ;
                expect(eh._rootStack.bar.go.__stack.on.length).toEqual(2) ;
                expect(eh._rootStack.bar.go.__stack.on[0].fn).toEqual(cbs.cb1) ;
                expect(eh._rootStack.bar.go.__stack.on[1].fn).toEqual(cbs.cb2) ;
            }) ;
            it("with the 'eventMode' option", function(){
                eh.on("bar.go", cbs.cb1) ;
                eh.on("bar.go", cbs.cb2, { eventMode: window.EventHub.EVENT_MODE.BOTH}) ;
                eh.on("bar.go", cbs.cb3, { eventMode: window.EventHub.EVENT_MODE.CAPTURING}) ;
                eh.on("bar.go", cbs.cb4, { eventMode: window.EventHub.EVENT_MODE.BUBBLING}) ;

                expect(eh._rootStack.bar.go.__stack.on.length).toEqual(4) ;

                expect(eh._rootStack.bar.go.__stack.on[0].fn).toEqual(cbs.cb1) ;
                expect(eh._rootStack.bar.go.__stack.on[0].eventMode).toBeUndefined() ;

                expect(eh._rootStack.bar.go.__stack.on[1].fn).toEqual(cbs.cb2) ;
                expect(eh._rootStack.bar.go.__stack.on[1].eventMode).toEqual(window.EventHub.EVENT_MODE.BOTH) ;

                expect(eh._rootStack.bar.go.__stack.on[2].fn).toEqual(cbs.cb3) ;
                expect(eh._rootStack.bar.go.__stack.on[2].eventMode).toEqual(window.EventHub.EVENT_MODE.CAPTURING) ;

                expect(eh._rootStack.bar.go.__stack.on[3].fn).toEqual(cbs.cb4) ;
                expect(eh._rootStack.bar.go.__stack.on[3].eventMode).toEqual(window.EventHub.EVENT_MODE.BUBBLING) ;
            }) ;
            it("with the 'prepend' option", function(){
                expect(eh.on("bar.go", cbs.cb1)).toBeTruthy() ;
                expect(eh.on("bar.go", cbs.cb2, { prepend: false})).toBeTruthy() ;
                expect(eh.on("bar.go", cbs.cb3, { prepend: true })).toBeTruthy() ;
                expect(eh.on("bar.go", cbs.cb4, { prepend: true })).toBeTruthy() ;

                expect(eh._rootStack.bar.go.__stack.on.length).toEqual(4) ;
                expect(eh._rootStack.bar.go.__stack.on[0].fn).toEqual(cbs.cb4) ;
                expect(eh._rootStack.bar.go.__stack.on[1].fn).toEqual(cbs.cb3) ;
                expect(eh._rootStack.bar.go.__stack.on[2].fn).toEqual(cbs.cb1) ;
                expect(eh._rootStack.bar.go.__stack.on[3].fn).toEqual(cbs.cb2) ;
            }) ;
            it("with 'allowMultiple' set to TRUE", function(){
                expect(eh.allowMultiple).toBeTruthy() ;                                 // by default this value is set to TRUE
                expect(eh.setAllowMultiple(true)).toBe(eh) ;                            // chainable
                expect(eh.on( "bar.go", cbs.cb1)).toBeTruthy() ;                        // default behavior is to accept
                expect(eh.on( "bar.go", cbs.cb1)).toBeTruthy() ;                        // the same callback multiple times
                expect(eh._rootStack.bar.go.__stack.on.length).toEqual(2) ;             // check the internal stack
            }) ;
            it("with 'allowMultiple' set to FALSE", function(){
                expect(eh.setAllowMultiple(false)).toBe(eh) ;                           // chainable
                expect(eh.on( "bar.go", cbs.cb2)).toBeTruthy() ;
                expect(eh.on( "bar.go", cbs.cb2)).toBeFalsy() ;                         // nope, its registered already
                expect(eh.on( "bar.go", cbs.cb2, {})).toBeFalsy() ;                     // idem
                expect(eh.on( "bar.go", cbs.cb2, {eventMode: window.EventHub.EVENT_MODE.CAPTURING})).toBeTruthy() ;      // accepted, because it has an event-mode defined
                expect(eh.on( "bar.go", cbs.cb2, {eventMode: window.EventHub.EVENT_MODE.BOTH})).toBeFalsy() ;            // falsy, because 'BOTH' includes 'CAPTURING' too
                expect(eh.on( "bar.go", cbs.cb2, {eventMode: window.EventHub.EVENT_MODE.CAPTURING})).toBeFalsy() ;       // nope
                expect(eh.on( "bar.go", cbs.cb2, {eventMode: window.EventHub.EVENT_MODE.BUBBLING})).toBeTruthy() ;       // different event mode

                expect(eh.on( "bar.go", cbs.cb3, {eventMode: window.EventHub.EVENT_MODE.BOTH})).toBeTruthy() ;
                expect(eh.on( "bar.go", cbs.cb3, {eventMode: window.EventHub.EVENT_MODE.CAPTURING})).toBeFalsy() ;       // 'BOTH' includes 'CAPTURING'
                expect(eh.on( "bar.go", cbs.cb3, {eventMode: window.EventHub.EVENT_MODE.BUBBLING})).toBeFalsy() ;        // and 'BUBBLING'
                expect(eh.on( "bar.go", cbs.cb3)).toBeTruthy() ;                                                       // true because no event mode is defined
            }) ;
        }) ;
        it("using 'one'", function(){
            eh.one("bar.go", cbs.cb1) ;
            expect(eh._rootStack.bar.go.__stack.on.length).toEqual(1) ;
            expect(eh._rootStack.bar.go.__stack.on[0].fn).toEqual(cbs.cb1) ;
            expect(eh._rootStack.bar.go.__stack.on[0].isOne).toBeTruthy() ;
        }) ;
        it("with a correct callback count", function(){
            expect(eh.countCallbacks('bar.foo')).toEqual(2) ;
            expect(eh.countCallbacks('bar.foo', { eventMode: window.EventHub.EVENT_MODE.BOTH })).toEqual(1) ;
            expect(eh.countCallbacks('bar.foo', { eventMode: window.EventHub.EVENT_MODE.CAPTURING })).toEqual(1) ;
            expect(eh.countCallbacks('bar.foo', { eventMode: window.EventHub.EVENT_MODE.BUBBLING })).toEqual(1) ;

            expect(eh.countCallbacks()).toEqual(10) ;
            expect(eh.countCallbacks('bar', {traverse: true})).toEqual(10) ;
            expect(eh.countCallbacks('bar', { traverse: true, eventMode: window.EventHub.EVENT_MODE.BOTH })).toEqual(4) ;
            expect(eh.countCallbacks('bar', { traverse: true, eventMode: window.EventHub.EVENT_MODE.CAPTURING })).toEqual(4) ;
            expect(eh.countCallbacks('bar', { traverse: true, eventMode: window.EventHub.EVENT_MODE.BUBBLING })).toEqual(4) ;
        }) ;

        it("and be able to remove callbacks using 'off'", function() {
            var on = eh._rootStack.bar.foo.__stack.on ;

            expect(eh.off('bar.foo', cbs.cb1, {isOne: true} )).toEqual(1) ;
            expect(eh.off('bar.foo', cbs.cb1, {isOne: true} )).toEqual(0) ;
            expect(eh.off('bar.foo', cbs.cb1)).toEqual(1) ;
            expect(on[0].fn).toBe(cbs.cb2) ;
            expect(eh.off('bar.foo', cbs.cb2)).toEqual(0) ;
            expect(eh.off('bar.foo', cbs.cb2, { eventMode: window.EventHub.EVENT_MODE.BOTH })).toEqual(1) ;
            expect(eh.off('bar.foo', cbs.cb3, { isOne: false, eventMode: window.EventHub.EVENT_MODE.CAPTURING })).toEqual(1) ;
            expect(eh.off('bar.foo', cbs.cb3, { isOne: false, eventMode: window.EventHub.EVENT_MODE.BUBBLING })).toEqual(0) ;
            expect(eh.off('bar.foo', cbs.cb4, { isOne: true, eventMode: window.EventHub.EVENT_MODE.BUBBLING })).toEqual(1) ;
            expect(on.length).toEqual(0) ;

            expect(eh.off('bar', cbs.cb1, {traverse:true})).toEqual(6) ;
            expect(eh.off('bar', {traverse:true})).toEqual(2) ;
            expect(eh.off('bar', {traverse:true, eventMode: window.EventHub.EVENT_MODE.BUBBLING })).toEqual(3) ;
            expect(eh.off('bar', cbs.cb3, {traverse:true, eventMode: window.EventHub.EVENT_MODE.CAPTURING })).toEqual(3) ;
        }) ;
        it("and possible to disable/enable events", function(){
            expect(eh._rootStack.bar.foo.__stack.disabled).toBeFalsy() ;
            expect(eh.isDisabled('bar.foo')).toBeFalsy() ;
            expect(eh.disable('bar.foo')).toBe(eh) ;
            expect(eh._rootStack.bar.foo.__stack.disabled).toBeTruthy() ;
            expect(eh.isDisabled('bar.foo')).toBeTruthy() ;
            expect(eh.enable('bar.foo')).toBe(eh) ;
            expect(eh._rootStack.bar.foo.__stack.disabled).toBeFalsy() ;
            expect(eh.isDisabled('bar.foo')).toBeFalsy() ;

            expect(eh.disable('bar.foo', {traverse: true})).toBe(eh) ;
            expect(eh._rootStack.bar.__stack.disabled).toBeFalsy() ;
            expect(eh._rootStack.bar.foo.__stack.disabled).toBeTruthy() ;
            expect(eh._rootStack.bar.foo.foo3.__stack.disabled).toBeTruthy() ;

        }) ;

        describe("and triggers them", function(){
            it("without an event mode defined", function(){
                expect(eh.trigger('bar.foo', [])).toEqual(5) ;
                expect(cbs.cb1).toHaveBeenCalledWith(["cb2", "cb3", "cb1", "cb1", "cb4"]);
                expect(eh._rootStack.bar.__stack.on.length).toEqual(6) ;
                expect(eh.trigger('bar.foo')).toEqual(3) ;
            }) ;
            it("in the Capturing event mode", function(){
                expect(eh.trigger('bar.foo', [], {eventMode: window.EventHub.EVENT_MODE.CAPTURING })).toEqual(4) ;
                expect(cbs.cb1).toHaveBeenCalledWith(["cb2", "cb3", "cb1", "cb1"]);
            });
            it("in the Bubbling event mode", function(){
                expect(eh.trigger('bar.foo', [], {eventMode: window.EventHub.EVENT_MODE.BUBBLING })).toEqual(4) ;
                expect(cbs.cb1).toHaveBeenCalledWith(["cb1", "cb1", "cb2", "cb4"]);
            }) ;
            it("in the Capturing and Bubbling event mode (BOTH)", function(){
                expect(eh.trigger('bar.foo', [], {eventMode: window.EventHub.EVENT_MODE.BOTH })).toEqual(5) ;
                expect(cbs.cb1).toHaveBeenCalledWith(["cb2", "cb3", "cb1", "cb1", "cb4"]);
                expect(eh.trigger('bar.foo', [], {eventMode: window.EventHub.EVENT_MODE.BOTH })).toEqual(3) ;
                expect(cbs.cb1).toHaveBeenCalledWith(["cb3", "cb1", "cb4"]);
            }) ;
            it("with the 'traverse' option", function(){
                expect(eh.trigger('bar.foo', [], {traverse: true})).toEqual(7) ;
                expect(cbs.cb1).toHaveBeenCalledWith(["cb2", "cb3", "cb1", "cb1", "cb1", "cb1", "cb4"]);
            }) ;
            it("when the event is disabled", function(){
                eh.disable('bar.foo') ;
                expect(eh.trigger('bar.foo')).toEqual(0) ;
                expect(eh.trigger('bar.foo'), {traverse: true}).toEqual(0) ;
                expect(eh.trigger('bar.foo.foo3', [])).toEqual(5) ;
                expect(cbs.cb1).toHaveBeenCalledWith(["cb2", "cb3", "cb1", "cb1", "cb4"]);

            }) ;
            it("and validate the trigger count", function(){
                eh.trigger('bar.foo') ;
                expect(eh.countTriggers()).toEqual(1) ;
                expect(eh.countTriggers('bar')).toEqual(0) ;
                expect(eh.countTriggers('bar', {traverse: true})).toEqual(1) ;
                expect(eh.countTriggers('bar.foo')).toEqual(1) ;
                expect(eh.countTriggers('bar.foo', {traverse: true})).toEqual(1) ;
                eh.trigger('bar.foo.foo3') ;
                expect(eh.countTriggers()).toEqual(2) ;
                expect(eh.countTriggers('bar')).toEqual(0) ;
                expect(eh.countTriggers('bar', {traverse: true})).toEqual(2) ;
                expect(eh.countTriggers('bar.foo')).toEqual(1) ;
                expect(eh.countTriggers('bar.foo', {traverse: true})).toEqual(2) ;
                expect(eh.countTriggers('bar.foo.foo3')).toEqual(1) ;
                expect(eh.countTriggers('bar.foo.foo3', {traverse: true})).toEqual(1) ;
            });
        });
    });
});
