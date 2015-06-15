/**
 * Created by Shohei Yokoyama on 2015/06/03.
 */
var hasIntersection = require('has-intersection');
var RBush = require('rbush');
var RTreeSplitQuery = function (dataset, callback, finishHandler, scope) {
    this.dataset = dataset;
    this.input = [];
    this.mark = {};
    this.nIntersections = 0;
    this.callback = callback || function () {
    };
    this.scope = scope || this;
    this.dataset = dataset;
    this.rTree = RBush(9);
    dataset.forEach(function (line, idx) {
        var minX = Math.min(line[0], line[2]);
        var minY = Math.min(line[1], line[3]);
        var maxX = Math.max(line[0], line[2]);
        var maxY = Math.max(line[1], line[3]);
        this.dataset[idx].push(idx);
        this.input[idx] = [minX, minY, maxX, maxY, idx];
        this.rTree.insert(this.input[idx]);
    }, this);
    dataset.forEach(function (lineA, idxA) {
        this.findIntersection(lineA, idxA);
    }, this);
    finishHandler.apply(this.scope,[]);
};
RTreeSplitQuery.prototype.findIntersection = function (lineA, idxA) {
    this.rTree.remove(this.input[idxA]);
    var minX = Math.min(lineA[0], lineA[2]);
    var minY = Math.min(lineA[1], lineA[3]);
    var maxX = Math.max(lineA[0], lineA[2]);
    var maxY = Math.max(lineA[1], lineA[3]);
    this.split = 2;

    var results = [];
    var touch = [];
    var deltaX = (lineA[2] - lineA[0]) / this.split;
    var deltaY = (lineA[3] - lineA[1]) / this.split;
    for (var i = this.split; i--;) {
        var sX, sY;
        if (i == this.split - 1) {
            //Avoid unexpected IEEE 754
            sX = lineA[2] - deltaX;
            sY = lineA[3] - deltaY;
        } else {
            sX = lineA[0] + (deltaX * i);
            sY = lineA[1] + (deltaY * i);
        }
        var r = this.rTree.search([Math.min(sX, sX + deltaX) - 1, Math.min(sY, sY + deltaY) - 1, Math.max(sX, sX + deltaX) + 1, Math.max(sY, sY + deltaY) + 1]);
        for (var ii = r.length; ii--;) {
            if (typeof touch[r[ii][4]] === 'undefined') {
                touch[r[ii][4]] = true;
                results.push(r[ii]);
            }
        }
    }
    for (i = results.length; i--;) {
        var result = results[i];
        var lineB = this.dataset[result[4]];
        var point;
        if (point = hasIntersection(lineA, lineB)) {
            this.callback.apply(this.scope, [idxA, result[4], point.x, point.y]);
            this.nIntersections++;
        }
    }
};
RTreeSplitQuery.prototype.hasIntersectionzz = function (lineA, lineB) {
    var x1 = lineA[0];
    var y1 = lineA[1];
    var f1 = lineA[2] - lineA[0];
    var g1 = lineA[3] - lineA[1];

    var x2 = lineB[0];
    var y2 = lineB[1];
    var f2 = lineB[2] - lineB[0];
    var g2 = lineB[3] - lineB[1];

    var det = f2 * g1 - f1 * g2;
    if (det == 0) {
        return false;
    }
    var dx = x2 - x1;
    var dy = y2 - y1;
    var t1 = (f2 * dy - g2 * dx) / det;
    var t2 = (f1 * dy - g1 * dx) / det;
    if (t1 > 0 && t1 < 1 && t2 > 0 && t2 < 1) {
        return {x: x1 + f1 * t1, y: y1 + g1 * t1};
    } else {
        return false;
    }
};
RTreeSplitQuery.prototype.nIntersections = null;
RTreeSplitQuery.prototype.dataset = null;
RTreeSplitQuery.prototype.rTree = null;
module.exports = RTreeSplitQuery;
