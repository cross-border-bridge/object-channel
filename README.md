# <p align="center"><img src="title.png"/></p>
- ObjectChannelのTypeScript用の実装を提供します
- Node.jsで利用することを想定しています

## Setup
### package.json
```
    "dependencies": {
        "@cross-border-bridge/object-channel": "~2.0.0"
    },
```

## Usage
#### step 1: import

```typescript
import * as oc from "@cross-border-bridge/object-channel";
```

#### step 2: クラスを準備
- ObjectChannelで使用するクラスを準備します
- `destroy` メソッドを実装すればリモート側から解放時にデストラクタとして呼び出されます
- `destroy` メソッドの実装は省略することができます

```typescript
class MyClassTS {
    foo(a1: string, a2: string, a3: number): string {
        return a1 + a2 + a3;
    }

    // デストラクタ (optional)
    // 実装した場合, リモート側で `RemoteObject#destroy` が実行された時に呼び出される
    destroy(): void {
        解放処理を実装
    }
}
```

#### step 3: ObjectChannelを準備
使用するFunctionChannelインスタンスを指定してObjectChannelを生成します。

```typescript
    var objectChannel: oc.ObjectChannel = new oc.ObjectChannel(functionChannel);
```

#### step 4: クラスを登録
step 2 で準備したクラスを `ObjectChannel#bind` で登録することで, リモート側からオブジェクト生成, メソッド実行, 破棄 ができるようになります。

```typescript
    objectChannel.bind(MyClassTS);
```

> `ObjectChannel#unbind` で `bind` 状態を解除することができます。

#### step 5: リモート側がbindしているクラスのインスタンス化
`ObjectChannel#create` でリモート側が `bind` しているクラスのインスタンスを生成できます。

```typescript
    objectChannel.create("MyClassJava", ["arg1", "arg2", "arg3"], (error?, remoteObject?) => {
        if (error) {
            インスタンス化に失敗した場合の処理
        } else {
            インスタンス化に成功した場合の処理（remoteObjectをメンバ変数に格納するなど）
        }
    });
```

#### step 6: リモート側のメソッドを呼び出す
`RemoteObject#invoke` で生成したオブジェクトのメソッドを呼び出すことができます。

```typescript
    // MyClassJava#fooメソッドを実行（結果を確認する）
    remoteObject.invoke("foo", ["arg1", "arg2", "arg3"], (error?, result?) => {
        if (error) {
            実行に失敗した場合の処理
        } else {
            実行に成功した場合の処理（戻り値が result に格納されている）
        }
    });

    // MyClassJava#fooメソッドを実行（結果を確認しない）
    remoteObject.invoke("foo", ["arg1", "arg2", "arg3"]);
```

#### step 7: リモート側のオブジェクトを破棄
`RemoteObject#destroy` でオブジェクトを破棄することができます。

```typescript
    remoteObject.destroy();
```

#### step 8: 破棄
`ObjectChannel#destroy` で, ObjectChannel を破棄できます

```typescript
    objectChannel.destory();
```

> ObjectChannelをdestroyしても下位層（FunctionChannel, DataChannel, DataBus）のdestroyは行われません。

## License
- Source code, Documents: [MIT](LICENSE)
- Image files: [CC BY 2.1 JP](https://creativecommons.org/licenses/by/2.1/jp/)
