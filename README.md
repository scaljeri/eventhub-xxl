![Get this with Bower](https://camo.githubusercontent.com/06c5d22b7908c0c4928071ac314e75c3da29d750/687474703a2f2f62656e7363687761727a2e6769746875622e696f2f626f7765722d6261646765732f62616467654032782e706e67)

[![Build Status][travis-url]][travis-image] [![Coverage Status][coveralls-url]][coveralls-image] [![Dependency Status][depstat-image]][depstat-url] [![devDependency Status][depstat-dev-image]][depstat-dev-url] [![Code Climate](https://codeclimate.com/github/scaljeri/javascript-eventhub/badges/gpa.svg)](https://codeclimate.com/github/scaljeri/javascript-eventhub) [![Inline docs](http://inch-ci.org/github/scaljeri/javascript-eventhub.svg?branch=master)](http://inch-ci.org/github/scaljeri/javascript-eventhub)

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/scaljeri/javascript-eventhub?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

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

[![Join the chat at https://gitter.im/scaljeri/javascript-eventhub](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/scaljeri/javascript-eventhub?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

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

[travis-url]: https://travis-ci.org/scaljeri/javascript-eventhub.png
[travis-image]: https://travis-ci.org/scaljeri/javascript-eventhub

[coveralls-url]: https://coveralls.io/repos/scaljeri/javascript-eventhub/badge.svg
[coveralls-image]: https://coveralls.io/r/scaljeri/javascript-eventhub

[depstat-url]: https://david-dm.org/scaljeri/javascript-eventhub
[depstat-image]: https://david-dm.org/scaljeri/javascript-eventhub.svg

[depstat-dev-url]: https://david-dm.org/scaljeri/javascript-eventhub#info=devDependencies
[depstat-dev-image]: https://david-dm.org/scaljeri/javascript-eventhub/dev-status.svg
