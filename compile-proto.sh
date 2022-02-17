# CreateDIR='./dist/proto'
# if [ ! -d $CreateDIR ]; then
#     mkdir $CreateDIR
# fi

# CreateDIR='./dist/proto'
# if [ ! -d $CreateDIR ]; then
#     mkdir $CreateDIR
# fi

mkdir -p dist
mkdir -p dist/proto

PROTOC_GEN_TS_PATH="./node_modules/.bin/protoc-gen-ts"
PROTOC_GEN_GRPC_PATH="./node_modules/.bin/grpc_tools_node_protoc_plugin"
PROTOC="./node_modules/.bin/grpc_tools_node_protoc"
JS_OUT_DIR="./dist"
TS_OUT_DIR="."
OUT_DIR="."

${PROTOC} \
    --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}" \
    --plugin=protoc-gen-grpc=${PROTOC_GEN_GRPC_PATH} \
    --js_out="import_style=commonjs,binary:${JS_OUT_DIR}" \
    --ts_out="service=grpc-node,mode=grpc-js:${TS_OUT_DIR}" \
    --grpc_out=grpc_js:"${JS_OUT_DIR}" \
    "./proto"/*.proto