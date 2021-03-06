var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('app4');

var index = require('./routes/index');
var users = require('./routes/users');
var chessRoute = require('./routes/chess');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
global.appRoot = path.resolve(__dirname);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/chess', chessRoute);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

io.on('connection', function(socket) {
    var chess = new (require('./chess_codes/chessGame.js'))();
    var nn = new (require('./chess_codes/chessNN.js'))();
    var minimax = require('./chess_codes/chessMinimax.js');
    const searchDepth = 2;
    console.log('A user connected');
    socket.on('drop piece', function(data) {
        socket.emit('ai thinking');
        var playerMove = chess.move(chess.convPosFromStr(data.from), chess.convPosFromStr(data.to), null);
        var doPreventMove = playerMove ? true : false;
        io.emit('board', {position: chess.getPositionObj(), preventMove: doPreventMove});

        if (data.playerColor !== chess.current_move_side) {
            var move = minimax(nn, chess.boardToFen(), searchDepth);
            if (move[1]) chess.move(move[1][0], move[1][1], move[1][2]);
            io.emit('board', {position: chess.getPositionObj(), preventMove: false});
        }
        socket.emit('ai done thinking');
    });

    socket.on('undo', function() {
        chess.backOneMove();
        io.emit('board', {position: chess.getPositionObj(), preventMove: true});
        setTimeout(function() {
            chess.backOneMove();
            io.emit('board', {position: chess.getPositionObj(), preventMove: false});
        }.bind(this), 300);
    });

    socket.on('redo', function() {
        chess.forwardOneMove();
        io.emit('board', {position: chess.getPositionObj(), preventMove: true});
        setTimeout(function() {
            chess.forwardOneMove();
            io.emit('board', {position: chess.getPositionObj(), preventMove: false});
        }.bind(this), 300);
    });

    var autoplayInterval;
    socket.on('auto', function() {
        socket.emit('ai thinking');
        autoplayInterval = setInterval(function() {
            for (let i = 0; i < 2; i++) {
                var move = minimax(nn, chess.boardToFen(), searchDepth);
                if (move[1]) {
                    chess.move(move[1][0], move[1][1], move[1][2]);
                    io.emit('board', {position: chess.getPositionObj(), preventMove: true});
                } else {
                    socket.emit('ai done thinking');
                    clearInterval(autoplayInterval);
                    io.emit('board', {position: chess.getPositionObj(), preventMove: false});
                }
            }
        }.bind(this), 300);
    }.bind(this));

    socket.on('stop auto', function() {
        socket.emit('ai done thinking');
        clearInterval(autoplayInterval);
        io.emit('board', {position: chess.getPositionObj(), preventMove: false});
    }.bind(this));

    socket.on('resign', function() {
        chess.resign = true;
    });

});

server.listen(process.env.PORT || 3000, function() {
    console.log('Listening...');

});
