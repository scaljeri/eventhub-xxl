const DEFAULTS = {
    /**
     * The traversal of event namespaces can be split into three different types:
     *
     *     CAPTURING
     *     BUBBLING
     *     CAPTURING and BUBBLING => BOTH
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
     * When an event is triggered, first the events propagates in CAPTURING mode and then in BUBBLING mode
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
     *     eventHub.on('bar', myFunc4, { eventMode: EventHub.EVENT_MODE.BOTH }) ;
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
    EVENT_MODE: {
        /**
         * Defines the capturing event mode
         * @property {String} EVENT_MODE.CAPTURING
         * @static
         */
        CAPTURING: 'capture'           // event goes from root to target
        /**
         * Defines the bubbling event mode
         * @property {String} EVENT_MODE.BUBBLING
         * @static
         */
        , BUBBLING: 'bubble'            // event goes from target to root
        /**
         * Represent both capturing and bubbling event modes
         * @property {String} EVENT_MODE.BOTH
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
 * Events can be namespaced enabling the execution of triggering groups of callbacks.
 *
 * Namespaces are separated by a dot, like
 *
 *     bar.foo1
 *     bar.foo2
 *     bar.bar1.foo1
 *
 * The event name is always the last part (from the last dot to the end) of the given string. Everyghing else is part of the Namespace
 *
 *     eventHub.on('bar', myFunc1) ;             // event name: 'bar'
 *     eventHub.on('bar.foo1', myFunc2) ;        // event name: 'foo1', namespace: 'bar'
 *     eventHub.on('bar.bar1', myFunc3) ;
 *     eventHub.on('bar.bar1.foo1', myFunc4) ;   // event name: 'foo1', namespace: 'bar.bar1'
 *
 * The advantage of namespaced events is that groups of callbacks can be triggered at once
 *
 *     eventHub.trigger('bar') ;        // --> triggers: myFunc1, myFunc2, myFunc3 and myFunc4
 *     eventHub.trigger('bar.bar1');    // --> triggers: myFunc3 and myFunc4
 *
 * @class EventHub
 * @constructor
 * @param {Object} [options] configuration parameters
 *      @param {Boolean} [options.allowMultiple=TRUE] accept multiple registrations of the same function for the same event
 */
export class EventHub {
    constructor(options = {}) {
        Object.defineProperty(this, '_rootStack',
            {
                value: {__stack: {triggers: 0, on: [], one: []}}, enumerable: false // hide it
            }
        );
        Object.defineProperty(this, '_eventNameIndex',
            {
                value: 0, enumerable: false     // hide it
                , writable: true                // otherwise ++ will not work
            }
        );

        this.allowMultiple = typeof options.allowMultiple  === 'boolean' ? options.allowMultiple : DEFAULTS.ALLOW_MULTIPLE;
    }

    static EVENT_MODE = DEFAULTS.EVENT_MODE;              // set static properties

    /**
     * Generates an unique event name
     *
     * @method generateUniqueEventName
     * @return {String} unique event name
     */
    generateUniqueEventName() {
        return '--eh--' + this._eventNameIndex++;      // first event-name will be: --eh--0
    }

    /**
     * If set to true, one function can be registered multiple times for the same event
     *
     * @method setAllowMultiple
     * @chainable
     * @param {Boolean} state accept multiple registrations
     */
    setAllowMultiple(state) {
        this.allowMultiple = state;
        return this;
    }

    /**
     * Enable an event name. See {{#crossLink "EventHub/disable:method"}}{{/crossLink}}
     * @method enable
     * @chainable
     * @param {String} eventName name of the event
     * @param {Object} [options] configuration
     *  @param {Boolean} [options.traverse=false] disable nested events as wel if set to TRUE
     */
    enable(eventName, options = {}) {
        return setDisableEvent.call(this, eventName, false, options);
    }

    /**
     * Disable an event. All triggers on a disabled event are ignored and no event propagation takes place. For example
     *
     *     eventHub.on('bar', callback1, { eventMode: EventHub.EVENT_MODE.BOTH }) ;
     *     eventHub.on('bar', callback2) ;
     *     eventHub.on('bar.foo', callback3, { eventMode: EventHub.EVENT_MODE.BOTH }) ;
     *     eventHub.on('bar.foo', callback4) ;
     *     eventHub.on('bar.foo.do', callback5 { eventMode: EventHub.EVENT_MODE.BOTH }) ;
     *     eventHub.on('bar.foo.do', callback6) ;
     *     eventHub.disable('bar') ;
     *
     *     eventHub.trigger('bar')          // -> no callbacks called
     *     eventHub.trigger('bar.foo')      // -> callback execution order: callback2, callback3, callback2
     *
     * @method disable
     * @chainable
     * @param {String} eventNname name of the event
     * @param {Object} [options] configuration
     *  @param {Boolean} [options.traverse=false] disable nested events as wel if set to TRUE
     */
    disable(eventName, options) {
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
    trigger(eventName, data, options) {
        let retVal = 0
            , namespace;

        if ((namespace = getStack.call(this, eventName)) && !!!namespace.__stack.disabled)  // check if the eventName exists and not being disabled
        {
            retVal = triggerEventCapture.call(this, eventName || '', data, options || {}) +              // NOTE that eventName can be empty!
                triggerEvent(namespace, data, options || {}) +
                ((eventName || '').match(/\./) !== null ? triggerEventBubble(namespace, data, options || {}) : 0);

            namespace.__stack.triggers++;                                             // count the trigger
            namespace.__stack.one = [];                                                // cleanup
        }

        return retVal;                                                                 // return the number of triggered callback functions
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
        return !!addCallbackToStack.call(this, eventName, callback, options || {});
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
    one(eventName, callback, options) {
        const obj = addCallbackToStack.call(this, eventName, callback, options || {});

        if (obj) // if obj exists, the callback was added.
        {
            obj.isOne = true;
        }

        return obj !== null;
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
    off(eventName, callback, options) {
        if (typeof callback !== 'function')                          // fix input
        {
            options = callback;
            callback = null;
        }

        const stack = getStack.call(this, eventName);
        return removeFromNamespace(stack, callback, options || {});
    }

    /**
     * count the registered callbacks for an event or namespace
     *
     * @method countCallbacks
     * @param {Sting} eventName the event name for which all registered callbacks are counted (including nested event names).
     * @param {Object} [options] configuration
     *      @param {String} [options.eventMode] the event mode; EventHub.CAPTURING or EventHub.BUBBLE
     *      @param {Boolean} [options.traverse=false] traverse all nested namepsaces
     * @return {Number} the number of callback functions inside 'eventName'. Returns -1 if the event or namespace does not exists
     * TODO: etype is not used
     */
    countCallbacks(eventName = '', options = {}) {
        let retVal = 0;
        if (options.eventMode === EventHub.EVENT_MODE.CAPTURING ||
            options.eventMode === EventHub.EVENT_MODE.BOTH) {
            retVal = triggerEventCapture.call(this, eventName, null, options, () => {})
        }

        if (options.eventMode === EventHub.EVENT_MODE.BUBBLING ||
            options.eventMode === EventHub.EVENT_MODE.BOTH) {
            retVal += triggerEventBubble.call(this, getStack.call(this, eventName), null, options, () => {})
        } else if (!options.eventMode) {
            retVal = triggerEvent(getStack.call(this, eventName), null, options, () => {});
        }

        return retVal; // stackCounter.call(this, eventName, options, getCallbackCount);
    }

    /**
     * returns the the trigger count for this event
     * @method countTrigger
     * @param {sting} [eventName] the event name
     * @param {Object} [options]
     *      @param {Boolean} [options.traverse=false] traverse all nested namepsaces
     * @return {Number} trigger count. -1 is returned if the event name does not exist
     */
    countTriggers(eventName, options = {}) {
        return stackCounter.call(this, eventName, options, getTriggerCount);
    }
}

/* ******** PRIVATE HELPER FUNCTION *********** */

function stackCounter(eventName, options, handler) {
    if (!eventName)  // if event-name is not defined --> traverse
    {
        options.traverse = true;
    }

    const stack = getStack.call(this, eventName);
    return sumPropertyInNamespace(stack, handler, options || {});
}

function setDisableEvent(eventName, state, options) {
    const namespace = getStack.call(this, eventName);

    changeStateEvent.call(this, namespace || {}, state, options || {});
    return this;
}

/*
 * An event can be in two states: disabled or enabled. The 'state' parameter holds the new state. This state
 * will be applied to all nested events.
 * @param {Object} namespace
 * @param {Boolean} state TRUE to disable the events
 */
function changeStateEvent(namespace, state, options) {
    for (let i in namespace) {
        if (i === '__stack') {
            namespace.__stack.disabled = state;
        }
        else if (options.traverse) {
            changeStateEvent.call(this, namespace[i], state, options);
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
 Returns the number of callback function present in this stack
 */
function getCallbackCount(stack, options) {
    let i, retVal = 0;

    for (i in stack.on) {
        if (stack.on[i].eventMode === options.eventMode) {
            retVal++;
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

function addCallbackToStack(eventName, callback, options) {
    let obj = null
        , stack;
    if (checkInput(eventName, callback))                                                  // validate input
    {
        stack = createStack.call(this, eventName);                                       // get stack of 'eventName'
        if (canAddCallback.call(this, stack.__stack.on, callback, options) === true)      // check if the callback is not already added
        {
            obj = {
                fn: callback,
                eventMode: options.eventMode,
                isOne: false
            };
            stack.__stack.on[options.prepend ? 'unshift' : 'push'](obj);
        }
    }

    return obj;
}

/*
 determines if a callback can be added to a stack. If this.allowMultiple === true, it will always return true
 */
function canAddCallback(callbacks, callback, options) {
    let i, retVal = true
        , eventMode = options.eventMode; //|| undefined ;

    if (this.allowMultiple === false) {
        for (i = 0; i < callbacks.length; i++) {
            if (callbacks[i].fn === callback && (
                    (!callback.eventMode && !eventMode)         // Both not defined
                    || callbacks[i].eventMode === eventMode)    // Identical
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
    else
    {
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
        if ((list[i].fn === callback || !callback) && list[i].eventMode === options.eventMode &&
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
function getStack(namespace) {
    let i
        , parts = namespace ? namespace.split('.') : []   // parts of the event namespaces
        , stack = this._rootStack;                  // root of the callback stack

    for (i = 0; i < parts.length; i++) {
        if (!stack[parts[i]]) {
            return null;                               // it does not exist -> done
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

function triggerEventCapture(eventName, data, options, dispatcher) {
    let i
        , namespace = this._rootStack
        , parts = eventName.split('.') || []
        , eventMode = DEFAULTS.EVENT_MODE.CAPTURING
        , retVal = 0; // callCallbacks(namespace, eventMode) ; -> because you cannot bind callbacks to the root

    if (parts.length > 1 &&
        ( !options.eventMode ||
            options.eventMode === DEFAULTS.EVENT_MODE.BOTH ||
            options.eventMode === DEFAULTS.EVENT_MODE.CAPTURING )) {
        for (i = 0; i < parts.length - 1; i++)           // loop through namespace (not the last part)
        {
            namespace = namespace[parts[i]];
            retVal += callCallbacks(namespace, data, eventMode, dispatcher);
        }
    }

    return retVal;
}

function triggerEventBubble(namespace, data, options, dispatcher) {
    //var namespace = namespaces.__stack.parent ;
    let eventMode = DEFAULTS.EVENT_MODE.BUBBLING
        , retVal = 0;

    if (!options.eventMode ||
        options.eventMode === DEFAULTS.EVENT_MODE.BOTH ||
        options.eventMode === DEFAULTS.EVENT_MODE.BUBBLING) {
        while (namespace.__stack.parent) {
            namespace = namespace.__stack.parent;
            retVal += callCallbacks(namespace, data, eventMode, dispatcher);
        }
    }

    return retVal;
}

/*
 * Namespaces can in theory be many levels deep, like: "aaaaa.bbbbbb.cccccc._stack"
 * To traverse this namespace and trigger everything inside it, this function is called recursively (only if options.traverse === true).
 */
function triggerEvent(stack, data, options, dispatcher) {
    let retVal = 0;

    if (!stack.disabled)                                          // if this node/event is disabled, don't traverse the namespace deeper
    {
        for (let ns in stack) {
            if (ns === "__stack") {
                retVal += callCallbacks(stack, data, null, dispatcher);
            }
            else if (options.traverse)                             // found a deeper nested namespace
            {
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
function callCallbacks(namespace, data, eventMode, dispatcher) {
    let i
        , retVal = 0
        , callback;

    if (!namespace.__stack.disabled) {
        for (i = 0; i < namespace.__stack.on.length; i++)            // loop through all callbacks
        {
            callback = namespace.__stack.on[i];
            if ((!callback.eventMode && !eventMode) ||
                callback.eventMode === eventMode ||
                eventMode && callback.eventMode === DEFAULTS.EVENT_MODE.BOTH)  // trigger callbacks depending on their event-mode
            {
                retVal++;                                               // count this trigger
                dispatcher ? dispatcher(callback, data, eventMode) : callback.fn(data);                                      // call the callback
                if (callback.isOne) {
                    namespace.__stack.on.splice(i--, 1);                // remove callback for index is i, and afterwards fix loop index with i--
                }
            }
        }
    }

    return retVal;
}
