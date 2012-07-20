(function( can, window, undefined ){
YUI().add("can", function(Y) {
can.Y = Y;

	// Register as an AMD module if supported, otherwise attach to the window
	if ( typeof define === "function" && define.amd ) {
		define( "can", [], function () { return can; } );
	} else {
		window.can = can;
	}

;

	// deferred.js
	// ---------
	// _Lightweight, jQuery style deferreds._
	
	var Deferred = function( func ) {
		if ( ! ( this instanceof Deferred ))
			return new Deferred();

		this._doneFuncs = [];
		this._failFuncs = [];
		this._resultArgs = null;
		this._status = "";

		// Check for option `function` -- call it with this as context and as first 
		// parameter, as specified in jQuery API.
		func && func.call(this, this);
	};
	can.Deferred = Deferred;
	can.when = Deferred.when = function() {
		var args = can.makeArray( arguments );
		if (args.length < 2) {
			var obj = args[0];
			if (obj && ( can.isFunction( obj.isResolved ) && can.isFunction( obj.isRejected ))) {
				return obj;			
			} else {
				return Deferred().resolve(obj);
			}
		} else {
			
			var df = Deferred(),
				done = 0,
				// Resolve params -- params of each resolve, we need to track them down 
				// to be able to pass them in the correct order if the master 
				// needs to be resolved.
				rp = [];

			can.each(args, function(arg, j){
				arg.done(function() {
					rp[j] = (arguments.length < 2) ? arguments[0] : arguments;
					if (++done == args.length) {
						df.resolve.apply(df, rp);
					}
				}).fail(function() {
					df.reject(arguments);
				});
			});

			return df;
			
		}
	}
	
	var resolveFunc = function(type, _status){
		return function(context){
			var args = this._resultArgs = (arguments.length > 1) ? arguments[1] : [];
			return this.exec(context, this[type], args, _status);
		}
	},
	doneFunc = function(type, _status){
		return function(){
			var self = this;
			// In Safari, the properties of the `arguments` object are not enumerable, 
			// so we have to convert arguments to an `Array` that allows `can.each` to loop over them.
			can.each(Array.prototype.slice.call(arguments), function( v, i, args ) {
				if ( ! v )
					return;
				if ( v.constructor === Array ) {
					args.callee.apply(self, v)
				} else {
					// Immediately call the `function` if the deferred has been resolved.
					if (self._status === _status)
						v.apply(self, self._resultArgs || []);
	
					self[type].push(v);
				}
			});
			return this;
		}
	};

	can.extend( Deferred.prototype, {
		pipe : function(done, fail){
			var d = can.Deferred();
			this.done(function(){
				d.resolve( done.apply(this, arguments) );
			});
			
			this.fail(function(){
				if(fail){
					d.reject( fail.apply(this, arguments) );
				} else {
					d.reject.apply(d, arguments);
				}
			});
			return d;
		},
		resolveWith : resolveFunc("_doneFuncs","rs"),
		rejectWith : resolveFunc("_failFuncs","rj"),
		done : doneFunc("_doneFuncs","rs"),
		fail : doneFunc("_failFuncs","rj"),
		always : function() {
			var args = can.makeArray(arguments);
			if (args.length && args[0])
				this.done(args[0]).fail(args[0]);

			return this;
		},

		then : function() {
			var args = can.makeArray( arguments );
			// Fail `function`(s)
			if (args.length > 1 && args[1])
				this.fail(args[1]);

			// Done `function`(s)
			if (args.length && args[0])
				this.done(args[0]);

			return this;
		},

		isResolved : function() {
			return this._status === "rs";
		},

		isRejected : function() {
			return this._status === "rj";
		},

		reject : function() {
			return this.rejectWith(this, arguments);
		},

		resolve : function() {
			return this.resolveWith(this, arguments);
		},

		exec : function(context, dst, args, st) {
			if (this._status !== "")
				return this;

			this._status = st;

			can.each(dst, function(d){
				d.apply(context, args);
			});

			return this;
		}
	});

	can.each = function (elements, callback, context) {
		var i = 0,
		    key;
		if (elements) {
			if (typeof elements.length == 'number' && elements.pop) {
				elements.attr && elements.attr('length');
				for (var len = elements.length; i < len; i++) {
					if (callback.call(context || elements[i], elements[i], i, elements) === false) {
						break;
					}
				}
			} else {
				for (key in elements) {
					if (callback.call(context || elements[i], elements[key], key, elements) === false) {
						break;
					}
				}
			}
		}
		return elements;
	}
;

	// event.js
	// ---------
	// _Basic event wrapper._
can.addEvent = function(event, fn){
	if(!this.__bindEvents){
		this.__bindEvents = {};
	}
	var eventName = event.split(".")[0];
	
	if(!this.__bindEvents[eventName]){
		this.__bindEvents[eventName] = [];
	}
	this.__bindEvents[eventName].push({
		handler: fn,
		name: event
	});
	return this;
};
can.removeEvent = function(event, fn){
	if(!this.__bindEvents){
		return;
	}
	var i =0,
		events = this.__bindEvents[event.split(".")[0]],
		ev;
	while(i < events.length){
		ev = events[i]
		if((fn && ev.handler === fn) || (!fn && ev.name === event)){
			events.splice(i, 1);
		} else {
			i++;
		}
	}	
	return this;
};
can.dispatch = function(event){
	if(!this.__bindEvents){
		return;
	}
	
	var eventName = event.type.split(".")[0],
		handlers = (this.__bindEvents[eventName] || []).slice(0),
		self= this,
		args = [event].concat(event.data || []);
		
	can.each(handlers, function(ev){
		event.data = args.slice(1);
		ev.handler.apply(self, args);
	});
}

;

		// ---------
		// _YUI node list._
		// `can.Y` is set as part of the build process.
		// `YUI().use('*')` is called for when `YUI` is statically loaded (like when running tests).
		var Y = can.Y = can.Y || YUI().use('*');

		// Map string helpers.
		can.trim = function( s ) {
			return Y.Lang.trim(s);
		}

		// Map array helpers.
		can.makeArray = function( arr ) {
			return Y.Array(arr);
		};
		can.isArray = Y.Lang.isArray;
		can.inArray = function( item, arr ) {
			return Y.Array.indexOf(arr, item);
		};

		can.map = function( arr, fn ) {
			return Y.Array.map(can.makeArray(arr || []), fn);
		};

		// Map object helpers.
		can.extend = function( first ) {
			var deep = first === true ? 1 : 0,
				target = arguments[deep],
				i = deep + 1,
				arg;
			for (; arg = arguments[i]; i++ ) {
				Y.mix(target, arg, true, null, null, !! deep);
			}
			return target;
		}
		can.param = function( object ) {
			return Y.QueryString.stringify(object, {arrayKey: true})
		}
		can.isEmptyObject = function( object ) {
			return Y.Object.isEmpty(object);
		}

		// Map function helpers.
		can.proxy = function( func, context ) {
			return Y.bind.apply(Y, arguments);
		}
		can.isFunction = function( f ) {
			return Y.Lang.isFunction(f);
		}

		// Element -- get the wrapped helper.
		var prepareNodeList = function( nodelist ) {
			nodelist.each(function( node, i ) {
				nodelist[i] = node.getDOMNode();
			});
			nodelist.length = nodelist.size();
			return nodelist;
		}
		can.$ = function( selector ) {
			if ( selector === window ) {
				return window;
			} else if ( selector instanceof Y.NodeList ) {
				return prepareNodeList(selector);
			} else if ( typeof selector === "object" && !can.isArray(selector) && typeof selector.nodeType === "undefined" && !selector.getDOMNode ) {
				return selector;
			} else {
				return prepareNodeList(Y.all(selector));
			}
		}
		can.get = function( wrapped, index ) {
			return wrapped._nodes[index];
		}
		can.buildFragment = function( html, node ) {
			var owner = node && node.ownerDocument,
				frag = Y.Node.create(html, owner);
			frag = (frag && frag.getDOMNode()) || document.createDocumentFragment();
			if ( frag.nodeType !== 11 ) {
				var tmp = document.createDocumentFragment();
				tmp.appendChild(frag)
				frag = tmp;
			}
			return frag;
		}
		can.append = function( wrapped, html ) {
			wrapped.each(function( node ) {
				if ( typeof html === 'string' ) {
					html = can.buildFragment(html, node)
				}
				node.append(html)
			});
		}
		can.addClass = function( wrapped, className ) {
			return wrapped.addClass(className);
		}
		can.data = function( wrapped, key, value ) {
			if ( value === undefined ) {

				return wrapped.item(0).getData(key)
			} else {
				return wrapped.item(0).setData(key, value)
			}
		}
		can.remove = function( wrapped ) {
			return wrapped.remove() && wrapped.destroy();
		}
		// Destroyed method.
		can._yNodeDestroy = can._yNodeDestroy || Y.Node.prototype.destroy;
		Y.Node.prototype.destroy = function() {
			can.trigger(this, "destroyed", [], false)
			can._yNodeDestroy.apply(this, arguments)
		}
		// Let `nodelist` know about the new destroy...
		Y.NodeList.addMethod("destroy", Y.Node.prototype.destroy);

		// Ajax
		var optionsMap = {
			type: "method",
			success: undefined,
			error: undefined
		}
		var updateDeferred = function( request, d ) {
			// `YUI` only returns a request if it is asynchronous.
			if ( request && request.io ) {
				var xhr = request.io;
				for ( var prop in xhr ) {
					if ( typeof d[prop] == 'function' ) {
						d[prop] = function() {
							xhr[prop].apply(xhr, arguments)
						}
					} else {
						d[prop] = prop[xhr]
					}
				}
			}
		}
		can.ajax = function( options ) {
			var d = can.Deferred(),
				requestOptions = can.extend({}, options);

			for ( var option in optionsMap ) {
				if ( requestOptions[option] !== undefined ) {
					requestOptions[optionsMap[option]] = requestOptions[option];
					delete requestOptions[option]
				}
			}
			requestOptions.sync = !options.async;

			var success = options.success,
				error = options.error;

			requestOptions.on = {
				success: function( transactionid, response ) {
					var data = response.responseText;
					if ( options.dataType === 'json' ) {
						data = eval("(" + data + ")")
					}
					updateDeferred(request, d);
					d.resolve(data, "success", request);
					success && success(data, "success", request);
				},
				failure: function( transactionid, response ) {
					updateDeferred(request, d);
					d.reject(request, "error");
					error && error(request, "error");
				}
			};

			var request = Y.io(requestOptions.url, requestOptions);
			updateDeferred(request, d);
			return d;

		}

		// Events - The `id` of the `function` to be bound, used as an expando on the `function`
		// so we can lookup it's `remove` object.
		var id = 0,
			// Takes a node list, goes through each node
			// and adds events data that has a map of events to 
			// `callbackId` to `remove` object.  It looks like
			// `{click: {5: {remove: fn}}}`. 
			addBinding = function( nodelist, selector, ev, cb ) {
				if ( nodelist instanceof Y.NodeList || !nodelist.on || nodelist.getDOMNode ) {
					nodelist.each(function( node ) {
						var node = can.$(node);
						var events = can.data(node, "events"),
							eventName = ev + ":" + selector;
						if (!events ) {
							can.data(node, "events", events = {});
						}
						if (!events[eventName] ) {
							events[eventName] = {};
						}
						if ( cb.__bindingsIds === undefined ) {
							cb.__bindingsIds = id++;
						}
						events[eventName][cb.__bindingsIds] = selector ? node.item(0).delegate(ev, cb, selector) : node.item(0).on(ev, cb);
					});
				} else {
					var obj = nodelist,
						events = obj.__canEvents = obj.__canEvents || {};
					if (!events[ev] ) {
						events[ev] = {};
					}
					if ( cb.__bindingsIds === undefined ) {
						cb.__bindingsIds = id++;
					}
					events[ev][cb.__bindingsIds] = obj.on(ev, cb);
				}
			},
			// Removes a binding on a `nodelist` by finding
			// the remove object within the object's data.
			removeBinding = function( nodelist, selector, ev, cb ) {
				if ( nodelist instanceof Y.NodeList || !nodelist.on || nodelist.getDOMNode ) {
					nodelist.each(function( node ) {
						var node = can.$(node),
							events = can.data(node, "events"),
							eventName = ev + ":" + selector,
							handlers = events[eventName],
							handler = handlers[cb.__bindingsIds];
						handler.detach();
						delete handlers[cb.__bindingsIds];
						if ( can.isEmptyObject(handlers) ) {
							delete events[ev];
						}
						if ( can.isEmptyObject(events) ) {}
					});
				} else {
					var obj = nodelist,
						events = obj.__canEvents || {},
						handlers = events[ev],
						handler = handlers[cb.__bindingsIds];
					handler.detach();
					delete handlers[cb.__bindingsIds];
					if ( can.isEmptyObject(handlers) ) {
						delete events[ev];
					}
					if ( can.isEmptyObject(events) ) {}
				}
			}
			can.bind = function( ev, cb ) {
				// If we can bind to it...
				if ( this.bind && this.bind !== can.bind ) {
					this.bind(ev, cb)
				} else if ( this.on || this.nodeType ) {
					addBinding(can.$(this), undefined, ev, cb)
				} else if ( this.addEvent ) {
					this.addEvent(ev, cb)
				} else {
					// Make it bind-able...
					can.addEvent.call(this, ev, cb)
				}
				return this;
			}
			can.unbind = function( ev, cb ) {
				// If we can bind to it...
				if ( this.unbind && this.unbind !== can.unbind ) {
					this.unbind(ev, cb)
				}

				else if ( this.on || this.nodeType ) {
					removeBinding(can.$(this), undefined, ev, cb);
				} else {
					// Make it bind-able...
					can.removeEvent.call(this, ev, cb)
				}
				return this;
			}
			can.trigger = function( item, event, args, bubble ) {
				if ( item instanceof Y.NodeList ) {
					item = item.item(0);
				}
				if ( item.getDOMNode ) {
					item = item.getDOMNode();
				}

				if ( item.nodeName ) {
					item = Y.Node(item);
					if ( bubble === false ) {
						// Force stop propagation by listening to `on` and then 
						// immediately disconnecting
						item.once(event, function( ev ) {
							ev.stopPropagation && ev.stopPropagation();
							ev.cancelBubble = true;
							ev._stopper && ev._stopper();
						})
					}
					realTrigger(item.getDOMNode(), event, {})
				} else {
					if ( typeof event === 'string' ) {
						event = {
							type: event
						}
					}
					event.target = event.target || item
					event.data = args
					can.dispatch.call(item, event)
				}
			};
		// Allow `dom` `destroyed` events.
		Y.mix(Y.Node.DOM_EVENTS, {
			destroyed: true
		});

		can.delegate = function( selector, ev, cb ) {
			if ( this.on || this.nodeType ) {
				addBinding(can.$(this), selector, ev, cb)
			} else if ( this.delegate ) {
				this.delegate(selector, ev, cb)
			}
			return this;
		}
		can.undelegate = function( selector, ev, cb ) {
			if ( this.on || this.nodeType ) {
				removeBinding(can.$(this), selector, ev, cb);
			} else if ( this.undelegate ) {
				this.undelegate(selector, ev, cb)
			}
			return this;
		}

		// `realTrigger` taken from `dojo`.
		var leaveRe = /mouse(enter|leave)/,
			_fix = function( _, p ) {
				return "mouse" + (p == "enter" ? "over" : "out");
			},
			realTrigger = document.createEvent ?
			function( n, e, a ) {
				// the same branch
				var ev = document.createEvent("HTMLEvents");
				e = e.replace(leaveRe, _fix);
				ev.initEvent(e, true, true);
				a && can.extend(ev, a);
				n.dispatchEvent(ev);
			} : function( n, e, a ) {
				// the janktastic branch
				var ev = "on" + e,
					stop = false,
					lc = e.toLowerCase(),
					node = n;
				try {
					// FIXME: is this worth it? for mixed-case native event support:? Opera ends up in the
					// createEvent path above, and also fails on _some_ native-named events.
					// if(lc !== e && d.indexOf(d.NodeList.events, lc) >= 0){
					// // if the event is one of those listed in our NodeList list
					// // in lowercase form but is mixed case, throw to avoid
					// // fireEvent. /me sighs. http://gist.github.com/315318
					// throw("janktastic");
					// }
					n.fireEvent(ev);
				} catch (er) {
					// a lame duck to work with. we're probably a 'custom event'
					var evdata = can.extend({
						type: e,
						target: n,
						faux: true,
						// HACK: [needs] added support for customStopper to _base/event.js
						// some tests will fail until del._stopPropagation has support.
						_stopper: function() {
							stop = this.cancelBubble;
						}
					}, a);
					realTriggerHandler(n, e, evdata);

					// handle bubbling of custom events, unless the event was stopped.
					while (!stop && n !== document && n.parentNode ) {
						n = n.parentNode;
						realTriggerHandler(n, e, evdata);
						//can.isFunction(n[ev]) && n[ev](evdata);
					}
				}
			},
			realTriggerHandler = function( n, e, evdata ) {
				var node = Y.Node(n),
					handlers = can.Y.Event.getListeners(node._yuid, e);
				if ( handlers ) {
					for ( var i = 0; i < handlers.length; i++ ) {
						handlers[i].fire(evdata)
					}
				}
			};

	
	// returns the
    // - observes and attr methods are called by func
	// - the value returned by func
	// ex: `{value: 100, observed: [{obs: o, attr: "completed"}]}`
	var getValueAndObserved = function(func, self){
		
		var oldReading;
		if (can.Observe) {
			// Set a callback on can.Observe to know
			// when an attr is read.
			// Keep a reference to the old reader
			// if there is one.  This is used
			// for nested live binding.
			oldReading = can.Observe.__reading;
			can.Observe.__reading = function(obj, attr){
				// Add the observe and attr that was read
				// to `observed`
				observed.push({
					obj: obj,
					attr: attr
				});
			}
		}
		
		var observed = [],
			// Call the "wrapping" function to get the value. `observed`
			// will have the observe/attribute pairs that were read.
			value = func.call(self);

		// Set back so we are no longer reading.
		if(can.Observe){
			can.Observe.__reading = oldReading;
		}
		return {
			value : value,
			observed : observed
		}
	},
		// Calls `callback(newVal, oldVal)` everytime an observed property
		// called within `getterSetter` is changed and creates a new result of `getterSetter`.
		// Also returns an object that can teardown all event handlers.
		computeBinder = function(getterSetter, context, callback){
			// track what we are observing
			var observing = {},
				// a flag indicating if this observe/attr pair is already bound
				matched = true,
				// the data to return 
				data = {
					// we will maintain the value while live-binding is taking place
					value : undefined,
					// a teardown method that stops listening
					teardown: function(){
						for ( var name in observing ) {
							var ob = observing[name];
							ob.observe.obj.unbind(ob.observe.attr, onchanged);
							delete observing[name];
						}
					}
				};
			
			// when a property value is cahnged
			var onchanged = function(){
				// store the old value
				var oldValue = data.value,
					// get the new value
					newvalue = getValueAndBind();
				// update the value reference (in case someone reads)
				data.value = newvalue
				// if a change happened
				if(newvalue !== oldValue){
					callback(newvalue, oldValue);
				};
			};
			
			// gets the value returned by `getterSetter` and also binds to any attributes
			// read by the call
			var getValueAndBind = function(){
				var info = getValueAndObserved( getterSetter, context ),
					newObserveSet = info.observed;
				
				var value = info.value;
				matched = !matched;
				
				// go through every attribute read by this observe
				can.each(newObserveSet, function(ob){
					// if the observe/attribute pair is being observed
					if(observing[ob.obj._cid+"|"+ob.attr]){
						// mark at as observed
						observing[ob.obj._cid+"|"+ob.attr].matched = matched;
					} else {
						// otherwise, set the observe/attribute on oldObserved, marking it as being observed
						observing[ob.obj._cid+"|"+ob.attr] = {
							matched: matched,
							observe: ob
						};
						ob.obj.bind(ob.attr, onchanged)
					}
				});
				
				// Iterate through oldObserved, looking for observe/attributes
				// that are no longer being bound and unbind them
				for ( var name in observing ) {
					var ob = observing[name];
					if(ob.matched !== matched){
						ob.observe.obj.unbind(ob.observe.attr, onchanged);
						delete observing[name];
					}
				}
				return value;
			}
			// set the initial value
			data.value = getValueAndBind();
			data.isListening = ! can.isEmptyObject(observing);
			return data;
		}
	
	// if no one is listening ... we can not calculate every time
		can.compute = function(getterSetter, context){
		if(getterSetter.isComputed){
			return getterSetter;
		}
		// get the value right away
		// TODO: eventually we can defer this until a bind or a read
		var computedData,
			bindings = 0,
			computed,
			canbind = true;
		if(typeof getterSetter === "function"){
			computed = function(value){
				if(value === undefined){
					// we are reading
					if(computedData){
						return computedData.value;
					} else {
						return getterSetter.call(context || this)
					}
				} else {
					return getterSetter.apply(context || this, arguments)
				}
			}
			
		} else {
			// we just gave it a value
			computed = function(val){
				if(val === undefined){
					return getterSetter;
				} else {
					var old = getterSetter;
					getterSetter = val;
					if( old !== val){
						can.trigger(computed, "change",[val, old]);
					}
					
					return val;
				}
				
			}
			canbind = false;
		}
				computed.isComputed = true;
		

				computed.bind = function(ev, handler){
			can.addEvent.apply(computed, arguments);
			if( bindings === 0 && canbind){
				// setup live-binding
				computedData = computeBinder(getterSetter, context || this, function(newValue, oldValue){
					can.trigger(computed, "change",[newValue, oldValue])
				});
			}
			bindings++;
		}
				computed.unbind = function(ev, handler){
			can.removeEvent.apply(computed, arguments);
			bindings--;
			if( bindings === 0 && canbind){
				computedData.teardown();
			}
			
		};
		return computed;
	};
	can.compute.binder = computeBinder;

	// ##string.js
	// _Miscellaneous string utility functions._  
	
	// Several of the methods in this plugin use code adapated from Prototype
	// Prototype JavaScript framework, version 1.6.0.1.
	// © 2005-2007 Sam Stephenson
	var undHash     = /_|-/,
		colons      = /\=\=/,
		words       = /([A-Z]+)([A-Z][a-z])/g,
		lowUp       = /([a-z\d])([A-Z])/g,
		dash        = /([a-z\d])([A-Z])/g,
		replacer    = /\{([^\}]+)\}/g,
		quote       = /"/g,
		singleQuote = /'/g,

		// Returns the `prop` property from `obj`.
		// If `add` is true and `prop` doesn't exist in `obj`, create it as an 
		// empty object.
		getNext = function( obj, prop, add ) {
			return prop in obj ?
				obj[ prop ] : 
				( add && ( obj[ prop ] = {} ));
		},

		// Returns `true` if the object can have properties (no `null`s).
		isContainer = function( current ) {
			return (/^f|^o/).test( typeof current );
		};

		can.extend(can, {
			// Escapes strings for HTML.
						esc : function( content ) {
				return ( "" + content )
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(quote, '&#34;')
					.replace(singleQuote, "&#39;");
			},
			
						getObject : function( name, roots, add ) {
			
				// The parts of the name we are looking up  
				// `['App','Models','Recipe']`
				var parts = name ? name.split('.') : [],
				    length =  parts.length,
				    current,
				    r = 0,
				    ret, i;

				// Make sure roots is an `array`.
				roots = can.isArray(roots) ? roots : [roots || window];
				
				if ( ! length ) {
					return roots[0];
				}

				// For each root, mark it as current.
				while ( current = roots[r++] ) {

					// Walk current to the 2nd to last object or until there 
					// is not a container.
					for (i =0; i < length - 1 && isContainer( current ); i++ ) {
						current = getNext( current, parts[i], add );
					}

					// If we can get a property from the 2nd to last object...
					if( isContainer(current) ) {
						
						// Get (and possibly set) the property.
						ret = getNext(current, parts[i], add); 
						
						// If there is a value, we exit.
						if ( ret !== undefined ) {
							// If `add` is `false`, delete the property
							if ( add === false ) {
								delete current[parts[i]];
							}
							return ret;
							
						}
					}
				}
			},
			// Capitalizes a string.
						capitalize: function( s, cache ) {
				// Used to make newId.
				return s.charAt(0).toUpperCase() + s.slice(1);
			},
			
			// Underscores a string.
						underscore: function( s ) {
				return s
					.replace(colons, '/')
					.replace(words, '$1_$2')
					.replace(lowUp, '$1_$2')
					.replace(dash, '_')
					.toLowerCase();
			},
			// Micro-templating.
						sub: function( str, data, remove ) {

				var obs = [];

				obs.push( str.replace( replacer, function( whole, inside ) {

					// Convert inside to type.
					var ob = can.getObject( inside, data, remove === undefined? remove : !remove );
					
					// If a container, push into objs (which will return objects found).
					if ( isContainer( ob ) ) {
						obs.push( ob );
						return "";
					} else {
						return "" + ob;
					}
				}));
				
				return obs.length <= 1 ? obs[0] : obs;
			},

			// These regex's are used throughout the rest of can, so let's make
			// them available.
			replacer : replacer,
			undHash : undHash
		});

	// ## view.js
	// `can.view`  
	// _Templating abstraction._

	var isFunction = can.isFunction,
		makeArray = can.makeArray,
		// Used for hookup `id`s.
		hookupId = 1,
		$view = can.view = function(view, data, helpers, callback){
		// Get the result.
		var result = $view.render(view, data, helpers, callback);
		if(can.isDeferred(result)){
			return result.pipe(function(result){
				return $view.frag(result);
			})
		}
		
		// Convert it into a dom frag.
		return $view.frag(result);
	};

	can.extend( $view, {
		// creates a frag and hooks it up all at once
		frag: function(result, parentNode ){
			return $view.hookup( $view.fragment(result), parentNode );
		},
		// simply creates a frag
		// this is used internally to create a frag
		// insert it
		// then hook it up
		fragment: function(result){
			var frag = can.buildFragment(result,document.body);
			// If we have an empty frag...
			if(!frag.childNodes.length) { 
				frag.appendChild(document.createTextNode(''))
			}
			return frag;
		},
    // Convert a path like string into something that's ok for an `element` ID.
    toId : function( src ) {
      return can.map(src.toString().split(/\/|\./g), function( part ) {
        // Dont include empty strings in toId functions
        if ( part ) {
          return part;
        }
      }).join("_");
    },
		hookup: function(fragment, parentNode ){
			var hookupEls = [],
				id, 
				func, 
				el,
				i=0;
			
			// Get all `childNodes`.
			can.each(fragment.childNodes ? can.makeArray(fragment.childNodes) : fragment, function(node){
				if(node.nodeType === 1){
					hookupEls.push(node)
					hookupEls.push.apply(hookupEls, can.makeArray( node.getElementsByTagName('*')))
				}
			});
			// Filter by `data-view-id` attribute.
			for (; el = hookupEls[i++]; ) {

				if ( el.getAttribute && (id = el.getAttribute('data-view-id')) && (func = $view.hookups[id]) ) {
					func(el, parentNode, id);
					delete $view.hookups[id];
					el.removeAttribute('data-view-id');
				}
			}
			return fragment;
		},
				hookups: {},
				hook: function( cb ) {
			$view.hookups[++hookupId] = cb;
			return " data-view-id='"+hookupId+"'";
		},
				cached: {},
		cachedRenderers: {},
				cache: true,
				register: function( info ) {
			this.types["." + info.suffix] = info;
		},
		types: {},
				ext: ".ejs",
				registerScript: function() {},
				preload: function( ) {},
				render: function( view, data, helpers, callback ) {
			// If helpers is a `function`, it is actually a callback.
			if ( isFunction( helpers )) {
				callback = helpers;
				helpers = undefined;
			}
	
			// See if we got passed any deferreds.
			var deferreds = getDeferreds(data);
	
	
			if ( deferreds.length ) { // Does data contain any deferreds?
				// The deferred that resolves into the rendered content...
				var deferred = new can.Deferred();
	
				// Add the view request to the list of deferreds.
				deferreds.push(get(view, true))
	
				// Wait for the view and all deferreds to finish...
				can.when.apply(can, deferreds).then(function( resolved ) {
					// Get all the resolved deferreds.
					var objs = makeArray(arguments),
						// Renderer is the last index of the data.
						renderer = objs.pop(),
						// The result of the template rendering with data.
						result; 
	
					// Make data look like the resolved deferreds.
					if ( can.isDeferred(data) ) {
						data = usefulPart(resolved);
					}
					else {
						// Go through each prop in data again and
						// replace the defferreds with what they resolved to.
						for ( var prop in data ) {
							if ( can.isDeferred(data[prop]) ) {
								data[prop] = usefulPart(objs.shift());
							}
						}
					}
					// Get the rendered result.
					result = renderer(data, helpers);
	
					// Resolve with the rendered view.
					deferred.resolve(result); 
					// If there's a `callback`, call it back with the result.
					callback && callback(result);
				});
				// Return the deferred...
				return deferred;
			}
			else {
				// No deferreds! Render this bad boy.
				var response, 
					// If there's a `callback` function
					async = isFunction( callback ),
					// Get the `view` type
					deferred = get(view, async);
	
				// If we are `async`...
				if ( async ) {
					// Return the deferred
					response = deferred;
					// And fire callback with the rendered result.
					deferred.then(function( renderer ) {
						callback(renderer(data, helpers))
					})
				} else {
					// if the deferred is resolved, call the cached renderer instead
					// this is because it's possible, with recursive deferreds to
					// need to render a view while its deferred is _resolving_.  A _resolving_ deferred
					// is a deferred that was just resolved and is calling back it's success callbacks.
					// If a new success handler is called while resoliving, it does not get fired by
					// jQuery's deferred system.  So instead of adding a new callback
					// we use the cached renderer.
					// We also add __view_id on the deferred so we can look up it's cached renderer.
					// In the future, we might simply store either a deferred or the cached result.
					if(deferred.isResolved() && deferred.__view_id  ){
						return $view.cachedRenderers[ deferred.__view_id ](data, helpers)
					} else {
						// Otherwise, the deferred is complete, so
						// set response to the result of the rendering.
						deferred.then(function( renderer ) {
							response = renderer(data, helpers);
						});
					}
					
				}
	
				return response;
			}
		}
	});

	// Makes sure there's a template, if not, have `steal` provide a warning.
	var	checkText = function( text, url ) {
			if ( ! text.length ) {
				
				throw "can.view: No template or empty template:" + url;
			}
		},
		// `Returns a `view` renderer deferred.  
		// `url` - The url to the template.  
		// `async` - If the ajax request should be asynchronous.  
		// Returns a deferred.
		get = function( url, async ) {
			
			
			var suffix = url.match(/\.[\w\d]+$/),
			type, 
			// If we are reading a script element for the content of the template,
			// `el` will be set to that script element.
			el, 
			// A unique identifier for the view (used for caching).
			// This is typically derived from the element id or
			// the url for the template.
			id, 
			// The ajax request used to retrieve the template content.
			jqXHR, 
			// Used to generate the response.
			response = function( text, d ) {
				// Get the renderer function.
				var func = type.renderer(id, text);
				d = d || new can.Deferred();
				
				// Cache if we are caching.
				if ( $view.cache ) {
					$view.cached[id] = d;
					d.__view_id = id;
					$view.cachedRenderers[id] = func;
				}
				d.resolve(func);
				// Return the objects for the response's `dataTypes`
				// (in this case view).
				return d;
			};

			//If the url has a #, we assume we want to use an inline template
			//from a script element and not current page's HTML
			if( url.match(/^#/) ) {
				url = url.substr(1);
			}
			// If we have an inline template, derive the suffix from the `text/???` part.
			// This only supports `<script>` tags.
			if ( el = document.getElementById(url) ) {
				suffix = "."+el.type.match(/\/(x\-)?(.+)/)[2];
			}
	
			// If there is no suffix, add one.
			if (!suffix && !$view.cached[url] ) {
				url += ( suffix = $view.ext );
			}

			if ( can.isArray( suffix )) {
				suffix = suffix[0]
			}
	
			// Convert to a unique and valid id.
			id = can.view.toId(url);
	
			// If an absolute path, use `steal` to get it.
			// You should only be using `//` if you are using `steal`.
			if ( url.match(/^\/\//) ) {
				var sub = url.substr(2);
				url = ! window.steal ? 
					"/" + sub : 
					steal.root.mapJoin(sub);
			}
	
			// Set the template engine type.
			type = $view.types[suffix];
	
			// If it is cached, 
			if ( $view.cached[id] ) {
				// Return the cached deferred renderer.
				return $view.cached[id];
			
			// Otherwise if we are getting this from a `<script>` element.
			} else if ( el ) {
				// Resolve immediately with the element's `innerHTML`.
				return response(el.innerHTML);
			} else {
				// Make an ajax request for text.
				var d = new can.Deferred();
				can.ajax({
					async: async,
					url: url,
					dataType: "text",
					error: function(jqXHR) {
						checkText("", url);
						d.reject(jqXHR);
					},
					success: function( text ) {
						// Make sure we got some text back.
						checkText(text, url);
						response(text, d)
					}
				});
				return d;
			}
		},
		// Gets an `array` of deferreds from an `object`.
		// This only goes one level deep.
		getDeferreds = function( data ) {
			var deferreds = [];

			// pull out deferreds
			if ( can.isDeferred(data) ) {
				return [data]
			} else {
				for ( var prop in data ) {
					if ( can.isDeferred(data[prop]) ) {
						deferreds.push(data[prop]);
					}
				}
			}
			return deferreds;
		},
		// Gets the useful part of a resolved deferred.
		// This is for `model`s and `can.ajax` that resolve to an `array`.
		usefulPart = function( resolved ) {
			return can.isArray(resolved) && resolved[1] === 'success' ? resolved[0] : resolved
		};
	
	
	if ( window.steal ) {
		steal.type("view js", function( options, success, error ) {
			var type = can.view.types["." + options.type],
				id = can.view.toId(options.rootSrc);

			options.text = "steal('" + (type.plugin || "can/view/" + options.type) + "').then(function($){" + "can.view.preload('" + id + "'," + options.text + ");\n})";
			success();
		})
	}

	//!steal-pluginify-remove-start
	can.extend(can.view, {
		register: function( info ) {
			this.types["." + info.suffix] = info;

			if ( window.steal ) {
				steal.type(info.suffix + " view js", function( options, success, error ) {
					var type = can.view.types["." + options.type],
						id = can.view.toId(options.rootSrc+'');

					options.text = type.script(id, options.text)
					success();
				})
			}
			can.view[info.suffix] = function(id, text){
				$view.preload(id, info.renderer(id, text) )
			}
		},
		registerScript: function( type, id, src ) {
			return "can.view.preload('" + id + "'," + $view.types["." + type].script(id, src) + ");";
		},
		preload: function( id, renderer ) {
			can.view.cached[id] = new can.Deferred().resolve(function( data, helpers ) {
				return renderer.call(data, data, helpers);
			});
		}

	});
	//!steal-pluginify-remove-end

	// ## construct.js
	// `can.Construct`  
	// _This is a modified version of
	// [John Resig's class](http://ejohn.org/blog/simple-javascript-inheritance/).  
	// It provides class level inheritance and callbacks._
	
	// A private flag used to initialize a new class instance without
	// initializing it's bindings.
	var initializing = 0;

		can.Construct = function() {
		if (arguments.length) {
			return can.Construct.extend.apply(can.Construct, arguments);
		}
	};

		can.extend(can.Construct, {
				newInstance: function() {
			// Get a raw instance object (`init` is not called).
			var inst = this.instance(),
				arg = arguments,
				args;
				
			// Call `setup` if there is a `setup`
			if ( inst.setup ) {
				args = inst.setup.apply(inst, arguments);
			}

			// Call `init` if there is an `init`  
			// If `setup` returned `args`, use those as the arguments
			if ( inst.init ) {
				inst.init.apply(inst, args || arguments);
			}

			return inst;
		},
		// Overwrites an object with methods. Used in the `super` plugin.
		// `newProps` - New properties to add.  
		// `oldProps` - Where the old properties might be (used with `super`).  
		// `addTo` - What we are adding to.
		_inherit: function( newProps, oldProps, addTo ) {
			can.extend(addTo || newProps, newProps || {})
		},
		// used for overwriting a single property.
		// this should be used for patching other objects
		// the super plugin overwrites this
		_overwrite : function(what, oldProps, propName, val){
			what[propName] = val;
		},
		// Set `defaults` as the merger of the parent `defaults` and this 
		// object's `defaults`. If you overwrite this method, make sure to
		// include option merging logic.
				setup: function( base, fullName ) {
			this.defaults = can.extend(true,{}, base.defaults, this.defaults);
		},
		// Create's a new `class` instance without initializing by setting the
		// `initializing` flag.
		instance: function() {

			// Prevents running `init`.
			initializing = 1;

			var inst = new this();

			// Allow running `init`.
			initializing = 0;

			return inst;
		},
		// Extends classes.
				extend: function( fullName, klass, proto ) {
			// Figure out what was passed and normalize it.
			if ( typeof fullName != 'string' ) {
				proto = klass;
				klass = fullName;
				fullName = null;
			}

			if ( ! proto ) {
				proto = klass;
				klass = null;
			}
			proto = proto || {};

			var _super_class = this,
				_super = this.prototype,
				name, shortName, namespace, prototype;

			// Instantiate a base class (but only create the instance,
			// don't run the init constructor).
			prototype = this.instance();
			
			// Copy the properties over onto the new prototype.
			can.Construct._inherit(proto, _super, prototype);

			// The dummy class constructor.
			function Constructor() {
				// All construction is actually done in the init method.
				if ( ! initializing ) {
					return this.constructor !== Constructor && arguments.length ?
						// We are being called without `new` or we are extending.
						arguments.callee.extend.apply(arguments.callee, arguments) :
						// We are being called with `new`.
						this.constructor.newInstance.apply(this.constructor, arguments);
				}
			}

			// Copy old stuff onto class (can probably be merged w/ inherit)
			for ( name in _super_class ) {
				if ( _super_class.hasOwnProperty(name) ) {
					Constructor[name] = _super_class[name];
				}
			}

			// Copy new static properties on class.
			can.Construct._inherit(klass, _super_class, Constructor);

			// Setup namespaces.
			if ( fullName ) {

				var parts = fullName.split('.'),
					shortName = parts.pop(),
					current = can.getObject(parts.join('.'), window, true),
					namespace = current,
					_fullName = can.underscore(fullName.replace(/\./g, "_")),
					_shortName = can.underscore(shortName);

				
				
				current[shortName] = Constructor;
			}

			// Set things that shouldn't be overwritten.
			can.extend(Constructor, {
				constructor: Constructor,
				prototype: prototype,
								namespace: namespace,
								shortName: shortName,
				_shortName : _shortName,
								fullName: fullName,
				_fullName: _fullName
			});

			// Make sure our prototype looks nice.
			Constructor.prototype.constructor = Constructor;

			
			// Call the class `setup` and `init`
			var t = [_super_class].concat(can.makeArray(arguments)),
				args = Constructor.setup.apply(Constructor, t );
			
			if ( Constructor.init ) {
				Constructor.init.apply(Constructor, args || t );
			}

						return Constructor;
						//  
						//  
					}

	});

	
	// ## deparam.js  
	// `can.deparam`  
	// _Takes a string of name value pairs and returns a Object literal that represents those params._
	var digitTest = /^\d+$/,
		keyBreaker = /([^\[\]]+)|(\[\])/g,
		paramTest = /([^?#]*)(#.*)?$/,
		prep = function( str ) {
			return decodeURIComponent( str.replace(/\+/g, " ") );
		}
	

	can.extend(can, { 
				deparam: function(params){
		
			var data = {},
				pairs, lastPart;

			if ( params && paramTest.test( params )) {
				
				pairs = params.split('&'),
				
				can.each( pairs, function( pair ) {

					var parts = pair.split('='),
						key   = prep( parts.shift() ),
						value = prep( parts.join("=") );

					current = data;
					parts = key.match(keyBreaker);
			
					for ( var j = 0, l = parts.length - 1; j < l; j++ ) {
						if (!current[parts[j]] ) {
							// If what we are pointing to looks like an `array`
							current[parts[j]] = digitTest.test(parts[j+1]) || parts[j+1] == "[]" ? [] : {}
						}
						current = current[parts[j]];
					}
					lastPart = parts.pop()
					if ( lastPart == "[]" ) {
						current.push(value)
					} else {
						current[lastPart] = value;
					}
				});
			}
			return data;
		}
	});

	// ## observe.js  
	// `can.Observe`  
	// _Provides the observable pattern for JavaScript Objects._  
	//  
	// Returns `true` if something is an object with properties of its own.
	var canMakeObserve = function( obj ) {
			return obj && typeof obj === 'object' && !(obj instanceof Date);
		},

		// Removes all listeners.
		unhookup = function(items, namespace){
			return can.each(items, function(item){
				if(item && item.unbind){
					item.unbind("change" + namespace);
				}
			});
		},
		// Listens to changes on `val` and "bubbles" the event up.  
		// `val` - The object to listen for changes on.  
		// `prop` - The property name is at on.  
		// `parent` - The parent object of prop.  
		hookupBubble = function( val, prop, parent ) {
			// If it's an `array` make a list, otherwise a val.
			if (val instanceof Observe){
				// We have an `observe` already...
				// Make sure it is not listening to this already
				unhookup([val], parent._cid);
			} else if ( can.isArray(val) ) {
				val = new Observe.List(val);
			} else {
				val = new Observe(val);
			}
			
			// Listen to all changes and `batchTrigger` upwards.
			val.bind("change" + parent._cid, function( ev, attr ) {
				// `batchTrigger` the type on this...
				var args = can.makeArray(arguments),
					ev = args.shift();
					args[0] = prop === "*" ? 
						parent.indexOf(val)+"." + args[0] :
						prop +  "." + args[0];
				// track objects dispatched on this observe		
				ev.triggeredNS = ev.triggeredNS || {};
				// if it has already been dispatched exit
				if (ev.triggeredNS[parent._cid]) {
					return;
				}
				ev.triggeredNS[parent._cid] = true;
						
				can.trigger(parent, ev, args);
				can.trigger(parent,args[0],args);
			});

			return val;
		},
		
		// An `id` to track events for a given observe.
		observeId = 0,
		// A reference to an `array` of events that will be dispatched.
		collecting = undefined,
		// Call to start collecting events (`Observe` sends all events at
		// once).
		collect = function() {
			if (!collecting ) {
				collecting = [];
				return true;
			}
		},
		// Creates an event on item, but will not send immediately 
		// if collecting events.  
		// `item` - The item the event should happen on.  
		// `event` - The event name, ex: `change`.  
		// `args` - Tn array of arguments.
		batchTrigger = function( item, event, args ) {
			// Don't send events if initalizing.
			if ( ! item._init) {
				if (!collecting ) {
					return can.trigger(item, event, args);
				} else {
					collecting.push([
					item,
					{
						type: event,
						batchNum : batchNum
					}, 
					args ] );
				}
			}
		},
		// Which batch of events this is for -- might not want to send multiple
		// messages on the same batch.  This is mostly for event delegation.
		batchNum = 1,
		// Sends all pending events.
		sendCollection = function() {
			var items = collecting.slice(0);
			collecting = undefined;
			batchNum++;
			can.each(items, function( item ) {
				can.trigger.apply(can, item)
			})
			
		},
		// A helper used to serialize an `Observe` or `Observe.List`.  
		// `observe` - The observable.  
		// `how` - To serialize with `attr` or `serialize`.  
		// `where` - To put properties, in an `{}` or `[]`.
		serialize = function( observe, how, where ) {
			// Go through each property.
			observe.each(function( val, name ) {
				// If the value is an `object`, and has an `attrs` or `serialize` function.
				where[name] = canMakeObserve(val) && can.isFunction( val[how] ) ?
				// Call `attrs` or `serialize` to get the original data back.
				val[how]() :
				// Otherwise return the value.
				val
			})
			return where;
		},
		$method = function( name ) {
			return function() {
				return can[name].apply(this, arguments );
			}
		},
		bind = $method('addEvent'),
		unbind = $method('removeEvent'),
		attrParts = function(attr){
			return can.isArray(attr) ? attr : (""+attr).split(".")
		};
		var Observe = can.Construct('can.Observe', {
		// keep so it can be overwritten
		setup : function(){
			can.Construct.setup.apply(this, arguments)
		},
		bind : bind,
		unbind: unbind,
		id: "id"
	},
		{
		setup: function( obj ) {
			// `_data` is where we keep the properties.
			this._data = {};
			// The namespace this `object` uses to listen to events.
			this._cid = ".observe" + (++observeId);
			// Sets all `attrs`.
			this._init = 1;
			this.attr(obj);
			delete this._init;
		},
		
				attr: function( attr, val ) {
			// This is super obfuscated for space -- basically, we're checking
			// if the type of the attribute is not a `number` or a `string`.
			if ( !~ "ns".indexOf((typeof attr).charAt(0))) {
				return this._attrs(attr, val)
			} else if ( val === undefined ) {// If we are getting a value.
				// Let people know we are reading.
				Observe.__reading && Observe.__reading(this, attr)
				return this._get(attr)
			} else {
				// Otherwise we are setting.
				this._set(attr, val);
				return this;
			}
		},
				each: function() {
			return can.each.apply(undefined, [this.__get()].concat(can.makeArray(arguments)))
		},
				removeAttr: function( attr ) {
			// Convert the `attr` into parts (if nested).
			var parts = attrParts(attr),
				// The actual property to remove.
				prop = parts.shift(),
				// The current value.
				current = this._data[prop];

			// If we have more parts, call `removeAttr` on that part.
			if ( parts.length ) {
				return current.removeAttr(parts)
			} else {
				// Otherwise, `delete`.
				delete this._data[prop];
				// Create the event.
				if (!(prop in this.constructor.prototype)) {
					delete this[prop]
				}
				batchTrigger(this, "change", [prop, "remove", undefined, current]);
				batchTrigger(this, prop, [undefined, current]);
				return current;
			}
		},
		// Reads a property from the `object`.
		_get: function( attr ) {
			var parts = attrParts(attr),
				current = this.__get(parts.shift());
			return parts.length ? current ? current._get(parts) : undefined : current;
		},
		// Reads a property directly if an `attr` is provided, otherwise
		// returns the "real" data object itself.
		__get: function( attr ) {
			return attr ? this._data[attr] : this._data;
		},
		// Sets `attr` prop as value on this object where.
		// `attr` - Is a string of properties or an array  of property values.
		// `value` - The raw value to set.
		_set: function( attr, value ) {
			// Convert `attr` to attr parts (if it isn't already).
			var parts = attrParts(attr),
				// The immediate prop we are setting.
				prop = parts.shift(),
				// The current value.
				current = this.__get(prop);

			// If we have an `object` and remaining parts.
			if ( canMakeObserve(current) && parts.length ) {
				// That `object` should set it (this might need to call attr).
				current._set(parts, value)
			} else if (!parts.length ) {
				// We're in "real" set territory.
				if(this.__convert){
					value = this.__convert(prop, value)
				}
				this.__set(prop, value, current)
				
			} else {
				throw "can.Observe: Object does not exist"
			}
		},
		__set : function(prop, value, current){
		
			// Otherwise, we are setting it on this `object`.
			// TODO: Check if value is object and transform
			// are we changing the value.
			if ( value !== current ) {

				// Check if we are adding this for the first time --
				// if we are, we need to create an `add` event.
				var changeType = this.__get().hasOwnProperty(prop) ? "set" : "add";

				// Set the value on data.
				this.___set(prop,

				// If we are getting an object.
				canMakeObserve(value) ?

				// Hook it up to send event.
				hookupBubble(value, prop, this) :
				// Value is normal.
				value);

				// `batchTrigger` the change event.
				batchTrigger(this, "change", [prop, changeType, value, current]);
				batchTrigger(this, prop, [value, current]);
				// If we can stop listening to our old value, do it.
				current && unhookup([current], this._cid);
			}

		},
		// Directly sets a property on this `object`.
		___set: function( prop, val ) {
			this._data[prop] = val;
			// Add property directly for easy writing.
			// Check if its on the `prototype` so we don't overwrite methods like `attrs`.
			if (!(prop in this.constructor.prototype)) {
				this[prop] = val
			}
		},
				bind: bind,
				unbind: unbind,
				serialize: function() {
			return serialize(this, 'serialize', {});
		},
				_attrs: function( props, remove ) {
			if ( props === undefined ) {
				return serialize(this, 'attr', {})
			}

			props = can.extend(true, {}, props);
			var prop, 
				collectingStarted = collect(),
				self = this,
				newVal;
			
			this.each(function(curVal, prop){
				newVal = props[prop];

				// If we are merging...
				if ( newVal === undefined ) {
					remove && self.removeAttr(prop);
					return;
				}
				if ( canMakeObserve(curVal) && canMakeObserve(newVal) && curVal.attr ) {
					curVal.attr(newVal, remove)
				} else if ( curVal != newVal ) {
					self._set(prop, newVal)
				} else {

				}
				delete props[prop];
			})
			// Add remaining props.
			for ( var prop in props ) {
				newVal = props[prop];
				this._set(prop, newVal)
			}
			if ( collectingStarted ) {
				sendCollection();
			}
			return this;
		}
	});
	// Helpers for `observable` lists.
		var splice = [].splice,
		list = Observe('can.Observe.List',
		{
		setup: function( instances, options ) {
			this.length = 0;
			this._cid = ".observe" + (++observeId);
			this._init = 1;
			this.bind('change',can.proxy(this._changes,this));
			this.push.apply(this, can.makeArray(instances || []));
			can.extend(this, options);
			delete this._init;
		},
		_changes : function(ev, attr, how, newVal, oldVal){
			// `batchTrigger` direct add and remove events...
			if ( !~ attr.indexOf('.')){
				
				if( how === 'add' ) {
					batchTrigger(this, how, [newVal,+attr]);
					batchTrigger(this,'length',[this.length]);
				} else if( how === 'remove' ) {
					batchTrigger(this, how, [oldVal, +attr]);
					batchTrigger(this,'length',[this.length]);
				} else {
					batchTrigger(this,how,[newVal, +attr])
				}
				
			}
		},
		__get : function(attr){
			return attr ? this[attr] : this;
		},
		___set : function(attr, val){
			this[attr] = val;
			if(+attr >= this.length){
				this.length = (+attr+1)
			}
		},
		// Returns the serialized form of this list.
				serialize: function() {
			return serialize(this, 'serialize', []);
		},
				//  
				splice: function( index, howMany ) {
			var args = can.makeArray(arguments),
				i;

			for ( i = 2; i < args.length; i++ ) {
				var val = args[i];
				if ( canMakeObserve(val) ) {
					args[i] = hookupBubble(val, "*", this)
				}
			}
			if ( howMany === undefined ) {
				howMany = args[1] = this.length - index;
			}
			var removed = splice.apply(this, args);
			if ( howMany > 0 ) {
				batchTrigger(this, "change", [""+index, "remove", undefined, removed]);
				unhookup(removed, this._cid);
			}
			if ( args.length > 2 ) {
				batchTrigger(this, "change", [""+index, "add", args.slice(2), removed]);
			}
			return removed;
		},
				_attrs: function( props, remove ) {
			if ( props === undefined ) {
				return serialize(this, 'attr', []);
			}

			// Create a copy.
			props = props.slice(0);

			var len = Math.min(props.length, this.length),
				collectingStarted = collect(),
				prop;

			for ( var prop = 0; prop < len; prop++ ) {
				var curVal = this[prop],
					newVal = props[prop];

				if ( canMakeObserve(curVal) && canMakeObserve(newVal) ) {
					curVal.attr(newVal, remove)
				} else if ( curVal != newVal ) {
					this._set(prop, newVal)
				} else {

				}
			}
			if ( props.length > this.length ) {
				// Add in the remaining props.
				this.push.apply( this, props.slice( this.length ) );
			} else if ( props.length < this.length && remove ) {
				this.splice(props.length)
			}

			if ( collectingStarted ) {
				sendCollection()
			}
		}
	}),

		// Converts to an `array` of arguments.
		getArgs = function( args ) {
			return args[0] && can.isArray(args[0]) ?
				args[0] :
				can.makeArray(args);
		};
	// Create `push`, `pop`, `shift`, and `unshift`
	can.each({
				push: "length",
				unshift: 0
	},
	// Adds a method
	// `name` - The method name.
	// `where` - Where items in the `array` should be added.
	function( where, name ) {
		list.prototype[name] = function() {
			// Get the items being added.
			var args = getArgs(arguments),
				// Where we are going to add items.
				len = where ? this.length : 0;

			// Go through and convert anything to an `observe` that needs to be converted.
			for ( var i = 0; i < args.length; i++ ) {
				var val = args[i];
				if ( canMakeObserve(val) ) {
					args[i] = hookupBubble(val, "*", this)
				}
			}
			
			// Call the original method.
			var res = [][name].apply(this, args);
			
			if ( !this.comparator || !args.length ) {
				batchTrigger(this, "change", [""+len, "add", args, undefined])
			}
						
			return res;
		}
	});

	can.each({
				pop: "length",
				shift: 0
	},
	// Creates a `remove` type method
	function( where, name ) {
		list.prototype[name] = function() {
			
			var args = getArgs(arguments),
				len = where && this.length ? this.length - 1 : 0;

			var res = [][name].apply(this, args)

			// Create a change where the args are
			// `*` - Change on potentially multiple properties.
			// `remove` - Items removed.
			// `undefined` - The new values (there are none).
			// `res` - The old, removed values (should these be unbound).
			// `len` - Where these items were removed.
			batchTrigger(this, "change", [""+len, "remove", undefined, [res]])

			if ( res && res.unbind ) {
				res.unbind("change" + this._cid)
			}
			return res;
		}
	});
	
	can.extend(list.prototype, {
				indexOf : [].indexOf || function(item) {
			return can.inArray(item, this)
		},

				join : [].join,

				slice : function() {
			var temp = Array.prototype.slice.apply(this, arguments);
			return new this.constructor( temp );
		},

				concat : function() {
			var args = [];
			can.each(arguments, function(arg) {
				args.push(arg instanceof can.Observe.List ? arg.serialize() : arg);
			});
			return new this.constructor(Array.prototype.concat.apply(this.serialize(), args));
		},

				forEach : function(cb, thisarg) {
			can.each(this, can.proxy(cb, thisarg || this ));
		}
	});

	(function() {
	

	// ## control.js
	// `can.Control`  
	// _Controller_
	
	// Binds an element, returns a function that unbinds.
	var bind = function( el, ev, callback ) {

		can.bind.call( el, ev, callback )

		return function() {
			can.unbind.call(el, ev, callback);
		};
	},
		isFunction = can.isFunction,
		extend = can.extend,
		each = can.each,
		slice = [].slice,
		paramReplacer = /\{([^\}]+)\}/g,
		special = can.getObject("$.event.special") || {},

		// Binds an element, returns a function that unbinds.
		delegate = function( el, selector, ev, callback ) {
			can.delegate.call(el, selector, ev, callback)
			return function() {
				can.undelegate.call(el, selector, ev, callback);
			};
		},
		
		// Calls bind or unbind depending if there is a selector.
		binder = function( el, ev, callback, selector ) {
			return selector ?
				delegate( el, can.trim( selector ), ev, callback ) : 
				bind( el, ev, callback );
		},
		
		basicProcessor;
	
		can.Construct("can.Control",
		{
		// Setup pre-processes which methods are event listeners.
				setup: function() {

			// Allow contollers to inherit "defaults" from super-classes as it 
			// done in `can.Construct`
			can.Construct.setup.apply( this, arguments );

			// If you didn't provide a name, or are `control`, don't do anything.
			if ( this !== can.Control ) {

				// Cache the underscored names.
				var control = this,
					funcName;

				// Calculate and cache actions.
				control.actions = {};
				for ( funcName in control.prototype ) {
					if ( control._isAction(funcName) ) {
						control.actions[funcName] = control._action(funcName);
					}
				}
			}
		},

		// Moves `this` to the first argument, wraps it with `jQuery` if it's an element
		_shifter : function( context, name ) {

			var method = typeof name == "string" ? context[name] : name;

			if ( ! isFunction( method )) {
				method = context[ method ];
			}
			
			return function() {
				context.called = name;
    			return method.apply(context, [this.nodeName ? can.$(this) : this].concat( slice.call(arguments, 0)));
			};
		},

		// Return `true` if is an action.
				_isAction: function( methodName ) {
			
			var val = this.prototype[methodName],
				type = typeof val;
			// if not the constructor
			return (methodName !== 'constructor') &&
				// and is a function or links to a function
				( type == "function" || (type == "string" &&  isFunction(this.prototype[val] ) ) ) &&
				// and is in special, a processor, or has a funny character
			    !! ( special[methodName] || processors[methodName] || /[^\w]/.test(methodName) );
		},
		// Takes a method name and the options passed to a control
		// and tries to return the data necessary to pass to a processor
		// (something that binds things).
				_action: function( methodName, options ) {
			
			// If we don't have options (a `control` instance), we'll run this 
			// later.  
      		paramReplacer.lastIndex = 0;
			if ( options || ! paramReplacer.test( methodName )) {
				// If we have options, run sub to replace templates `{}` with a
				// value from the options or the window
				var convertedName = options ? can.sub(methodName, [options, window]) : methodName,
					
					// If a `{}` resolves to an object, `convertedName` will be
					// an array
					arr = can.isArray(convertedName),
					
					// Get the parts of the function  
					// `[convertedName, delegatePart, eventPart]`  
					// `/^(?:(.*?)\s)?([\w\.\:>]+)$/` - Breaker `RegExp`.
					parts = (arr ? convertedName[1] : convertedName).match(/^(?:(.*?)\s)?([\w\.\:>]+)$/);

					var event = parts[2],
					processor = processors[event] || basicProcessor;
				return {
					processor: processor,
					parts: parts,
					delegate : arr ? convertedName[0] : undefined
				};
			}
		},
		// An object of `{eventName : function}` pairs that Control uses to 
		// hook up events auto-magically.
				processors: {},
		// A object of name-value pairs that act as default values for a 
		// control instance
				defaults: {}
	},
		{
		// Sets `this.element`, saves the control in `data, binds event
		// handlers.
				setup: function( element, options ) {

			var cls = this.constructor,
				pluginname = cls.pluginName || cls._fullName,
				arr;

			// Want the raw element here.
			this.element = can.$(element)

			if ( pluginname && pluginname !== 'can_control') {
				// Set element and `className` on element.
				this.element.addClass(pluginname);
			}
			
			(arr = can.data(this.element,"controls")) || can.data(this.element,"controls",arr = []);
			arr.push(this);
			
			// Option merging.
						this.options = extend({}, cls.defaults, options);

			// Bind all event handlers.
			this.on();

			// Get's passed into `init`.
						return [this.element, this.options];
		},
				on: function( el, selector, eventName, func ) {
			if ( ! el ) {

				// Adds bindings.
				this.off();

				// Go through the cached list of actions and use the processor 
				// to bind
				var cls = this.constructor,
					bindings = this._bindings,
					actions = cls.actions,
					element = this.element,
					destroyCB = can.Control._shifter(this,"destroy"),
					funcName, ready;
					
				for ( funcName in actions ) {
					if ( actions.hasOwnProperty( funcName )) {
						ready = actions[funcName] || cls._action(funcName, this.options);
						bindings.push(
							ready.processor(ready.delegate || element, 
							                ready.parts[2], 
											ready.parts[1], 
											funcName, 
											this));
					}
				}
	
	
				// Setup to be destroyed...  
				// don't bind because we don't want to remove it.
				can.bind.call(element,"destroyed", destroyCB);
				bindings.push(function( el ) {
					can.unbind.call(el,"destroyed", destroyCB);
				});
				return bindings.length;
			}

			if ( typeof el == 'string' ) {
				func = eventName;
				eventName = selector;
				selector = el;
				el = this.element;
			}

			if(func === undefined) {
				func = eventName;
				eventName = selector;
				selector = null;
			}

			if ( typeof func == 'string' ) {
				func = can.Control._shifter(this,func);
			}

			this._bindings.push( binder( el, eventName, func, selector ));

			return this._bindings.length;
		},
		// Unbinds all event handlers on the controller.
				off : function(){
			var el = this.element[0]
			each(this._bindings || [], function( value ) {
				value(el);
			});
			// Adds bindings.
			this._bindings = [];
		},
		// Prepares a `control` for garbage collection
				destroy: function() {
			var Class = this.constructor,
				pluginName = Class.pluginName || Class._fullName,
				controls;
			
			// Unbind bindings.
			this.off();
			
			if(pluginName && pluginName !== 'can_control'){
				// Remove the `className`.
				this.element.removeClass(pluginName);
			}
			
			// Remove from `data`.
			controls = can.data(this.element,"controls");
			controls.splice(can.inArray(this, controls),1);
			
			can.trigger( this, "destroyed"); // In case we want to know if the `control` is removed.
			
			this.element = null;
		}
	});

	var processors = can.Control.processors,

	// Processors do the binding.  
	// They return a function that unbinds when called.  
	//
	// The basic processor that binds events.
	basicProcessor = function( el, event, selector, methodName, control ) {
		return binder( el, event, can.Control._shifter(control, methodName), selector);
	};

	// Set common events to be processed as a `basicProcessor`
	each(["change", "click", "contextmenu", "dblclick", "keydown", "keyup", 
		 "keypress", "mousedown", "mousemove", "mouseout", "mouseover", 
		 "mouseup", "reset", "resize", "scroll", "select", "submit", "focusin",
		 "focusout", "mouseenter", "mouseleave"], function( v ) {
		processors[v] = basicProcessor;
	});

	}());

	// ## route.js  
	// `can.route`  
	// _Helps manage browser history (and client state) by synchronizing the 
	// `window.location.hash` with a `can.Observe`._  
	//   
    // Helper methods used for matching routes.
	var 
		// `RegExp` used to match route variables of the type ':name'.
        // Any word character or a period is matched.
        matcher = /\:([\w\.]+)/g,
        // Regular expression for identifying &amp;key=value lists.
        paramsMatcher = /^(?:&[^=]+=[^&]*)+/,
        // Converts a JS Object into a list of parameters that can be 
        // inserted into an html element tag.
		makeProps = function( props ) {
			var tags = [];
			can.each(props, function(val, name){
				tags.push( ( name === 'className' ? 'class'  : name )+ '="' + 
						(name === "href" ? val : can.esc(val) ) + '"');
			});
			return tags.join(" ");
		},
		// Checks if a route matches the data provided. If any route variable
        // is not present in the data, the route does not match. If all route
        // variables are present in the data, the number of matches is returned 
        // to allow discerning between general and more specific routes. 
		matchesData = function(route, data) {
			var count = 0, i = 0, defaults = {};
			// look at default values, if they match ...
			for( var name in route.defaults ) {
				if(route.defaults[name] === data[name]){
					// mark as matched
					defaults[name] = 1;
					count++;
				}
			}
			for (; i < route.names.length; i++ ) {
				if (!data.hasOwnProperty(route.names[i]) ) {
					return -1;
				}
				if(!defaults[route.names[i]]){
					count++;
				}
				
			}
			
			return count;
		},
		onready = !0,
		location = window.location,
		each = can.each,
		extend = can.extend;

	can.route = function( url, defaults ) {
        defaults = defaults || {}
        // Extract the variable names and replace with `RegExp` that will match
		// an atual URL with values.
		var names = [],
			test = url.replace(matcher, function( whole, name, i ) {
				names.push(name);
				var next = "\\"+( url.substr(i+whole.length,1) || "&" )
				// a name without a default value HAS to have a value
				// a name that has a default value can be empty
				// The `\\` is for string-escaping giving single `\` for `RegExp` escaping.
				return "([^" +next+"]"+(defaults[name] ? "*" : "+")+")"
			});

		// Add route in a form that can be easily figured out.
		can.route.routes[url] = {
            // A regular expression that will match the route when variable values 
            // are present; i.e. for `:page/:type` the `RegExp` is `/([\w\.]*)/([\w\.]*)/` which
            // will match for any value of `:page` and `:type` (word chars or period).
			test: new RegExp("^" + test+"($|&)"),
            // The original URL, same as the index for this entry in routes.
			route: url,
            // An `array` of all the variable names in this route.
			names: names,
            // Default values provided for the variables.
			defaults: defaults,
            // The number of parts in the URL separated by `/`.
			length: url.split('/').length
		}
		return can.route;
	};

	extend(can.route, {
				param: function( data , _setRoute ) {
			// Check if the provided data keys match the names in any routes;
			// Get the one with the most matches.
			var route,
				// Need to have at least 1 match.
				matches = 0,
				matchCount,
				routeName = data.route,
				propCount = 0;
				
			delete data.route;
			
			each(data, function(){propCount++});
			// Otherwise find route.
			each(can.route.routes, function(temp, name){
				// best route is the first with all defaults matching
				
				
				matchCount = matchesData(temp, data);
				if ( matchCount > matches ) {
					route = temp;
					matches = matchCount
				}
				if(matchCount >= propCount){
					return false;
				}
			});
			// If we have a route name in our `can.route` data, and it's
			// just as good as what currently matches, use that
			if (can.route.routes[routeName] && matchesData(can.route.routes[routeName], data ) === matches) {
				route = can.route.routes[routeName];
			}
			// If this is match...
			if ( route ) {
				var cpy = extend({}, data),
                    // Create the url by replacing the var names with the provided data.
                    // If the default value is found an empty string is inserted.
					res = route.route.replace(matcher, function( whole, name ) {
                        delete cpy[name];
                        return data[name] === route.defaults[name] ? "" : encodeURIComponent( data[name] );
                    }),
                    after;
				// Remove matching default values
				each(route.defaults, function(val,name){
					if(cpy[name] === val) {
						delete cpy[name]
					}
				})
				
				// The remaining elements of data are added as 
				// `&amp;` separated parameters to the url.
				after = can.param(cpy);
				// if we are paraming for setting the hash
				// we also want to make sure the route value is updated
				if(_setRoute){
					can.route.attr('route',route.route);
				}
				return res + (after ? "&" + after : "")
			}
            // If no route was found, there is no hash URL, only paramters.
			return can.isEmptyObject(data) ? "" : "&" + can.param(data);
		},
				deparam: function( url ) {
			// See if the url matches any routes by testing it against the `route.test` `RegExp`.
            // By comparing the URL length the most specialized route that matches is used.
			var route = {
				length: -1
			};
			each(can.route.routes, function(temp, name){
				if ( temp.test.test(url) && temp.length > route.length ) {
					route = temp;
				}
			});
            // If a route was matched.
			if ( route.length > -1 ) { 
				var // Since `RegExp` backreferences are used in `route.test` (parens)
                    // the parts will contain the full matched string and each variable (back-referenced) value.
                    parts = url.match(route.test),
                    // Start will contain the full matched string; parts contain the variable values.
					start = parts.shift(),
                    // The remainder will be the `&amp;key=value` list at the end of the URL.
					remainder = url.substr(start.length - (parts[parts.length-1] === "&" ? 1 : 0) ),
                    // If there is a remainder and it contains a `&amp;key=value` list deparam it.
                    obj = (remainder && paramsMatcher.test(remainder)) ? can.deparam( remainder.slice(1) ) : {};

                // Add the default values for this route.
				obj = extend(true, {}, route.defaults, obj);
                // Overwrite each of the default values in `obj` with those in 
				// parts if that part is not empty.
				each(parts,function(part,  i){
					if ( part && part !== '&') {
						obj[route.names[i]] = decodeURIComponent( part );
					}
				});
				obj.route = route.route;
				return obj;
			}
            // If no route was matched, it is parsed as a `&amp;key=value` list.
			if ( url.charAt(0) !== '&' ) {
				url = '&' + url;
			}
			return paramsMatcher.test(url) ? can.deparam( url.slice(1) ) : {};
		},
				data: new can.Observe({}),
        		routes: {},
				ready: function(val) {
			if( val === false ) {
				onready = val;
			}
			if( val === true || onready === true ) {
				setState();
			}
			return can.route;
		},
				url: function( options, merge ) {
			if (merge) {
				options = extend({}, curParams, options)
			}
			return "#!" + can.route.param(options)
		},
				link: function( name, options, props, merge ) {
			return "<a " + makeProps(
			extend({
				href: can.route.url(options, merge)
			}, props)) + ">" + name + "</a>";
		},
				current: function( options ) {
			return location.hash == "#!" + can.route.param(options)
		}
	});
	
	
    // The functions in the following list applied to `can.route` (e.g. `can.route.attr('...')`) will
    // instead act on the `can.route.data` observe.
	each(['bind','unbind','delegate','undelegate','attr','removeAttr'], function(name){
		can.route[name] = function(){
			return can.route.data[name].apply(can.route.data, arguments)
		}
	})

	var // A ~~throttled~~ debounced function called multiple times will only fire once the
        // timer runs down. Each call resets the timer.
		timer,
        // Intermediate storage for `can.route.data`.
        curParams,
        // Deparameterizes the portion of the hash of interest and assign the
        // values to the `can.route.data` removing existing values no longer in the hash.
        // setState is called typically by hashchange which fires asynchronously
        // So it's possible that someone started changing the data before the 
        // hashchange event fired.  For this reason, it will not set the route data
        // if the data is changing and the hash already matches the hash that was set.
        setState = function() {
        	var hash = location.href.split(/#!?/)[1] || ""
			curParams = can.route.deparam( hash );
			
			
			// if the hash data is currently changing, and
			// the hash is what we set it to anyway, do NOT change the hash
			if(!changingData || hash !== lastHash){
				can.route.attr(curParams, true);
			}
		},
		// The last hash caused by a data change
		lastHash,
		// Are data changes pending that haven't yet updated the hash
		changingData;

	// If the hash changes, update the `can.route.data`.
	can.bind.call(window,'hashchange', setState);

	// If the `can.route.data` changes, update the hash.
    // Using `.serialize()` retrieves the raw data contained in the `observable`.
    // This function is ~~throttled~~ debounced so it only updates once even if multiple values changed.
    // This might be able to use batchNum and avoid this.
	can.route.bind("change", function(ev, attr) {
		// indicate that data is changing
		changingData = 1;
		clearTimeout( timer );
		timer = setTimeout(function() {
			// indicate that the hash is set to look like the data
			changingData = 0;
			var serialized = can.route.data.serialize();
			location.hash = "#!" + (lastHash = can.route.param(serialized, true))
		}, 1);
	});
	// `onready` event...
	can.bind.call(document,"ready",can.route.ready);

	// ## ejs.js
	// `can.EJS`  
	// _Embedded JavaScript Templates._

	// Helper methods.
	var myEval = function( script ) {
		eval(script);
	},
		extend = can.extend,
		// Regular expressions for caching.
		quickFunc = /\s*\(([\$\w]+)\)\s*->([^\n]*)/,
		attrReg = /([^\s]+)=$/,
		newLine = /(\r|\n)+/g,
		attributeReplace = /__!!__/g,
		tagMap = {
			"": "span", 
			table: "tr", 
			tr: "td", 
			ol: "li", 
			ul: "li", 
			tbody: "tr",
			thead: "tr",
			tfoot: "tr",
			select: "option"
		},
		// Escapes characters starting with `\`.
		clean = function( content ) {
			return content
				.split('\\').join("\\\\")
				.split("\n").join("\\n")
				.split('"').join('\\"')
				.split("\t").join("\\t");
		},
		bracketNum = function(content){
			return (--content.split("{").length) - (--content.split("}").length);
		},
		// Cross-browser attribute methods.
		// These should be mapped to the underlying library.
		attrMap = {
			"class" : "className"
		},
		bool = can.each(["checked","disabled","readonly","required"], function(n){
			attrMap[n] = n;
		}),
		setAttr = function(el, attrName, val){
			attrMap[attrName] ?
				(el[attrMap[attrName]] = can.inArray(attrName,bool) > -1? true  : val):
				el.setAttribute(attrName, val);
		},
		getAttr = function(el, attrName){
			return attrMap[attrName]?
				el[attrMap[attrName]]:
				el.getAttribute(attrName);
		},
		removeAttr = function(el, attrName){
			if(can.inArray(attrName,bool) > -1){
				el[attrName] = false;
			} else{
				el.removeAttribute(attrName)
			}
		},
		// a helper to get the parentNode for a given element el
		// if el is in a documentFragment, it will return defaultParentNode
		getParentNode = function(el, defaultParentNode){
			return defaultParentNode && el.parentNode.nodeType === 11 ? defaultParentNode : el.parentNode;
		},
		// helper to know if property is not an expando on oldObserved's list of observes
		// this should probably be removed and oldObserved should just have a
		// property with observes
		observeProp = function(name){
			return name.indexOf("|") >= 0;
		},
		// Returns escaped/sanatized content for anything other than a live-binding
		contentEscape = function( txt ) {
			return (typeof txt == 'string' || typeof txt == 'number') ?
				can.esc( txt ) :
				contentText(txt);
		},
		// Returns text content for anything other than a live-binding 
		contentText =  function( input ) {	
			
			// If it's a string, return.
			if ( typeof input == 'string' ) {
				return input;
			}
			// If has no value, return an empty string.
			if ( !input && input != 0 ) {
				return '';
			}

			// If it's an object, and it has a hookup method.
			var hook = (input.hookup &&

			// Make a function call the hookup method.
			function( el, id ) {
				input.hookup.call(input, el, id);
			}) ||

			// Or if it's a `function`, just use the input.
			(typeof input == 'function' && input);

			// Finally, if there is a `function` to hookup on some dom,
			// add it to pending hookups.
			if ( hook ) {
				pendingHookups.push(hook);
				return '';
			}

			// Finally, if all else is `false`, `toString()` it.
			return "" + input;
		},
		// The EJS constructor function
		EJS = function( options ) {
			// Supports calling EJS without the constructor
			// This returns a function that renders the template.
			if ( this.constructor != EJS ) {
				var ejs = new EJS(options);
				return function( data, helpers ) {
					return ejs.render(data, helpers);
				};
			}
			// If we get a `function` directly, it probably is coming from
			// a `steal`-packaged view.
			if ( typeof options == "function" ) {
				this.template = {
					fn: options
				};
				return;
			}
			// Set options on self.
			extend(this, options);
			this.template = scan(this.text, this.name);
		};

	can.EJS = EJS;
		EJS.prototype.
		render = function( object, extraHelpers ) {
		object = object || {};
		return this.template.fn.call(object, object, new EJS.Helpers(object, extraHelpers || {}));
	};
		extend(EJS, {
		// Called to return the content within a magic tag like `<%= %>`.
		// - escape - if the content returned should be escaped
		// - tagName - the tag name the magic tag is within or the one that proceeds the magic tag
		// - status - where the tag is in.  The status can be:
		//    - _STRING_ - The name of the attribute the magic tag is within
		//    - `1` - The magic tag is within a tag like `<div <%= %>>`
		//    - `0` - The magic tag is outside (or between) tags like `<div><%= %></div>`
		// - self - the `this` the template was called with
		// - func - the "wrapping" function.  For example:  `<%= task.attr('name') %>` becomes
		//   `(function(){return task.attr('name')})
				txt : function(escape, tagName, status, self, func){
			// call the "wrapping" function and get the binding information
			var binding = can.compute.binder(func, self, function(newVal, oldVal){
				// call the update method we will define for each
				// type of attribute
				update(newVal, oldVal)
			});
			
			// If we had no observes just return the value returned by func.
			if(!binding.isListening){
				return (escape || status !== 0? contentEscape : contentText)(binding.value);
			}
			// The following are helper methods or varaibles that will
			// be defined by one of the various live-updating schemes.
			
			// The parent element we are listening to for teardown
			var	parentElement,
				// if the parent element is removed, teardown the binding
				setupTeardownOnDestroy = function(el){
					can.bind.call(el,'destroyed', binding.teardown)
					parentElement = el;
				},
				// if there is no parent, undo bindings
				teardownCheck = function(parent){
					if(!parent){
						binding.teardown();
						can.unbind.call(parentElement,'destroyed', binding.teardown)
					}
				},
				// the tag type to insert
				tag = (tagMap[tagName] || "span"),
				// this will be filled in if binding.isListening
				update;
			
			
			// The magic tag is outside or between tags.
			if(status == 0){
				// Return an element tag with a hookup in place of the content
				return "<" +tag+can.view.hook(
				escape ? 
					// If we are escaping, replace the parentNode with 
					// a text node who's value is `func`'s return value.
					function(el, parentNode){
						// updates the text of the text node
						update = function(newVal){
							node.nodeValue = ""+newVal;
							teardownCheck(node.parentNode);
						};
						
						var parent = getParentNode(el, parentNode),
							node = document.createTextNode(binding.value);
							
						parent.insertBefore(node, el);
						parent.removeChild(el);
						setupTeardownOnDestroy(parent);
					} 
					:
					// If we are not escaping, replace the parentNode with a
					// documentFragment created as with `func`'s return value.
					function(span, parentNode){
						// updates the elements with the new content
						update = function(newVal){
							// is this still part of the DOM?
							var attached = nodes[0].parentNode;
							// update the nodes in the DOM with the new rendered value
							if( attached ) {
								nodes = makeAndPut(newVal, nodes);
							}
							teardownCheck(nodes[0].parentNode)
						}
						
						// make sure we have a valid parentNode
						parentNode = getParentNode(span, parentNode)
						// A helper function to manage inserting the contents
						// and removing the old contents
						var makeAndPut = function(val, remove){
								// create the fragment, but don't hook it up
								// we need to insert it into the document first
								
								var frag = can.view.frag(val, parentNode),
									// keep a reference to each node
									nodes = can.map(frag.childNodes,function(node){
										return node;
									}),
									last = remove[remove.length - 1];
								
								// Insert it in the `document` or `documentFragment`
								if( last.nextSibling ){
									last.parentNode.insertBefore(frag, last.nextSibling)
								} else {
									last.parentNode.appendChild(frag)
								}
								// Remove the old content.
								can.remove( can.$(remove) );
								
								return nodes;
							},
							// nodes are the nodes that any updates will replace
							// at this point, these nodes could be part of a documentFragment
							nodes = makeAndPut(binding.value, [span]);
						
						
						setupTeardownOnDestroy(parentNode);
						
				}) + "></" +tag+">";
			// In a tag, but not in an attribute
			} else if(status === 1){ 
				// remember the old attr name
				var attrName = binding.value.replace(/['"]/g, '').split('=')[0];
				pendingHookups.push(function(el) {
					update = function(newVal){
						var parts = (newVal|| "").replace(/['"]/g, '').split('='),
							newAttrName = parts[0];
						
						// Remove if we have a change and used to have an `attrName`.
						if((newAttrName != attrName) && attrName){
							removeAttr(el,attrName)
						}
						// Set if we have a new `attrName`.
						if(newAttrName){
							setAttr(el, newAttrName, parts[1]);
							attrName = newAttrName;
						}
					}
					setupTeardownOnDestroy(el);
				});

				return binding.value;
			} else { // In an attribute...
				pendingHookups.push(function(el){
					// update will call this attribute's render method
					// and set the attribute accordingly
					update = function(){
						setAttr(el, status, hook.render())
					}
					
					var wrapped = can.$(el),
						hooks;
					
					// Get the list of hookups or create one for this element.
					// Hooks is a map of attribute names to hookup `data`s.
					// Each hookup data has:
					// `render` - A `function` to render the value of the attribute.
					// `funcs` - A list of hookup `function`s on that attribute.
					// `batchNum` - The last event `batchNum`, used for performance.
					(hooks = can.data(wrapped,'hooks')) || can.data(wrapped, 'hooks', hooks = {});
					
					// Get the attribute value.
					var attr = getAttr(el, status),
						// Split the attribute value by the template.
						parts = attr.split("__!!__"),
						hook;

					
					// If we already had a hookup for this attribute...
					if(hooks[status]) {
						// Just add to that attribute's list of `function`s.
						hooks[status].bindings.push(binding);
					}
					else {
						// Create the hookup data.
						hooks[status] = {
							render: function() {
								var i =0,
									newAttr = attr.replace(attributeReplace, function() {
										return contentText( hook.bindings[i++].value );
									});
								return newAttr;
							},
							bindings: [binding],
							batchNum : undefined
						};
					};

					// Save the hook for slightly faster performance.
					hook = hooks[status];

					// Insert the value in parts.
					parts.splice(1,0,binding.value);

					// Set the attribute.
					setAttr(el, status, parts.join(""));
					
					// Bind on change.
					//liveBind(observed, el, binder,oldObserved);
					setupTeardownOnDestroy(el)
				})
				return "__!!__";
			}
		},
		pending: function() {
			if(pendingHookups.length) {
				var hooks = pendingHookups.slice(0);

				pendingHookups = [];
				return can.view.hook(function(el){
					can.each(hooks, function(fn){
						fn(el);
					})
				});
			}else {
				return "";
			}
		}
});
	// Start scanning code.
	var tokenReg = new RegExp("(" +[ "<%%", "%%>", "<%==", "<%=", 
					"<%#", "<%", "%>", "<", ">", '"', "'"].join("|")+")","g"),
		// Commands for caching.
		startTxt = 'var ___v1ew = [];',
		finishTxt = "return ___v1ew.join('')",
		put_cmd = "___v1ew.push(",
		insert_cmd = put_cmd,
		// Global controls (used by other functions to know where we are).
		//  
		// Are we inside a tag?
		htmlTag = null,
		// Are we within a quote within a tag?
		quote = null,
		// What was the text before the current quote? (used to get the `attr` name)
		beforeQuote = null,
		// Used to mark where the element is.
		status = function(){
			// `t` - `1`.
			// `h` - `0`.
			// `q` - String `beforeQuote`.
			return quote ? "'"+beforeQuote.match(attrReg)[1]+"'" : (htmlTag ? 1 : 0)
		},
		pendingHookups = [],
		scan = function(source, name){
			var tokens = [],
				last = 0;
			
			source = source.replace(newLine, "\n");
			source.replace(tokenReg, function(whole, part, offset){
				// if the next token starts after the last token ends
				// push what's in between
				if(offset > last){
					tokens.push( source.substring(last, offset) );
				}
				// push the token 
				tokens.push(part);
				// update the position of the last part of the last token
				last = offset+part.length;
			})
			// if there's something at the end, add it
			if(last < source.length){
				tokens.push(source.substr(last))
			}
			
			var content = '',
				buff = [startTxt],
				// Helper `function` for putting stuff in the view concat.
				put = function( content, bonus ) {
					buff.push(put_cmd, '"', clean(content), '"'+(bonus||'')+');');
				},
				// A stack used to keep track of how we should end a bracket
				// `}`.  
				// Once we have a `<%= %>` with a `leftBracket`,
				// we store how the file should end here (either `))` or `;`).
				endStack =[],
				// The last token, used to remember which tag we are in.
				lastToken,
				// The corresponding magic tag.
				startTag = null,
				// Was there a magic tag inside an html tag?
				magicInTag = false,
				// The current tag name.
				tagName = '',
				// stack of tagNames
				tagNames = [],
				// Declared here.
				bracketCount,
				i = 0,
				token;

			// Reinitialize the tag state goodness.
			htmlTag = quote = beforeQuote = null;

			for (; (token = tokens[i++]) !== undefined;) {

				if ( startTag === null ) {
					switch ( token ) {
					case '<%':
					case '<%=':
					case '<%==':
						magicInTag = 1;
					case '<%#':
						// A new line -- just add whatever content within a clean.  
						// Reset everything.
						startTag = token;
						if ( content.length ) {
							put(content);
						}
						content = '';
						break;

					case '<%%':
						// Replace `<%%` with `<%`.
						content += '<%';
						break;
					case '<':
						// Make sure we are not in a comment.
						if(tokens[i].indexOf("!--") !== 0) {
							htmlTag = 1;
							magicInTag = 0;
						}
						content += token;
						break;
					case '>':
						htmlTag = 0;
						// TODO: all `<%=` in tags should be added to pending hookups.
						if(magicInTag){
							put(content, ",can.EJS.pending(),\">\"");
							content = '';
						} else {
							content += token;
						}
						// if it's a tag like <input/>
						if(lastToken.substr(-1) == "/"){
							// remove the current tag in the stack
							tagNames.pop();
							// set the current tag to the previous parent
							tagName = tagNames[tagNames.length-1];
						}
						break;
					case "'":
					case '"':
						// If we are in an html tag, finding matching quotes.
						if(htmlTag){
							// We have a quote and it matches.
							if(quote && quote === token){
								// We are exiting the quote.
								quote = null;
								// Otherwise we are creating a quote.
								// TODO: does this handle `\`?
							} else if(quote === null){
								quote = token;
								beforeQuote = lastToken;
							}
						}
					default:
						// Track the current tag
						if(lastToken === '<'){
							tagName = token.split(' ')[0];
							// If 
							if( tagName.indexOf("/") === 0 && tagNames.pop() === tagName.substr(1) ) {
								tagName = tagNames[tagNames.length-1]|| tagName.substr(1)
							} else {
								tagNames.push(tagName);
							}
						}
						content += token;
						break;
					}
				}
				else {
					// We have a start tag.
					switch ( token ) {
					case '%>':
						// `%>`
						switch ( startTag ) {
						case '<%':
							// `<%`
							
							// Get the number of `{ minus }`
							bracketCount = bracketNum(content);
							
							// We are ending a block.
							if (bracketCount == 1) {

								// We are starting on.
								buff.push(insert_cmd, "can.EJS.txt(0,'"+tagName+"'," + status() + ",this,function(){", startTxt, content);
								
								endStack.push({
									before: "",
									after: finishTxt+"}));\n"
								})
							}
							else {
								
								// How are we ending this statement?
								var last = // If the stack has value and we are ending a block...
									 endStack.length && bracketCount == -1 ? // Use the last item in the block stack.
									 endStack.pop() : // Or use the default ending.
								{
									after: ";"
								};
								
								// If we are ending a returning block, 
								// add the finish text which returns the result of the
								// block.
								if (last.before) {
									buff.push(last.before)
								}
								// Add the remaining content.
								buff.push(content, ";",last.after);
							}
							break;
						case '<%=':
						case '<%==':
							// We have an extra `{` -> `block`.
							// Get the number of `{ minus }`.
							bracketCount = bracketNum(content);
							// If we have more `{`, it means there is a block.
							if( bracketCount ){
								// When we return to the same # of `{` vs `}` end with a `doubleParent`.
								endStack.push({
									before : finishTxt,
									after: "}));"
								})
							} 
							// Check if its a func like `()->`
							if(quickFunc.test(content)){
								var parts = content.match(quickFunc)
								content = "function(__){var "+parts[1]+"=can.$(__);"+parts[2]+"}"
							}
							
							// If we have `<%== a(function(){ %>` then we want
							// `can.EJS.text(0,this, function(){ return a(function(){ var _v1ew = [];`.
							buff.push(insert_cmd, "can.EJS.txt("+(startTag === '<%=' ? 1 : 0)+",'"+tagName+"'," + status()+",this,function(){ return ", content, 
								// If we have a block.
								bracketCount ? 
								// Start with startTxt `"var _v1ew = [];"`.
								startTxt : 
								// If not, add `doubleParent` to close push and text.
								"}));"
								);
							break;
						}
						startTag = null;
						content = '';
						break;
					case '<%%':
						content += '<%';
						break;
					default:
						content += token;
						break;
					}
					
				}
				lastToken = token;
			}
			
			// Put it together...
			if ( content.length ) {
				// Should be `content.dump` in Ruby.
				put(content)
			}
			buff.push(";")
			
			var template = buff.join(''),
				out = {
					out: 'with(_VIEW) { with (_CONTEXT) {' + template + " "+finishTxt+"}}"
				};
			// Use `eval` instead of creating a function, because it is easier to debug.
			myEval.call(out, 'this.fn = (function(_CONTEXT,_VIEW){' + out.out + '});\r\n//@ sourceURL=' + name + ".js");
			return out;
		};
	
	

		EJS.Helpers = function( data, extras ) {
		this._data = data;
		this._extras = extras;
		extend(this, extras);
	};
		EJS.Helpers.prototype = {
				// TODO Deprecated!!
		list : function(list, cb){
			can.each(list, function(item, i){
				cb(item, i, list)
			})
		}
	};

	// Options for `steal`'s build.
	can.view.register({
		suffix: "ejs",
		// returns a `function` that renders the view.
		script: function( id, src ) {
			return "can.EJS(function(_CONTEXT,_VIEW) { " + new EJS({
				text: src,
				name: id
			}).template.out + " })";
		},
		renderer: function( id, text ) {
			return EJS({
				text: text,
				name: id
			});
		}
	});

	
	// ## control/route.js  
	// _Controller route integration._
	
	can.Control.processors.route = function( el, event, selector, funcName, controller ) {
		can.route( selector || "" )
		var batchNum,
			check = function( ev, attr, how ) {
				if ( can.route.attr('route') === ( selector || "" ) && 
				   ( ev.batchNum === undefined || ev.batchNum !== batchNum ) ) {
					
					batchNum = ev.batchNum;
					
					var d = can.route.attr();
					delete d.route;
					if(can.isFunction(controller[funcName])){
						controller[funcName]( d )
					}else {
						controller[controller[funcName]](d)
					}
					
				}
			}
		can.route.bind( 'change', check );
		return function() {
			can.route.unbind( 'change', check )
		}
	}
;

	
	// ## model.js  
	// `can.Model`  
	// _A `can.Observe` that connects to a RESTful interface._
	//  
	// Generic deferred piping function
		var	pipe = function( def, model, func ) {
		var d = new can.Deferred();
		def.then(function(){
			arguments[0] = model[func](arguments[0])
			d.resolveWith(d, arguments)
		},function(){
			d.rejectWith(this, arguments)
		})
		return d;
	},
		modelNum = 0,
		ignoreHookup = /change.observe\d+/,
		getId = function( inst ) {
			return inst[inst.constructor.id]
		},
		// Ajax `options` generator function
		ajax = function( ajaxOb, data, type, dataType, success, error ) {

			
			// If we get a string, handle it.
			if ( typeof ajaxOb == "string" ) {
				// If there's a space, it's probably the type.
				var parts = ajaxOb.split(" ")
				ajaxOb = {
					url : parts.pop()
				};
				if(parts.length){
					ajaxOb.type = parts.pop();
				}
			}

			// If we are a non-array object, copy to a new attrs.
			ajaxOb.data = typeof data == "object" && !can.isArray(data) ?
				can.extend(ajaxOb.data || {}, data) : data;
	

			// Get the url with any templated values filled out.
			ajaxOb.url = can.sub(ajaxOb.url, ajaxOb.data, true);

			return can.ajax(can.extend({
				type: type || "post",
				dataType: dataType ||"json",
				success : success,
				error: error
			}, ajaxOb ));
		},
		makeRequest = function( self, type, success, error, method ) {
			var deferred ,
				args = [self.serialize()],
				// The model.
				model = self.constructor,
				jqXHR;

			// `destroy` does not need data.
			if ( type == 'destroy' ) {
				args.shift();
			}
			// `update` and `destroy` need the `id`.
			if ( type !== 'create' ) {
				args.unshift(getId(self))
			}
			
			jqXHR = model[type].apply(model, args);
			
			deferred = jqXHR.pipe(function(data){
				self[method || type + "d"](data, jqXHR);
				return self
			})

			// Hook up `abort`
			if(jqXHR.abort){
				deferred.abort = function(){
					jqXHR.abort();
				}
			}
			
			return deferred.then(success,error);
		},
	
	// This object describes how to make an ajax request for each ajax method.  
	// The available properties are:
	//		`url` - The default url to use as indicated as a property on the model.
	//		`type` - The default http request type
	//		`data` - A method that takes the `arguments` and returns `data` used for ajax.
		//
				// 
				// 
			ajaxMethods = {
				create : {
			url : "_shortName",
			type :"post"
		},
				update : {
			data : function(id, attrs){
				attrs = attrs || {};
				var identity = this.id;
				if ( attrs[identity] && attrs[identity] !== id ) {
					attrs["new" + can.capitalize(id)] = attrs[identity];
					delete attrs[identity];
				}
				attrs[identity] = id;
				return attrs;
			},
			type : "put"
		},
				destroy : {
			type : "delete",
			data : function(id){
				var args = {};
				args[this.id] = id;
				return args;
			}
		},
				findAll : {
			url : "_shortName"
		},
				findOne: {}
	},
		// Makes an ajax request `function` from a string.
		//		`ajaxMethod` - The `ajaxMethod` object defined above.
		//		`str` - The string the user provided. Ex: `findAll: "/recipes.json"`.
		ajaxMaker = function(ajaxMethod, str){
			// Return a `function` that serves as the ajax method.
			return function(data){
				// If the ajax method has it's own way of getting `data`, use that.
				data = ajaxMethod.data ? 
					ajaxMethod.data.apply(this, arguments) :
					// Otherwise use the data passed in.
					data;
				// Return the ajax method with `data` and the `type` provided.
				return ajax(str || this[ajaxMethod.url || "_url"], data, ajaxMethod.type || "get")
			}
		}

	
	
	can.Observe("can.Model",{
		setup : function(base){
			can.Observe.apply(this, arguments);
			if(this === can.Model){
				return;
			}
			var self = this,
				clean = can.proxy(this._clean, self);
				
			can.each(ajaxMethods, function(method, name){
				if ( ! can.isFunction( self[name] )) {
					self[name] = ajaxMaker(method, self[name]);
				}
				if (self["make"+can.capitalize(name)]){
					var newMethod = self["make"+can.capitalize(name)](self[name]);
					can.Construct._overwrite(self, base, name,function(){
						this._super;
						this._reqs++;
						return newMethod.apply(this, arguments).then(clean, clean);
					})
				}
			});

			if(!self.fullName || self.fullName == base.fullName){
				self.fullName = self._shortName = "Model"+(++modelNum);
			}
			// Ddd ajax converters.
			this.store = {};
			this._reqs = 0;
			this._url = this._shortName+"/{"+this.id+"}"
		},
		_ajax : ajaxMaker,
		_clean : function(){
			this._reqs--;
			if(!this._reqs){
				for(var id in this.store) {
					if(!this.store[id]._bindings){
						delete this.store[id];
					}
				}
			}
		},
				models: function( instancesRawData ) {

			if ( ! instancesRawData ) {
				return;
			}
      
			if ( instancesRawData instanceof this.List ) {
				return instancesRawData;
			}

			// Get the list type.
			var self = this,
				res = new( self.List || ML),
				// Did we get an `array`?
				arr = can.isArray(instancesRawData),
				
				// Did we get a model list?
				ml = (instancesRawData instanceof ML),

				// Get the raw `array` of objects.
				raw = arr ?

				// If an `array`, return the `array`.
				instancesRawData :

				// Otherwise if a model list.
				(ml ?

				// Get the raw objects from the list.
				instancesRawData.serialize() :

				// Get the object's data.
				instancesRawData.data),
				i = 0;

			

			can.each(raw, function( rawPart ) {
				res.push( self.model( rawPart ));
			});

			if ( ! arr ) { // Push other stuff onto `array`.
				can.each(instancesRawData, function(val, prop){
					if ( prop !== 'data' ) {
						res[prop] = val;
					}
				})
			}
			return res;
		},
				model: function( attributes ) {
			if (!attributes ) {
				return;
			}
			if ( attributes instanceof this ) {
				attributes = attributes.serialize();
			}
			var model = this.store[attributes[this.id]] ? this.store[attributes[this.id]].attr(attributes) : new this( attributes );
			if(this._reqs){
				this.store[attributes[this.id]] = model;
			}
			return model;
		}
	},
		{
				isNew: function() {
			var id = getId(this);
			return ! ( id || id === 0 ); // If `null` or `undefined`
		},
				save: function( success, error ) {
			return makeRequest(this, this.isNew() ? 'create' : 'update', success, error);
		},
				destroy: function( success, error ) {
			return makeRequest(this, 'destroy', success, error, 'destroyed');
		},
				bind : function(eventName){
			if ( ! ignoreHookup.test( eventName )) { 
				if ( ! this._bindings ) {
					this.constructor.store[getId(this)] = this;
					this._bindings = 0;
				}
				this._bindings++;
			}
			
			return can.Observe.prototype.bind.apply( this, arguments );
		},
				unbind : function(eventName){
			if(!ignoreHookup.test(eventName)) { 
				this._bindings--;
				if(!this._bindings){
					delete this.constructor.store[getId(this)];
				}
			}
			return can.Observe.prototype.unbind.apply(this, arguments);
		},
		// Change `id`.
		___set: function( prop, val ) {
			can.Observe.prototype.___set.call(this,prop, val)
			// If we add an `id`, move it to the store.
			if(prop === this.constructor.id && this._bindings){
				this.constructor.store[getId(this)] = this;
			}
		}
	});
	
	can.each({
		makeFindAll : "models",
		makeFindOne: "model"
	}, function( method, name ) {
		can.Model[name] = function( oldFind ) {
			return function( params, success, error ) {
				return pipe( oldFind.call( this, params ), this, method ).then( success, error );
			};
		};
	});
				
		can.each([
		"created",
		"updated",
		"destroyed"], function( funcName ) {
		can.Model.prototype[funcName] = function( attrs ) {
			var stub, 
				constructor = this.constructor;

			// Update attributes if attributes have been passed
			stub = attrs && typeof attrs == 'object' && this.attr(attrs.attr ? attrs.attr() : attrs);

			// Call event on the instance
			can.trigger(this,funcName);
			can.trigger(this,"change",funcName)
			

			// Call event on the instance's Class
			can.trigger(constructor,funcName, this);
		};
	});
  
  // Model lists are just like `Observe.List` except that when their items are 
  // destroyed, it automatically gets removed from the list.
  	var ML = can.Observe.List('can.Model.List',{
		setup : function(){
			can.Observe.List.prototype.setup.apply(this, arguments );
			// Send destroy events.
			var self = this;
			this.bind('change', function(ev, how){
				if(/\w+\.destroyed/.test(how)){
					self.splice(self.indexOf(ev.target),1);
				}
			})
		}
	})
	
}, "0.0.1", {
requires: ["node", "io-base", "querystring", "event-focus", "array-extras"],
 optional: ["selector-css2", "selector-css3"]
});
}( can = {}, this ));