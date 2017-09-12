const DEFAULTS = {
    /**
     * The traversal of event namespaces can be split into two different phase :
     *
     *     CAPTURING
     *     BUBBLING
     *
     * For example, if <tt>bar.foo</tt> is triggered, CAPTURING and BUBBLING do the opposite and are executed
     * one after the other as follows
     *
     *                    | |                                     / \
     *     ---------------| |-----------------     ---------------| |-----------------
     *     | bar          | |                |     | bar          | |                |
     *     |   -----------| |-----------     |     |   -----------| |-----------     |
     *     |   |bar.foo   \ /          |     |     |   |bar.foo   | |          |     |
     *     |   -------------------------     |     |   -------------------------     |
     *     |        Event CAPTURING          |     |        Event BUBBLING           |
     *     -----------------------------------     -----------------------------------
     *
     * first the events propagates in the CAPTURING phase and then in BUBBLING phase
     *
     *
     *                                   | |  / \
     *                  -----------------| |--| |-----------------
     *                  | bar            | |  | |                |
     *                  |   -------------| |--| |-----------     |
     *                  |   |bar.foo     \ /  | |          |     |
     *                  |   --------------------------------     |
     *                  |               event model              |
     *                  ------------------------------------------
     *
     *     eventHub.on('bar.foo', myFunc1) ;
     *     eventHub.on('bar', myFunc2, { eventMode: EventHub.EVENT_MODE.CAPTURING }) ;
     *     eventHub.on('bar', myFunc3, { eventMode: EventHub.EVENT_MODE.BUBBLING }) ;
     *     eventHub.on('bar', myFunc4, { eventMode: EventHub.EVENT_MODE.BOTH }) ;     // myFunc4 is added to both phases
     *     eventHub.trigger('bar.foo') ;
     *
     * Callback execution order:
     *
     *     myFunc2
     *     myFunc4
     *     myFunc1
     *     myFunc3
     *     myFunc4
     *
     * @property {Object} EVENT_MODE
     * @static
     */
    PHASES: {
        /**
         * Defines the capturing event phase
         * @property {String} PHASES.CAPTURING
         * @static
         */
        CAPTURING: 'capture'           // event goes from root to target
        /**
         * Defines the bubbling event phase
         * @property {String} PHASES.BUBBLING
         * @static
         */
        , BUBBLING: 'bubble'            // event goes from target to root
        /**
         * Represent both capturing and bubbling event phase
         * @property {String} PHASES.BOTH
         * @static
         */
        , BOTH: 'both'
    }
    /**
     * Default setting, used to determine if the same callback can be registered multiple times to the same event
     * @private
     */, ALLOW_MULTIPLE: true
};

/**
 * EventHub-XXL facilitates event-based communication between different parts of an application (Event driven system).
 * Events can be namespaced, enabling the execution of groups of callbacks.
 * Namespaces are separated by a dot, like: `bar.foo1`, `bar.foo2`, `bar.bar1.foo1`.
 *
 * Although there is not much difference between an event-namespace and the event-name (last part),
 * but the namespace will be travered by the event phases described above.
 */
export class EventHub {
    /**
     * @readonly
     * @enum {string}
     * @property {string} BUBBLING Event goes from child to parent
     * @property {string} CAPTURING Event goes from parent to child
     */
    static PHASES = DEFAULTS.PHASES;

    /**
    * @constructor
    * @param {object} [options] configuration parameters
    * @param {boolean} [options.allowMultiple=TRUE] accept multiple registrations of the same function for the same event
    */
    constructor(options = {}) {
        Object.defineProperty(this, '_rootStack',
            {
                value: {__stack: {disabled: false, triggers: 0, on: [], one: []}}, enumerable: false // hide it
            }
        );
        Object.defineProperty(this, '_eventNameIndex',
            {
                value: 0, enumerable: false     // hide it
                , writable: true                // otherwise ++ will not work
            }
        );

        this.allowMultiple = typeof options.allowMultiple === 'boolean' ? options.allowMultiple : DEFAULTS.ALLOW_MULTIPLE;
    }

    /**
     * Simulates `trigger`, `on`, `one` and `off`, meaning no callbacks are actually triggered,
     * added or removed.
     *
     * @example
     *
     * isAdded = eh.fake.on('a.b', myFunc);
     * isAdded = eh.fake.one('a.b', myFunc);
     * count   = eh.fake.off('a.b', myFunc);
     * count   = eh.fake.trigger('a.b');
     *
     * @returns {}
     */
    get fake() {
        return {
            trigger: (event, data, options) => {
                return this.trigger(event, data, options || data, () => {});
            },
            on: () => {
                // TODO
            },
            one: () => {

            },
            off: () => {
                // TODO
            }
        }
    }

