/**
 * Created by Shohei Yokoyama on 2015/06/03.
 */

var hasIntersection = require('has-intersection');
var BruteForce = function(dataset,callback,scope){
    this.nIntersections = 0;
    this.callback = callback || function(){};
    this.scope = scope || this;
    this.dataset = dataset;
    var idxA,idxB;
    for (idxA = 0; idxA < this.dataset.length; idxA++) {
        for (idxB = idxA + 1; idxB < this.dataset.length; idxB++) {
            var lineA = this.dataset[idxA];
            var lineB = this.dataset[idxB];
            var point;
            if(point = hasIntersection(lineA,lineB)){
                this.callback.apply(this.scope, [lineA[4], lineB[4], point.x, point.y]);
                this.nIntersections++;
            }
        }
    }
};
BruteForce.prototype.nIntersections = null;
module.exports = BruteForce;