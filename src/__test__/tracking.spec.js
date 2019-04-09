import oGrid from "o-grid";
import oViewport from "o-viewport";
import oTracking from "o-tracking";
import { Tracking, SPOOR_API_INGEST_URL } from "../tracking";

jest.mock("o-grid", () => ({ getCurrentLayout: jest.fn() }), { virtual: true });

jest.mock("o-tracking", () => ({ init: jest.fn() }), { virtual: true });

jest.mock("o-viewport", () => ({ getOrientation: jest.fn() }), {
	virtual: true
});

jest.mock("n-ui-foundations", () => ({ broadcast: jest.fn() }), {
	virtual: true
});

const flags = {
	get: value => {
		switch (value) {
			case "oTracking":
				return true;
			case "sendBeacon":
				return "sendBeacon";
			default:
				return true;
		}
	}
};

const appInfo = { appInfo: "appInfo" };

describe("Tracking", () => {
	afterEach(() => jest.clearAllMocks());

	describe(".init()", () => {
		it("should initialise `oTracking` with the correct parameters", () => {
			const context = { context: "" };
			const userData = { userData: "" };
			const tracking = new Tracking(flags, appInfo);

			// Stub out helper methods
			tracking.getUserData = () => userData;
			tracking.prepareContext = () => context;

			tracking.init();

			expect(oTracking.init).toHaveBeenCalledTimes(1);
			expect(oTracking.init).toHaveBeenCalledWith({
				server: SPOOR_API_INGEST_URL,
				context: context,
				user: userData,
				useSendBeacon: flags.get("sendBeacon")
			});
		});

		it("does nothing when the flag has not been set", () => {
			const flags = {
				get: jest.fn(flag => (flag === "oTracking" ? false : true))
			};
			const tracking = new Tracking(flags, appInfo);

			// Stub out helper methods
			tracking.getUserData = jest.fn();
			tracking.prepareContext = jest.fn();

			tracking.init();

			expect(flags.get).toHaveBeenCalledTimes(1);
			expect(flags.get).toHaveBeenCalledWith("oTracking");
			expect(oTracking.init).not.toHaveBeenCalled();
			expect(tracking.getUserData).not.toHaveBeenCalled();
			expect(tracking.prepareContext).not.toHaveBeenCalled();
		});

		it("does nothing when flags have not been supplied", () => {
			const tracking = new Tracking(null, appInfo);

			// Stub out helper methods
			tracking.getUserData = jest.fn();
			tracking.prepareContext = jest.fn();

			tracking.init();

			expect(oTracking.init).not.toHaveBeenCalled();
			expect(tracking.getUserData).not.toHaveBeenCalled();
			expect(tracking.prepareContext).not.toHaveBeenCalled();
		});
	});

	describe(".userData", () => {
		const userData = {
			layout: "layoutUserData",
			orientation: "orientationUserData",
			connectionType: "connectionTypeUserData"
		};

		it("should return the correct user data", () => {
			const tracking = new Tracking(flags, appInfo);

			oGrid.getCurrentLayout.mockReturnValue(userData.layout);
			oViewport.getOrientation.mockReturnValue(userData.orientation);
			tracking.getConnectionType = () => userData.connectionType;

			const result = tracking.getUserData();

			expect(result).toEqual(userData);
		});

		it("should return a user data object without a `connectionType` prop when there is no connection Type ", () => {
			const tracking = new Tracking(flags, appInfo);

			oGrid.getCurrentLayout.mockReturnValue(userData.layout);
			oViewport.getOrientation.mockReturnValue(userData.orientation);
			tracking.getConnectionType = () => null;

			const result = tracking.getUserData();

			expect(result.connectionType).toBeUndefined();
		});
	});

	describe(".getConnectionType()", () => {
		it("should return the correct connection info for the browser", () => {
			navigator.connection = "connection";
			navigator.mozConnection = undefined;
			navigator.webkitConnection = undefined;

			const tracking = new Tracking(flags, appInfo);
			const result = tracking.getConnectionType();

			expect(result).toBe(navigator.connection);
		});

		it("should return `mozConnection` if applicable", () => {
			navigator.connection = undefined;
			navigator.mozConnection = "mozConnection";
			navigator.webkitConnection = "webkitConnection";

			const tracking = new Tracking(flags, appInfo);
			const result = tracking.getConnectionType();

			expect(result).toBe(navigator.mozConnection);
		});

		it("should return `webkitConnection` if applicable", () => {
			navigator.connection = undefined;
			navigator.mozConnection = undefined;
			navigator.webkitConnection = "webkitConnection";

			const tracking = new Tracking(flags, appInfo);
			const result = tracking.getConnectionType();

			expect(result).toBe(navigator.webkitConnection);
		});

		it("should return `undefined` if not available", () => {
			navigator.connection = undefined;
			navigator.mozConnection = undefined;
			navigator.webkitConnection = undefined;

			const tracking = new Tracking(flags, appInfo);
			const result = tracking.getConnectionType();

			expect(result).toBeUndefined();
		});
	});

	describe(".prepareContextAppInfo()", () => {
		it("should prepare the `app info` portion of the context", () => {
			const appInfo = { product: "foo", name: "bar", version: "1.0.0" };
			const tracking = new Tracking(flags, appInfo);
			const result = tracking.prepareContextAppInfo();
			expect(result).toEqual({
				product: "foo",
				app: "bar",
				appVersion: "1.0.0"
			});
		});

		it("should set the `product` value as `next` is `appInfo.product` has not been specified", () => {
			const appInfo = { name: "bar", version: "1.0.0" };
			const tracking = new Tracking(flags, appInfo);
			const result = tracking.prepareContextAppInfo();
			expect(result).toEqual({
				product: "next",
				app: "bar",
				appVersion: "1.0.0"
			});
		});
	});
});
