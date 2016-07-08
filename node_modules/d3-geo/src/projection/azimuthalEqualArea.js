import {asin, sqrt} from "../math";
import {azimuthal, azimuthalInvert} from "./azimuthal";
import projection from "./index";

var azimuthalEqualArea = azimuthal(function(cxcy) {
  return sqrt(2 / (1 + cxcy));
});

azimuthalEqualArea.invert = azimuthalInvert(function(z) {
  return 2 * asin(z / 2);
});

export default function() {
  return projection(azimuthalEqualArea)
      .scale(120)
      .clipAngle(180 - 1e-3);
}