    /**
     * Generates an unique event name
     *
     * @return {string} unique event name
     */
    generateUniqueEventName() {
        return '--eh--' + this._eventNameIndex++;      // first event-name will be: --eh--0
    }

    /**
     * By default it is allowed to add a function multiple times to the same event. Set to `false` to disabled this behaviour
     *
     * @chainable
     * @param {boolean} state accept multiple registrations
     */
    setAllowMultiple(state) {
        this.allowMultiple = state;
        return this;
    }

    /**
     * Enables a disabled event. See {@link EventHub#disable}
     *
     * @chainable
     * @param {string} eventName name of the event
     * @param {object} [options] configuration
     * @param {boolean} [options.traverse=false] disable nested events
     */
    enable(eventName, options = {}) {
        return setDisableEvent.call(this, eventName, false, options);
    }

    /**
     * Disable an event, meaning all triggers are ignored
     *
     * @example
     *
     * eventHub.on('bar', callback1, { eventMode: EventHub.EVENT_MODE.BOTH }) ;
     * eventHub.on('bar', callback2) ;
     * eventHub.on('bar.foo', callback3, { eventMode: EventHub.EVENT_MODE.BOTH }) ;
     * eventHub.on('bar.foo', callback4) ;
     * eventHub.on('bar.foo.do', callback5 { eventMode: EventHub.EVENT_MODE.BOTH }) ;
     * eventHub.on('bar.foo.do', callback6) ;
     *
     * eventHub.disable('bar') ;
     *
     * eventHub.trigger('bar')          // -> no callbacks called
     * eventHub.trigger('bar.foo')      // -> only callback4 is called
     * eventHub.trigger('bar.foo.do')   // -> callback execution order: callback3, callback6, callback3
     *
     * @chainable
     * @param {String} eventNname name of the event
     * @param {object} [options] configuration
     * @param {boolean} [options.traverse=false] disable nested events
     */
    disable(eventName, options = {}) {
        return setDisableEvent.call(this, eventName, true, options);
    }

    /**
     * check if a specific event is disabled.
     * @method isDisabled
     * @param {String} eventName name of the event
     * @return {Boolean} TRUE if the event is disabled. If the event does not exists, FALSE is returned
     */
    isDisabled(eventName) {
        const namespace = getStack.call(this, eventName);
        return namespace ? namespace.__stack.disabled : false;
    }

    /**
     * Triggers one or more events. One event is triggered if the 'eventName' parameter targets a specific event, but if this parameter is a namespace, all nested events and
     * namespaces will be triggered.
     *
     * @method trigger
     * @param {string} eventName name of the event or namespace
     * @param {*} data data passed to the triggered callback function
     * @param {Object} [options] configuration
     *      @param {Boolean} [options.traverse=false] trigger all callbacks in nested namespaces
     *      @param {String}  [options.eventMode] define the event mode to be used
     * @return {Number} the count of triggered callbacks
     * @example
     eventHub.trigger('ui.update' ) ;                                      // trigger the 'update' event inside the 'ui' namespace
     eventHub.trigger('ui', null, {traverse: true} ) ;                     // trigger all nested events and namespaces inside the 'ui' namespace
     eventHub.trigger('ui.update', {authenticated: true} ) ;               // trigger the 'update' event inside the 'ui' namespace
     eventHub.trigger('ui', {authenticated: true}, {traverse: true} ) ;    // trigger all nested events and namespaces inside the 'ui' namespace
     */
    trigger(event, data, options, dispatcher) {
        let retVal = 0;

        if (!options) {
            options = {};
        } else if (options.phase === DEFAULTS.PHASES.BOTH) {
            options = Object.assign({}, options, {phase: null});
        }

        if (this.canTrigger(event)) {
            const namespace = getStack.call(this, event),
                phase = options.phase;

            retVal =
                (!phase || phase === EventHub.PHASES.CAPTURING ?
                    triggerEventCapture.call(this, event, data, options, dispatcher) : 0)
                +
                triggerEvent(namespace, data, options, dispatcher)
                +
                (!phase || phase === EventHub.PHASES.BUBBLING ?
                    triggerEventBubble.call(this, namespace, data, options, dispatcher) : 0);

            namespace.__stack.triggers++;                                             // count the trigger
            // namespace.__stack.one = [];                                                // cleanup
        }

        return retVal;                                                                 // return the number of triggered callback functions
    }

