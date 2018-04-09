#Browser Script Canary
An easy way to do a user based Canary Deployment of your Javascript script!

Really useful for SDK deployments.

## What this module does:
* Rolls out if the current end-user should load the Canary version of your script.
* Seamlessly load the Canary version of your script.

## Simple example
```typescript
import {ICanaryConfig, Canary} from "browser-script-canary";

(async function main() {
    const canary = new Canary({
        probability: 50, // percentage
        canaryScriptUrl: '/mySdk.js?version=canary'
    } as ICanaryConfig);
    
    const wasCanaryLoaded = await canary.bootstrap();
    
    if (!wasCanaryLoaded) {
        // initialize the current sdk:
        window.mySdk = {
            isReady: () => true,
        };
    }
})();
```

## ICanaryConfig
```typescript
export interface ICanaryConfig {
    // Participating in Canary:
    probability: number,
    version?: string,
    cookiesNames?: {
            isCanary?: string,
            version?: string
    },
    
    // Loading of Canary Script:
    canaryScriptUrl?: string,
    loadAsync?: boolean,
    supportCORs?: boolean,
    
    // Helpers:
    globalCanaryIndicationName?: string
}
```

### Participating in the Canary

#### `probability : number`
TODO
#### `version?: string`
TODO
#### `cookiesNames?: Object`
TODO

### Loading of Canary Script
#### `canaryScriptUrl?: string`
TODO
#### `loadAsync?: boolean`
TODO
#### `supportCORs?: boolean`
TODO

### Helpers
#### `globalCanaryIndicationName?: string`
TODO

## Example
Inside the repo there's an example that can walk you through the usage and value of most of the above parameters.
After cloning the repo: 
* In its directory run: `npm i && npm run example`
* Add to your hosts file: `127.0.0.1 example.com`
* Using a modern browser, navigate to `http://example.com:8080/example/index.html`

## Advanced Customization
When creating an instance of the `Canary` class, except for the `ICanaryConfig` Object you can provide other alternate implementations of different depedendencies: 
```typescript
export class Canary {
    constructor(config: ICanaryConfig,
                cookieProvider = new CookieProvider(),
                scriptLoader = new ScriptLoader(),
                randomFactory = () => Math.random() * 100,
                defaultScriptFactory = () =>
                    (!document || !document.currentScript)
                        ? undefined
                        : (document.currentScript as HTMLScriptElement).src,
                globalCanaryIndication = {
                    get: () => window[_config.globalCanaryIndicationName],
                    set: (val) => window[_config.globalCanaryIndicationName] = val
                }) {}
}
```

#### `CookieProvider`
TODO
#### `ScriptLoader`
TODO
#### `randomFactory`
TODO
#### `defaultScriptFactory`
TODO
#### `globalCanaryIndication`
TODO