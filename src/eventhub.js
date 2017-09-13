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
     *     eventHub.on('bar', myFunc2, { phase: EventHub.PHASES.CAPTURING }) ;
     *     eventHub.on('bar', myFunc3, { phase: EventHub.PHASES.BUBBLING }) ;
     *     eventHub.on('bar', myFunc4, { phase: EventHub.PHASES.BOTH }) ;     // myFunc4 is added to both phases
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
     * @property {Object} PHASES
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
} ;

/**
 * EventHub-XXL facilitates event-based communication between different parts of an application (Event driven system).
 * Events can be namespaced, enabling the execution of groups of callbacks.
 */
export class EventHub {
    /**
     * Available phases
     *
     * @readonly
     * @enum {string}
     * @property {string} BUBBLING Event goes from child to parent
     * @property {string} CAPTURING Event goes from parent to child
     */
    static PHASES = DEFAULTS.PHASES ;

    /**
     * An instance represents a unique  event-hub, because instances do not share any data
     *
    * @constructor
    * @param {object} [options] configuration parameters
    * @param {boolean} [options.allowMultiple=TRUE] accept multiple registrations of the same function for the same event
    */
    constructor(options = {}) {
        Object.defineProperty(this, '_rootStack',
            {
                value: {__stack: {disabled: false, triggers: 0, on: [], one: []}}
                , enumerable: false // hide it
            }
        ) ;
        Object.defineProperty(this, '_eventNameIndex',
            {
                value: 0, enumerable: false     // hide it
                , writable: true                // otherwise ++ will not work
            }
        ) ;

        this.allowMultiple = typeof options.allowMultiple === 'boolean' ? options.allowMultiple : DEFAULTS.ALLOW_MULTIPLE ;
    }

    /**
     * Simulates `trigger`, `on`, `one` and `off`, meaning no callbacks are actually triggered,
     * added or removed.
     *
     * @example
     *
     * isAdded = eh.fake.on('a.b', myFunc) ;
     * isAdded = eh.fake.one('a.b', myFunc) ;
     * count   = eh.fake.off('a.b', myFunc) ;
     * count   = eh.fake.trigger('a.b') ;
     *
     * @returns {{trigger: (function(*=, *=, *=)), on: (function(*=, *=, *=)), one: (function(*=, *=, *=)), off: (function(*=, *=, *=))}}
     */
    get fake() {
        return {
            trigger: (event, data, options) => {
                return this.trigger(event, data, options || data, () => {}) ;
            },
            on: (event, callback, options) => {
                return this.on(event, callback, options, true) ;
            },
            one: (event, callback, options) => {
                return this.one(event, callback, options, true) ;
            },
            off: (event, callback, options) => {
                return this.off(event, callback, options, true) ;
            }
        }
    }

    /**
     * Generates an unique event name
     *
     * @return {string} unique event name
     */
    generateUniqueEventName() {
        return '--eh--' + this._eventNameIndex++ ;      // first event-name will be: --eh--0
    }

    /**
     * By default it is allowed to add a function multiple times to the same event. Set to `false` to disabled this behaviour
     *
     * @chainable
     * @param {boolean} state accept multiple registrations
     */
    setAllowMultiple(state) {
        this.allowMultiple = state ;
        return this ;
    }

    /**
     * Enables a disabled event. See {@link EventHub#disable}.
     *
     * @chainable
     * @param {string} eventName name of the event
     * @param {object} [options] configuration
     * @param {boolean} [options.traverse=false] enable nested events if set to true
     */
    enable(event, options = {}, defaultState = false) {
        let namespace = event;

        if (typeof namespace === 'string') {
            namespace = getStack.call(this, event);
        }

        if (namespace) {
            for (let i in namespace)
            {
                if (i === '__stack')
                {
                    namespace.__stack.disabled = defaultState ;
                }
                else if (options.traverse)
                {
                    this.enable(namespace[i], options, defaultState) ;
                }
            }
        }

        return this;
    }

