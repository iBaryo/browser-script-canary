import {Canary} from "../index";
import {ICanaryConfig} from "../app/Canary";

declare function getConfig(): ICanaryConfig;

(async function main(win: Window & { sdk: any, onSdkReady: Function }) {
    const config = getConfig();
    const a = document.createElement('a');
    a.href = (document.currentScript as any).src;

    const isCanary =
        a.search.indexOf(config.canaryScriptUrl || 'version=canary') > -1;

    if (!isCanary) {
        const canary = new Canary(config);
        const canaryLoaded = await canary.bootstrap();

        if (canaryLoaded) {
            return;
        }
    }

    win.sdk = {
        isReady: () => true,
        isCanary
    };

    win.onSdkReady && win.onSdkReady(win.sdk);
})(window as any);