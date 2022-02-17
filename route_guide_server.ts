import * as grpc from '@grpc/grpc-js';
import { RouteGuideService, IRouteGuideServer  } from './proto/route_guide_grpc_pb';
import { Point, Feature,Rectangle, RouteNote,RouteSummary } from './proto/route_guide_pb';
import * as _ from 'lodash';
import parseArgs from 'minimist';
import fs from 'fs';
import path from 'path';

const COORD_FACTOR = 1e7;
let featureList: Feature[] = [];
const route_notes: any = {};

function checkFeature(point: Point): Feature {
    let feature: Feature = new Feature();
    for(let i = 0; i < featureList.length; i++) {
        feature = featureList[i];
        if(feature.getLocation().getLatitude() === point.getLatitude() &&
            feature.getLocation().getLongitude() === point.getLongitude()) {
                console.log(feature);
                return feature;
            }
    }
    let name = '';
    feature.setName(name);
    feature.setLocation(point);
    console.log(feature);
    return feature;
}

function getDistance(start:Point, end: Point) {
    function toRadians(num: number): number {
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
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function pointKey(point: Point): string {
    return point.getLatitude() + ' ' + point.getLongitude();
}

const routeGuideServer: IRouteGuideServer = {
    getFeature(
        call: grpc.ServerUnaryCall<Point, Feature>, 
        callback: grpc.sendUnaryData<Feature> 
    ): void {
        callback(null, checkFeature(call.request));
    },

    listFeatures(
        call: grpc.ServerWritableStream<Rectangle, Feature>
    ): void {

        const lo = call.request.getLo();
        const hi = call.request.getHi();
        const left = _.min([lo.getLongitude(), hi.getLongitude]) || -1;
        const right = _.max([lo.getLongitude(), hi.getLongitude()]) || -1;
        const top = _.max([lo.getLatitude(), hi.getLatitude()]) || -1;
        const bottom = _.min([lo.getLatitude(), hi.getLatitude()]) || -1;
        let returnNum = 0;

        _.each(featureList, (feature:Feature) => {
            if(feature.getName() === '') {
                return;
            }

            if(feature.getLocation().getLongitude() >= left &&
                feature.getLocation().getLongitude() <= right && 
                feature.getLocation().getLatitude() >= bottom &&
                feature.getLocation().getLatitude() <= top
            ) {
                call.write(feature);
            }
        });
        call.end();
    },

    recordRoute(
        call: grpc.ServerReadableStream<Point, RouteSummary>,
        callback: grpc.sendUnaryData<RouteSummary>
    ): void {
        let point_count = 0;
        let feature_count = 0;
        let distance = 0;
        let previous:Point = new Point();
        const start_time = process.hrtime();
        call.on('data', (point:Point) => {
            point_count += 1;
            if(checkFeature(point).getName() !== '') {
                feature_count += 1;
            }

            if(previous !== null) {
                distance += getDistance(previous, point);
            }
            previous = point;
        });
        call.on('end', () => {
            const routeSummary:RouteSummary = new RouteSummary();
            routeSummary.setPointcount(point_count);
            routeSummary.setFeaturecount(feature_count);
            routeSummary.setDistance(distance)
            routeSummary.setElapsedtime(process.hrtime(start_time)[0]);
            console.log(routeSummary);
            callback(null, routeSummary);
        });
    },

    routeChat(
        call: grpc.ServerDuplexStream<RouteNote, RouteNote>
    ): void {
        call.on('data', (note: RouteNote) => {
            const key:string = pointKey(note.getLocation());
            if(route_notes.hasOwnProperty()) {
                _.each(route_notes[key], (note: RouteNote) => {
                    call.write(note);
                });
            } else {
                route_notes[key] = [];
            }

            route_notes[key].push(JSON.parse(JSON.stringify(note)));
        });
        call.on('end', () => {
            call.end();
        });
    }
}

function getServer():grpc.Server {
    const server:grpc.Server = new grpc.Server();
    server.addService(RouteGuideService, routeGuideServer);
    return server;
}

if(require.main === module) {
    const routeServer: grpc.Server = getServer();
    routeServer.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
        const argv = parseArgs(process.argv, {
            string: 'db_path',
        });

        fs.readFile(path.resolve(argv.db_path), (err: any, data: Buffer) => {
            if(err) return err;
            let tmpArr = JSON.parse(data.toString());
            for(let i = 0; i < tmpArr.length; i++) {
                let tmpFeature = new Feature();
                let tmpLocation = new Point();
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