    /**
     * Disable an event, meaning all triggers are ignored
     *
     * @example
     *
     * eventHub.on('bar', callback1, { phase: EventHub.PHASES.BOTH }) ;
     * eventHub.on('bar', callback2) ;
     * eventHub.on('bar.foo', callback3, { phase: EventHub.PHASES.BOTH }) ;
     * eventHub.on('bar.foo', callback4) ;
     * eventHub.on('bar.foo.do', callback5 { phase: EventHub.PHASES.BOTH }) ;
     * eventHub.on('bar.foo.do', callback6) ;
     *
     * eventHub.disable('bar') ;
     *
     * eventHub.trigger('bar')          // -> no callbacks called
     * eventHub.trigger('bar.foo')      // -> only callback4 is called
     * eventHub.trigger('bar.foo.do')   // -> callback execution order: callback3, callback6, callback3
     *
     * @chainable
     * @param {string} event name of the event
     * @param {object} [options] configuration
     * @param {boolean} [options.traverse=false] disable nested events
     */
    disable(event, options = {}) {
        return this.enable(event, options, true);
    }

    /**
     * Check if a specific event is disabled.
     *
     * @param {string} event name of the event
     * @return {boolean} TRUE if the event is disabled. If the event does not exists, FALSE is returned
     */
    isDisabled(eventName) {
        const namespace = getStack.call(this, eventName) ;
        return namespace ? namespace.__stack.disabled : false ;
    }

    /**
     * Triggers one or more events. If traverse is set to `true`, all nested callbacks (without a phase) will be triggered too
     *
     * @param {string} event name of the event
     * @param {*} data information passed to the triggered callback function
     * @param {object} [options] configuration
     * @param {boolean} [options.traverse=false] trigger all callbacks in nested namespaces
     * @param {string}  [options.phase] define the event mode to be used
     * @return {Number} the count of triggered callbacks
     *
     * @example
     * eventHub.trigger('ui.update' ) ;                                      // trigger the 'update' event inside the 'ui' namespace
     * eventHub.trigger('ui', null, {traverse: true} ) ;                     // trigger all nested events and namespaces inside the 'ui' namespace
     * eventHub.trigger('ui.update', {authenticated: true} ) ;               // trigger the 'update' event inside the 'ui' namespace
     * eventHub.trigger('ui', {authenticated: true}, {traverse: true} ) ;    // trigger all nested events and namespaces inside the 'ui' namespace
     */
    trigger(event, data, options, dispatcher) {
        let retVal = 0 ;

        if (!options)
        {
            options = {} ;
        }
        else if (options.phase === DEFAULTS.PHASES.BOTH)
        {
            options = Object.assign({}, options, {phase: null}) ;
        }

        if (this.canTrigger(event))
        {
            const namespace = getStack.call(this, event),
                phase = options.phase ;

            retVal =
                triggerEventCapture.call(this, event, data, options, dispatcher)
                +
                triggerEvent(namespace, data, options, dispatcher)
                +
                triggerEventBubble.call(this, namespace, data, options, dispatcher);

            namespace.__stack.triggers++ ;                                             // count the trigger
            // namespace.__stack.one = [] ;                                                // cleanup
        }

        return retVal ;                                                                 // return the number of triggered callback functions
    }

    /**
     * For an event to be triggerable, it should be enabled and exits.
     *
     * @param event
     * @returns {boolean}
     */
    canTrigger(event = '') {
        return ((getStack.call(this, event) || {}).__stack || {}).disabled === false ;
    }

    /**
     * Register a callback for a specific event. Callbacks are executed in the order of
     * registration. Set 'prepend' to TRUE to add the callback in front of the other already registered callbacks.
     * With the 'options' parameter the callback can be attached to a phase (See {@link EventHub#PHASES})
     *
     * @param {string} event name of the event
     * @param {function} callback
     * @param {object} [options] configuration
     * @param {boolean} [options.prepend] if TRUE, the callback is placed before all other registered callbacks.
     * @param {string} [options.phase] the event phase
     *
     * @return {boolean} TRUE if the callback is registered successfully
     *
     * @example
     * eventHub.on( 'ui.update', myFunc1) ;
     * eventHub.on( 'ui.update', myFunc2, {prepend: true, phase: EventHub.PHASES.CAPTURING} ) ;
     */
    on(event, callback, options, isFake = false) {
        return addCallbackToStack.call(this, event, callback, options || {}, isFake) ;
    }

    /**
     * This function is identical with {@link EventHub#on} except that this callback is removed after it has been called
     *
     * @param {string} event name of the event
     * @param {function} callback
     * @param {object} [options] configuration
     * @param {boolean} [options.prepend] if TRUE, the callback is placed before all other registered callbacks.
     * @param {string} [options.phase] the event phase
     *
     * @return {boolean} TRUE if the callback is registered successfully
     *
     * @example
     * eventHub.one( 'ui.update', myFunc1) ;
     * eventHub.one( 'ui.update', myFunc2, {prepend: true, phase: EventHub.PHASES.CAPTURING} ) ;
     *
     */
    one(event, callback, options, isFake) {
        return addCallbackToStack.call(this, event, callback,
            Object.assign({}, (options || {}), {isOne: true}), isFake) ;
    }

