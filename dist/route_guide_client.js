"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_1 = __importDefault(require("async"));
const fs_1 = __importDefault(require("fs"));
const minimist_1 = __importDefault(require("minimist"));
const path_1 = __importDefault(require("path"));
const lodash_1 = __importDefault(require("lodash"));
const grpc = __importStar(require("@grpc/grpc-js"));
const route_guide_grpc_pb_1 = require("./proto/route_guide_grpc_pb");
const route_guide_pb_1 = require("./proto/route_guide_pb");
const client = new route_guide_grpc_pb_1.RouteGuideClient('0.0.0.0:50051', grpc.credentials.createInsecure());
const COORD_FACTOR = 1e7;
function runGetFeature() {
    const point1 = new route_guide_pb_1.Point();
    point1.setLatitude(409146138);
    point1.setLongitude(-746188906);
    const point2 = new route_guide_pb_1.Point();
    point2.setLatitude(0);
    point2.setLongitude(0);
    ////////////////////////////
    const location1 = new route_guide_pb_1.RouteNote();
    location1.setLocation(point1);
    console.log(location1.getLocation());
    const location2 = new route_guide_pb_1.RouteNote();
    location2.setLocation(point2);
    console.log(location2.getLocation());
    ////////////////////////////
    client.getFeature(point1, (error, feature) => {
        if (feature === undefined) {
            return;
        }
        const location = feature.getLocation();
        if (location === null || location === undefined) {
            return;
        }
        if (feature.getName() === '') {
            console.log('Found no feature at ' +
                location.getLatitude() / COORD_FACTOR + ', ' +
                location.getLongitude() / COORD_FACTOR);
        }
        else {
            console.log(`Found feature called "${feature.getName()}" at ${location.getLatitude() / COORD_FACTOR}, ${location.getLongitude()}`);
        }
    });
}
function runListFeatures() {
    const rect = new route_guide_pb_1.Rectangle();
    const lo = new route_guide_pb_1.Point();
    lo.setLatitude(400000000);
    lo.setLongitude(-750000000);
    rect.setLo(lo);
    const hi = new route_guide_pb_1.Point();
    hi.setLatitude(420000000);
    hi.setLongitude(-730000000);
    rect.setHi(hi);
    console.log('Looking for features between 40, -75 and 42, -73');
    const call = client.listFeatures(rect);
    call.on('data', (feature) => {
        const location = feature.getLocation();
        if (location === null || location === undefined) {
            return;
        }
        console.log('Found feature called "' + feature.getName() + '" at ' +
            location.getLatitude() / COORD_FACTOR + ', ' +
            location.getLongitude() / COORD_FACTOR);
    });
    call.on('end', () => { });
}
function runRecordRoute() {
    const argv = (0, minimist_1.default)(process.argv, {
        string: 'db_path'
    });
    fs_1.default.readFile(path_1.default.resolve(argv.db_path), (err, data) => {
        if (err) {
            return;
        }
        const jsonToProto = [];
        JSON.parse(data.toString()).forEach((data) => {
            let featureData = new route_guide_pb_1.Feature();
            let pointData = new route_guide_pb_1.Point();
            pointData.setLongitude(data.location.longitude);
            pointData.setLatitude(data.location.latitude);
            featureData.setLocation(pointData);
            featureData.setName(data.name);
            jsonToProto.push(featureData);
        });
        const featureList = lodash_1.default.map(jsonToProto, (value) => {
            const valueLocation = value.getLocation();
            if (valueLocation === null || valueLocation === undefined) {
                return;
            }
            const feature = new route_guide_pb_1.Feature();
            feature.setName(value.getName());
            const location = new route_guide_pb_1.Point();
            location.setLatitude(valueLocation.getLatitude());
            location.setLongitude(valueLocation.getLongitude());
            feature.setLocation(location);
            return feature;
        });
        const numPoint = 10;
        const call = client.recordRoute((error, state) => {
            console.log(state === null || state === void 0 ? void 0 : state.toString());
            if (error) {
                console.log(error);
                return;
            }
            console.log('Finished trip with', state === null || state === void 0 ? void 0 : state.getPointcount(), 'points');
            console.log('Passed', state === null || state === void 0 ? void 0 : state.getFeaturecount(), 'features');
            console.log('Travelled', state === null || state === void 0 ? void 0 : state.getDistance(), 'meters');
            console.log('It took', state === null || state === void 0 ? void 0 : state.getElapsedtime(), 'seconds');
        });
        function pointSender(location) {
            return function (callback) {
                console.log('Visiting point ' + location.getLatitude() / COORD_FACTOR +
                    ', ' + location.getLongitude() / COORD_FACTOR);
                call.write(location);
                lodash_1.default.delay(callback, lodash_1.default.random(500, 1500));
            };
        }
        let pointSenders = [];
        for (let i = 0; i < numPoint; i++) {
            const randPoint = featureList[lodash_1.default.random(0, featureList.length - 1)];
            const location = randPoint === null || randPoint === void 0 ? void 0 : randPoint.getLocation();
            if (location === null || location === undefined) {
                return;
            }
            pointSenders[i] = pointSender(location);
        }
        async_1.default.series(pointSenders, () => {
            call.end();
        });
    });
}
function runRoutechat() {
    const call = client.routeChat();
    call.on('data', (note) => {
        const noteLocation = note.getLocation();
        if (noteLocation === null || noteLocation === undefined) {
            return;
        }
        console.log('Got message "' + note.getMessage() + '" at ' +
            noteLocation.getLatitude() + ', ' +
            noteLocation.getLongitude());
    });
    call.on('end', () => { });
    const notes = [{
            location: {
                latitude: 0,
                longitude: 0
            },
            message: 'First message'
        }, {
            location: {
                latitude: 0,
                longitude: 1
            },
            message: 'Second message'
        }, {
            location: {
                latitude: 1,
                longitude: 0
            },
            message: 'Third message'
        }, {
            location: {
                latitude: 0,
                longitude: 0
            },
            message: 'Fourth message'
        }];
    for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        console.log('Sending message "' + note.message + '" at ' +
            note.location.latitude + ', ' + note.location.longitude);
        const noteMsg = new route_guide_pb_1.RouteNote();
        noteMsg.setMessage(note.message);
        const point = new route_guide_pb_1.Point();
        point.setLatitude(+note.location.latitude);
        point.setLongitude(+note.location.longitude);
        console.log(point.getLongitude() === null);
        noteMsg.setLocation(point);
        console.log(noteMsg.getLocation());
        call.write(noteMsg);
    }
    call.end();
}
function main() {
    runGetFeature();
    // runListFeatures();
    // runRecordRoute();
    // runRoutechat();
}
if (require.main === module) {
    main();
}
exports.runGetFeature = runGetFeature;
exports.runListFeatures = runListFeatures;
exports.runRecordRoute = runRecordRoute;
exports.runRoutechat = runRoutechat;
