// Copyright © 2017 DWANGO Co., Ltd.

import { ObjectSpace } from './ObjectSpace';
import { FunctionChannel } from '@cross-border-bridge/function-channel';

export class ObjectSpaceFC {
    private _functionChannel: FunctionChannel;
    private _objectSpace: ObjectSpace;

    constructor(functionChannel: FunctionChannel, objectSpace: ObjectSpace) {
        this._functionChannel = functionChannel;
        this._objectSpace = objectSpace;
    }

    create(className: string, ...args: any[]): string {
        let objectTag: string = this._objectSpace.create(className, args);
        if (!objectTag) return undefined;
        let localObject = this._objectSpace.getObject(objectTag);
        this._functionChannel.bind(objectTag, localObject);
        return objectTag;
    }

    destroy(object: string) {
        this._objectSpace.destroy(object);
    }
}
