# Module Dependencies
express = require 'express'
app = module.exports = express.createServer()
cfg = null
nano = null
db = null

# Configuration
app.configure ->
  app.set 'views', __dirname + '/views'
  app.set 'view engine', 'jade'
  app.use express.bodyParser()
  app.use express.methodOverride()
  app.use express.cookieParser()
  app.use express.session
    secret: 'your secret here'
  app.use express.compiler
    src: __dirname + '/public'
    enable: ['sass']
  app.use app.router
  app.use express.static __dirname + '/public'
  
app.configure 'development', ->
  cfg = require './cfg.js'
  app.use express.errorHandler
    dumpExceptions: true
    showStack: true

app.configure 'production', ->
  cfg = require './cfgserver.js'
  app.use express.errorHandler()
  
app.configure ->  
  nano = require('nano')(cfg)
  db = nano.use 'express'

# User Utilities
UserUtil = 
  getAllDocuments: (req, res, next) ->
    db.list 
      include_docs: true, (_, users) ->
        req.users = users
        next()
  getAllUsers: (req, res, next) ->
    db.view 'players', 'players', (e, r, h) ->
      return next new Error "View Error" unless r
      req.users = r
      next()
  getUserById: (req, res, next, id) ->
    userId = id ? req.params.id
    db.get userId, (e, r, h) ->
      return next new Error "User is not found" if h['status-code'] is 404
      req.user = r
      next()

# Param Middleware      
app.param 'userId', (req, res, next, id) ->
  UserUtil.getUserById req, res, next, id

# Routes
app.get '/', (req, res) ->
  res.render 'index',
    title: 'Express'

###
app.get '/users', UserUtil.getAllUsers, (req, res) ->
  res.render 'users',
    users: req.users.rows
###

app.get '/users', UserUtil.getAllUsers, (req, res) ->
  res.render 'users',
    users: req.users.rows

app.get '/users/add', (req, res) ->
  res.render 'users/add'

app.post '/users/add', (req, res) ->
  db.insert req.body, ->
    res.redirect '/users'

app.get '/user/:userId', (req, res) ->
  res.render 'users/view',
    user: req.user

app.get '/user/:userId/edit', (req, res) ->
  res.render 'users/edit',
    user: req.user

app.put '/user/:userId/edit', (req, res) ->
  db.insert req.body, req.user._id, ->
    res.redirect '/users'

app.get '/user/:userId/delete', (req, res) ->
  db.destroy req.user._id, req.user._rev, ->
    res.redirect '/users'
    
app.get '/positions', (req, res) ->
  res.render 'positions'

# Starting the app ..
port = process.env.PORT || 3000
app.listen port, ->
  console.log 'Started on %d', app.address().port