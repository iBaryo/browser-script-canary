# Browser Script Canary
An easy way to do a user based Canary Deployment of your Javascript script!

Really useful for SDK deployments.

## What this module does:
* Rolls out if the current end-user should load the Canary version of your script.
* Seamlessly load the Canary version of your script.

## Simple example
In Typescript:
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


### Inner Flow
* Script loads.
* Participating in the Canary:
    * If the end-user never rolled its participation in the Canary
        * Roll the canary participation according to the probability.
    * If the end-user participates in Canary
        * Loading of Canary Script:
            * According to configuration
     

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
Required in range: `0 <= probability <= 100`.

The higher the probability, the more likely an end-user will receive the Canary version. 

#### `version?: string`
Optional. 

Changing the version will cause reset of all participating Canary end-users.
#### `cookiesNames?: Object`
Optional.


`isCanary: string` - the end-user's Canary indication cookie name.

`version: string` - the end-user's Canary version cookie name. If no `version` parameter, it won't be set.

### Loading of Canary Script
#### `canaryScriptUrl?: string`
Optional. 

The URL the Canary version script will be loaded from.

The default is the URL of the current script (`document.currentScript`) with the query string parameter: `version=canary`.
To change this - check the 'Advanced Customization' section. 
 

#### `loadAsync?: boolean`
Optional. The Default is `false`. 

If `true`, will load the Canary script in an async matter by appending a script tag to the `document.head`'s children.
This could be problematic in the following case:

```html
<html>
    <head>
        <script>
            const canary = new Canary({
                probability: 100,
                canaryScriptUrl: '/mySdk.js?version=canary',
                loadAsync: true
            });        
            canary.bootstrap();
        </script>
        <script>
           mySdk.doAction();
           // because in `head`, scripts are loaded in a sync matter,
           //  this will run before the above finished bootstrapping - so it'll throw.
        </script>
    </head>
</html>
```

#### `supportCORs?: boolean`
Optional. The default is `false`. Relevant only if `loadAsync !== true`.

If `true` the canary script URL will be loaded by a sync XHR request - so it must support CORs.

Else it'll be loaded via `document.write` of a the relevant script tag (which works fine if the script is in `head`). 


### Helpers
#### `globalCanaryIndicationName?: string`
Optional. The default is `'___canary'`.

The property name on `window` that the indication for the Canary bootstrapping will be stored.

More about changing this in the 'Advanced Customization' section.

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
                    get: () => window[config.globalCanaryIndicationName],
                    set: (val) => window[config.globalCanaryIndicationName] = val
                }) {}
}
```

#### `CookieProvider`
```typescript
export interface ICookieProvider {
    get: (key: string) => string | null;
    put: (key: string, val: string) => void;
    remove: (key: string) => void;
}
```
How cookies are read, set and deleted.

#### `ScriptLoader`
```typescript
export interface IScriptLoader {
    load(url: string, isAsync?: boolean, supportCORs?: boolean): Promise<any>;
}
```
How the Canary script will be loaded according to configuration.

#### `randomFactory`
```typescript
() => number
```
How to generate a random number.

#### `defaultScriptFactory`
```typescript
() => string|undefined
```
How to get the default script url (when `canaryScriptUrl` is not provided).

#### `globalCanaryIndication`
```typescript
export interface IGlobalCanaryIndication {
    get: () => boolean,
    set: (val: boolean) => void
}
```
How to get and set the global indication of loading Canary.