let loaderCounter = 1;

export interface IScriptLoader {
    load(url: string, isAsync?: boolean, supportCORs?: boolean): Promise<any>;
}

export class ScriptLoader implements IScriptLoader {

    constructor(private _win = window,
                private _doc = document,
                private _xhrFactory = () => new XMLHttpRequest(),) {
    }

    public load(url: string, isAsync = false, supportCORs = true): Promise<any> {
        if (isAsync) {
            return this.loadViaScriptTag(url);
        }
        else if (supportCORs) {
            return this.loadViaXhr(url);
        }
        else {
            return this.loadViaDocument(url);
        }
    }

    private loadViaScriptTag(url: string) {
        return new Promise((resolve, reject) => {
            const script = this._doc.createElement('script') as HTMLScriptElement;
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            this._doc.head.appendChild(script);
        });
    }

    private loadViaXhr(url: string) {
        return new Promise<any>((resolve, reject) => {
            const xhr = this._xhrFactory();
            xhr.open('GET', url, false);
            xhr.onload = res => {
                if (xhr.readyState !== 4 || xhr.status !== 200) {
                    reject(xhr);
                }
                else {
                    try {
                        const res = eval(xhr.responseText);
                        resolve(res);
                    }
                    catch (e) {
                        reject(e);
                    }
                }
            };

            try {
                // sync load - the above onload will happen before advancing...
                xhr.send(null);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    private loadViaDocument(url: string) {
        return new Promise((resolve, reject) => {
            const loadingName = `___canary_loader_${loaderCounter++}`;
            this._win[loadingName] = {};

            function createCallbackFor(event: string, fn: Function) {
                this._win[loadingName][event] = e => {
                    delete this._win[loadingName];
                    fn(e);
                };
                return `window.${loadingName}.${event}()`;
            }

            this._doc.write(
                `<script src="${url}" onload="${createCallbackFor('onload', resolve)}" onerror="${createCallbackFor('onerror', reject)}"></script>`
            );
        });
    }
}