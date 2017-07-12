// Copyright © 2017 DWANGO Co., Ltd.

describe("ObjectChannelSpec", function() {
    var oc = require("../lib/ObjectChannel.js");
    var fc = require("../node_modules/@cross-border-bridge/function-channel/lib/index.js");
    var dc = require("../node_modules/@cross-border-bridge/data-channel/lib/index.js");
    var db = require("../node_modules/@cross-border-bridge/memory-queue-data-bus/lib/index.js");
    var mq = require("../node_modules/@cross-border-bridge/memory-queue/lib/index.js");
    var dummyFunctionChannel = new Object();
    var objectChannel;
    var remoteObject;
    var objectTag;

    it("constructor", function() {
        dummyFunctionChannel.bind = function(id, obj) {
            expect("$obj").toEqual(id);
            expect(obj).not.toBeUndefined();
        }
        objectChannel = new oc.ObjectChannel(dummyFunctionChannel);
    });

    it("create a remote object", function() {
        dummyFunctionChannel.invoke = function(id, method, args, callback) {
            expect("$obj").toEqual(id);
            expect("create").toEqual(method);
            expect(2).toEqual(args.length);
            expect("RemoteClass").toEqual(args[0]);
            expect(3).toEqual(args[1].length);
            expect("arg1").toEqual(args[1][0]);
            expect("arg2").toEqual(args[1][1]);
            expect("arg3").toEqual(args[1][2]);
            callback(undefined, "RemoteClass:1");
        }
        objectChannel.create("RemoteClass", ["arg1", "arg2", "arg3"], function(err, obj) {
            expect(err).toBeUndefined();
            expect("RemoteClass:1").toEqual(obj._tag);
            remoteObject = obj;
        });
    });

    it("invoke remote method (PUSH)", function() {
        dummyFunctionChannel.invoke = function(id, method, args, callback) {
            expect("RemoteClass:1").toEqual(id);
            expect("testMethod").toEqual(method);
            expect(2).toEqual(args.length);
            expect("ONE").toEqual(args[0]);
            expect("TWO").toEqual(args[1]);
            expect(callback).toBeUndefined();
        }
        remoteObject.invoke("testMethod", ["ONE", "TWO"]);
    });

    it("invoke remote method (REQUEST)", function() {
        dummyFunctionChannel.invoke = function(id, method, args, callback) {
            expect("RemoteClass:1").toEqual(id);
            expect("testMethod2").toEqual(method);
            expect(2).toEqual(args.length);
            expect("ONE").toEqual(args[0]);
            expect("TWO").toEqual(args[1]);
            callback(undefined, "OK");
        }
        remoteObject.invoke("testMethod2", ["ONE", "TWO"], function(err, result) {
            expect(err).toBeUndefined();
            expect("OK").toEqual(result);
        });
    });

    it("invoke remote method (TIMEOUT)", function(done) {
        dummyFunctionChannel.invoke = function(id, method, args, callback, timeout) {
            expect(2525).toEqual(timeout);
            callback("Timeout");
        }
        remoteObject.invoke("testMethod2", ["ONE", "TWO"], function(err, result) {
            expect("Timeout").toEqual(err);
            expect(result).toBeUndefined();
            done();
        }, 2525);
    });

    it("destroy remote object", function() {
        dummyFunctionChannel.invoke = function(id, method, args, callback) {
            expect("$obj").toEqual(id);
            expect("destroy").toEqual(method);
            expect(1).toEqual(args.length);
            expect("RemoteClass:1").toEqual(args[0]);
            expect(callback).toBeUndefined();
        }
        remoteObject.destroy();
    });

    it("use remote object after destroy", function(done) {
        dummyFunctionChannel.invoke = undefined;
        remoteObject.invoke();
        remoteObject.invoke("method", [], function(err, result) {
            expect("AlreadyDestroyed").toEqual(err);
            expect(result).toBeUndefined();
            done();
        });
        remoteObject.destroy();
    });

    MyClassJS = (function() {
        function MyClassJS(a1, a2, a3) {
            expect("a1").toEqual(a1);
            expect(2).toEqual(a2);
            expect(a3).toBeTruthy();
        }
        MyClassJS.prototype.foo = function(a1, a2, a3) {
            console.log("executing MyClassJS.foo(" + a1 + "," + a2 + "," + a3 + ")");
            return a1 + a2 + a3;
        }
        return MyClassJS;
    })();

    it("bind", function() {
        objectChannel.bind(MyClassJS);
    });

    it("receive create request", function() {
        dummyFunctionChannel.bind = function(id, obj) {
            expect("MyClassJS:1").toEqual(id);
            expect(obj).not.toBeUndefined();
        }
        var tag = objectChannel._fc.create("MyClassJS", ["a1", 2, true]);
        expect("MyClassJS:1", tag);
        objectTag = tag;
        expect(objectChannel._objectSpace.getObject(objectTag)).not.toBeUndefined();
    });

    it("receive destroy request", function() {
        objectChannel._fc.destroy(objectTag);
        expect(objectChannel._objectSpace.getObject(objectTag)).toBeUndefined();
    });

    it("receive destroy request again", function() {
        objectChannel._fc.destroy(objectTag);
        expect(objectChannel._objectSpace.getObject(objectTag)).toBeUndefined();
    });

    it("unbind", function() {
        objectChannel.unbind(MyClassJS);
    });

    it("receive create request after unbound", function() {
        dummyFunctionChannel.bind = undefined;
        var tag = objectChannel._fc.create("MyClassJS", ["a1", 2, true]);
        expect(tag).toBeUndefined();
        expect(objectChannel._objectSpace.getObject(tag)).toBeUndefined();
    });

    it("unbind by string", function() {
        objectChannel.bind(function TestClass() {
            this.str = undefined;
            this.hoge = function(s) {
                str = s;
            }
        });
        dummyFunctionChannel.bind = function(id, obj) {
            expect("TestClass:1").toEqual(id);
            expect(obj).not.toBeUndefined();
        }
        var tag = objectChannel._fc.create("TestClass", []);
        expect("TestClass:1").toEqual(tag);
        objectChannel.unbind("TestClass");
        expect(objectChannel._fc.create("TestClass", [])).toBeUndefined();
    });

    it("bind again", function() {
        objectChannel.bind(MyClassJS);
    });

    it("receive create request again", function() {
        dummyFunctionChannel.bind = function(id, obj) {
            expect("MyClassJS:3").toEqual(id);
            expect(obj).not.toBeUndefined();
        }
        var tag = objectChannel._fc.create("MyClassJS", ["a1", 2, true]);
        expect("MyClassJS:3", tag);
        objectTag = tag;
        expect(objectChannel._objectSpace.getObject(objectTag)).not.toBeUndefined();
    });

    it("receive destroy request and expect execute detroy()", function() {
        var counter = 0;
        objectChannel._objectSpace.getObject(objectTag).destroy = function() {
            counter++;
        }
        objectChannel._fc.destroy(objectTag);
        expect(1).toEqual(counter);
    });

    it("receive create request again", function() {
        dummyFunctionChannel.bind = function(id, obj) {
            expect("MyClassJS:4").toEqual(id);
            expect(obj).not.toBeUndefined();
        }
        var tag = objectChannel._fc.create("MyClassJS", ["a1", 2, true]);
        expect("MyClassJS:4", tag);
        objectTag = tag;
        expect(objectChannel._objectSpace.getObject(objectTag)).not.toBeUndefined();
    });

    it("receive destroy request and expect execute destructor()", function() {
        var counter = 0;
        objectChannel._objectSpace.getObject(objectTag).destructor = function() {
            counter--;
        }
        objectChannel._fc.destroy(objectTag);
        expect(-1).toEqual(counter);
    });

    it("destroy ObjectChannel", function() {
        dummyFunctionChannel.unbind = function(id) {
            expect("$obj").toEqual(id);
        }
        expect(objectChannel.destroyed()).toBeFalsy();
        objectChannel.destroy();
        expect(objectChannel.destroyed()).toBeTruthy();
    });

    it("use after destroy", function() {
        objectChannel.bind();
        objectChannel.unbind();
        objectChannel.create();
        objectChannel.destroy();
    });

    it("combined-test", function() {
        var mq1 = new mq.MemoryQueue();
        var mq2 = new mq.MemoryQueue();

        // 送信側ObjectChannelを作成
        var dataBusS = new db.MemoryQueueDataBus(mq1, mq2);
        var dataChannelS = new dc.DataChannel(dataBusS);
        var functionChannelS = new fc.FunctionChannel(dataChannelS);
        var objectChannelS = new oc.ObjectChannel(functionChannelS);

        // 受信側ObjectChannelを作成
        var dataBusR = new db.MemoryQueueDataBus(mq2, mq1);
        var dataChannelR = new dc.DataChannel(dataBusR);
        var functionChannelR = new fc.FunctionChannel(dataChannelR);
        var objectChannelR = new oc.ObjectChannel(functionChannelR);

        // 受信側ObjectChannelに登録するクラス(MyClassJS)を準備
        var MyClassJS = (function() {
            function MyClassJS() {}
            MyClassJS.prototype.foo = function(a1, a2, a3) {
                return a1 + a2 + a3;
            };
            MyClassJS.prototype.fooA = function(a1, a2, a3) {
                return function(callback) {
                    callback(a1 + a2 + a3);
                }
            };
            return MyClassJS;
        })();
        objectChannelR.bind(MyClassJS);

        // 送信側からMyClassJSをインスタンス化
        objectChannelS.create("MyClassJS", [], function(error, remoteObject) {
            // fooを実行
            remoteObject.invoke("foo", ["One", "Two", "Three"], function(error, result) {
                console.log("foo: " + result);
                expect("OneTwoThree").toEqual(result);
            });
            // fooAを実行
            remoteObject.invoke("fooA", ["Ichi", "Ni", "Sun"], function(error, result) {
                console.log("fooA: " + result);
                expect("IchiNiSun").toEqual(result);
            });
            // 破棄
            remoteObject.destroy();
        });

        // 破棄
        objectChannelR.unbind(MyClassJS);
        objectChannelR.destroy();
        functionChannelR.destroy();
        dataChannelR.destroy();
        dataBusR.destroy();
        objectChannelS.destroy();
        functionChannelS.destroy();
        dataChannelS.destroy();
        dataBusS.destroy();
    });
});