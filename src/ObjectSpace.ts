// Copyright © 2017 DWANGO Co., Ltd.

export type Constructor = any;

export class ObjectSpace {
    private _classes: {[className: string]: Constructor} = {};
    private _objects: {[objectTag: string]: any} = {};
    private _objectIds: {[className: string]: number} = {};

    bindClass(className: string, handler: Constructor): void {
        this._classes[className] = handler;
    }

    unbindClass(className: string): void {
        delete this._classes[className];
    }

    create(className: string, args: any[]): string {
        const objectTag = this._acquireRemoteObjectTag(className);
        if (!this._classes[className]) {
            console.error("class not bind: " + className);
            return;
        }
        this._objects[objectTag] = this._createInstance(this._classes[className], args);
        return objectTag;
    }

    getObject(objectTag: string): any {
        return this._objects[objectTag];
    }

    destroy(objectTag: string): void {
        const object = this._objects[objectTag];
        if (!object) {
            console.error("object undefined: remote-object=" + objectTag);
            return;
        }
        if (object.destroy) {
            object.destroy();
        } else if (object.destructor) {
            object.destructor();
        }
        this._objects[objectTag] = undefined;
    }

    private _createInstance(ctor: any, args: any[]) {
        return new (Function.bind.apply(ctor, [null].concat(args[0])));
    }

    private _acquireRemoteObjectTag(className: string, objectId?: number): string {
        if (!this._objectIds[className]) {
            this._objectIds[className] = 0;
        }
        if (!objectId) {
            objectId = this._objectIds[className] + 1;
            if (!objectId) {
                objectId = 1;
            }
        }
        if (objectId <= this._objectIds[className]) {
            console.error("invalid objectId was specified: " + objectId);
            return null;
        }
        this._objectIds[className] = objectId;
        return className + ":" + objectId;
    }
}