    /**
     * Removes the given callback for a specific event. However, if a callback is registered with an 'phase', the
     * callback can only be removed if that phase is specified too!
     *
     * @param {string} event name of the event
     * @param {function} [callback] the callback function to be removed. If omitted, all callbacks of that event are removed
     * @param {object} options configuration
     * @param {boolean} [options.traverse=false] traverse all nested namespaces
     * @param {string} [options.phase=''] the phase of the callback to be removed
     * @param {boolean} [options.isOne] only remove callbacks registered using {@link EventHub#one}
     * @return {number} the amount of removed callbacks
     *
     * @example
     * eventHub.off('ui.update', myFunc) ;
     * eventHub.off('ui.update', myFunc, {phase: EventHub.PHASES.CAPTURING}) ;
     * eventHub.off('ui') ; // Remove all callbacks for event `ui`
     */
    off(event, callback, options, isFake) {
        if (typeof callback !== 'function')
        {
            options = callback ;
            callback = null ;
        }

        const stack = getStack.call(this, event) ;
        return removeFromNamespace(stack, callback, options || {}, isFake) ;
    }

    /**
     * Each time an event is triggered the event trigger count is increased by one. This functions returns that number.
     *
     * @param {string} event name of the event
     * @param {object} [options]
     * @param {boolean} [options.traverse=false] traverse all nested events
     * @return {Number} the amount of trigger for the given event name
     */
    getTriggersFor(event, options = {}, namespace = getStack.call(this, event)) {
        let retVal = namespace.__stack.triggers;

        if (options.traverse) {
            for (let i in namespace)
            {
                if (i !== '__stack')
                {
                    retVal += this.getTriggersFor(event, options, namespace[i]) ;
                }
            }
        }

        return retVal;
    }
}

/* ******** PRIVATE HELPER FUNCTION *********** */

function addCallbackToStack(event, callback, options, isFake) {
    let obj = null
        , canAdd = false
        , stack ;

    if (checkInput(event, callback))                                                  // validate input
    {
        stack = createStack.call(this, event) ;                                       // get stack of 'eventName'

        if (options.phase === DEFAULTS.PHASES.BOTH)
        {
            canAdd = canAddCallback.call(this, stack.__stack.on, callback,
                Object.assign({}, options, {phase: DEFAULTS.PHASES.CAPTURING})) &&
            canAddCallback.call(this, stack.__stack.on, callback,
                Object.assign({}, options, {phase: DEFAULTS.PHASES.BUBBLING})) ;
        }
        else
        {
            canAdd = canAddCallback.call(this, stack.__stack.on, callback, options) ;
        }

        if (canAdd && !isFake)
        {
            obj = {
                fn: callback,
                phase: options.phase,
                isOne: options.isOne
            } ;
            stack.__stack.on[options.prepend ? 'push' : 'unshift'](obj) ;

            if (options.phase === DEFAULTS.PHASES.BOTH) {
                obj.phase = DEFAULTS.PHASES.CAPTURING ;

                stack.__stack.on[options.prepend ? 'push' : 'unshift'](Object.assign({}, obj, {phase: DEFAULTS.PHASES.BUBBLING})) ;
            }
        }
    }

    return canAdd ;
}

function canAddCallback(callbacks, callback, options) {
    let i, retVal = true
        , phase = options.phase ; //|| undefined ;

    if (this.allowMultiple === false)
    {
        for (i = 0 ; i < callbacks.length ; i++)
        {
            if (callbacks[i].fn === callback && (
                    (!callback.phase && !phase)         // Both not defined
                    || callbacks[i].phase === phase)    // Identical
            )
            {
                retVal = false ;
                break ;
            }
        }
    }

    return retVal ;
}


/* Validate the input for 'on' and 'one'.
 event:     should be defined and of type "string"
 callback:  should be defined and of type "function"
 */
function checkInput(event, callback) {
    let retVal = false ;

    if (typeof(event) === "string" && callback && typeof(callback) === "function")   // OK
    {
        retVal = true ;
    }
    else {
        console.warn(`Cannot bind the callback function to the event name ( eventName=${event},  callback=${callback})`) ;
    }

    return retVal ;
}

/*
Traverse namespaces (if options.traverse === true) and selects namespaces for inspection.
See `removeCallback` for more details about the actual removal of callback function
 */
