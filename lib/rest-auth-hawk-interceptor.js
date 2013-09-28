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
 * Config Options <code>
 * 	credentials		REQUIRED - see https://github.com/hueniverse/hawk#usage-example - object with the following properties: id, key, algorithm
 * 					For example:
 * 
 * 						credentials : {
 *						    id: 'dh37fgj492je',
 *						    key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
 *						    algorithm: 'sha256'
 *						}
 *
 *	ext				OPTIONAL - app specific data, e.g., a session id
 * 
 * </code>
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

	module.exports = interceptor({
		init : function(config) {
			logging.setLogLevel(log, config.logLevel || 'WARN');
			assert(!lodash.isUndefined(config.credentials), 'credentials are required');
			assert(lodash.isString(config.credentials.id), 'credentials.id is required and must be a String');
			assert(lodash.isString(config.credentials.key), 'credentials.key is required and must be a String');
			assert(lodash.isString(config.credentials.algorithm), 'credentials.algorithm is required and must be a String');

			if (log.isDebugEnabled()) {
				log.debug('init() is done - config is valid');
			}

			return config;
		},
		request : function(request, config) {
			request.headers = request.headers || {};
			var method = request.method || (request.entity ? 'POST' : 'GET');
			var header = Hawk.client.header(request.path, method, config);
			request.headers.Authorization = header.field;
			if (log.isDebugEnabled()) {
				log.debug('request(): Authorization : ' + request.headers.Authorization);
			}
			return request;
		}
	});
}());