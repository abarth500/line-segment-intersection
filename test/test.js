/**
 * Created by Shohei Yokoyama on 2015/06/02.
 */

// Input format: [[x0,y0,x1,y1],...]
/*
var dataset = [
    [0,5,10,-5],
    [0,-5,10,5],
    [0,1,10,-1],
    [0,-1,10,1],
    [5,5,10,10]
];
*/

var SweepLine = require('../index.js').SweepLine;
var RTree = require('../index.js').RTree;
var BruteForce = require('../index.js').BruteForce;
var SplitQuery = require('../index.js').SplitQuery;
var Duration = require('duration-log');
var duration = new Duration();


function rand() {
    return Math.round(Math.random() * (10000 + 10000) -10000);
}

["10","100","1000","10000"].forEach(function(n){
    var dataset=[];
    for(var c = 0; c < n; c++){
        var x = rand();
        var x1 = x;
        var x2 = 2*x;
        var y1 = rand();
        var y2 = rand();
        if(x1 == x2){
            x2 /= 2;
        }
        dataset.push([x1,y1,x2,y2]);
        //console.log(dataset[dataset.length-1].join(","));
    }
    console.log("# "+ n + " line segments.");
    var result = [];

    var t = duration.start("Bentley-Ottmann");
    var sweepLine = new SweepLine(dataset.concat(),function(idxA,idxB,x,y){
        //callback for each intersection
        //result.push(["SL",idxA,idxB,x,y]);
    },function(){},this);
    t.stop();


    var t = duration.start("RTree");
    var rTree = new RTree(dataset.concat(),function(idxA,idxB,x,y){
        //callback for each intersection
        //result.push(["RT",idxA,idxB,x,y]);
    },function(){},this);
    t.stop();


    var t = duration.start("RTree-SplitQuery");
    var splitQuery = new SplitQuery(dataset.concat(),function(idxA,idxB,x,y){
        //callback for each intersection
        //result.push(["SQ",idxA,idxB,x,y]);
    },function(){},this);
    t.stop();

    var t = duration.start("BuruteForce");
    var bruteForce = new BruteForce(dataset.concat(),function(idxA,idxB,x,y){
        //callback for each intersection
        //result.push(["BF",idxA,idxB,x,y]);
    },function(){},this);
    t.stop();

    console.log("\tBentley-Ottmann  :"+sweepLine.nIntersections+" intersections, time="+duration.sumup["Bentley-Ottmann"]);
    console.log("\tRTree            :"+rTree.nIntersections+" intersections, time="+duration.sumup["RTree"]);
    console.log("\tRTree(SplitQuery):"+splitQuery.nIntersections+" intersections, time="+duration.sumup["RTree-SplitQuery"]);
    console.log("\tBuruteForce      :"+bruteForce.nIntersections+" intersections, time="+duration.sumup["BuruteForce"]);
});