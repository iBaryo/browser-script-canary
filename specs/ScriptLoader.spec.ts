import {ScriptLoader} from "../app/ScriptLoader";

describe('ScriptLoader', () => {
    let sLoader: ScriptLoader;

    let mockWin: Window;
    let mockDoc: Document;
    let xhrFactorySpy: () => XMLHttpRequest;
    let mockXhr: XMLHttpRequest | any;

    beforeEach(() => {
        mockWin = {} as Window;
        mockDoc = {} as Document;
        mockXhr = {
            open: jasmine.createSpy('xhr open'),
            send: jasmine.createSpy('xhr send').and.callFake(() => {
                mockXhr.readyState = 4;
                mockXhr.status = 200;
                mockXhr.onload && mockXhr.onload();
            }),
        };
        xhrFactorySpy = jasmine.createSpy('xhr').and.returnValue(mockXhr);
        sLoader = new ScriptLoader(mockWin, mockDoc, xhrFactorySpy);
    });

    it('should init', () => {
        expect(sLoader).toBeTruthy();
    });

    describe('async load', () => {
        it('should append new script tag to head element', () => {});
        it('should resolve when script load', () => {});
        it('should reject when script error', () => {});
    });

    describe('sync load', () => {
        describe('with CORs', () => {
            it('should send sync xhr request to get the script', () =>{});
            it('should reject if there is an error with sending the request', () => {});
            it('should reject if there is an error with the response', () => {});
            it('should evaluate the response text and resolve with the result', () => {});
            it('should reject if there is an error with the evaluation', () => {});
        });

        describe('without CORs', () => {
            it('should document.write the relevant script', () =>{});
            it('should resolve when script load', () => {});
            it('should reject when script error', () => {});
        });
    });
});