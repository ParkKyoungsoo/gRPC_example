// GENERATED CODE -- DO NOT EDIT!

// package: routeguide
// file: proto/route_guide.proto

import * as proto_route_guide_pb from "../proto/route_guide_pb";
import * as grpc from "@grpc/grpc-js";

interface IRouteGuideService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  getFeature: grpc.MethodDefinition<proto_route_guide_pb.Point, proto_route_guide_pb.Feature>;
  listFeatures: grpc.MethodDefinition<proto_route_guide_pb.Rectangle, proto_route_guide_pb.Feature>;
  recordRoute: grpc.MethodDefinition<proto_route_guide_pb.Point, proto_route_guide_pb.RouteSummary>;
  routeChat: grpc.MethodDefinition<proto_route_guide_pb.RouteNote, proto_route_guide_pb.RouteNote>;
}

export const RouteGuideService: IRouteGuideService;

export interface IRouteGuideServer extends grpc.UntypedServiceImplementation {
  getFeature: grpc.handleUnaryCall<proto_route_guide_pb.Point, proto_route_guide_pb.Feature>;
  listFeatures: grpc.handleServerStreamingCall<proto_route_guide_pb.Rectangle, proto_route_guide_pb.Feature>;
  recordRoute: grpc.handleClientStreamingCall<proto_route_guide_pb.Point, proto_route_guide_pb.RouteSummary>;
  routeChat: grpc.handleBidiStreamingCall<proto_route_guide_pb.RouteNote, proto_route_guide_pb.RouteNote>;
}

export class RouteGuideClient extends grpc.Client {
  constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
  getFeature(argument: proto_route_guide_pb.Point, callback: grpc.requestCallback<proto_route_guide_pb.Feature>): grpc.ClientUnaryCall;
  getFeature(argument: proto_route_guide_pb.Point, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<proto_route_guide_pb.Feature>): grpc.ClientUnaryCall;
  getFeature(argument: proto_route_guide_pb.Point, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<proto_route_guide_pb.Feature>): grpc.ClientUnaryCall;
  listFeatures(argument: proto_route_guide_pb.Rectangle, metadataOrOptions?: grpc.Metadata | grpc.CallOptions | null): grpc.ClientReadableStream<proto_route_guide_pb.Feature>;
  listFeatures(argument: proto_route_guide_pb.Rectangle, metadata?: grpc.Metadata | null, options?: grpc.CallOptions | null): grpc.ClientReadableStream<proto_route_guide_pb.Feature>;
  recordRoute(callback: grpc.requestCallback<proto_route_guide_pb.RouteSummary>): grpc.ClientWritableStream<proto_route_guide_pb.Point>;
  recordRoute(metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<proto_route_guide_pb.RouteSummary>): grpc.ClientWritableStream<proto_route_guide_pb.Point>;
  recordRoute(metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<proto_route_guide_pb.RouteSummary>): grpc.ClientWritableStream<proto_route_guide_pb.Point>;
  routeChat(metadataOrOptions?: grpc.Metadata | grpc.CallOptions | null): grpc.ClientDuplexStream<proto_route_guide_pb.RouteNote, proto_route_guide_pb.RouteNote>;
  routeChat(metadata?: grpc.Metadata | null, options?: grpc.CallOptions | null): grpc.ClientDuplexStream<proto_route_guide_pb.RouteNote, proto_route_guide_pb.RouteNote>;
}
