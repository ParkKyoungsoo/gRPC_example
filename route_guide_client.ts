import async from 'async';
import fs from 'fs';
import parseArgs from 'minimist';
import path from 'path';
import _, { first } from 'lodash';
import * as grpc from '@grpc/grpc-js';
import { RouteGuideClient } from './proto/route_guide_grpc_pb';
import { Point, Rectangle, Feature, RouteNote, RouteSummary } from './proto/route_guide_pb';

const client = new RouteGuideClient('0.0.0.0:50051', grpc.credentials.createInsecure());
const COORD_FACTOR = 1e7;

function runGetFeature() {
    const point1 = new Point();
    point1.setLatitude(409146138);
    point1.setLongitude(-746188906);

    const point2 = new Point();
    point2.setLatitude(0);
    point2.setLongitude(0);
    client.getFeature(        
        point1, 
        (error: grpc.ServiceError | null, feature?: Feature) => {
            if(feature === undefined) {
                return;
            }

            if(feature.getName() === '') {
                console.log('Found no feature at ' + 
                    feature.getLocation().getLatitude() / COORD_FACTOR + ', ' +
                    feature.getLocation().getLongitude() / COORD_FACTOR
                );
            } else {
                console.log(
                    `Found feature called "${feature.getName()}" at ${feature.getLocation().getLatitude() / COORD_FACTOR}, ${feature.getLocation().getLongitude()}`
                );
            }
        }
    );
}

function runListFeatures() {
    const rect = new Rectangle();
    const lo = new Point();
    lo.setLatitude(400000000);
    lo.setLongitude(-750000000);
    rect.setLo(lo);

    const hi = new Point();
    hi.setLatitude(420000000);
    hi.setLongitude(-730000000);
    rect.setHi(hi);
    console.log('Looking for features between 40, -75 and 42, -73');
    const call = client.listFeatures(rect);
    call.on('data', (feature:Feature) => {
        console.log('Found feature called "' + feature.getName() + '" at ' + 
            feature.getLocation().getLatitude() / COORD_FACTOR + ', ' + 
            feature.getLocation().getLongitude() / COORD_FACTOR
        );
    });

    call.on('end', ()=>{});
}

function runRecordRoute() {
    const argv = parseArgs(process.argv, {
        string: 'db_path'
    });

    fs.readFile(path.resolve(argv.db_path), (err, data) => {
        if(err) {
            return;   
        }
        
        const jsonToProto: Feature[] = [];
        JSON.parse(data.toString()).forEach((data: any) => {
            let featureData = new Feature();
            let pointData = new Point();
            pointData.setLongitude(data.location.longitude);
            pointData.setLatitude(data.location.latitude);
            featureData.setLocation(pointData);
            featureData.setName(data.name);

            jsonToProto.push(featureData);
        });

        const featureList = _.map(jsonToProto, (value: Feature) =>{
            const feature = new Feature();
            feature.setName(value.getName());
            const location = new Point();
            location.setLatitude(value.getLocation().getLatitude());
            location.setLongitude(value.getLocation().getLongitude());
            feature.setLocation(location);
            return feature;
        });

        const numPoint = 10;
        const call = client.recordRoute((error: grpc.ServiceError | null, state?: RouteSummary) => {

            console.log('client', state);
            if(error) {
                console.log(error.message);
                return;
            }

            console.log('Finished trip with', state?.getPointcount(), 'points');
            console.log('Passed', state?.getFeaturecount(), 'features');
            console.log('Travelled', state?.getDistance(), 'meters');
            console.log('It took', state?.getElapsedtime(), 'seconds');
        });

        function pointSender(location: Point) {
            return function (callback: any) {
                console.log('Visiting point ' + location.getLatitude() / COORD_FACTOR + 
                    ', ' + location.getLongitude() / COORD_FACTOR
                );
                call.write(location);
                _.delay(callback, _.random(500,1500));
            };
        }

        let pointSenders = [];
        for(let i = 0; i < numPoint; i++) {
            const randPoint = featureList[_.random(0, featureList.length - 1)];
            pointSenders[i] = pointSender(randPoint.getLocation());
        }
        async.series(pointSenders, () => {
            call.end();
        });
    });
}

function runRoutechat() {
    const call = client.routeChat();
    call.on('data', (note: RouteNote) => {
        console.log('Got message "' + note.getMessage() + '" at ' + 
            note.getLocation().getLatitude() + ', ' + 
            note.getLocation().getLongitude()
        );
    });
    
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

    for(let i = 0; i < notes.length; i++) {
        const note = notes[i];
        console.log('Sending message "' + note.message + '" at ' + 
            note.location.latitude + ', ' + note.location.longitude
        );
        const noteMsg = new RouteNote();
        noteMsg.setMessage(note.message);

        const location = new Point();
        location.setLatitude(note.location.latitude);
        location.setLongitude(note.location.longitude);
        noteMsg.setLocation(location);
        call.write(noteMsg);
    }
    call.end();
}


function main() {
    runGetFeature();
    // runListFeatures();
    runRecordRoute();
    // runRoutechat();
}

if(require.main === module) {
    main();
}

exports.runGetFeature = runGetFeature;

exports.runListFeatures = runListFeatures;

exports.runRecordRoute = runRecordRoute;

exports.runRoutechat = runRoutechat;