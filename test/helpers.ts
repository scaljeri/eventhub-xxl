import chai = require('chai');
import assertArrays = require('chai-arrays');
import sinonChai = require('sinon-chai');

import * as sinon from 'sinon';

import {beforeEach, describe, it, after, before} from "mocha";
import {EventHub} from '../src/eventhub';

let should = chai.should();
chai.use(assertArrays);
chai.use(sinonChai);

export {EventHub, chai, should, beforeEach, describe, it, after, before, sinon};