/**
 * Copyright [2013] [runrightfast.co]
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

'use strict';
var expect = require('chai').expect;

var credentials = {
	d74s3nz2873n : {
		key : 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
		algorithm : 'sha256'
	}
};

var getCredentials = function(id, callback) {

	return callback(null, credentials[id]);
};

function startServer(callback) {
	var Hapi = require('hapi');

	var manifest = {
		pack : {},
		servers : [ {
			port : 8000,
			options : {
				labels : [ 'api' ],
				auth : {
					hawk : {
						scheme : 'hawk',
						defaultMode : true,
						getCredentialsFunc : getCredentials
					}
				}
			}
		} ],
		plugins : {
			'lout' : {
				endpoint : '/api/hapi/docs'
			},
			'furball' : {
				version : false,
				plugins : '/api/hapi/plugins'
			}
		}
	};

	var composer = new Hapi.Composer(manifest);

	composer.compose(function(err) {
		if (err) {
			console.error('Failed composing servers : ' + err.message);
			callback(err);
		} else {
			console.log('Hapi is composed.');
			composer.start(function() {
				console.log('All servers started');
				callback();
			});
		}
	});

	return composer;
}

var createRestClient = function(config) {
	var rest = require('rest');
	var errorCode = require('rest/interceptor/errorCode');
	var retry = require('rest/interceptor/retry');
	var timeout = require('rest/interceptor/timeout');

	if (config.auth) {
		if (config.auth.hawk) {
			console.log('chaining hawk-auth-interceptor to rest client');
			var hawk = require('..');
			rest = rest.chain(hawk, config.auth.hawk);
		}
	}

	return rest.chain(retry, config.retry).chain(timeout, {
		timeout : config.timeout
	}).chain(errorCode);
};

describe('Hawk Interceptor', function() {
	var composer = null;

	beforeEach(function(done) {
		composer = startServer(done);
	});

	afterEach(function(done) {
		composer.stop({
			timeout : 1000
		}, function() {
			console.log('All servers stopped');
			done();
		});
	});

	it('complies with the Hawk auth protocol', function(done) {
		var client = createRestClient({
			logLevel : 'ERROR',
			auth : {
				hawk : {
					credentials : {
						id : 'd74s3nz2873n',
						key : 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
						algorithm : 'sha256'
					},
					ext : '',
					logLevel : 'DEBUG'
				}
			}
		});

		client('http://localhost:8000/api/hapi/plugins').then(function(response) {
			console.log('response.status.code = ' + response.status.code);
			done();
		}, function(response) {
			var getEntity = function() {
				try {
					JSON.parse(response.entity);
				} catch (err) {
					return response.entity;
				}
			};

			var info = {
				statusCode : response.status.code,
				statusText : response.status.text,
				entity : getEntity()
			};
			console.error('log request failed: ' + JSON.stringify(info));

			done(new Error(JSON.stringify(info)));
		});

	});

});