/**
 * Created by Shohei Yokoyama on 2015/06/02.
 */
var Heap = require('heap');
//var X = require('intersection');
var hasIntersection = require('has-intersection');
var createTree = require("functional-red-black-tree");

var Duration = require("duration-log");

var CurIdx = function(id){
    this.orgId = id;
    this.id = id;
};
CurIdx.prototype.set =function(id){
  this.id = id;
};
CurIdx.prototype.get =function(){
    return this.id;
};
CurIdx.prototype.id = 0;
CurIdx.prototype.orgId = 0;

var SweepLine = function(dataset,callback,scope){
    this.duration = new Duration();
    this.nIntersections = 0;
    this.callback = callback || function(){};
    this.scope = scope || this;
    this.dataset = [];
    this.idlist = [];
    this.sweep = null;
    this.mark = {};
    var _this = this;
    this.rbTree = createTree(function (A,B) {
        var AY = _this.getSweepY(A);
        var BY = _this.getSweepY(B);
        return parseFloat(Number(AY-BY).toFixed(10));
    });
    this.heap = new Heap(function (a, b) {
        if (a[0] - b[0] != 0) {
            return a[0] - b[0];
        } else {
            if ((a[2] == "end" && b[2] == "end") || (a[2] == "start" && b[2] == "start")) {
                return a[3] - b[3];
            } else if (a[2] == "start") {
                return -1;
            } else if (b[2] == "start") {
                return 1;
            } else if (a[2] == "end") {
                return 1;
            } else if (b[2] == "end") {
                return -1;
            } else if (a[2] == "X" && b[2] == "X") {
                var aA = a[3][0];
                var aB = a[4][0];
                var bA = b[3][0];
                var bB = b[4][0];
                return  (bA + bB) - (aA + aB);
            } else {
                throw new Error("Never Reach Here!(aType=" + a[2] + ", bType=" + b[2] + ")");
            }
        }
    });
    dataset.forEach(function(line,idx){
        var startX,startY,endX,endY;
        if(line[0] < line[2]){
            startX = line[0];
            startY = line[1];
            endX   = line[2];
            endY   = line[3];
        }else{
            startX = line[2];
            startY = line[3];
            endX   = line[0];
            endY   = line[1];
        }
        var curIdx = new CurIdx(idx);
        this.idlist[idx] = curIdx;
        this.dataset.push([startX,startY,endX,endY,idx,curIdx]);
        //this.dataindex.push(idx);
        var slope = (endY - startY) / (endX - startX);
        this.heap.insert([startX,startY,"start",slope,idx,curIdx]);
        this.heap.insert([endX,endY,"end",slope,idx,curIdx]);
    },this);
    var point;
    while (point = this.heap.pop()) {
        this.sweep = point[0];
        var lineA,lineB;
        switch(point[2]){
            case "start":
                this.rbTree = this.rbTree.insert(point[4],this.dataset[point[5].get()]);
                if(this.rbTree.length < 2){
                    continue;
                }
                lineA = this.dataset[point[5].get()];
                lineB = this.findFromTree(point[5].get());
                if(lineB && lineB.valid && lineB.hasNext) {
                    lineB.next();
                    this.ckeckIntersection(lineA,lineB.value);
                    lineB.prev();
                };
                if(lineB.hasPrev) {
                    lineB.prev();
                    this.ckeckIntersection(lineA,lineB.value);
                }
                break;
            case "end":
                var len = this.rbTree.length;
                //this.printTree();
                var iterR = this.findFromTree(point[5].get());
                if(iterR.hasNext && iterR.hasPrev){
                    lineA = this.rbTree.at(iterR.index+1).value;
                    lineB = this.rbTree.at(iterR.index-1).value;
                    this.ckeckIntersection(lineA,lineB);
                }
                this.rbTree = iterR.remove();
                //this.printTree();
                if(len-this.rbTree.length == 0){
                    throw new ERROR("Item wasn't removed.");
                }
                break;
            case "X":
                lineA = this.dataset[point[3][1].get()];
                lineB = this.dataset[point[4][1].get()];
                this.callback.apply(this.scope,[lineA[4],lineB[4],point[0],point[1]]);
                this.nIntersections++;
                //this.printTree();
                var iterA = this.findFromTree(lineA[5].get());
                var iterB = this.findFromTree(lineB[5].get());
                if(iterA.index == iterB.index) {
                    var iter =this.goFirst(iterA.clone());
                    var match = 0;
                    do{
                        if(iter.value[5].get() == lineA[5].get()){
                            match++;
                            iterA = iter.clone();
                            if(match==2){
                                break;
                            }
                        }
                        if(iter.value[5].get()==lineB[5].get()){
                            match++;
                            iterB = iter.clone();
                            if(match==2){
                                break;
                            }
                        }
                        if(iter.hasNext) {
                            iter.next();
                        }else{
                            throw new Error("bug?");
                        }
                    }while(iter.valid)
                }
                var maxIter = iterA;
                var minIter = iterB;
                if(minIter.index > maxIter.index){
                    maxIter = iterB;
                    minIter = iterA;
                }
                if(minIter.hasPrev){
                    this.ckeckIntersection(maxIter.value,this.rbTree.at(minIter.index-1).value);
                }
                if(maxIter.hasNext){
                    this.ckeckIntersection(minIter.value,this.rbTree.at(maxIter.index+1).value);
                }
                this.mark[lineA[4]+'-'+lineB[4]] = {x:point[0],y:point[1]};
                var maxKey = maxIter.key;
                var minKey = minIter.key;
                var maxVal = this.dataset[maxIter.key];
                this.dataset[maxIter.key] = this.dataset[minIter.key];
                this.dataset[minIter.key] = maxVal;
                var max = maxIter.value;
                var min = minIter.value;
                max[5].set(minIter.key);
                min[5].set(maxIter.key);
                this.rbTree =  this.rbTree.at(maxIter.index).update(min);
                this.rbTree =  this.rbTree.at(minIter.index).update(max);
                break;
            default:
                throw new Error("Never Reach Here! (Invalid Event Type = "+point+")");
        }
    }
};
SweepLine.prototype.getSlope = function(line){
    return (line[3] - line[1]) / (line[2] - line[0]);
};
SweepLine.prototype.getSweepY = function(idx){
    var sideX = this.dataset[idx][2] - this.dataset[idx][0];
    if(sideX == 0){
        //The line is Vertical.
        return Math.min(this.dataset[idx][1],this.dataset[idx][3]);
    }
    var sideY = this.dataset[idx][3] - this.dataset[idx][1];
    var deltaX = this.sweep - this.dataset[idx][0];
    return  this.dataset[idx][1] + ((deltaX / sideX)*sideY);
};
SweepLine.prototype.findFromTree = function(id,iter){
    if(!iter) {
        iter = this.rbTree.find(id);
    }
    iter = this.goFirst(iter);

    while(iter.value[5].get()!=id){
        if(iter.hasNext) {
            iter.next();
        }else{
            this.printTree();
            console.log(this.duration.sumup);
            throw new Error("Not Found IN Tree.");
        }
    }
    return iter;
};
SweepLine.prototype.printTree = function(){
    //return;
    console.log("=============================================printTree");
    var keys = this.rbTree.keys;
    this.rbTree.values.forEach(function(po,idx){
        console.log("["+idx+"]\tkey:"+keys[idx]+", orgId:"+po[4]+", curId:"+po[5].get()+" X:"+this.sweep+", Y:"+this.getSweepY(po[5].get()));
    },this);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^printTree");
    //console.log("HEAP:"+this.heap.toArray().join("|"));
};
SweepLine.prototype.removeFromTree = function(id,iter){
    if(!iter) {
        iter = this.rbTree.find(id);
    }
    iter = this.goFirst(iter);
    if(iter.value[5]==id){
        return iter.remove();
    }else{
        iter.next();
        return this.removeFromTree(id,iter);
    }
};
SweepLine.prototype.goFirst = function(iter,sweepY){
    if(!sweepY){
        //console.log("Go First!");
        if(typeof iter.value == "undefined"){
            this.printTree();
            throw "can't go first position.";
        }
        sweepY = iter.value[5].get();
    }
    if(iter.hasPrev){
        iter.prev();
        if(0 == parseFloat(Number(this.getSweepY(iter.value[5].get()) - sweepY).toFixed(10))){
            return this.goFirst(iter,sweepY);
        }else{
            return iter;
        }
    }else{
        return iter;
    }
};
SweepLine.prototype.ckeckIntersection = function(lineA,lineB){
    var point;
    if(point = hasIntersection(lineA,lineB)){
        if(!this.mark.hasOwnProperty(lineA[4]+'-'+lineB[4]) && !this.mark.hasOwnProperty(lineB[4]+'-'+lineA[4])) {
            this.mark[lineA[4]+'-'+lineB[4]] = true;
            this.heap.insert([
                point.x,
                point.y,
                "X",
                [(lineA[3] - lineA[1]) / (lineA[2] - lineA[0]), lineA[5]],
                [(lineB[3] - lineB[1]) / (lineB[2] - lineB[0]), lineB[5]]
            ]);
        }
    }
}
SweepLine.prototype.nIntersections = null;
module.exports = SweepLine;