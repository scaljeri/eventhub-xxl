javascript-eventhub [![Build Status](https://travis-ci.org/scaljeri/javascript-eventhub.png)](https://travis-ci.org/scaljeri/javascript-eventhub)
======================

Event Hub for event-based applications. It facilitates event-based communication between different 
parts of an application (Event driven system). Events can be namespaced too.
                                                
Namespaces are separated by a dot, like
                                                
    bar.foo1
    bar.foo2
    bar.bar1.foo1
                                                
A Namespace and an Eventname are actually more or less the same thing:
                                                
    eventHub.on('bar', myFunc1) ;
    eventHub.on('bar.foo1', myFunc2) ;
    eventHub.on('bar.bar1', myFunc3) ;
    eventHub.on('bar.bar1.foo1', myFunc4) ;
                                                
The advantage of namespaced events is that it facilitates triggering groups of events
                                                
    eventHub.trigger('bar') ;        // --> triggers: myFunc1, myFunc2, myFunc3 and myFunc4
    eventHub.trigger('bar.bar1');    // --> triggers: myFunc3 and myFunc4
    
### Event modes

Contains available event modes. For example, if <tt>bar.foo</tt> is triggered, both event modes do the opposite
                     
                         | |                                     / \
          ---------------| |-----------------     ---------------| |-----------------
          | bar          | |                |     | bar          | |                |
          |   -----------| |-----------     |     |   -----------| |-----------     |
          |   |bar.foo   \ /          |     |     |   |bar.foo   | |          |     |
          |   -------------------------     |     |   -------------------------     |
          |        Event CAPTURING          |     |        Event BUBBLING           |
          -----------------------------------     -----------------------------------
                     
The event model implemented in this class does both, going from <tt>bubbling</tt> to the execution of all callbacks in <tt>bar.foo</tt>,
then back in <tt>capturing</tt> mode
                     
                                            | |  / \
                           -----------------| |--| |-----------------
                           | bar            | |  | |                |
                           |   -------------| |--| |-----------     |
                           |   |bar.foo     \ /  | |          |     |
                           |   --------------------------------     |
                           |               event model              |
                           ------------------------------------------
                      
    eventHub.on('bar.foo', myFunc1) ;
    eventHub.on('bar', myFunc2, { eventMode: EventHub.EVENT_MODE.CAPTURING }) ;
    eventHub.on('bar', myFunc3, { eventMode: EventHub.EVENT_MODE.BUBBLING }) ;
    eventHub.on('bar', myFunc4, { eventMode: EventHub.EVENT_MODE.BOTH }) ;
    eventHub.trigger('bar.foo') ; 
    // -> callback execution order: myFunc3, myFunc4, myFunc1, myFunc2 and myFunc4

### Gulp tasks ###

Install the dependencies as follows

    $> npm install

To minify the library

    $> gulp

