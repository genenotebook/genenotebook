import {acos, sin, tau} from "../math";
import {azimuthal, azimuthalInvert} from "./azimuthal";
import projection from "./index";

var azimuthalEquidistant = azimuthal(function(c) {
  return (c = acos(c)) && c / sin(c);
});

azimuthalEquidistant.invert = azimuthalInvert(function(z) {
  return z;
});

export default function() {
  return projection(azimuthalEquidistant)
      .scale(480 / tau)
      .clipAngle(180 - 1e-3);
}
