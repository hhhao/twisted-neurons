/*
 Chess Minimax Search
 */

var nn = new (require('./chessNN.js'))();
var chess = new (require('./chessGame.js'))();

//TODO implement tree reordering
function minimaxTopLevelWithMove(fen, depth) {
    chess.fenToBoard(fen);
    var isTopMaxSide = chess.current_move_side === 'w' ? true : false;
    var result = [(isTopMaxSide ? -Infinity : Infinity), null];
    var alpha = -Infinity;
    var beta = Infinity;
    var moves = chess.availableMoves();
    if (depth <= 0 || !moves.length) {
        result[0] = nn.forward(chess.gfeatures(), chess.pfeatures(), chess.sfeatures());
        return result;
    }
    for (let i = 0, n = moves.length; i < n; i++) {
        var m = moves[i];
        chess.move(m[0], m[1], m[2]);
        var subScore = minimax(chess.boardToFen(), depth-1, alpha, beta, !isTopMaxSide);
        if (isTopMaxSide && subScore > result[0]) {
            result[0] = subScore;
            result[1] = m;
            alpha = subScore;
        } else if (!isTopMaxSide && subScore < result[0]) {
            result[0] = subScore;
            result[1] = m;
            beta = subScore;
        }
        chess.fenToBoard(fen);
    }
    return result;
}

function minimax(fen, depth, alpha, beta, isMaxSide) {
    chess.fenToBoard(fen);
    var moves = chess.availableMoves();
    if (depth <= 0 || !moves.length) {
        return nn.forward(chess.gfeatures(), chess.pfeatures(), chess.sfeatures());
    }
    var score = isMaxSide ? -Infinity : Infinity;
    for (let i = 0, n = moves.length; i < n; i++) {
        var m = moves[i];
        chess.move(m[0], m[1], m[2]);
        var subScore = minimax(chess.boardToFen(), depth-1, alpha, beta, !isMaxSide);
        if (isMaxSide && subScore > score) {
            score = subScore;
            alpha = subScore;
        } else if (!isMaxSide && subScore < score) {
            score = subScore;
            beta = subScore;
        }
        chess.fenToBoard(fen);
        if (alpha > beta) break;
    }
    return score;
}

module.exports = minimaxTopLevelWithMove;
