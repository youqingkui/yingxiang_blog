// Generated by CoffeeScript 1.8.0
(function() {
  var mongoose, tasgSchema;

  mongoose = require('./mongoose');

  tasgSchema = mongoose.Schema({
    tags: Array
  });

  module.exports = mongoose.model('Tags', tasgSchema);

}).call(this);

//# sourceMappingURL=tags.js.map