    canTrigger(event = '') {
        return ((getStack.call(this, event) || {}).__stack || {}).disabled === false;
    }

    /**
     * Register a callback for a specific event. Callbacks are executed in the order of
     * registration. Set 'prepend' to TRUE to add the callback in front of the others. With the 'options'
     * parameter it is also possible to execute the callback in a capturing or bubbling phase.
     *
     * @method on
     * @param {String} eventName
     * @param {Function} callback
     * @param {Object} [options] configuration
     *      @param {Boolean} [options.prepend] if TRUE, the callback is placed before all other registered callbacks.
     *      @param {String} [options.eventMode] the event mode for which the callback is triggered too. Available modes are
     *          <tt>capture</tt>, <tt>bubble</tt> or both
     * @return {Boolean} TRUE if the callback is registered successfully. It will fail if the callback was already registered
     * @example
     eventHub.on( 'ui.update', this.update.bind(this) ) ;
     eventHub.on( 'ui.update', this.update.bind(this), {prepend: true, eventMode: EventHub.EVENT_MODE.CAPTURING} ) ;
     */
    on(eventName, callback, options) {
        return addCallbackToStack.call(this, eventName, callback, options || {});
    }


    /**
     * Register a callback for a specific event. This function is identical to {{#crossLink "EventHub/on:method"}}{{/crossLink}}
     * except that this callback is removed from the list after it has been triggered.
     *
     * @method one
     * @param {string} eventName
     * @param {function} callback
     * @param {Object} [options] configuration
     *      @param {Boolean} [options.prepend] if TRUE, the callback is placed before all other registered callbacks.
     *      @param {String} [options.eventMode=null] the event mode for which the callback is triggered too. Available modes are
     *          <tt>capture</tt> and <tt>bubble</tt>
     * @return {Boolean} TRUE if the callback is registered successfully. It will fail if the callback was already registered
     */
    one(event, callback, options) {
        return addCallbackToStack.call(this, event, callback,
            Object.assign({}, (options || {}), {isOne: true}));
    }

    /**
     * Removes the given callback for a specific event. However, if a callback is registered with an 'eventMode', the
     * callback can only be removed if that eventMode is specified too!
     *
     * @method off
     * @param {String} eventName
     * @param {Function} [callback] the callback function to be removed. If omitted, all registered events and nested
     * namespaces inside 'eventName' are removed
     * @param {Object} options configuration
     *      @param {Boolean} [options.traverse=false] traverse all nested namespaces
     *      @param {String} [options.eventMode=null] the event mode of the callback to be removed
     *      @param {Boolean} [options.isOne]
     * @return {Number} the count of removed callback functions
     * @example
     eventHub.off('ui.update', this.update) ;
     eventHub.off('ui.update', this.update, {eventMode: EventHub.EVENT_MODE.CAPTURING}) ;
     eventHub.off('ui') ;
     */
    off(event, callback, options) {
        if (typeof callback !== 'function')                          // fix input
        {
            options = callback;
            callback = null;
        }

        const stack = getStack.call(this, event);
        return removeFromNamespace(stack, callback, options || {});
    }

    /**
     * returns the the trigger count for this event
     * @param {sting} event name of the nam
     * @param {Object} [options]
     * @param {Boolean} [options.traverse=false] traverse all nested namepsaces
     * @return {Number} trigger count. -1 is returned if the event name does not exist
     */
    getTriggerFor(event, options = {}) {
        return stackCounter.call(this, event, options, getTriggerCount);
    }
}

/* ******** PRIVATE HELPER FUNCTION *********** */

function stackCounter(eventName, options, handler) {
    const stack = getStack.call(this, eventName);
    return sumPropertyInNamespace(stack, handler, options);
}

function setDisableEvent(eventName, state, options) {
    const namespace = getStack.call(this, eventName);

    changeStateEvent.call(this, namespace, state, options);

    return this;
}

/*
 * An event can be in two states: disabled or enabled. The 'state' parameter holds the new state. This state
 * will be applied to all nested events.
 * @param {Object} namespace
 * @param {Boolean} state TRUE to disable the events
 */
function changeStateEvent(namespace, state, options) {
    if (namespace) {
        for (let i in namespace) {
            if (i === '__stack') {
                namespace.__stack.disabled = state;
            }
            else if (options.traverse) {
                changeStateEvent.call(this, namespace[i], state, options);
            }
        }
    }
}

