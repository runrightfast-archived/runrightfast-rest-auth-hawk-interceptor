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

/**
 * <code>
 * options: {
 *  hawk : {	// REQUIRED	 - config that is passed through to Hawk
 *  	 see : https://github.com/hueniverse/hawk/blob/master/lib/client.js
 *
 *		 // Required
 *
 *       credentials: {
 *           id: 'dh37fgj492je',
 *           key: 'aoijedoaijsdlaksjdl',
 *           algorithm: 'sha256'                            // 'sha1', 'sha256'
 *       },
 *
 *       // Optional
 *
 *       ext: 'application-specific',                       // Application specific data sent via the ext attribute
 *       timestamp: Date.now(),                             // A pre-calculated timestamp
 *       nonce: '2334f34f',                                 // A pre-generated nonce
 *       localtimeOffsetMsec: 400,                          // Time offset to sync with server time (ignored if timestamp provided)
 *       payload: '{"some":"payload"}',                     // UTF-8 encoded string for body hash generation (ignored if hash provided)
 *       contentType: 'application/json',                   // Payload content-type (ignored if hash provided)
 *       hash: 'U4MKKSmiVxk37JCCrAVIjV=',                   // Pre-calculated payload hash
 *       app: '24s23423f34dx',                              // Oz application id
 *       dlg: '234sz34tww3sd'                               // Oz delegated-by application id
 *  },
 *  sntp : {												// OPTIONAL - if specified, then it enables to automatically retrieve and synchronize the clock within the application on a daily basis
 *  														// can be set to an options object or a boolean - sntp: true means use default settings
 *  														// *** if enabled, then in order to stop the daily scheduled job, call sntp.stop() 
 *  														//     - either through sntp exported from this module or Hawk.sntp.stop()
 *  	
 *  	host: 'nist1-sj.ustiming.org',  					// Defaults to pool.ntp.org
 *  	port: 123,                      					// Defaults to 123 (NTP)
 *   	resolveReference: true,         					// Default to false (not resolving)
 *   	timeout: 1000                   					// Defaults to zero (no timeout)  
 *  },
 *  logLevel: 'WARN'										// OPTIONAL - Defaults to 'WARN'   								
 * } 
 * </code>
 * 
 */
(function() {
	'use strict';

	var interceptor = require('rest/interceptor');
	var Hawk = require('hawk');
	var lodash = require('lodash');
	var Hoek = require('hoek');
	var assert = Hoek.assert;
	var logging = require('runrightfast-commons').logging;
	var log = logging.getLogger('hawk-auth-interceptor.js');

	var sntpStarted = false;

	module.exports.interceptor = interceptor({
		init : function(config) {
			assert(lodash.isObject(config), 'config is required and must be an Object');
			logging.setLogLevel(log, config.logLevel || 'WARN');
			assert(!lodash.isUndefined(config.hawk.credentials), 'hawk.credentials are required');
			assert(lodash.isString(config.hawk.credentials.id), 'hawk.credentials.id is required and must be a String');
			assert(lodash.isString(config.hawk.credentials.key), 'hawk.credentials.key is required and must be a String');
			assert(lodash.isString(config.hawk.credentials.algorithm), 'hawk.credentials.algorithm is required and must be a String');

			if (config.sntp && !sntpStarted) {
				if (lodash.isBoolean(config.sntp)) {
					Hawk.sntp.start(function() {
						log.info('sntp offset = ' + (Date.now() - Hawk.sntp.now()));
					});
					sntpStarted = true;
				} else {
					throw new Error('config.sntp must be a Boolean, but was found to be : ' + (typeof config.sntp));
				}
			}

			if (log.isDebugEnabled()) {
				log.debug('init() is done - config is valid');
			}

			return config;
		},
		request : function(request, config) {
			request.headers = request.headers || {};
			var method = request.method || (request.entity ? 'POST' : 'GET');
			var header = Hawk.client.header(request.path, method, config.hawk);
			request.headers.Authorization = header.field;
			if (log.isDebugEnabled()) {
				log.debug('request(): Authorization : ' + request.headers.Authorization);
			}
			return request;
		}
	});

	module.exports.sntp = Hawk.sntp;
}());