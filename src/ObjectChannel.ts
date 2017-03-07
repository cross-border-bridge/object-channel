// Copyright © 2017 DWANGO Co., Ltd.

import { ObjectSpace, Constructor } from './ObjectSpace';
import { ObjectSpaceFC } from './ObjectSpaceFC';
import { RemoteObject } from './RemoteObject';
import { FunctionChannel } from '@cross-border-bridge/function-channel';

export { ObjectChannel, ObjectChannelCallback }

type ObjectChannelCallback = (error?: string, remoteObject?: RemoteObject) => void;

class ObjectChannel {
    private static _globalObjectSpace: ObjectSpace = new ObjectSpace();
    _functionChannel: FunctionChannel;
    _objectSpace: ObjectSpace;
    private _fc: ObjectSpaceFC;

    constructor(functionChannel: FunctionChannel, objectSpace?: ObjectSpace) {
        this._functionChannel = functionChannel;
        this._objectSpace = objectSpace ? objectSpace : ObjectChannel._globalObjectSpace;
        this._fc = new ObjectSpaceFC(this._functionChannel, this._objectSpace);
        this._functionChannel.bind("$obj", this._fc);
    }

    /**
     * 破棄
     */
    destroy(): void {
        if (this.destroyed()) return;
        this._functionChannel.unbind("$obj");
        this._functionChannel = undefined;
        this._objectSpace = undefined;
    }

    /**
     * 破棄済みかチェック
     * 
     * @return 破棄済みの場合 true が返る
     */
    destroyed(): boolean {
        return !this._functionChannel;
    }

    /**
     * ローカル側のクラスをbind
     * 
     * @param classFunction クラスが定義されたfunction
     */
    bind(classFunction: any): void {
        if (this.destroyed()) return;
        this._objectSpace.bindClass(this._getFunctionName(classFunction), classFunction);
    }

    /**
     * ローカル側のbindを解除
     * 
     * @param classFunction クラスが定義されたfunctionまたはクラス名
     */
    unbind(classFunction: any): void {
        if (this.destroyed()) return;
        if ("string" === typeof classFunction) {
            this._objectSpace.unbindClass(classFunction);
        } else {
            this._objectSpace.unbindClass(this._getFunctionName(classFunction));
        }
    }

    /**
     * リモート側のオブジェクトを生成
     * 
     * @param className クラス名
     * @param args コンストラクタに渡す引数
     * @param callback 結果を受け取るコールバック
     * @param [timeout] 応答待ちのタイムアウト
     */
    create(className: string, args: any[], callback: ObjectChannelCallback, timeout?: number): void {
        if (this.destroyed()) return;
        var _this = this;
        this._functionChannel.invoke("$obj", "create", [className, args], (error, result) => {
            if (error) {
                callback.apply(_this, [error, undefined]);
            } else {
                callback.apply(_this, [undefined, new RemoteObject(_this._functionChannel, _this._objectSpace, result)]);
            }
        }, timeout);
    }

    private _getFunctionName(f: any): string {
        return f.name || f.toString().match(/^function\s?([^\s(]*)/)[1];
    }
}
