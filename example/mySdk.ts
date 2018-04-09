import {ICanaryConfig, Canary} from "../index";

declare function getConfig(): ICanaryConfig;

(async function main(win: Window & { sdk: any, onSdkReady: Function }) {
    const config = getConfig();

    const canary = new Canary(config);
    const isCanary = canary.isCanaryAlreadyActive();

    if (!isCanary) {
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