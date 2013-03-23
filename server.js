(function() {
  var UserUtil, app, cfg, db, express, nano, users;
  cfg = require('./cfg.js');
  express = require('express');
  app = module.exports = express.createServer();
  nano = require('nano')(cfg);
  db = nano.use('express');
  users = {};
  app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
      secret: 'your secret here'
    }));
    app.use(express.compiler({
      src: __dirname + '/public',
      enable: ['sass']
    }));
    app.use(app.router);
    return app.use(express.static(__dirname + '/public'));
  });
  app.configure('development', function() {
    return app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });
  app.configure('production', function() {
    return app.use(express.errorHandler());
  });
  UserUtil = {
    getAllUsers: function(req, res, next) {
      return db.list({
        include_docs: true
      }, function(_, users) {
        req.users = users;
        return next();
      });
    },
    getUserById: function(req, res, next) {
      return db.get(req.params.id, function(_, user) {
        req.user = user;
        return next();
      });
    }
  };
  app.get('/', function(req, res) {
    return res.render('index', {
      title: 'Express'
    });
  });
  app.get('/users', UserUtil.getAllUsers, function(req, res) {
    return res.render('users', {
      users: req.users.rows
    });
  });
  app.get('/user/:id', UserUtil.getUserById, function(req, res) {
    return res.render('users/view', {
      user: req.user
    });
  });
  app.get('/user/:id/edit', UserUtil.getUserById, function(req, res) {
    return res.render('users/edit', {
      user: req.user
    });
  });
  app.listen(80);
  console.log('Started on %d', app.address().port);
}).call(this);
