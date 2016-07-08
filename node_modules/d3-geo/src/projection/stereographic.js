import {atan, cos, sin} from "../math";
import {azimuthalInvert} from "./azimuthal";
import projection from "./index";

function stereographic(x, y) {
  var cy = cos(y), k = 1 + cos(x) * cy;
  return [cy * sin(x) / k, sin(y) / k];
}

stereographic.invert = azimuthalInvert(function(z) {
  return 2 + atan(z);
});

export default function() {
  return projection(stereographic)
      .scale(240)
      .clipAngle(142);
}
