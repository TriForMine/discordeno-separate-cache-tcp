import { readStream } from "../utils/readStream.ts";
import {decodeData, encodeData} from "../utils/utils.ts";
import set from "./functions/set.ts";
import get from "./functions/get.ts";
import deleteOne from "./functions/delete.ts";
import has from "./functions/has.ts";
import size from "./functions/size.ts";
import {NHttp, HttpResponse} from "./deps.ts";
import forEach from "./functions/forEach.ts";
import filter from "./functions/filter.ts";

const app = new NHttp();

function sendData(response: HttpResponse, data: any) {
  const encodedData = encodeData(data);
  return response.header({
    "Content-Type": "application/msgpack",
    "Content-Length": encodedData.byteLength,
  }).send(encodedData);
}

app.get("/memory", ({ response }) => {
  return response.send(
      JSON.stringify({
        success: true,
        response: Deno.memoryUsage(),
      }),
  );
});

app.post("/:table/:key/set", async ({request, response, params}) => {
  if(!request.body)
    return response.code(404).send('404 Not Found');
  return sendData(response, set(params.table, params.key, decodeData(await readStream(request.body.getReader()))));
});

app.get("/:table/:key/get", ({response, params}) => {
  return sendData(response, get(params.table, params.key));
});

app.get("/:table/:key/delete", ({response, params}) => {
  return sendData(response, deleteOne(params.table, params.key));
});

app.get("/:table/:key/has", ({response, params}) => {
  return sendData(response, has(params.table, params.key));
});

app.get("/:table/size", ({response, params}) => {
  return sendData(response, size(params.table));
});

app.post("/forEach/:type", async ({request, response, params}) => {
  if(!request.body)
    return response.code(404).send('404 Not Found');
  return sendData(response, forEach(params.type, decodeData(await readStream(request.body.getReader()))));
});

app.get("/filter/:type", ({response, params}) => {
  return sendData(response, filter(params.type));
});

app.listen(9999, () => {
  console.log(`HTTP webserver running.  Access it at:  http://localhost:9999/`);
})
