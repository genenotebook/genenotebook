import {asin, cos, epsilon, sin} from "../math";
import {azimuthalInvert} from "./azimuthal";
import projection from "./index";

function orthographic(x, y) {
  return [cos(y) * sin(x), sin(y)];
}

orthographic.invert = azimuthalInvert(asin);

export default function() {
  return projection(orthographic)
      .scale(240)
      .clipAngle(90 + epsilon);
}
