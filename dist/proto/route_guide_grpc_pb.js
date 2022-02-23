// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var proto_route_guide_pb = require('../proto/route_guide_pb.js');

function serialize_routeguide_Feature(arg) {
  if (!(arg instanceof proto_route_guide_pb.Feature)) {
    throw new Error('Expected argument of type routeguide.Feature');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routeguide_Feature(buffer_arg) {
  return proto_route_guide_pb.Feature.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routeguide_Point(arg) {
  if (!(arg instanceof proto_route_guide_pb.Point)) {
    throw new Error('Expected argument of type routeguide.Point');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routeguide_Point(buffer_arg) {
  return proto_route_guide_pb.Point.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routeguide_Rectangle(arg) {
  if (!(arg instanceof proto_route_guide_pb.Rectangle)) {
    throw new Error('Expected argument of type routeguide.Rectangle');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routeguide_Rectangle(buffer_arg) {
  return proto_route_guide_pb.Rectangle.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routeguide_RouteNote(arg) {
  if (!(arg instanceof proto_route_guide_pb.RouteNote)) {
    throw new Error('Expected argument of type routeguide.RouteNote');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routeguide_RouteNote(buffer_arg) {
  return proto_route_guide_pb.RouteNote.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routeguide_RouteSummary(arg) {
  if (!(arg instanceof proto_route_guide_pb.RouteSummary)) {
    throw new Error('Expected argument of type routeguide.RouteSummary');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routeguide_RouteSummary(buffer_arg) {
  return proto_route_guide_pb.RouteSummary.deserializeBinary(new Uint8Array(buffer_arg));
}


var RouteGuideService = exports.RouteGuideService = {
  // Simple RPC
getFeature: {
    path: '/routeguide.RouteGuide/GetFeature',
    requestStream: false,
    responseStream: false,
    requestType: proto_route_guide_pb.Point,
    responseType: proto_route_guide_pb.Feature,
    requestSerialize: serialize_routeguide_Point,
    requestDeserialize: deserialize_routeguide_Point,
    responseSerialize: serialize_routeguide_Feature,
    responseDeserialize: deserialize_routeguide_Feature,
  },
  // Server-to-client Streaming RPC
listFeatures: {
    path: '/routeguide.RouteGuide/ListFeatures',
    requestStream: false,
    responseStream: true,
    requestType: proto_route_guide_pb.Rectangle,
    responseType: proto_route_guide_pb.Feature,
    requestSerialize: serialize_routeguide_Rectangle,
    requestDeserialize: deserialize_routeguide_Rectangle,
    responseSerialize: serialize_routeguide_Feature,
    responseDeserialize: deserialize_routeguide_Feature,
  },
  // Client-to-server streaming RPC
recordRoute: {
    path: '/routeguide.RouteGuide/RecordRoute',
    requestStream: true,
    responseStream: false,
    requestType: proto_route_guide_pb.Point,
    responseType: proto_route_guide_pb.RouteSummary,
    requestSerialize: serialize_routeguide_Point,
    requestDeserialize: deserialize_routeguide_Point,
    responseSerialize: serialize_routeguide_RouteSummary,
    responseDeserialize: deserialize_routeguide_RouteSummary,
  },
  // Bidirectional streaming RPC
routeChat: {
    path: '/routeguide.RouteGuide/RouteChat',
    requestStream: true,
    responseStream: true,
    requestType: proto_route_guide_pb.RouteNote,
    responseType: proto_route_guide_pb.RouteNote,
    requestSerialize: serialize_routeguide_RouteNote,
    requestDeserialize: deserialize_routeguide_RouteNote,
    responseSerialize: serialize_routeguide_RouteNote,
    responseDeserialize: deserialize_routeguide_RouteNote,
  },
};

exports.RouteGuideClient = grpc.makeGenericClientConstructor(RouteGuideService);
