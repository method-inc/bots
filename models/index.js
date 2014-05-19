var fs        = require('fs'),
    path      = require('path'),
    Sequelize = require('sequelize'),
    lodash    = require('lodash'),
    sequelize = new Sequelize('bots', 'root', 'root', {
      host: 'localhost',
      port: 3306
    }),
    models        = {};

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js');
  })
  .forEach(function(file) {
    var model = sequelize.import(path.join(__dirname, file));
    models[model.name] = model;
  });

Object.keys(models).forEach(function(modelName) {
  if ('associate' in models[modelName]) {
    models[modelName].associate(models);
  }
});

module.exports = lodash.extend({
  sequelize: sequelize,
  Sequelize: Sequelize
}, models);
