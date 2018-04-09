import {Canary} from "../index";
import {CookieProvider} from "../app/CookieProvider";
import {ICanaryConfig} from "../app/Canary";
import Spy = jasmine.Spy;
import {IScriptLoader} from "../app/ScriptLoader";

require('jasmine-co').install();

describe('canary', () => {
    let canary: Canary;
    let mockConfig: ICanaryConfig;
    let mockScriptLoader: IScriptLoader;
    let mockCookieProvider: CookieProvider;
    let randomFactorySpy: Spy & (() => number);
    let defaultScriptFactorySpy: Spy & (() => string);
    let mockGlobalCanaryIndication;

    const mockScriptUrl = 'mock.script.com';
    const mockVersion = 'vMock';

    beforeEach(() => {
        mockConfig = {
            probability: 50,
            version: mockVersion,
            canaryScriptUrl: mockScriptUrl,
            globalCanaryIndicationName: '___canary'
        };
        mockScriptLoader = {
            load: jasmine.createSpy('script loader').and.returnValue(Promise.resolve())
        };
        mockCookieProvider = {
            get: jasmine.createSpy('cookie get'),
            put: jasmine.createSpy('cookie set'),
            remove: jasmine.createSpy('cookie delete')
        };
        randomFactorySpy = jasmine.createSpy('random');

        defaultScriptFactorySpy = jasmine.createSpy('default script').and.returnValue(mockScriptUrl);

        let mockStaging = {} as any;
        mockGlobalCanaryIndication = {
            get: jasmine.createSpy('get global canary ind').and.callFake(() => mockStaging[mockConfig.globalCanaryIndicationName]),
            set: jasmine.createSpy('set global canary ind').and.callFake(v => mockStaging[mockConfig.globalCanaryIndicationName] = v)
        };

        canary = new Canary(
            mockConfig,
            mockCookieProvider,
            mockScriptLoader,
            randomFactorySpy,
            defaultScriptFactorySpy,
            mockGlobalCanaryIndication
        );
    });

    it('should initialize', () => expect(canary).toBeTruthy());

    it('should delete the canary cookies if probability is 0', async () => {
        // arrange
        mockConfig.probability = 0;

        // act
        const res = await canary.bootstrap();

        // assert
        expect(res).toBeFalsy();
        expect(mockCookieProvider.remove).toHaveBeenCalledWith(mockConfig.cookiesNames.isCanary);
        expect(mockCookieProvider.remove).toHaveBeenCalledWith(mockConfig.cookiesNames.version);
    });

    describe('when no canary set', () => {
        beforeEach(() => {
            mockConfig.probability = 50;
            mockCookieProvider.get = jasmine.createSpy('no cookies').and.returnValue(null);
        });
        it('should roll and set canary as canary cookie false', async () => {
            randomFactorySpy.and.returnValue(mockConfig.probability + 1);

            // act
            await canary.bootstrap();

            expect(mockCookieProvider.put).toHaveBeenCalledWith(mockConfig.cookiesNames.isCanary, false.toString());
        });

        it('should set canary version if exists in config', async () => {
            // act
            await canary.bootstrap();

            expect(mockCookieProvider.put).toHaveBeenCalledTimes(2);
            expect((mockCookieProvider.put as Spy).calls.mostRecent().args).toEqual([mockConfig.cookiesNames.version, mockConfig.version]);
        });

        it('should not set canary version if does not exist in config', async () => {
            delete mockConfig.version;

            // act
            await canary.bootstrap();

            expect(mockCookieProvider.put).toHaveBeenCalledTimes(1);
        });

        describe('rolled canary to true', () => {
            beforeEach(async () => {
                mockConfig.canaryScriptUrl = mockScriptUrl;
                randomFactorySpy.and.returnValue(mockConfig.probability - 1);

                // act
                await canary.bootstrap();
            });

            it('should roll and set canary as canary cookie true', async () => {
                expect(mockCookieProvider.put).toHaveBeenCalledWith(mockConfig.cookiesNames.isCanary, true.toString());
            });
            it('should set the canary version as cookie', () => {
                expect(mockCookieProvider.put).toHaveBeenCalledWith(mockConfig.cookiesNames.version, mockConfig.version);
            });
            it('should load canary version', () => {
                expect(mockScriptLoader.load).toHaveBeenCalledWith(mockScriptUrl, false, false);
            });
        });
    });

    describe('canary already set', () => {
        let mockIsCanary: boolean;
        beforeEach(() => {
            mockIsCanary = false;

            mockCookieProvider.get = jasmine.createSpy('canary cookie exist').and.callFake(cookieName => {
                switch (cookieName) {
                    case (mockConfig.cookiesNames.isCanary):
                        return mockIsCanary.toString();
                    case (mockConfig.cookiesNames.version):
                        return mockVersion;
                    default:
                        return null;
                }
            });

        });
        it('should not re-roll and try to set canary if it is the same version', async () => {
            await canary.bootstrap();

            expect(randomFactorySpy).not.toHaveBeenCalled();
            expect(mockCookieProvider.put).not.toHaveBeenCalled();
        });

        it('should re-roll and try to set canary if it is not the same version', async () => {
            mockConfig.version = mockVersion + '2';
            await canary.bootstrap();

            expect(randomFactorySpy).toHaveBeenCalled();
            expect(mockCookieProvider.put).toHaveBeenCalledWith(mockConfig.cookiesNames.version, mockConfig.version);
            expect(mockCookieProvider.put).toHaveBeenCalledWith(mockConfig.cookiesNames.isCanary, jasmine.any(String));
        });

        it('should not load canary version if canary indication is set to false', async () => {
            const res = await canary.bootstrap();

            expect(res).toBeFalsy();
            expect(randomFactorySpy).not.toHaveBeenCalled();
            expect(mockCookieProvider.put).not.toHaveBeenCalled();
            expect(mockScriptLoader.load).not.toHaveBeenCalled();
        });

        describe('to true', () => {
            beforeEach(() => {
                mockIsCanary = true;
            });

            it('should load the canary script according to url', async () => {
                const res = await canary.bootstrap();
                expect(res).toBeTruthy();
                expect(mockScriptLoader.load).toHaveBeenCalledWith(mockScriptUrl, false, false);
            });
            it('should load the canary version of current url if canary script url not provided', async () => {
                delete mockConfig.canaryScriptUrl;
                defaultScriptFactorySpy.and.returnValue(mockScriptUrl);
                const res = await canary.bootstrap();
                expect(mockScriptLoader.load).toHaveBeenCalledWith(`${mockScriptUrl}?version=canary`, false, false);
            });
            it('should load the canary version of current url with existing qs params', async () => {
                delete mockConfig.canaryScriptUrl;
                const mockUrl = `${mockScriptUrl}?existing=param`;
                defaultScriptFactorySpy.and.returnValue(mockUrl);
                const res = await canary.bootstrap();
                expect(mockScriptLoader.load).toHaveBeenCalledWith(`${mockUrl}&version=canary`, false, false);
            });
            it('should reject if no canary script url and no current script', async () => {
                delete mockConfig.canaryScriptUrl;
                defaultScriptFactorySpy.and.returnValue(null);
                try {
                    const res = await canary.bootstrap();
                    fail();
                }
                catch (e) {
                    expect(e).toBe('canary: no current script');
                }
            });
            it('should reject if script load has failed', async () => {
                mockScriptLoader.load = jasmine.createSpy('script load fail').and.returnValue(Promise.reject(null));

                try {
                    const res = await canary.bootstrap();
                    fail();
                }
                catch (e) {
                    expect(e).toBeNull();
                }
            });
            it('should resolve with script evaluation result', async () => {
                mockScriptLoader.load = jasmine.createSpy('script load returns').and.returnValue(Promise.resolve(mockVersion));
                const res = await canary.bootstrap();
                expect(res).toBe(mockVersion);
            });

            describe('isCanaryAlreadyActive', () => {
                it('should not be before ever bootstrapping canary', () => {
                    expect(canary.isCanaryAlreadyActive()).toBeFalsy();
                });
                it('should be when start bootstrapping', () => {
                    canary.bootstrap(); // not waiting
                    expect(canary.isCanaryAlreadyActive()).toBeTruthy();
                });
                it('should return to false when done bootstrapping', async () => {
                    expect(canary.isCanaryAlreadyActive()).toBeFalsy();
                    const bootstrapping = canary.bootstrap();
                    expect(canary.isCanaryAlreadyActive()).toBeTruthy();
                    await bootstrapping;
                    expect(canary.isCanaryAlreadyActive()).toBeFalsy();
                });
            });
        });
    });
});