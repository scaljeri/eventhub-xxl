const EventHub = require('eventhub-xxl').EventHub;

const eh = new EventHub();

function myFuncA(state) {console.log('FuncA: ' + state)}
function myFuncB(state) {console.log('FuncB: ' + state)}
function myFuncC(state) {console.log('FuncC: ' + state)}

eh.on('foo', myFuncA, {phase: EventHub.PHASES.BUBBLING});
eh.on('foo.bar', myFuncB, {phase: EventHub.PHASES.CAPTURING});
eh.on('foo.bar.baz', myFuncC);

eh.trigger('foo.bar.baz', 'ok');
