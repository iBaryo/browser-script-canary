import {CookieProvider, ICookieProvider} from "./CookieProvider";
import {IScriptLoader, ScriptLoader} from "./ScriptLoader";

export interface ICanaryConfig {
    probability: number,
    version?: string,
    canaryScriptUrl?: string,
    loadAsync?: boolean,
    supportCORs?: boolean,
    cookiesNames?: {
        isCanary?: string,
        version?: string
    },
    globalCanaryIndicationName?: string
}

export interface IGlobalCanaryIndication {
    get: () => boolean,
    set: (val: boolean) => void
}

export class Canary {

    constructor(private _config: ICanaryConfig,
                private _cookieProvider : ICookieProvider = new CookieProvider(),
                private _scriptLoader : IScriptLoader = new ScriptLoader(),
                private _randomFactory = () => Math.random() * 100,
                private _defaultScriptFactory = () =>
                    (!document || !document.currentScript)
                        ? undefined
                        : (document.currentScript as HTMLScriptElement).src,
                private _globalCanaryIndication : IGlobalCanaryIndication = {
                    get: () => window[_config.globalCanaryIndicationName],
                    set: (val) => window[_config.globalCanaryIndicationName] = val
                }) {

        this._config.cookiesNames = this._config.cookiesNames || {};
        this._config.cookiesNames.isCanary = this._config.cookiesNames.isCanary || 'isCanary';

        if (this._config.version && !this._config.cookiesNames.version) {
            this._config.cookiesNames.version = 'canaryVer';
        }

        this._config.globalCanaryIndicationName = this._config.globalCanaryIndicationName || '___canary';
    }


    public bootstrap() : Promise<boolean|any> {
        if (!this._config.probability) {
            this._cookieProvider.remove(this._config.cookiesNames.isCanary);
            this._cookieProvider.remove(this._config.cookiesNames.version);
            return Promise.resolve(false);
        }
        else if (this.shouldLoadCanary()) {
            return this.loadCanaryScript().then(res => res === undefined ? true : res);
        }
        else {
            return Promise.resolve(false);
        }
    }

    public isCanaryAlreadyActive() {
        return this._globalCanaryIndication.get();
    }

    public loadCanaryScript() {
        this._globalCanaryIndication.set(true);
        return this._scriptLoader.load(
            this.getCanaryScriptUrl(),
            !!this._config.loadAsync,
            !!this._config.supportCORs
        ).then(res => {
            this._globalCanaryIndication.set(false);
            return res;
        });
    }

    public shouldLoadCanary() {
        if (this.wasCanarySet()) {
            return this._cookieProvider.get(this._config.cookiesNames.isCanary) == true.toString();
        }
        else {
            return this.rollCanary();
        }
    }

    private wasCanarySet() {
        return this._cookieProvider.get(this._config.cookiesNames.isCanary)
            && (!this._config.version || this._cookieProvider.get(this._config.cookiesNames.version) == this._config.version);
    }

    private rollCanary() {
        const isCanary = this._randomFactory() <= this._config.probability;
        this._cookieProvider.put(this._config.cookiesNames.isCanary, isCanary.toString());
        this._config.version && this._cookieProvider.put(this._config.cookiesNames.version, this._config.version);
        return isCanary;
    }

    private getCanaryScriptUrl() {
        if (this._config.canaryScriptUrl) {
            return this._config.canaryScriptUrl;
        }
        else {
            let scriptUrl = this._defaultScriptFactory();

            if (!scriptUrl) {
                throw 'canary: no current script';
            }

            scriptUrl += (scriptUrl.indexOf('?') == -1) ? '?' : '&';

            return `${scriptUrl}version=canary`;
        }
    }
}