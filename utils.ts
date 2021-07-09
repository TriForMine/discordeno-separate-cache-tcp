function concat(arrays: Uint8Array[]) {
    // sum of individual array lengths
    let totalLength = arrays.reduce((acc, value) => acc + value.length, 0);

    if (!arrays.length) return new Uint8Array();

    let result = new Uint8Array(totalLength);

    // for each array - copy it over result
    // next array is copied right after the previous one
    let length = 0;
    for(let array of arrays) {
        result.set(array, length);
        length += array.length;
    }

    return result;
}


export async function readStream(reader: ReadableStreamDefaultReader) {
    let chunks = new Uint8Array();
    while (true) {
        const {value, done} = await reader.read();
        if (done) break;
        chunks = concat([chunks, value])
    }
    return chunks
}
