(function() {
  var UserUtil, app, cfg, db, express, nano, port;
  express = require('express');
  app = module.exports = express.createServer();
  cfg = null;
  nano = null;
  db = null;
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
    cfg = require('./cfg.js');
    return app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });
  app.configure('production', function() {
    cfg = require('./cfgserver.js');
    return app.use(express.errorHandler());
  });
  app.configure(function() {
    nano = require('nano')(cfg);
    return db = nano.use('express');
  });
  UserUtil = {
    getAllDocuments: function(req, res, next) {
      return db.list({
        include_docs: true
      }, function(_, users) {
        req.users = users;
        return next();
      });
    },
    getAllUsers: function(req, res, next) {
      return db.view('players', 'players', function(e, r, h) {
        if (!r) {
          return next(new Error("View Error"));
        }
        req.users = r;
        return next();
      });
    },
    getUserById: function(req, res, next, id) {
      var userId;
      userId = id != null ? id : req.params.id;
      return db.get(userId, function(e, r, h) {
        if (h['status-code'] === 404) {
          return next(new Error("User is not found"));
        }
        req.user = r;
        return next();
      });
    }
  };
  app.param('userId', function(req, res, next, id) {
    return UserUtil.getUserById(req, res, next, id);
  });
  app.get('/', function(req, res) {
    return res.render('index', {
      title: 'Express'
    });
  });
  /*
  app.get '/users', UserUtil.getAllUsers, (req, res) ->
    res.render 'users',
      users: req.users.rows
  */
  app.get('/users', UserUtil.getAllUsers, function(req, res) {
    return res.render('users', {
      users: req.users.rows
    });
  });
  app.get('/users/add', function(req, res) {
    return res.render('users/add');
  });
  app.post('/users/add', function(req, res) {
    return db.insert(req.body, function() {
      return res.redirect('/users');
    });
  });
  app.get('/user/:userId', function(req, res) {
    return res.render('users/view', {
      user: req.user
    });
  });
  app.get('/user/:userId/edit', function(req, res) {
    return res.render('users/edit', {
      user: req.user
    });
  });
  app.put('/user/:userId/edit', function(req, res) {
    return db.insert(req.body, req.user._id, function() {
      return res.redirect('/users');
    });
  });
  app.get('/user/:userId/delete', function(req, res) {
    return db.destroy(req.user._id, req.user._rev, function() {
      return res.redirect('/users');
    });
  });
  app.get('/positions', function(req, res) {
    return res.render('positions');
  });
  port = process.env.PORT || 3000;
  app.listen(port, function() {
    return console.log('Started on %d', app.address().port);
  });
}).call(this);
