// Copyright © 2017 DWANGO Co., Ltd.

import { FunctionChannel, FunctionChannelCallback } from '@cross-border-bridge/function-channel';
import { ObjectSpace } from './ObjectSpace';

/**
 * error-type of object channel
 */
const ERROR_TYPE_CLOSE = 'Close';

export class RemoteObject {
    private _channel: FunctionChannel;
    private _space: ObjectSpace;
    private _tag: string;
    private _destroyed: boolean;

    constructor(channel: FunctionChannel, space: ObjectSpace, tag: string) {
        this._channel = channel;
        this._space = space;
        this._tag = tag;
        this._destroyed = false;
    }

    /**
     * Native側のメソッドを実行
     * 
     * @param method 実行するメソッド名
     * @param [args] 実行するメソッドに渡す引数
     * @param [callback] 結果を受け取るコールバック
     * @param [timeout] 応答待ちのタイムアウト
     * @return メソッドの戻り値
     */
    invoke(method: string, args?: any[], callback?: FunctionChannelCallback, timeout?: number): void {
        if (this._destroyed) {
            if (callback) callback.apply(this, ["AlreadyDestroyed"]);
            return;
        }
        this._channel.invoke(this._tag, method, args, callback, timeout);
    }

    /**
     * Native側のオブジェクトを破棄
     */
    destroy(): void {
        if (this._destroyed) {
            return;
        }
        this._channel.invoke("$obj", "destroy", [this._tag]);
        this._destroyed = true;
    }
}