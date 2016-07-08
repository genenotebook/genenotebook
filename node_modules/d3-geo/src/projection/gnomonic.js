import {atan, cos, sin} from "../math";
import {azimuthalInvert} from "./azimuthal";
import projection from "./index";

function gnomonic(x, y) {
  var cy = cos(y), k = cos(x) * cy;
  return [cy * sin(x) / k, sin(y) / k];
}

gnomonic.invert = azimuthalInvert(atan);

export default function() {
  return projection(gnomonic)
      .scale(139)
      .clipAngle(60);
}
