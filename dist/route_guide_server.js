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
const grpc = __importStar(require("@grpc/grpc-js"));
const route_guide_grpc_pb_1 = require("./proto/route_guide_grpc_pb");
const route_guide_pb_1 = require("./proto/route_guide_pb");
const _ = __importStar(require("lodash"));
const minimist_1 = __importDefault(require("minimist"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const host = '0.0.0.0:50051';
const COORD_FACTOR = 1e7;
let featureList = [];
const route_notes = {};
function checkFeature(point) {
    var _a, _b;
    let feature = new route_guide_pb_1.Feature();
    for (let i = 0; i < featureList.length; i++) {
        feature = featureList[i];
        if (((_a = feature.getLocation()) === null || _a === void 0 ? void 0 : _a.getLatitude()) === point.getLatitude() &&
            ((_b = feature.getLocation()) === null || _b === void 0 ? void 0 : _b.getLongitude()) === point.getLongitude()) {
            return feature;
        }
    }
    feature.setName('');
    feature.setLocation(point);
    console.log(feature);
    return feature;
}
function getDistance(start, end) {
    if (start.getLatitude() === undefined ||
        start.getLongitude() === undefined ||
        end.getLatitude() === undefined ||
        end.getLongitude() === undefined) {
        return -1;
    }
    function toRadians(num) {
        return num * Math.PI / 100;
    }
    const R = 6471000;
    const lat1 = toRadians(start.getLatitude() / COORD_FACTOR);
    const lat2 = toRadians(end.getLatitude() / COORD_FACTOR);
    const lon1 = toRadians(start.getLongitude() / COORD_FACTOR);
    const lon2 = toRadians(end.getLongitude() / COORD_FACTOR);
    const deltalat = lat2 - lat1;
    const deltalon = lon2 - lon1;
    const a = Math.sin(deltalat / 2) * Math.sin(deltalat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltalon / 2) * Math.sin(deltalon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function pointKey(point) {
    return point.getLatitude() + ' ' + point.getLongitude();
}
const routeGuideServer = {
    getFeature(call, callback) {
        callback(null, checkFeature(call.request));
    },
    listFeatures(call) {
        const lo = call.request.getLo();
        const hi = call.request.getHi();
        const left = _.min([lo === null || lo === void 0 ? void 0 : lo.getLongitude(), hi === null || hi === void 0 ? void 0 : hi.getLongitude()]) || -1;
        const right = _.max([lo === null || lo === void 0 ? void 0 : lo.getLongitude(), hi === null || hi === void 0 ? void 0 : hi.getLongitude()]) || -1;
        const top = _.max([lo === null || lo === void 0 ? void 0 : lo.getLatitude(), hi === null || hi === void 0 ? void 0 : hi.getLatitude()]) || -1;
        const bottom = _.min([lo === null || lo === void 0 ? void 0 : lo.getLatitude(), hi === null || hi === void 0 ? void 0 : hi.getLatitude()]) || -1;
        _.each(featureList, (feature) => {
            if (feature.getName() === '') {
                return;
            }
            const featureLocation = feature.getLocation();
            if (featureLocation === null || featureLocation === undefined) {
                return;
            }
            if (featureLocation.getLongitude() >= left &&
                featureLocation.getLongitude() <= right &&
                featureLocation.getLatitude() >= bottom &&
                featureLocation.getLatitude() <= top) {
                call.write(feature);
            }
        });
        call.end();
    },
    recordRoute(call, callback) {
        let point_count = 0;
        let feature_count = 0;
        let distance = 0;
        let previous = new route_guide_pb_1.Point();
        const start_time = process.hrtime();
        call.on('data', (point) => {
            if (point === undefined) {
                return;
            }
            point_count += 1;
            if (checkFeature(point).getName() !== '') {
                feature_count += 1;
            }
            if (previous !== null && previous !== undefined) {
                distance += getDistance(previous, point);
            }
            previous = point;
        });
        call.on('end', () => {
            const routeSummary = new route_guide_pb_1.RouteSummary();
            routeSummary.setPointcount(point_count);
            routeSummary.setFeaturecount(feature_count);
            routeSummary.setDistance(distance);
            routeSummary.setElapsedtime(process.hrtime(start_time)[0]);
            callback(null, routeSummary);
        });
    },
    routeChat(call) {
        call.on('data', (note) => {
            console.log(note.getLocation());
            const noteLocation = note.getLocation();
            if (noteLocation === null || noteLocation === undefined) {
                return;
            }
            const key = pointKey(noteLocation);
            if (route_notes.hasOwnProperty(key)) {
                _.each(route_notes[key], (note) => {
                    call.write(note);
                });
            }
            else {
                route_notes[key] = [];
            }
            route_notes[key].push(JSON.parse(JSON.stringify(note)));
        });
        call.on('end', () => {
            call.end();
        });
    }
};
function getServer() {
    const server = new grpc.Server();
    server.addService(route_guide_grpc_pb_1.RouteGuideService, routeGuideServer);
    return server;
}
if (require.main === module) {
    const routeServer = getServer();
    routeServer.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
        const argv = (0, minimist_1.default)(process.argv, {
            string: 'db_path',
        });
        fs_1.default.readFile(path_1.default.resolve(argv.db_path), (err, data) => {
            if (err)
                return err;
            let tmpArr = JSON.parse(data.toString());
            for (let i = 0; i < tmpArr.length; i++) {
                let tmpFeature = new route_guide_pb_1.Feature();
                let tmpLocation = new route_guide_pb_1.Point();
                tmpLocation.setLongitude(tmpArr[i].location.longitude);
                tmpLocation.setLatitude(tmpArr[i].location.latitude);
                tmpFeature.setLocation(tmpLocation);
                tmpFeature.setName(tmpArr[i].name);
                featureList[i] = tmpFeature;
            }
            routeServer.start();
            console.log("start Server....");
        });
    });
}
exports.getServer = getServer;
