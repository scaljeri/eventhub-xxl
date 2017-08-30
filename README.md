[![CircleCI](circleci-img)](circleci-url)
[![CircleCI](https://circleci.com/gh/scaljeri/eventhub-xxl/tree/master.svg?style=svg)](https://circleci.com/gh/scaljeri/eventhub-xxl/tree/master)

[![Coverage Status][coveralls-url]][coveralls-image] [![Dependency Status][depstat-image]][depstat-url] [![devDependency Status][depstat-dev-image]][depstat-dev-url] [![Code Climate](https://codeclimate.com/github/scaljeri/eventhub-xxl/badges/gpa.svg)](https://codeclimate.com/github/scaljeri/eventhub-xxl) [![Inline docs](http://inch-ci.org/github/scaljeri/eventhub-xxl.svg?branch=master)](http://inch-ci.org/github/scaljeri/eventhub-xxl)

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/scaljeri/javascript-eventhub?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

Javascript Eventhub Library 

This is an Event Hub for event-based applications. It facilitates event-based communication between different 
parts of an application (Event driven system). 
  
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

### Yarn tasks ###

Install the dependencies as follows

    $> yarn install 

To minify the library

    $> gulp
    
To run the tests

    $> yarn test
    
### Installation ###

    $> yarn add eventhub-xxl

[travis-url]: https://travis-ci.org/scaljeri/eventhub-xxl.png
[travis-image]: https://travis-ci.org/scaljeri/eventhub-xxl

[coveralls-url]: https://coveralls.io/repos/scaljeri/eventhub-xxl/badge.svg
[coveralls-image]: https://coveralls.io/r/scaljeri/eventhub-xxl

[depstat-url]: https://david-dm.org/scaljeri/eventhub-xxl
[depstat-image]: https://david-dm.org/scaljeri/eventhub-xxl.svg

[depstat-dev-url]: https://david-dm.org/scaljeri/eventhub-xxl#info=devDependencies
[depstat-dev-image]: https://david-dm.org/scaljeri/eventhub-xxl/dev-status.svg

[circleci-img]: https://circleci.com/gh/scaljeri/eventhub-xxl/tree/master.svg?style=svg
[circleci-url]: https://circleci.com/gh/scaljeri/eventhub-xxl/tree/master
