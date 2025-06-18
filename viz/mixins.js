const Base = class {}

// Helper function for default assignment with identity fallback
const defaults = (wiring = {}) => {
  return new Proxy(wiring, {
    get(target, prop) {
      // If the property exists in wiring, return its value
      if (prop in target) {
        return target[prop];
      }
      // Otherwise, return the property name itself (identity)
      return prop;
    }
  });
};

// Rewire function: creates a new wirableMixin with different default method names
const rewire = (wirableMixin, newDefaults) => {
  return (wiring = {}) => (Base = class {}) => {
    // Merge the new defaults with any additional wiring
    const finalWiring = Object.assign({}, newDefaults, wiring);
    return wirableMixin(finalWiring)(Base);
  };
};

// Compose helper: combines multiple wirableMixins
const compose = (...mixins) => {
  return (wiring = {}) => (Base = class {}) => {
    // Apply mixins in sequence, each getting the wiring
    return mixins.reduce((CurrentBase, mixin) => {
      return mixin(wiring)(CurrentBase);
    }, Base);
  };
};

// Wrap a class to make it rewirable:
const makeRewirable = (ClassToWrap, methodNames = []) => {
  return (wiring = {}) => (Base = class {}) => {
    const methods = defaults(wiring);
    
    return class extends Base {
      constructor(...args) {
        super(...args);
        
        // Create an instance of the wrapped class
        this._wrapped = new ClassToWrap(...args);
        
        // If no method names provided, extract them from the prototype
        const actualMethodNames = methodNames.length > 0 
          ? methodNames 
          : Object.getOwnPropertyNames(ClassToWrap.prototype)
              .filter(name => 
                name !== 'constructor' && 
                typeof ClassToWrap.prototype[name] === 'function'
              );
        
        // Create rewirable methods that delegate to the wrapped instance
        actualMethodNames.forEach(methodName => {
          // Use computed property names to enable rewiring
          this[methods[methodName]] = (...args) => {
            return this._wrapped[methodName](...args);
          };
        });
      }
    };
  };
};

const MapMixin = makeRewirable(Map, ['get', 'set', 'has', 'delete', 'clear', 'keys', 'values', 'entries']);
const WeakMapMixin = makeRewirable(WeakMap, ['get', 'set', 'has', 'delete']);
const SetMixin = makeRewirable(Set, ['add', 'has', 'delete', 'clear', 'keys', 'values', 'entries']);
const ArrayMixin = makeRewirable(Array, [
  'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 
  'indexOf', 'includes', 'find', 'filter', 'map', 'forEach',
  //'length' // This won't work as expected since length is a property, not a method
]);

// Higher order storage mixin: Make a per-instance storage out of some container rewirableMixin
const perInstanceStorage = (rewirableMixin) => (wiring = {}) => (Base = class {}) => {

    let methods = defaults(wiring);
    let instanceMap = new WeakMap();
    let containerClass = rewirableMixin()();

    return(class extends Base {
        constructor(...args) {
            super(...args)
            let dataContainer = new containerClass();
            instanceMap.set(this, dataContainer);
        }

        [methods.get](key) {
            let dataContainer = instanceMap.get(this);
            return(dataContainer.get(key))
        }

        [methods.has](key) {
            let dataContainer = instanceMap.get(this);
            return(dataContainer.has(key))
        }

        [methods.set](key, value) {
            let dataContainer = instanceMap.get(this);
            return(dataContainer.set(key, value))
        }
    })
}


// Higher order registrar mixin: the passed in container holds the collected items
const Registrar = (rewirableMixin) => (wiring = {}) => (Base = class {}) => {

    let methods = defaults(wiring);
    let containerClass = rewirableMixin()()

    return(class extends Base {
        constructor(...args) {super(...args)}
        [methods.register](type, value) {
            if (!this[methods.has](type)) {
                this[methods.set](type, new containerClass())
            }
            this[methods.get](type).add(value)
        }
        [methods.getRegistered](type) {
            return(this[methods.get](type))
        }
        [methods.unregister](type, value) {
            return(this[methods.get](type).delete(value))
        }
    })
}

const EventEmitter = compose(perInstanceStorage(MapMixin), Registrar(SetMixin))({register: 'on', unregister: 'off'});

const Example = class extends EventEmitter(Base) {
    constructor(...args) {super(...args)}
    emit(eventType, payload) {
        if (this.has(eventType)) {
            for (const handler of this.getRegistered(eventType).values()) {
                handler(payload)
            }
        }
    }
};

let t = new Example();
t.on('test', () => console.log('tested'))
t.emit('nothing');
t.emit('test');