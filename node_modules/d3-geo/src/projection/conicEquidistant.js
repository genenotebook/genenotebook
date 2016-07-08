import {abs, atan2, cos, epsilon, sign, sin, sqrt} from "../math";
import {conicProjection} from "./conic";
import {equirectangular} from "./equirectangular";

function conicEquidistant(y0, y1) {
  var cy0 = cos(y0),
      n = y0 === y1 ? sin(y0) : (cy0 - cos(y1)) / (y1 - y0),
      g = cy0 / n + y0;

  if (abs(n) < epsilon) return equirectangular;

  function project(x, y) {
    var gy = g - y, nx = n * x;
    return [gy * sin(nx), g - gy * cos(nx)];
  }

  project.invert = function(x, y) {
    var gy = g - y;
    return [atan2(x, gy) / n, g - sign(n) * sqrt(x * x + gy * gy)];
  };

  return project;
}

export default function() {
  return conicProjection(conicEquidistant)
      .scale(128)
      .translate([480, 280]);
}
