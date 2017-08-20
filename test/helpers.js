import chai from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import assertArrays from 'chai-arrays';
import {beforeEach, describe, it} from "mocha";
import {EventHub} from '../src/eventhub';

let should = chai.should();
chai.use(assertArrays);
chai.use(sinonChai);

export {EventHub, chai, sinon, should, beforeEach, describe, it};