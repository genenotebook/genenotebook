import {atan, exp, halfPi, log, tan} from "../math";
import {mercatorProjection} from "./mercator";

function transverseMercator(lambda, phi) {
  return [log(tan((halfPi + phi) / 2)), -lambda];
}

transverseMercator.invert = function(x, y) {
  return [-y, 2 * atan(exp(x)) - halfPi];
};

export default function() {
  var m = mercatorProjection(transverseMercator),
      center = m.center,
      rotate = m.rotate;

  m.center = function(_) {
    return arguments.length ? center([-_[1], _[0]]) : (_ = center(), [_[1], -_[0]]);
  };

  m.rotate = function(_) {
    return arguments.length ? rotate([_[0], _[1], _.length > 2 ? _[2] + 90 : 90]) : (_ = rotate(), [_[0], _[1], _[2] - 90]);
  };

  return rotate([0, 0, 90]);
}
