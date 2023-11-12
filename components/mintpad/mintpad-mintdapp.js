import { useState, useEffect, useRef } from "react";
import { IPFS_GATEWAY } from "@/tock.config";
import { NFT_STORAGE_GATEWAY } from "@/tock.config";
import { hexEncode } from "@/utils/crypto-utils";
import Loading from "../loading/loading";

export default function MintpadDapp({
  layers,
  fileNames,
  cids,
  setBlob,
  isSetBlob,
}) {
  const [loaded, setLoaded] = useState(false);
  const [built, setBuilt] = useState(false);
  const [assets, setAssets] = useState([]);
  const [drawing, setDrawing] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [percentage, setPercentage] = useState(0);

  const ctx = useRef(null);
  const canvas = useRef(null);
  const loadedCount = useRef(0);

  useEffect(() => {
    if (fileNames.length == 0) return;
    let len = 0;
    for (let i in fileNames) len = len + fileNames[i].length;
    setTotalCount(len);
  }, [fileNames]);

  useEffect(() => {
    if (!isSetBlob) return;
    const traits = [];
    for (let i = 0; i < layers.length; i++) {
      const trait_type = toHex(layers[i]);
      const selectedLayer = assets[i];
      const _value = selectedLayer[drawing[i]].name;
      const value = toHex(_value.slice(0, _value.length - 4));
      traits.push({ trait_type, value });
    }
    canvas.current.toBlob((blob) => {
      setBlob({ blob, traits });
    });
  }, [isSetBlob]);

  useEffect(() => {
    if (totalCount == 0) return;
    const _assets = [];
    for (let i = 0; i < cids.length; i++) {
      const images = [];
      const layerFileNames = fileNames[i];
      for (let j = 0; j < layerFileNames.length; j++) {
        let img = new Image();
        img.onload = imageLoaded;
        img.error = (e) =>
          (e.target.src = `https://${cids[i]}.${NFT_STORAGE_GATEWAY}/${layerFileNames[j]}`);
        img.src = `${IPFS_GATEWAY}/${cids[i]}/${layerFileNames[j]}`;
        img.crossOrigin = "Anonymous";
        images.push({ img, name: layerFileNames[j] });
      }
      _assets[i] = images;
    }
    setAssets(_assets);
  }, [totalCount]);

  function redraw() {
    ctx.current.clearRect(0, 0, canvas.current.width, canvas.current.height);
    for (let layer in drawing) {
      drawImage(layer);
    }
  }

  useEffect(() => {
    if (!built) return;
    redraw();
  }, [drawing]);

  useEffect(() => {
    if (!loaded) return;
    if (canvas.current) return;
    let _canvas = document.getElementById("app-canvas");
    canvas.current = _canvas;
    ctx.current = _canvas.getContext("2d");
    let newDrawing = {};
    for (let layer in assets) newDrawing[layer] = 0;
    setDrawing(newDrawing);
    setBuilt(true);
  }, [loaded]);

  function imageLoaded(e) {
    setPercentage(Math.ceil(((loadedCount.current + 1) * 100) / totalCount));
    loadedCount.current = loadedCount.current + 1;
    if (loadedCount.current === totalCount) setLoaded(true);
  }

  function drawImage(layer) {
    if (!built) return;
    const selectedLayer = assets[layer];
    ctx.current.drawImage(selectedLayer[drawing[layer]].img, 0, 0, 1000, 1000);

    // const _value = selectedLayer[drawing[layer]].name;
    // const value = _value.slice(0, _value.length - 4);
    // console.log(value);
  }

  function nextImg(layer) {
    const selectedLayer = assets[layer];
    if (drawing[layer] + 1 < selectedLayer.length) {
      const newDrawing = { ...drawing };
      newDrawing[layer] = drawing[layer] + 1;
      setDrawing(newDrawing);
    }
  }

  function IsNextImgNotAvailable(layer) {
    const selectedLayer = assets[layer];
    if (drawing[layer] + 1 < selectedLayer.length) return false;
    else return true;
  }

  function IsPrevImgNotAvailable(layer) {
    if (drawing[layer] - 1 >= 0) return false;
    else return true;
  }

  function prevImg(layer) {
    if (drawing[layer] - 1 >= 0) {
      const newDrawing = { ...drawing };
      newDrawing[layer] = drawing[layer] - 1;
      setDrawing(newDrawing);
    }
  }

  return (
    <div>
      {!loaded && (
        <div>
          <p className="text-center text-tock-green mb-2 text-xs font-normal">
            please wait for app to build...
          </p>
          <p className="text-center text-tock-green mb-2 text-xs font-normal">
            {percentage}%
          </p>
          <div className="flex justify-center items-center">
            <Loading isLoading={!loaded} size={20} />
          </div>
        </div>
      )}
      {loaded && (
        <div className="flex flex-col lg:flex-row-reverse justify-center w-full">
          <div className="flex justify-center">
            <canvas
              id="app-canvas"
              className="rounded-xl mt-4 border border-zinc-500 mb-2 w-[350px] h-[350px] object-contain"
              width={1000}
              height={1000}
            ></canvas>
          </div>
          {built && (
            <div className="mb-6 mt-2 px-10">
              {Object.keys(drawing).map((layer, i) => {
                return (
                  <div
                    key={"drawing_" + i}
                    className="mt-6 mb-4 flex flex-col sm:grid sm:grid-cols-2 items-center justify-center"
                  >
                    <p className="text-sm text-zinc-400 text-start">
                      <span className="text-tock-orange">{layers[layer]}:</span>{" "}
                      {assets[layer][drawing[layer]].name.slice(
                        0,
                        assets[layer][drawing[layer]].name.length - 4
                      )}
                    </p>
                    <div className="flex justify-center select-none">
                      <button
                        className="disabled:border-zinc-700 disabled:text-zinc-700 mt-1 mb-1 border border-zinc-500 transition ease-in-out mx-4 enabled:hover:bg-zinc-600 duration-300 bg-tock-semiblack text-zinc-400 font-bold py-2 px-4 rounded-2xl focus:outline-none focus:shadow-outline active:text-white"
                        onClick={() => prevImg(layer)}
                        disabled={IsPrevImgNotAvailable(layer)}
                      >
                        &lt;
                      </button>

                      <p className="text-zinc-500 text-xs w-12 text-center align-middle mt-4">
                        {drawing[layer] + 1}/{assets[layer].length}
                      </p>
                      <button
                        className="disabled:border-zinc-700 disabled:text-zinc-700 mt-1 mb-1 border border-zinc-500 transition ease-in-out mx-4 enabled:hover:bg-zinc-600 duration-300 bg-tock-semiblack text-zinc-400 font-bold py-2 px-4 rounded-2xl focus:outline-none focus:shadow-outline active:text-white"
                        onClick={() => nextImg(layer)}
                        disabled={IsNextImgNotAvailable(layer)}
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function toHex(_string) {
  let _bytes = hexEncode(_string);
  let zeroPaddingLen = 64 - _bytes.length;
  for (let i = 0; i < zeroPaddingLen; i++) {
    _bytes = _bytes + "0";
  }
  const hex = "0x" + _bytes;
  return hex;
}