/*
 Returns the sum of a stack property. The specific property is implemented in propertyFunc
 */
function sumPropertyInNamespace(namespace, propertyFunc, options) {
    let i, retVal = 0;

    for (i in namespace) {
        if (i === '__stack') {
            retVal += propertyFunc(namespace.__stack, options);
        }
        else if (options.traverse === true) {
            retVal += sumPropertyInNamespace(namespace[i], propertyFunc, options);
        }
    }

    return retVal;
}

/*
 Returns the trigger count of this stack
 */
function getTriggerCount(stack) {
    return stack.triggers;
}

function addCallbackToStack(event, callback, options) {
    let obj = null
        , canAdd = false
        , stack;

    if (checkInput(event, callback))                                                  // validate input
    {
        stack = createStack.call(this, event);                                       // get stack of 'eventName'

        if (options.phase === DEFAULTS.PHASES.BOTH)
        {
            canAdd = canAddCallback.call(this, stack.__stack.on, callback,
                Object.assign({}, options, {phase: DEFAULTS.PHASES.CAPTURING})) &&
            canAddCallback.call(this, stack.__stack.on, callback,
                Object.assign({}, options, {phase: DEFAULTS.PHASES.BUBBLING}));
        } else
        {
            canAdd = canAddCallback.call(this, stack.__stack.on, callback, options);
        }

        if (canAdd)
        {
            obj = {
                fn: callback,
                phase: options.phase,
                isOne: options.isOne
            };
            stack.__stack.on[options.prepend ? 'push' : 'unshift'](obj);

            if (options.phase === DEFAULTS.PHASES.BOTH) {
                obj.phase = DEFAULTS.PHASES.CAPTURING;

                stack.__stack.on[options.prepend ? 'push' : 'unshift'](Object.assign({}, obj, {phase: DEFAULTS.PHASES.BUBBLING}));
            }
        }
    }

    return canAdd;
}

/*
 determines if a callback can be added to a stack. If this.allowMultiple === true, it will always return true
 */
function canAddCallback(callbacks, callback, options) {
    let i, retVal = true
        , phase = options.phase; //|| undefined ;

    if (this.allowMultiple === false) {
        for (i = 0; i < callbacks.length; i++) {
            if (callbacks[i].fn === callback && (
                    (!callback.phase && !phase)         // Both not defined
                    || callbacks[i].phase === phase)    // Identical
            ) {
                retVal = false;
                break;
            }
        }
    }

    return retVal;
}


/* Validate the input for 'on' and 'one'.
 eventName: should be defined and of type "string"
 callback:  should be defined and of type "function"
 */
function checkInput(eventName, callback) {
    let retVal = false;

    if (typeof(eventName) === "string" && callback && typeof(callback) === "function")   // OK
    {
        retVal = true;
    }
    else {
        console.warn(`Cannot bind the callback function to the event name ( eventName=${eventName},  callback=${callback})`);
    }

    return retVal;
}

/*
 Removes the callback from the stack. However, a stack can contain other namespaces. And these namespaces
 can contain the callback too. Furthermore, the callback is optional, in which case the whole stack
 is erased.
 */
function removeFromNamespace(namespaces, callback, options) {
    let i, retVal = 0                                                // number of removed callbacks
        , namespace;

    for (i in namespaces) {                                                             // so we loop through all namespaces (and __stack is one of them)
        if (namespaces.hasOwnProperty(i)) {
            namespace = namespaces[i];
            if (i === '__stack') {
                retVal += removeCallback(namespace.on, callback, options);
            }
            else if (options.traverse)                           // NO, its a namesapace -> recursion
            {
                retVal += removeFromNamespace.call(this, namespace, callback, options);
            }
        }
    }

    return retVal;                                              // a count of removed callback function
}

/* This function should only be called on a stack with the 'on' and 'one' lists. It will remove one or
 multiple occurrences of the 'callback' function
 */
function removeCallback(list, callback, options) {
    let i                                             // position on the stack
        , retVal = 0;

    for (i = list.length - 1; i >= 0; i--) {
        if ((list[i].fn === callback || !callback) && list[i].phase === options.phase &&
            (options.isOne === list[i].isOne || options.isOne === undefined || options.isOne === null)
        /*
         && ( options.isOne === undefined || options.isOne === null || options.isOne === list[i].isOne
         || (options.isOne === false && list[i].isOne === undefined)
         )
         */
        ) {
            list.splice(i, 1);
            retVal++;
        }
    }

    return retVal;
}

