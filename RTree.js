/**
 * Created by Shohei Yokoyama on 2015/06/03.
 */

var hasIntersection = require('has-intersection');
var RBush = require('rbush');
var RTree = function(dataset,callback,scope){
    this.dataset = dataset;
    this.input = [];
    this.nIntersections = 0;
    this.callback = callback || function(){};
    this.scope = scope || this;
    this.dataset = dataset;
    this.rTree = RBush(9);
    dataset.forEach(function(line,idx) {
        var minX = Math.min(line[0],line[2]);
        var minY = Math.min(line[1],line[3]);
        var maxX = Math.max(line[0],line[2]);
        var maxY = Math.max(line[1],line[3]);
        this.dataset[idx].push(idx);
        this.input[idx] = [minX,minY,maxX,maxY,idx];
        this.rTree.insert( this.input[idx]);
    },this);
    dataset.forEach(function(lineA,idxA) {
        var minX = Math.min(lineA[0],lineA[2]);
        var minY = Math.min(lineA[1],lineA[3]);
        var maxX = Math.max(lineA[0],lineA[2]);
        var maxY = Math.max(lineA[1],lineA[3]);
        var results = this.rTree.search([minX, minY, maxX, maxY]);
        this.rTree.remove( this.input[idxA]);
        results.forEach(function(result){
            var lineB = this.dataset[result[4]];
            var point;
            if(point = hasIntersection(lineA,lineB)){
                this.callback.apply(this.scope, [idxA, result[4], point.x, point.y]);
                this.nIntersections++;
            }
        },this);
    },this);
};
RTree.prototype.nIntersections = null;
RTree.prototype.dataset = null;
RTree.prototype.rTree = null;
module.exports = RTree;