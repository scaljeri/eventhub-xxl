[![Build Status](https://travis-ci.org/scaljeri/javascript-eventhub.png)](https://travis-ci.org/scaljeri/javascript-eventhub) 
[![Coverage Status](https://coveralls.io/repos/scaljeri/javascript-eventhub/badge.svg)](https://coveralls.io/r/scaljeri/javascript-eventhub)

Javascript Eventhub Library 

This is an Event Hub for event-based applications. It facilitates event-based communication between different 
parts of an application (Event driven system). It support AMD and runs as a node package service too!
  
Event names should have the form
                                                
    bar
    bar.foo1  // --> namespaced event name
    bar.foo2
    bar.bar1.foo1
    
To register an event do
                                                
    eventHub.on('bar', myFunc1) ;
    eventHub.on('bar.foo1', myFunc2) ;
    eventHub.on('bar.bar1', myFunc3) ;
    eventHub.on('bar.bar1.foo1', myFunc4) ;
    
Note that using namespaces facilitates triggering groups of callbacks
                                                
    eventHub.trigger('bar') ;        // --> triggers: myFunc1, myFunc2, myFunc3 and myFunc4
    eventHub.trigger('bar.bar1');    // --> triggers: myFunc3 and myFunc4
    
### Event modes

An event mode defines the propagation direction of an event. An event in capturing mode  goes from the root to the target. 
In bubbling mode the event goes from the target up to the root. Assume an event is trigger on `bar.foo`
                     
                       | |                                     / \
        ---------------| |-----------------     ---------------| |-----------------
        | bar          | |                |     | bar          | |                |
        |   -----------| |-----------     |     |   -----------| |-----------     |
        |   |bar.foo   \ /          |     |     |   |bar.foo   | |          |     |
        |   -------------------------     |     |   -------------------------     |
        |        Event CAPTURING          |     |        Event BUBBLING           |
        -----------------------------------     -----------------------------------
                     
The event model implemented does both, going from **bubbling** and executes all callbacks from `bar` and next the ones from `bar.foo`.
Then it back in **capturing** mode
                     
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
    
To run the tests

    $> gulp test
    
### Installation ###

    $> bower install javascript-eventhub

