export function hexEncode(str) {
  let hex, i;
  let result = "";
  for (i = 0; i < str.length; i++) {
    hex = str.charCodeAt(i).toString(16);
    result += hex.slice(-4);
  }
  return result;
}

export function hexDecode(str) {
  // let j;
  // let hexes = str.match(/.{1,32}/g) || [];
  // let back = "";
  // for (j = 0; j < hexes.length; j++) {
  //   back += String.fromCharCode(parseInt(hexes[j], 16));
  // }
  // return back;

  var hex = str.toString();//force conversion
  var str = '';
  for (var i = 0; i < hex.length; i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}