function removeFromNamespace(namespaces, callback, options, isFake) {
    let i, retVal = 0                                                // number of removed callbacks
        , namespace ;

    for (i in namespaces) {                                                             // so we loop through all namespaces (and __stack is one of them)
        if (namespaces.hasOwnProperty(i))
        {
            namespace = namespaces[i] ;
            if (i === '__stack')
            {
                retVal += removeCallback(namespace.on, callback, options, isFake) ;
            }
            else if (options.traverse)                           // NO, its a namesapace -> recursion
            {
                retVal += removeFromNamespace.call(this, namespace, callback, options, isFake) ;
            }
        }
    }

    return retVal ;                                              // a count of removed callback function
}

/*
Remove the callback from the namespace if it exist and if the `phase` and `isOne` match. If no
callback is given all callbacks are removed
 */
function removeCallback(list, callback, options, isFake) {
    let i                                             // position on the stack
        , retVal = 0 ;

    for (i = list.length - 1 ; i >= 0 ; i--)
    {
        if ((list[i].fn === callback || !callback) && list[i].phase === options.phase &&
            (options.isOne === list[i].isOne || options.isOne === undefined || options.isOne === null)
        )
        {
            if (!isFake)
            {
                list.splice(i, 1) ;
            }

            retVal++ ;
        }
    }

    return retVal ;
}

/*
Find the stack (a.k.a namespace) for a given event
 */
function getStack(event) {
    let i
        , parts = event ? event.split('.') : []      // parts of the event namespaces
        , stack = this._rootStack ;                  // root of the callback stack

    for (i = 0 ; i < parts.length ; i++) {
        if (!stack[parts[i]])
        {
            return 0 ;                               // it does not exist -> done
        }

        stack = stack[parts[i]] ;                    // traverse a level deeper into the stack
    }

    return stack ;                                   // return the stack matched by 'event'
}

/*
Create namespace/stack if not exist and return it
*/
function createStack(namespace) {
    let i
        , parts = namespace.split('.')             // split the namespace
        , stack = this._rootStack ;                // start at the root

    for (i = 0 ; i < parts.length ; i++)           // traverse the stack
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
            } ;
        }

        stack = stack[parts[i]] ;                   // go into the (newly created) namespace
    }

    return stack ;
}

function triggerEventCapture(event, data, options, dispatcher) {
    let i
        , namespace = this._rootStack
        , parts = event ? event.split('.') : []
        , phase = DEFAULTS.PHASES.CAPTURING
        , retVal = 0 ;

    if (parts.length > 1 && (!options.phase || options.phase === phase))
    {
        for (i = 0 ; i < parts.length - 1 ; i++)           // loop through namespace (not the last part)
        {
            namespace = namespace[parts[i]] ;
            retVal += callCallbacks(namespace, data, phase, dispatcher) ;
        }
    }

    return retVal ;
}

function triggerEventBubble(namespace, data, options, dispatcher) {
    let phase = DEFAULTS.PHASES.BUBBLING
        , retVal = 0 ;

    if (!options.phase || options.phase === phase)
    {
        while (namespace && namespace.__stack.parent)
        {
            namespace = namespace.__stack.parent ;
            retVal += callCallbacks(namespace, data, phase, dispatcher) ;
        }
    }

    return retVal ;
}

function triggerEvent(stack, data, options, dispatcher) {
    let retVal = callCallbacks(stack, data, null, dispatcher) ;

    if (options.traverse)
    {                             // found a deeper nested namespace
        for (let ns in stack)
        {
            if (stack.hasOwnProperty(ns) && ns !== '__stack' && stack[ns].__stack)
            {
                retVal += triggerEvent(stack[ns], data, options, dispatcher) ;
            }
        }
    }

    return retVal ;
}

/*
 This method triggers callbacks within a given namespace for a specific phase. If a callback `isOne` it
 is removed from the namespace
 */
function callCallbacks(namespace, data, phase, dispatcher) {
    let i = namespace.__stack.on.length
        , retVal = 0
        , callback ;

    while(callback = namespace.__stack.on[--i])
    {
        if ((!callback.phase && !phase) || callback.phase === phase)
        {
            retVal++ ;                                                           // count this trigger
            dispatcher ? dispatcher(callback, data, phase) : callback.fn(data) ; // call the callback

            if (callback.isOne) {
                namespace.__stack.on.splice(i, 1) ;                              // remove callback for index is i, and afterwards fix loop index with i--
            }
        }
    }

    return retVal ;
}
