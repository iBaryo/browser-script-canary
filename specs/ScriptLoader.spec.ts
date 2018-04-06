import {ScriptLoader} from "../app/ScriptLoader";
import Spy = jasmine.Spy;

require('jasmine-co').install();


const mockUrl = 'mock.url.com';

describe('ScriptLoader', () => {
    let sLoader: ScriptLoader;
    let act: () => Promise<any>;

    let mockWin: Window;
    let mockDoc: Document | any;
    let xhrFactorySpy: () => XMLHttpRequest;
    let mockXhr: XMLHttpRequest | any;

    beforeEach(() => {
        mockWin = {} as Window;
        mockDoc = {} as Document;
        mockXhr = {} as XMLHttpRequest;
        xhrFactorySpy = jasmine.createSpy('xhr').and.returnValue(mockXhr);

        sLoader = new ScriptLoader(mockWin, mockDoc, xhrFactorySpy);
    });

    it('should init', () => {
        expect(sLoader).toBeTruthy();
    });

    describe('async load', () => {

        beforeEach(() => {

            act = () => sLoader.load(mockUrl, true);

            Object.assign(mockDoc, {
                createElement: jasmine.createSpy('create element').and.callFake(tag => {
                    switch (tag) {
                        case 'script':
                            return {
                                mockScript: true
                            };
                        default:
                            return null;
                    }
                }),
                head: {
                    appendChild: jasmine.createSpy('append child to head').and.callFake(
                        (el: HTMLElement & { mockScript?: boolean }) => {
                            if (el.mockScript) {
                                el.onload(null);
                            }
                        })
                }
            });
        });

        it('should resolve when script load', async () => {
            await act();
        });

        it('should append new script tag to head element', async () => {
            await act();
            const script = (mockDoc.head.appendChild as Spy).calls.mostRecent().args[0] as HTMLScriptElement;
            expect(mockDoc.head.appendChild).toHaveBeenCalled();
            expect(script).toBeTruthy();
            expect(script.src).toBe(mockUrl);
        });
        it('should reject when script error', async () => {
            mockDoc.head.appendChild = jasmine.createSpy('append child to head').and.callFake(
                (el: HTMLElement & { mockScript?: boolean }) => {
                    if (el.mockScript) {
                        el.onerror(null);
                    }
                });

            try {
                await act();
                fail();
            }
            catch (e) {
                expect(e).toBeNull();
            }
        });
    });

    describe('sync load', () => {
        describe('with CORs', () => {
            const mockEvalRes = 42;

            beforeEach(() => {
                act = () => sLoader.load(mockUrl, false, true);

                Object.assign(mockXhr, {
                    open: jasmine.createSpy('xhr open'),
                    send: jasmine.createSpy('xhr send').and.callFake(() => {
                        mockXhr.readyState = 4;
                        mockXhr.status = 200;
                        mockXhr.onload && mockXhr.onload();
                    }),
                    responseText: mockUrl
                });

                Object.assign(mockWin, {
                    eval: jasmine.createSpy('eval').and.returnValue(mockEvalRes)
                });

            });
            it('should send sync xhr request to get the script', async () => {
                await act();
                expect(mockXhr.open).toHaveBeenCalledWith('GET', mockUrl, false);
                expect(mockXhr.send).toHaveBeenCalledWith(null);
            });
            it('should evaluate the response text and resolve with the result', async () => {
                expect(await act()).toBe(mockEvalRes);
                expect(mockWin['eval']).toHaveBeenCalledWith(mockXhr.responseText);
            });
            it('should reject if there is an error with sending the request', async () => {
                const err = 'CORs!';
                mockXhr.send = jasmine.createSpy('fail sync xhr').and.throwError(err);

                try {
                    await act();
                    fail();
                }
                catch (e) {
                    expect(e.toString()).toBe(`Error: ${err}`);
                }
            });
            it('should reject if there is an error with the response', async () => {
                mockXhr.send = jasmine.createSpy('xhr send with error').and.callFake(() => {
                    mockXhr.readyState = 1;
                    mockXhr.status = 500;
                    mockXhr.onload && mockXhr.onload();
                });

                try {
                    await act();
                    fail();
                }
                catch (e) {
                    expect(e).toBe(mockXhr);
                }
            });

            it('should reject if there is an error with the evaluation', async () => {
                const err = 'syntx err';
                mockWin['eval'] = jasmine.createSpy('eval with error').and.throwError(err);

                try {
                    await act();
                    fail();
                }
                catch (e) {
                    expect(e.toString()).toBe(`Error: ${err}`);
                }
            });
        });

        describe('without CORs', () => {
            const DomParser = require('dom-parser');
            const parser = new DomParser();

            beforeEach(() => {
                act = () => sLoader.load(mockUrl, false, false);
            });

            it('should resolve when script load', async () => {
                Object.assign(mockDoc, {
                    write: jasmine.createSpy('doc write').and.callFake(str => {
                        const dom = parser.parseFromString(str);
                        const script = dom.getElementsByTagName('script')[0];
                        const onload = script.getAttribute('onload');
                        (new Function('window', `return ${onload};`))(mockWin);
                    })
                });

                await act();
                expect(mockDoc.write).toHaveBeenCalled();
            });
            it('should reject when script error', async () => {
                Object.assign(mockDoc, {
                    write: jasmine.createSpy('doc write').and.callFake(str => {
                        const dom = parser.parseFromString(str);
                        const script = dom.getElementsByTagName('script')[0];
                        const onerror = script.getAttribute('onerror');
                        (new Function('window', `return ${onerror};`))(mockWin);
                    })
                });

                try {
                    await act();
                    fail();
                }
                catch (e) {

                }
            });
        });
    });
});