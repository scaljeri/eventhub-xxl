[![CircleCI][circleci-img]][circleci-url]

[![Coverage Status][coveralls-url]][coveralls-image] [![devDependency Status][depstat-dev-image]][depstat-dev-url] [![Inline docs](http://inch-ci.org/github/scaljeri/eventhub-xxl.svg?branch=master)](http://inch-ci.org/github/scaljeri/eventhub-xxl)

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
    
With namespaces it is possible to trigger groups of callbacks
                                                
    eventHub.trigger('bar') ;        // --> triggers: myFunc1, myFunc2, myFunc3 and myFunc4
    eventHub.trigger('bar.bar1');    // --> triggers: myFunc3 and myFunc4
    
### Event phases

The traversal of event namespaces can be split into three different types:

    CAPTURING
    BUBBLING
    CAPTURING and BUBBLING => BOTH

For example, if `bar.foo` is triggered, CAPTURING and BUBBLING do the opposite and are executed
one after the other as follows

                       | |                                     / \
        ---------------| |-----------------     ---------------| |-----------------
        | bar          | |                |     | bar          | |                |
        |   -----------| |-----------     |     |   -----------| |-----------     |
        |   |bar.foo   \ /          |     |     |   |bar.foo   | |          |     |
        |   -------------------------     |     |   -------------------------     |
        |        Event CAPTURING          |     |        Event BUBBLING           |
        -----------------------------------     -----------------------------------
                     
When an event is triggered, first the events propagates in CAPTURING phase and then in BUBBLING phase
                       
                                          | |  / \
                         -----------------| |--| |-----------------
                         | bar            | |  | |                |
                         |   -------------| |--| |-----------     |
                         |   |bar.foo     \ /  | |          |     |
                         |   --------------------------------     |
                         |               event model              |
                         ------------------------------------------
                      
    eventHub.on('bar.foo', myFunc1) ;
    eventHub.on('bar', myFunc2, { phase: EventHub.PHASES.CAPTURING }) ;
    eventHub.on('bar', myFunc3, { phase: EventHub.PHASES.BUBBLING }) ;
    eventHub.on('bar', myFunc4, { phase: EventHub.PHASES.BOTH }) ;
    eventHub.on('bar.foo', myFuncXYZ, { eventMode: EventHub.EVENT_MODE.BOTH) ;
    eventHub.trigger('bar.foo') ; 
    
Callback execution order:

    myFunc2     // capturing 
    myFunc4     // capturing
    myFunc1     // end-point
    myFunc3     // bubbling
    myFunc4     // bubbling
    
Callbacks which belong to an phase can't be triggered directly, which is why `myFuncXYZ` was not executed

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
[coveralls-image]: https://coveralls.io/github/scaljeri/eventhub-xxl?branch=master

[depstat-url]: https://david-dm.org/scaljeri/eventhub-xxl
[depstat-image]: https://david-dm.org/scaljeri/eventhub-xxl.svg

[depstat-dev-url]: https://david-dm.org/scaljeri/eventhub-xxl#info=devDependencies
[depstat-dev-image]: https://david-dm.org/scaljeri/eventhub-xxl/dev-status.svg

[circleci-img]: https://circleci.com/gh/scaljeri/eventhub-xxl/tree/master.svg?style=svg
[circleci-url]: https://circleci.com/gh/scaljeri/eventhub-xxl/tree/master
