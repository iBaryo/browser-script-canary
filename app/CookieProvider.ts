export class CookieProvider {
    public get(key: string): string | null {
        // http://stackoverflow.com/questions/11920697/how-to-get-hash-value-in-a-url-in-js
        const matches = document.cookie.match(new RegExp(key + '=([^$;]*)'));
        return matches ? matches[1] : null;
    }

    public put(key : string, val : string) {
        document.cookie = `${key}=${val};path=/;domain=.${location.hostname}`;
    }

    public remove(key: string) {
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;domain=.${location.hostname}`;
    }
}