/*
 This private function returns the callback stack matched by 'eventName'. If the eventName does
 not exist 'null' is returned
 */
function getStack(event) {
    let i
        , parts = event ? event.split('.') : []   // parts of the event namespaces
        , stack = this._rootStack;                  // root of the callback stack

    for (i = 0; i < parts.length; i++) {
        if (!stack[parts[i]]) {
            return 0;                               // it does not exist -> done
        }
        stack = stack[parts[i]];                       // traverse a level deeper into the stack
    }

    return stack;                                      // return the stack matched by 'eventName'
}

/*
 * Internally 'eventName' is always a namespace. Callbacks are placed inside a special
 * variable called '__stack'. So, when the eventName is 'doAction', internally this will
 * look like doAction.__stack. This function always increases the count for each namespace
 * because this function is only called when adding a new callback. Finally, if the namespace
 * does not exist, it is created.
 */
function createStack(namespace) {
    let i
        , parts = namespace.split('.')             // split the namespace
        , stack = this._rootStack;                 // start at the root

    for (i = 0; i < parts.length; i++)             // traverse the stack
    {
        if (!stack[parts[i]])                      // if not exists --> create it
        {
            stack[parts[i]] = {
                __stack: {                         // holds all info for this namespace (not the child namespaces)
                    on: []                         // callback stack
                    , parent: stack                // parent namespace/object
                    , triggers: 0                  // count triggers
                    , disabled: false              // by default the namespace/event is enabled
                }
            };
        }

        stack = stack[parts[i]];                   // go into the (newly created) namespace
    }

    return stack;
}

function triggerEventCapture(event, data, options, dispatcher) {
    let i
        , namespace = this._rootStack
        , parts = event ? event.split('.') : []
        , phase = DEFAULTS.PHASES.CAPTURING
        , retVal = 0; // callCallbacks(namespace, eventMode) ; -> because you cannot bind callbacks to the root

    if (parts.length > 1 &&
        ( !options.phase || options.phase === phase)) {
        for (i = 0; i < parts.length - 1; i++)           // loop through namespace (not the last part)
        {
            namespace = namespace[parts[i]];
            retVal += callCallbacks(namespace, data, phase, dispatcher);
        }
    }

    return retVal;
}

function triggerEventBubble(namespace, data, options, dispatcher) {
    //var namespace = namespaces.__stack.parent ;
    let phase = DEFAULTS.PHASES.BUBBLING
        , retVal = 0;

    if (!options.phase ||
        options.phase === DEFAULTS.PHASES.BOTH ||
        options.phase === DEFAULTS.PHASES.BUBBLING) {
        while (namespace && namespace.__stack.parent) {
            namespace = namespace.__stack.parent;
            retVal += callCallbacks(namespace, data, phase, dispatcher);
        }
    }

    return retVal;
}

/*
 * Namespaces can in theory be many levels deep, like: "aaaaa.bbbbbb.cccccc._stack"
 * To traverse this namespace and trigger everything inside it, this function is called recursively (only if options.traverse === true).
 */
function triggerEvent(stack, data, options, dispatcher) {
    let retVal = callCallbacks(stack, data, null, dispatcher);

    if (options.traverse) {                             // found a deeper nested namespace
        for (let ns in stack) {
            if (stack.hasOwnProperty(ns) && ns !== '__stack' && stack[ns].__stack) {
                retVal += triggerEvent(stack[ns], data, options, dispatcher); // nested namespaces. NOTE that the 'eventName' is omitted!!
            }
        }
    }

    return retVal;
}

/*
 This method triggers the callback for a given namespace. It does not traverse the namespaces, it only loops through
 the 'on' list and afterwards checks if there are callbacks which should be removed (checking the 'one' list)
 If the 'eventMode' is defined, it only triggers callbacks which accept the eventMode.
 @param {Object} namespace
 @param {Anything} data
 @param {String} eventMode accepted values
 */
function callCallbacks(namespace, data, phase, dispatcher) {
    let i = namespace.__stack.on.length
        , retVal = 0
        , callback;

    while(callback = namespace.__stack.on[--i])
    {
        if ((!callback.phase && !phase) || callback.phase === phase)
        {
            retVal++;                                               // count this trigger
            dispatcher ? dispatcher(callback, data, phase) : callback.fn(data);                                      // call the callback

            if (callback.isOne) {
                namespace.__stack.on.splice(i, 1);                // remove callback for index is i, and afterwards fix loop index with i--
            }
        }
    }

    return retVal;
}
