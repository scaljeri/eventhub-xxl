[![CircleCI][circleci-img]][circleci-url]

[![Coverage Status][coveralls-url]][coveralls-image] [![devDependency Status][depstat-dev-image]][depstat-dev-url] 

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/scaljeri/javascript-eventhub?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

Javascript Eventhub Library 

This is an Event Hub for event-based applications. It facilitates event-based communication between different 
parts of an application (Event driven system). 

To register a callback for an event run

    import {EventHub} from 'eventhub-xxl';
    
    const eh = new EventHub();
    
    eh.on('login', myFunc);
    
and to trigger

    eh.trigger('login', 'success');
    
`succes` is the data given to `myFunc`. 

But, event names can be namespaced
  
    bar.foo.baz
    
`bar.foo` is the namespace and `baz` the actual event name. Now you can still do

    eh.on('bar.foo.baz', myFunc);
    
    eh.trigger('bar.foo.baz');
    
and it will also trigger `myFunc` but namespaces will give you some extra power which is described in the `Phases` section below
    
### Event phases
If the event `bar.foo` is triggered, the namespace is traversed in a so called `CAPTURING` and `BUBBLING` phase

                       | |                                     / \
        ---------------| |-----------------     ---------------| |-----------------
        | bar          | |                |     | bar          | |                |
        |   -----------| |-----------     |     |   -----------| |-----------     |
        |   |bar.foo   \ /          |     |     |   |bar.foo   | |          |     |
        |   -------------------------     |     |   -------------------------     |
        |        Event CAPTURING          |     |        Event BUBBLING           |
        -----------------------------------     -----------------------------------
                     
First the events propagates in CAPTURING phase and then in BUBBLING phase
                       
                                          | |  / \
                         -----------------| |--| |-----------------
                         | bar            | |  | |                |
                         |   -------------| |--| |-----------     |
                         |   |bar.foo     \ /  | |          |     |
                         |   --------------------------------     |
                         |               event model              |
                         ------------------------------------------
                      
During these phases each callback targeted for that specific phase is executed.

Example:

    eventHub.on('bar', myFunc1);                                            
    eventHub.on('bar.foo', myFunc2, {phase: EventHub.PHASES.CAPTURING}) ;  
    eventHub.on('bar.foo', myFunc3, {phase: EventHub.PHASES.BUBBLING}) ;  
    eventHub.on('bar.foo.baz', myFunc4, {phase: EventHub.EVENT_MODE.BOTH) ;  // added to both phases
    eventHub.on('bar.foo.baz', myFunc5) ;                                    
    
    eventHub.trigger('bar.foo.baz') ; 
  
`bar.foo` is the namespace and the EventHub will begin with the CAPTURING phase, meaning it will first execute
`myFunc2`. Note that `myFunc1` is skipped, because it does not belong to a phase! The execution order is

    myFunc2     // capturing 
    myFunc5     // end-point
    myFunc3     // bubbling
    
`myFunc4` is not executed too, as it belongs to a phase and in the context of this trigger `baz` is the event, not part of the namespace!

### On and Off
As mentioned above, a callback can be registered using `on`

    eh.on('bar.foo', myFunc);
    eh.on('bar.foo', myFunc, {phase: EventHub.PHASES.CAPTURING);
    eh.on('bar.foo', myFunc, {phase: EventHub.PHASES.BUBBLING);
    eh.on('bar.foo', myFunc, {phase: EventHub.PHASES.BOTH);
    
`one` is identical, but the callback is removed after it has been executed

### Disable / Enable
Sometimes it might be useful to disable parts of the namespace. 

    eh.disable('bar.foo');
    eh.trigger('bar.foo.baz'); // Only triggers: myFunc5
    
To enable a namespace again do

    eh.enable('bar.foo')
    
Note: You cannot trigger a disabled namespace directly

### Multiple
By default it is possible to register a callback multiple times for the same event. 
This can be disabled by doing

    eh.allowMultiple(false);
    
### Traverse to children
Consider the following setup

    eh.on('bar', funcA, {phase: EventHub.PHASES.BOTH);
    eh.on('bar.foo', funcB);
    eh.on('bar.foo.baz', funcc, {phase: EventHub.PHASES.BOTH);
    eh.on('bar.foo.baz.moz', funD);
    
With the `traverse` option set

    eh.trigger('bar.foo', { traverse: true });
    
it will trigger the following sequence of callbacks

    funcA
    funcB
    funcD
    funcA
    
So, this option will traverse deeper into the namespace and only triggers callbacks without a phase.

### Fake it
A `trigger`, an `off`, an `on` or `one` can be simulated, meaning no callbacks are actually triggered,
added or removed

    eh.fake.trigger('bar.foo.ba'); 
    
but it will return the amount of callbacks triggered.

### Yarn tasks ###

Install the dependencies as follows

    $> yarn install 

To build and minify

    $> yarn build
    
To run the tests

    $> yarn test
    
### Installation ###

    $> yarn add eventhub-xxl
    
and import it into your project as follows

    import { EventHub } from 'eventhub-xxl';
    
or with ES5

    var EventHub = require('eventhub-xxl').EventHub;
    
### Run in the browser
There are a couple of ways to run this library in the browser. 

  a) If you use `import` or `require` in you project
  
    import { EventHub } from 'eventhub-xxl';
   
    var EventHub = require('eventhub-xxl').EventHub;
   
   you need to `browserify` it first. For es2015 use [babelify](https://github.com/babel/babelify) 
   
    $> ./node_modules/.bin/browserify index.js -o bundle.js -t [ babelify --presets [ env ] ]
    
  and for es5 you only need to do
  
    $> ./node_modules/.bin/browserify index.js -o bundle.js
    
  b) With RequireJs you have to use the [UMD](https://github.com/umdjs/umd) [named module](http://requirejs.org/docs/api.html#modulename) 
  
      requirejs.config({
          paths: {
              xxl: './node_modules/eventhub-xxl/dist/eventhub.umd.min'
          }
      });
  
      requirejs(['xxl'], function(xxl) {
          var EventHub = xxl.EventHub;
          ...
      });
      
   
  c) or without any loaders by simply adding a script element
   
    <script src="./node_modules/eventhub-xxl/dist/eventhub.umd.min.js"></script>
    <script>
        var EventHub = xxl.EventHub;
        ...
    </script> 
  

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
