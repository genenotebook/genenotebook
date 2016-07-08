import {atan, atan2, cos, epsilon, halfPi, log, pow, sign, sin, sqrt, tan} from "../math";
import {conicProjection} from "./conic";
import {mercator} from "./mercator";

function tany(y) {
  return tan((halfPi + y) / 2);
}

function conicConformal(y0, y1) {
  var cy0 = cos(y0),
      n = y0 === y1 ? sin(y0) : log(cy0 / cos(y1)) / log(tany(y1) / tany(y0)),
      f = cy0 * pow(tany(y0), n) / n;

  if (!n) return mercator;

  function project(x, y) {
    if (f > 0) { if (y < -halfPi + epsilon) y = -halfPi + epsilon; }
    else { if (y > halfPi - epsilon) y = halfPi - epsilon; }
    var r = f / pow(tany(y), n);
    return [r * sin(n * x), f - r * cos(n * x)];
  }

  project.invert = function(x, y) {
    var fy = f - y, r = sign(n) * sqrt(x * x + fy * fy);
    return [atan2(x, fy) / n, 2 * atan(pow(f / r, 1 / n)) - halfPi];
  };

  return project;
}

export default function() {
  return conicProjection(conicConformal);
}
