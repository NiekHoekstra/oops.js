function Meta(parent, methods) {
  this.__meta = this;  // safe __meta calls :)
  this.proto = {};
  this.cls = {};
  this.bound = {};

  if(parent){
    parent = parent.__meta;
    Object.assign(this.proto, parent.proto);
    Object.assign(this.cls, parent.cls);
  }
  this.parent = parent;
  this.mixin(methods);
}
Meta.default = {
   '__construct': function(){}, // catch non-existant constructors.
};

Object.assign(Meta.prototype, {
  '_assign': function(f) {
    Object.assign(f.prototype, this.bound);
    Object.assign(f, this.cls);
  },
  '_bind' : function(func) { // Bind a function to inject a 'self' argument.
    function f() {
      let args = Array.from(arguments);
      args.unshift(this);
      return func.apply(this, args);
    }
    return f;
  },
  'mixin': function(dict) {
    for(let key in dict) {
      if(key[0] == ':') {
        this.cls[key] = dict[key];
      } else {
        this.proto[key] = dict[key];
        this.bound[key] = this._bind(dict[key]);
      }
    }
  },
  'build': function(){
    let meta = this;
    function f() { this.__meta = meta; this.__construct.apply(this, arguments); }  // this is how we implement constructors.
    f.__meta = meta;
    if(this.parent != null) this.parent._assign(f); this._assign(f);
    f.prototype.super = function() {
      return meta.parent.proto;
    }
    f.prototype.__apply = function(func, self, args) {
      args = Array.from(args);
      args.unshift(self);
      return this.__raw(func, args);
    }
    f.prototype.__raw = function(func, args) {
      return this.__meta.proto[func].apply(self, args);
    }
    return f;
  }
});

function Class(inherits, methods) {
  let meta = new Meta(inherits, methods);
  return meta.build();
}
